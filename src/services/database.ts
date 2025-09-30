import { supabase } from '../lib/supabase'
import type { MenuItem, Order, CartItem } from '../types'

// Menu Items Functions
export const menuItemsService = {
  async getAll(includeDisabled = false): Promise<MenuItem[]> {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('name')
    
    // Only filter by availability if we don't want disabled items
    if (!includeDisabled) {
      query = query.eq('available', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category === 'FOODS' ? 'food' as const : 'beverage' as const,
      subcategory: item.subcategory || '',
      description: item.description || '',
      image: item.image_url || '',
      available: item.available
    }))
  },

  async create(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: item.name,
        price: item.price,
        category: item.category === 'food' ? 'FOODS' : 'BEVERAGES',
        subcategory: item.subcategory || null,
        description: item.description || null,
        image_url: item.image || null,
        available: true
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      category: data.category === 'FOODS' ? 'food' as const : 'beverage' as const,
      subcategory: data.subcategory || '',
      description: data.description || '',
      image: data.image_url || '',
      available: data.available
    }
  },

  async update(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const updateData: Record<string, unknown> = {}
    
    if (updates.name) updateData.name = updates.name
    if (updates.price) updateData.price = updates.price
    if (updates.category) updateData.category = updates.category === 'food' ? 'FOODS' : 'BEVERAGES'
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory || null
    if (updates.description !== undefined) updateData.description = updates.description || null
    if (updates.image !== undefined) updateData.image_url = updates.image || null
    if (updates.available !== undefined) updateData.available = updates.available

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      category: data.category === 'FOODS' ? 'food' as const : 'beverage' as const,
      subcategory: data.subcategory || '',
      description: data.description || '',
      image: data.image_url || '',
      available: data.available
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: false })
      .eq('id', id)
    
    if (error) throw error
  },

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Orders Functions with enhanced real-time capabilities
export const ordersService = {
  async getAll(): Promise<Order[]> {
    let dbOrders: Order[] = [];
    
    try {
      console.log('🔄 Fetching orders from Supabase database...');
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Supabase orders fetch error:', error);
        throw error;
      }
      
      dbOrders = data.map(order => ({
        id: order.order_number,
        items: order.order_items.map((item: unknown) => {
          const orderItem = item as {
            menu_item_id: string
            quantity: number
            price: number
            menu_items: {
              name: string
              category: string
              subcategory: string | null
              description: string | null
              image_url: string | null
            }
          }
          
          return {
            menuItem: {
              id: orderItem.menu_item_id,
              name: orderItem.menu_items.name,
              price: orderItem.price,
              category: orderItem.menu_items.category === 'FOODS' ? 'food' as const : 'beverage' as const,
              subcategory: orderItem.menu_items.subcategory || '',
              description: orderItem.menu_items.description || '',
              image: orderItem.menu_items.image_url || '',
              available: true
            },
            quantity: orderItem.quantity
          }
        }),
        total: order.total,
        status: 'completed' as const,
        refund_status: (order.refund_status || 'none') as 'none' | 'full_refund' | 'partial_refund' | 'exchanged',
        timestamp: new Date(order.created_at),
        paymentMethod: order.payment_method as 'cash' | 'card',
        tableNumber: order.table_number || ''
      }));

      console.log(`✅ Successfully loaded ${dbOrders.length} orders from Supabase database`);
      return dbOrders;
      
    } catch (error) {
      console.error('❌ Database orders fetch failed, trying localStorage fallback:', error);
      
      // Only use localStorage as emergency fallback
      try {
        const fallbackOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]') as Order[];
        console.log(`⚠️ Using localStorage fallback: ${fallbackOrders.length} orders`);
        
        // Convert string dates back to Date objects
        const processedFallbackOrders = fallbackOrders.map(order => ({
          ...order,
          timestamp: new Date(order.timestamp)
        }));
        
        // Sort by timestamp (newest first)
        processedFallbackOrders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return processedFallbackOrders;
      } catch (localError) {
        console.error('❌ Even localStorage fallback failed:', localError);
        return [];
      }
    }
  },

  async create(order: {
    orderNumber: string
    items: CartItem[]
    total: number
    paymentMethod: 'cash' | 'card'
    tableNumber: string
  }): Promise<Order> {
    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: order.orderNumber,
          table_number: order.tableNumber,
          payment_method: order.paymentMethod,
          total: order.total,
          status: 'completed',
          refund_status: 'none'
        })
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // Create order items
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      const newOrder: Order = {
        id: order.orderNumber,
        items: order.items.map(item => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes
        })),
        total: order.total,
        status: 'completed',
        refund_status: 'none',
        timestamp: new Date(),
        paymentMethod: order.paymentMethod,
        tableNumber: order.tableNumber
      };

      // Force update for fallback system
      console.log('🔔 Dispatching force update events for admin panel...');
      window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
        detail: { order: newOrder, timestamp: new Date() }
      }));
      
      return newOrder;
    } catch (error) {
      console.error('Database order creation failed:', error);
      
      // Fallback to localStorage
      const fallbackOrder: Order = {
        id: order.orderNumber,
        items: order.items.map(item => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes
        })),
        total: order.total,
        status: 'completed',
        refund_status: 'none',
        timestamp: new Date(),
        paymentMethod: order.paymentMethod,
        tableNumber: order.tableNumber
      };

      // Save to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
      existingOrders.push(fallbackOrder);
      localStorage.setItem('fallbackOrders', JSON.stringify(existingOrders));
      
      console.log('💾 Order saved to localStorage, dispatching update events...');
      window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
        detail: { order: fallbackOrder, timestamp: new Date(), fallback: true }
      }));
      
      return fallbackOrder;
    }
  },

  async update(id: string, updates: { status?: Order['status'] }): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        ...(updates.status && { status: updates.status })
      })
      .eq('order_number', id)
    
    if (error) throw error
  },

  async updateRefundStatus(orderId: string, refundStatus: 'none' | 'full_refund' | 'partial_refund' | 'exchanged'): Promise<void> {
    try {
      console.log(`🔄 Updating order ${orderId} refund status to: ${refundStatus}`);
      
      const { error } = await supabase
        .from('orders')
        .update({ refund_status: refundStatus })
        .eq('order_number', orderId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully updated order ${orderId} refund status in database`);
      
      // Dispatch real-time update event for other terminals
      window.dispatchEvent(new CustomEvent('refundProcessed', {
        detail: { 
          orderId, 
          refundStatus, 
          timestamp: new Date(),
          source: 'database_update'
        }
      }));
      
    } catch (error) {
      console.error(`❌ Failed to update refund status in database for order ${orderId}:`, error);
      
      // Emergency fallback - update localStorage only
      try {
        const fallbackOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]') as Order[];
        const updatedFallbackOrders = fallbackOrders.map((order: Order) => 
          order.id === orderId 
            ? { ...order, refund_status: refundStatus }
            : order
        );
        localStorage.setItem('fallbackOrders', JSON.stringify(updatedFallbackOrders));
        console.warn(`⚠️ Used localStorage fallback for refund status update: ${orderId}`);
      } catch (fallbackError) {
        console.error(`❌ Even localStorage fallback failed:`, fallbackError);
        throw new Error('Failed to update refund status in both database and localStorage');
      }
      
      throw error; // Re-throw to let calling function handle the error
    }
  }
}

// Settings Functions with fallback to localStorage
export const settingsService = {
  async get(key: string): Promise<unknown> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.warn(`Database get failed for key ${key}:`, error);
        // Fallback to localStorage
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
      }
      
      return data?.value || null;
    } catch (error) {
      console.warn(`Settings get failed for key ${key}, using localStorage:`, error);
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
      } catch (localError) {
        console.error('Even localStorage get failed:', localError);
        return null;
      }
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.warn(`Database set failed for key ${key}:`, error);
        throw error;
      }
      
      // Also save to localStorage as backup
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Settings set failed for key ${key}, using localStorage:`, error);
      // Fallback to localStorage only
      localStorage.setItem(key, JSON.stringify(value));
      // Don't throw error, just warn - we have localStorage backup
    }
  },

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
      
      if (error) {
        console.warn('Database getAll failed:', error);
        throw error;
      }
      
      const result = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, unknown>)
      
      return result;
    } catch (error) {
      console.warn('Settings getAll failed, using localStorage:', error);
      // Fallback to localStorage
      const fallbackSettings: Record<string, unknown> = {};
      
      // Try to get common settings from localStorage
      const keys = ['restaurant', 'system', 'receipt', 'notifications'];
      for (const key of keys) {
        try {
          const localData = localStorage.getItem(key);
          if (localData) {
            fallbackSettings[key] = JSON.parse(localData);
          }
        } catch (localError) {
          console.warn(`Failed to get ${key} from localStorage:`, localError);
        }
      }
      
      return fallbackSettings;
    }
  }
}

// Enhanced Real-time subscriptions with better error handling
export const subscribeToMenuItems = (callback: (items: MenuItem[]) => void) => {
  try {
    console.log('🔄 Setting up Supabase real-time subscription for menu items...');
    
    // Try Supabase real-time subscription
    const subscription = supabase
      .channel('menu_items_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('� Menu items changed via Supabase real-time:', payload);
          menuItemsService.getAll(true).then(callback).catch(error => {
            console.error('Error refreshing menu items after real-time update:', error);
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Menu items subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase menu items real-time subscription active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Supabase menu items subscription failed, using fallback');
          setupFallbackMenuSubscription(callback);
        }
      });

    return subscription;
  } catch (error) {
    console.error('⚠️ Supabase menu subscription setup failed:', error);
    return setupFallbackMenuSubscription(callback);
  }
};

// Fallback subscription for menu items
function setupFallbackMenuSubscription(callback: (items: MenuItem[]) => void) {
  console.log('🔧 Setting up fallback menu items subscription...');
  
  const handleCustomUpdate = () => {
    console.log('📦 Fallback: Menu items update triggered');
    menuItemsService.getAll(true).then(callback).catch(error => {
      console.error('Error in fallback menu update:', error);
    });
  };
  
  window.addEventListener('menuItemsForceUpdate', handleCustomUpdate);
  
  // Poll every 30 seconds as additional fallback
  const pollInterval = setInterval(() => {
    menuItemsService.getAll(true).then(callback).catch(error => {
      console.error('Error in menu polling:', error);
    });
  }, 30000);
  
  return {
    unsubscribe: () => {
      console.log('🔧 Cleaning up fallback menu subscription');
      window.removeEventListener('menuItemsForceUpdate', handleCustomUpdate);
      clearInterval(pollInterval);
    }
  };
}

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  try {
    console.log('🔄 Setting up Supabase real-time subscription for orders...');
    
    // Try Supabase real-time subscription
    const subscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('� Orders changed via Supabase real-time:', payload);
          ordersService.getAll().then(callback).catch(error => {
            console.error('Error refreshing orders after real-time update:', error);
          });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          console.log('� Order items changed via Supabase real-time:', payload);
          ordersService.getAll().then(callback).catch(error => {
            console.error('Error refreshing orders after order items update:', error);
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase orders real-time subscription active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Supabase orders subscription failed, using fallback');
          setupFallbackOrdersSubscription(callback);
        }
      });

    return subscription;
  } catch (error) {
    console.error('⚠️ Supabase orders subscription setup failed:', error);
    return setupFallbackOrdersSubscription(callback);
  }
};

// Fallback subscription for orders
function setupFallbackOrdersSubscription(callback: (orders: Order[]) => void) {
  console.log('🔧 Setting up fallback orders subscription...');
  
  const handleCustomUpdate = () => {
    console.log('� Fallback: Orders force update triggered');
    ordersService.getAll().then(callback).catch(error => {
      console.error('Error in fallback orders update:', error);
    });
  };
  
  const handleNewOrder = () => {
    console.log('� Fallback: New order detected, refreshing...');
    // Small delay to ensure database write completes
    setTimeout(() => {
      ordersService.getAll().then(callback).catch(error => {
        console.error('Error in new order update:', error);
      });
    }, 500);
  };

  const handleRefundUpdate = () => {
    console.log('📦 Fallback: Refund update detected, refreshing...');
    ordersService.getAll().then(callback).catch(error => {
      console.error('Error in refund update:', error);
    });
  };
  
  window.addEventListener('ordersForceUpdate', handleCustomUpdate);
  window.addEventListener('newOrderCreated', handleNewOrder);
  window.addEventListener('refundProcessed', handleRefundUpdate);
  
  // Poll every 15 seconds for orders (more frequent than menu items)
  const pollInterval = setInterval(() => {
    ordersService.getAll().then(callback).catch(error => {
      console.error('Error in orders polling:', error);
    });
  }, 15000);
  
  return {
    unsubscribe: () => {
      console.log('🔧 Cleaning up fallback orders subscription');
      window.removeEventListener('ordersForceUpdate', handleCustomUpdate);
      window.removeEventListener('newOrderCreated', handleNewOrder);
      window.removeEventListener('refundProcessed', handleRefundUpdate);
      clearInterval(pollInterval);
    }
  };
}