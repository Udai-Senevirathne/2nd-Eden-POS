import { ordersService } from '../services/database';
import { Order } from '../types';

// Diagnostic function for real-time updates
export const runRealTimeDiagnostics = async () => {
  console.log('🔍 REAL-TIME DIAGNOSTICS STARTING...');
  console.log('=====================================');
  
  // 1. Check localStorage orders
  try {
    const fallbackOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]') as Order[];
    console.log('💾 Fallback Orders in localStorage:', fallbackOrders.length);
    fallbackOrders.forEach((order: Order, index: number) => {
      console.log(`   ${index + 1}. Order #${order.id} - $${order.total} - ${new Date(order.timestamp).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error reading localStorage orders:', error);
  }
  
  // 2. Check database orders
  try {
    console.log('🔄 Fetching orders from database...');
    const dbOrders = await ordersService.getAll();
    console.log('🗄️  Database Orders:', dbOrders.length);
    dbOrders.slice(0, 5).forEach((order: Order, index: number) => {
      console.log(`   ${index + 1}. Order #${order.id} - $${order.total} - ${order.timestamp.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error fetching database orders:', error);
  }
  
  // 3. Check event listeners
  const eventTypes = ['newOrderCreated', 'ordersUpdated', 'ordersForceUpdate'];
  eventTypes.forEach(eventType => {
    console.log(`📡 Testing ${eventType} event...`);
    window.dispatchEvent(new CustomEvent(eventType, { 
      detail: { test: true, timestamp: new Date() } 
    }));
  });
  
  // 4. Check Supabase connection
  try {
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase.from('orders').select('count').single();
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connection working');
    }
  } catch (error) {
    console.error('❌ Supabase import/connection failed:', error);
  }
  
  // 5. Simulate order creation
  console.log('🧪 Simulating order creation...');
  const mockOrder = {
    id: 'DIAG' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    items: [
      { 
        menuItem: { 
          id: 'test-item',
          name: 'Diagnostic Burger', 
          price: 9.99,
          category: 'food' as const,
          subcategory: 'Test',
          description: 'Test item',
          available: true
        }, 
        quantity: 1 
      }
    ],
    total: 9.99,
    status: 'completed' as const,
    timestamp: new Date(),
    paymentMethod: 'cash' as const,
    tableNumber: 'TEST'
  };
  
  // Add to localStorage
  const existingOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
  existingOrders.push(mockOrder);
  localStorage.setItem('fallbackOrders', JSON.stringify(existingOrders));
  
  // Dispatch events
  window.dispatchEvent(new CustomEvent('newOrderCreated', { detail: { order: mockOrder } }));
  window.dispatchEvent(new CustomEvent('ordersForceUpdate', { detail: { order: mockOrder } }));
  
  console.log('✅ Mock order created and events dispatched');
  console.log('=====================================');
  console.log('🔍 DIAGNOSTICS COMPLETE - Check admin panel now!');
  
  return {
    fallbackOrdersCount: existingOrders.length,
    mockOrderId: mockOrder.id,
    timestamp: new Date()
  };
};

// Make it globally available
declare global {
  interface Window {
    runRealTimeDiagnostics: () => Promise<{
      fallbackOrdersCount: number;
      mockOrderId: string;
      timestamp: Date;
    }>;
  }
}

window.runRealTimeDiagnostics = runRealTimeDiagnostics;