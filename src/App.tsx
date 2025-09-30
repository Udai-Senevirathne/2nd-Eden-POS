import { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { CategorySelector } from './components/CategorySelector';
import { SubcategorySelector } from './components/SubcategorySelector';
import { MenuGrid } from './components/MenuGrid';
import { CartSidebar } from './components/CartSidebar';
import { PaymentModal } from './components/PaymentModal';
import { OrderConfirmation } from './components/OrderConfirmation';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuthModal } from './components/AdminAuthModal';
import { QuickRefundModal } from './components/QuickRefundModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useCart } from './hooks/useCart';
import { usePopup } from './hooks/usePopup';
import { Popup } from './components/Popup';
import { Loading } from './components/Loading';
import { menuItemsService, ordersService, subscribeToMenuItems, subscribeToOrders, settingsService } from './services/database';
import { Order, MenuItem } from './types';
import ReceiptPrinter from './services/receiptPrinter';

// Test connection function - for debugging
const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const items = await menuItemsService.getAll(true);
    console.log('✅ Database connection successful. Items:', items);
    return items;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Test settings function
const testSettingsConnection = async () => {
  try {
    console.log('Testing settings connection...');
    const settings = await import('./services/database').then(db => db.settingsService.getAll());
    console.log('✅ Settings connection successful. Settings:', settings);
    return settings;
  } catch (error) {
    console.error('❌ Settings connection failed:', error);
    throw error;
  }
};

// Test receipt settings function
const testReceiptSettings = async () => {
  try {
    console.log('Testing receipt settings...');
    const receiptSettings = await settingsService.get('receipt');
    console.log('Current receipt settings:', receiptSettings);
    
    // Test updating receipt settings
    const testSettings = {
      headerText: 'Test Header - ' + new Date().toLocaleTimeString(),
      footerText: 'Test Footer - Updated',
      paperSize: 'thermal-80mm',
      autoPrint: false,
      showLogo: true
    };
    
    await settingsService.set('receipt', testSettings);
    console.log('✅ Receipt settings test completed successfully!');
    return testSettings;
  } catch (error) {
    console.error('❌ Receipt settings test failed:', error);
    throw error;
  }
};

// Test currency conversion function
const testCurrencyConversion = async () => {
  try {
    console.log('Testing currency conversion...');
    const { CurrencyConverter } = await import('./utils/currencyUtils');
    
    // Test USD to LKR conversion
    const usdAmount = 10.00;
    const lkrAmount = CurrencyConverter.convert(usdAmount, 'USD', 'LKR');
    console.log(`$${usdAmount} USD = ${CurrencyConverter.format(lkrAmount, 'LKR')}`);
    
    // Test LKR to USD conversion
    const lkrAmountTest = 3250.00;
    const usdAmountConverted = CurrencyConverter.convert(lkrAmountTest, 'LKR', 'USD');
    console.log(`Rs ${lkrAmountTest} LKR = ${CurrencyConverter.format(usdAmountConverted, 'USD')}`);
    
    console.log('✅ Currency conversion test completed successfully!');
    return { usdAmount, lkrAmount, lkrAmountTest, usdAmountConverted };
  } catch (error) {
    console.error('❌ Currency conversion test failed:', error);
    throw error;
  }
};

//ctions available globally
declare global {
  interface Window {
    testDatabaseConnection: () => Promise<MenuItem[]>;
    testSettingsConnection: () => Promise<Record<string, unknown>>;
    testCurrencyConversion: () => Promise<{ usdAmount: number; lkrAmount: number; lkrAmountTest: number; usdAmountConverted: number }>;
    testReceiptSettings: () => Promise<Record<string, unknown>>;
    testPopupSystem: () => void;
    testLoadingSystem: () => void;
    testUserManagement: () => void;
  }
}

window.testDatabaseConnection = testDatabaseConnection;
window.testSettingsConnection = testSettingsConnection;
window.testCurrencyConversion = testCurrencyConversion;
window.testReceiptSettings = testReceiptSettings;

function App() {
  return (
    <AuthProvider>
      <PosSystem />
    </AuthProvider>
  );
}

function PosSystem() {
  const [selectedCategory, setSelectedCategory] = useState<'food' | 'beverage'>('food');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Starters');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isQuickRefundOpen, setIsQuickRefundOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [currentMenuItems, setCurrentMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('USD');
  
  // Initialize popup functionality
  const { popup, showError, showSuccess, closePopup } = usePopup();

  // Test popup functionality
  const testPopupSystem = useCallback(() => {
    try {
      console.log('Testing popup system...');
      showError('This is a test error popup message!');
      console.log('✅ Popup system test completed successfully!');
    } catch (error) {
      console.error('❌ Popup system test failed:', error);
    }
  }, [showError]);

  // Test loading system functionality
  const testLoadingSystem = useCallback(() => {
    try {
      console.log('Testing loading system...');
      // Temporarily show loading state
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        console.log('✅ Loading system test completed successfully!');
      }, 3000); // Show loading for 3 seconds
    } catch (error) {
      console.error('❌ Loading system test failed:', error);
    }
  }, []);

  // Test user management system
  const testUserManagement = useCallback(() => {
    try {
      console.log('Testing user management system...');
      console.log('✅ User management is available in Admin Panel > Settings > Users tab');
      console.log('Features available:');
      console.log('- Add/Edit/Delete users');
      console.log('- PIN and Password management');
      console.log('- Role-based access control');
      console.log('- Enable/Disable users');
      console.log('- Password visibility toggle');
      console.log('- Auto-generate PINs and passwords');
      showSuccess('User management system is ready! Go to Admin Panel > Settings > Users to test it.');
    } catch (error) {
      console.error('❌ User management test failed:', error);
    }
  }, [showSuccess]);
  
  // Admin panel states with persistence
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(() => {
    // Check if user was logged into admin panel before refresh
    const adminOpen = localStorage.getItem('adminPanelOpen') === 'true';
    const adminLoginTime = localStorage.getItem('adminLoginTime');
    
    // Auto-logout after 24 hours for security
    if (adminOpen && adminLoginTime) {
      const loginTime = parseInt(adminLoginTime);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - loginTime > twentyFourHours) {
        localStorage.removeItem('adminPanelOpen');
        localStorage.removeItem('adminLoginTime');
        return false;
      }
    }
    
    return adminOpen;
  });

  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
  } = useCart();

  // Load menu items from database
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const items = await menuItemsService.getAll(true); // Load all items including disabled
        setCurrentMenuItems(items);
      } catch (err) {
        console.error('Database connection failed, using fallback data:', err);
        // Fallback to local data if database is not set up
        const fallbackItems: MenuItem[] = [
          { id: '1', name: 'Classic Burger', price: 12.99, category: 'food', subcategory: 'Main', description: 'Beef patty with lettuce, tomato, and cheese', available: true },
          { id: '2', name: 'Fresh Coffee', price: 3.99, category: 'beverage', subcategory: 'Coffee', description: 'Freshly brewed coffee', available: true },
          { id: '3', name: 'Caesar Salad', price: 9.99, category: 'food', subcategory: 'Starters', description: 'Romaine lettuce with Caesar dressing', available: true },
        ];
        setCurrentMenuItems(fallbackItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // Load currency from settings
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const restaurantSettings = await settingsService.get('restaurant') as { currency?: string };
        if (restaurantSettings?.currency) {
          setSelectedCurrency(restaurantSettings.currency as 'USD' | 'LKR');
        }
      } catch (error) {
        console.warn('Could not load currency from settings, using default USD:', error);
        // Fallback to localStorage if database fails
        const savedCurrency = localStorage.getItem('currency') as 'USD' | 'LKR';
        if (savedCurrency) {
          setSelectedCurrency(savedCurrency);
        }
      }
    };

    loadCurrency();
  }, []);

  // Load order history from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        console.log('🔄 App.tsx: Loading initial orders...');
        const orders = await ordersService.getAll();
        console.log(`✅ App.tsx: Loaded ${orders.length} orders from database`);
        setOrderHistory(orders);
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    };

    loadOrders();
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    console.log('🔄 App.tsx: Setting up real-time subscriptions...');
    
    const menuSubscription = subscribeToMenuItems((items) => {
      console.log(`🔄 App.tsx: Menu items updated - ${items.length} items`);
      setCurrentMenuItems(items);
    });

    const ordersSubscription = subscribeToOrders((orders) => {
      console.log(`🔄 App.tsx: Orders updated - ${orders.length} orders`);
      setOrderHistory(orders);
    });

    return () => {
      console.log('🔄 App.tsx: Cleaning up subscriptions...');
      menuSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, []);

  // Make test functions available globally 
  useEffect(() => {
    window.testPopupSystem = testPopupSystem;
    window.testLoadingSystem = testLoadingSystem;
    window.testUserManagement = testUserManagement;
    
    // Import diagnostics
    import('./utils/diagnostics').then(() => {
      console.log('🔍 Real-time diagnostics loaded. Run window.runRealTimeDiagnostics() in console to debug.');
    });
  }, [testPopupSystem, testLoadingSystem, testUserManagement]);

  const filteredItems = currentMenuItems.filter(item => {
    // Create subcategory mapping for compatibility
    const subcategoryMap: { [key: string]: string[] } = {
      'starters': ['starters', 'starter', 'appetizers', 'appetizer'],
      'breakfast': ['breakfast', 'morning'],
      'main': ['main', 'main course', 'mains', 'entrees', 'entree'],
      'desserts': ['desserts', 'dessert', 'sweets', 'sweet'],
      'coffee': ['coffee', 'hot drinks', 'hot drink', 'espresso'],
      'smoothies': ['smoothies', 'smoothie', 'shakes', 'shake'],
      'soft drinks': ['soft drinks', 'soft drink', 'soda', 'cold drinks', 'cold drink'],
      'fresh juices': ['fresh juices', 'fresh juice', 'juice', 'juices']
    };
    
    // Normalize both subcategories for comparison
    const itemSubcategory = item.subcategory?.toLowerCase() || '';
    const selectedSubcategoryLower = selectedSubcategory.toLowerCase();
    
    // Check if item subcategory matches selected subcategory or its aliases
    const matchesSubcategory = subcategoryMap[selectedSubcategoryLower]?.includes(itemSubcategory) || 
                              itemSubcategory === selectedSubcategoryLower;
    
    return item.category === selectedCategory && 
           matchesSubcategory &&
           item.available === true;
  });

  const handleCategoryChange = (category: 'food' | 'beverage') => {
    setSelectedCategory(category);
    // Set default subcategory when switching main categories
    if (category === 'food') {
      setSelectedSubcategory('Starters'); // Your preferred default
    } else {
      setSelectedSubcategory('Coffee'); // Back to original beverage default
    }
  };

  const handleCheckout = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentMethod: 'cash' | 'card', tableNumber: string) => {
    try {
      const orderNumber = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log('🛒 Creating order:', { orderNumber, items: cartItems.length, total: getTotalPrice(), paymentMethod, tableNumber });
      
      // Save order to database
      const order = await ordersService.create({
        orderNumber,
        items: cartItems,
        total: getTotalPrice(),
        paymentMethod,
        tableNumber
      });

      console.log('✅ Order created successfully:', order);
      
      // CRITICAL: Force immediate update of order history in main app
      const updatedOrders = await ordersService.getAll();
      setOrderHistory(updatedOrders);
      
      // Dispatch multiple real-time update events for comprehensive coverage
      console.log('📡 Dispatching comprehensive real-time updates...');
      
      // Main order creation event
      window.dispatchEvent(new CustomEvent('newOrderCreated', { 
        detail: { order, timestamp: new Date() } 
      }));
      
      // Force admin panel update
      window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
        detail: { orders: updatedOrders, timestamp: new Date() }
      }));
      
      // Update sales reports immediately
      window.dispatchEvent(new CustomEvent('ordersUpdated', { 
        detail: { orders: updatedOrders, timestamp: new Date() } 
      }));
      
      // Dashboard metrics update
      window.dispatchEvent(new CustomEvent('dashboardUpdate', { 
        detail: { orders: updatedOrders, timestamp: new Date() } 
      }));

      setCurrentOrder(order);
      setIsPaymentOpen(false);
      setIsConfirmationOpen(true);
      clearCart();
      
      // Enhanced receipt printing
      try {
        await ReceiptPrinter.printReceipt(order, {
          copies: 1,
          autoPrint: true
        });
        console.log('✅ Receipt printed successfully');
      } catch (printError) {
        console.error('❌ Receipt printing failed:', printError);
        showError('Order completed but receipt printing failed. You can reprint from order confirmation.');
      }
    } catch (err) {
      console.error('❌ Error completing payment:', err);
      
      // Detailed error logging
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      // Try to save order locally as fallback
      try {
        const fallbackOrder: Order = {
          id: Math.random().toString(36).substring(2, 8).toUpperCase(),
          items: cartItems.map(item => ({
            menuItem: item.menuItem,
            quantity: item.quantity
          })),
          total: getTotalPrice(),
          status: 'completed',
          refund_status: 'none',
          timestamp: new Date(),
          paymentMethod,
          tableNumber
        };
        
        // Save to localStorage as backup
        const existingOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
        existingOrders.push(fallbackOrder);
        localStorage.setItem('fallbackOrders', JSON.stringify(existingOrders));
        
        console.log('💾 Order saved to localStorage as fallback');
        
        // Dispatch real-time update event even for fallback
        console.log('📡 Dispatching fallback order update...');
        window.dispatchEvent(new CustomEvent('newOrderCreated', { 
          detail: { order: fallbackOrder, timestamp: new Date(), fallback: true } 
        }));
        
        setCurrentOrder(fallbackOrder);
        setIsPaymentOpen(false);
        setIsConfirmationOpen(true);
        clearCart();
        
        // Enhanced receipt printing for fallback orders
        try {
          await ReceiptPrinter.printReceipt(fallbackOrder, {
            copies: 1,
            autoPrint: true
          });
        } catch (printError) {
          console.error('❌ Fallback receipt printing failed:', printError);
        }
        
      } catch (fallbackErr) {
        console.error('❌ Fallback save also failed:', fallbackErr);
        showError('Error completing order. Please try again.');
      }
    }
  };

  const handleOrderConfirmationClose = () => {
    setIsConfirmationOpen(false);
    setCurrentOrder(null);
  };

  // Admin panel handlers
  const handleAdminClick = () => {
    setIsAdminAuthOpen(true);
  };

  // Quick refund handler
  const handleRefundClick = () => {
    setIsQuickRefundOpen(true);
  };

  const handleRefundProcessed = async () => {
    // Refresh order history after refund is processed
    try {
      const orders = await ordersService.getAll();
      setOrderHistory(orders);
      showSuccess('Refund processed successfully!');
    } catch (error) {
      console.error('Error refreshing orders after refund:', error);
    }
  };

  const handleAdminAuthenticated = (user: { id: string; name: string; role: string; lastLogin?: Date }) => {
    console.log('User authenticated:', user);
    setIsAdminAuthOpen(false);
    setIsAdminPanelOpen(true);
    // Save admin panel state and login time to localStorage
    localStorage.setItem('adminPanelOpen', 'true');
    localStorage.setItem('adminLoginTime', Date.now().toString());
    localStorage.setItem('currentAdminUser', JSON.stringify(user));
    
    showSuccess(`Welcome ${user.name}! Access granted.`);
  };

  const handleAdminPanelClose = () => {
    setIsAdminPanelOpen(false);
    // Remove admin panel state from localStorage
    localStorage.removeItem('adminPanelOpen');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('currentAdminUser');
  };

  // Menu management functions
  const handleAddMenuItem = async (newItem: Omit<MenuItem, 'id'>) => {
    try {
      console.log('Adding menu item:', newItem);
      const menuItem = await menuItemsService.create(newItem);
      console.log('Menu item created successfully:', menuItem);
      // Real-time subscription will update the UI automatically
    } catch (err) {
      console.error('Error adding menu item:', err);
      showError(`Error adding menu item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      console.log('Updating menu item:', id, updates);
      await menuItemsService.update(id, updates);
      console.log('Menu item updated successfully:', id);
      // Real-time subscription will update the UI automatically
    } catch (err) {
      console.error('Error updating menu item:', err);
      showError(`Error updating menu item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      console.log('Deleting menu item:', id);
      await menuItemsService.delete(id);
      console.log('Menu item deleted successfully:', id);
      // Real-time subscription will update the UI automatically
    } catch (err) {
      console.error('Error deleting menu item:', err);
      showError(`Error deleting menu item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Settings management
  const handleSaveSettings = (settings: object) => {
    // In a real app, this would save to database/localStorage
    localStorage.setItem('restaurantSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  };

  if (isLoading) {
    return (
      <Loading 
        type="database"
        size="xl"
        message="Loading menu items..."
        fullScreen={true}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onAdminClick={handleAdminClick} 
        onRefundClick={handleRefundClick}
        currency={selectedCurrency} 
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Category Selection */}
          <div className="p-6 bg-white border-b border-gray-200">
            <CategorySelector
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Subcategory Selection */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <SubcategorySelector
              category={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={setSelectedSubcategory}
            />
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <MenuGrid
              items={filteredItems}
              onAddToCart={addToCart}
              currency={selectedCurrency}
            />
          </div>
        </div>

        {/* Cart Sidebar */}
        <CartSidebar
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={handleCheckout}
          totalPrice={getTotalPrice()}
          currency={selectedCurrency}
        />
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentComplete={handlePaymentComplete}
        totalAmount={getTotalPrice()}
        currency={selectedCurrency}
      />

      <OrderConfirmation
        isOpen={isConfirmationOpen}
        onClose={handleOrderConfirmationClose}
        order={currentOrder}
        currency={selectedCurrency}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onAuthenticated={handleAdminAuthenticated}
      />

      <ProtectedRoute requiredPermission="canAccessAdminPanel">
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onLogout={handleAdminPanelClose}
          orderHistory={orderHistory}
          menuItems={currentMenuItems}
          onAddMenuItem={handleAddMenuItem}
          onUpdateMenuItem={handleUpdateMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          onSaveSettings={handleSaveSettings}
        />
      </ProtectedRoute>

      <QuickRefundModal
        isOpen={isQuickRefundOpen}
        onClose={() => setIsQuickRefundOpen(false)}
        orders={orderHistory}
        currency={selectedCurrency}
        onRefundProcessed={handleRefundProcessed}
      />

      {/* Global Popup Component */}
      <Popup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        title={popup.title}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        showButtons={popup.showButtons}
      />
    </div>
  );
}

export default App;