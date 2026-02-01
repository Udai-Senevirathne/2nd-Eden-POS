import React, { useState, useEffect } from 'react';
import { BarChart3, Package, Clock, Settings, DollarSign, LogOut, RotateCcw, Trash2 } from 'lucide-react';
import { Order, MenuItem, OrderItem, RefundTransaction } from '../types';
import { MenuManagement } from './MenuManagement';
import { SettingsComponent } from './SettingsComponent';
import { SalesReports } from './SalesReports';
import { RefundManagement } from './RefundManagement';
import { PermissionGuard } from './PermissionGuard';
import { ordersService, menuItemsService, subscribeToOrders, subscribeToMenuItems } from '../services/database';
import { usePopup } from '../hooks/usePopup';
import { useAuth } from '../hooks/useAuth';
import { Popup } from './Popup';
import ReceiptPrinter from '../services/receiptPrinter';
import { useCurrency } from '../utils/currencyUtils';

interface AdminPanelProps {
  isOpen: boolean;
  onLogout: () => void;
  orderHistory: Order[];
  menuItems: MenuItem[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onSaveSettings: (settings: object) => void;
  currency?: 'USD' | 'LKR';
}

type AdminTab = 'dashboard' | 'orders' | 'menu' | 'reports' | 'refunds' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onLogout,
  orderHistory: initialOrderHistory,
  menuItems: initialMenuItems,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onSaveSettings,
  currency = 'USD',
}) => {
  const { formatPrice, convertPrice } = useCurrency(currency);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [realTimeOrders, setRealTimeOrders] = useState<Order[]>(initialOrderHistory);
  const [realTimeMenuItems, setRealTimeMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user authentication and permissions
  const { user, userRole, hasPermission, logout } = useAuth();

  // Initialize popup functionality
  const { popup, showError, showSuccess, showConfirmPopup, closePopup } = usePopup();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOpen) return;

    console.log('🔄 AdminPanel: Setting up comprehensive real-time subscriptions...');

    // Listen for new orders from the main POS interface
    const handleNewOrder = (event: CustomEvent) => {
      console.log('🆕 AdminPanel: New order received from POS:', event.detail);
      showSuccess(`New order received! Order #${event.detail.order.id}`);
    };

    // Listen for forced order updates
    const handleOrdersForceUpdate = (event: CustomEvent) => {
      console.log('🔄 AdminPanel: Force updating orders:', event.detail.orders.length);
      setRealTimeOrders(event.detail.orders);
      
      // Re-dispatch for child components
      window.dispatchEvent(new CustomEvent('ordersUpdated', { 
        detail: { orders: event.detail.orders, timestamp: new Date() } 
      }));
    };

    // Listen for dashboard updates
    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('📊 AdminPanel: Dashboard update received');
      setRealTimeOrders(event.detail.orders);
    };

    // Listen for refund processed events (from other terminals)
    const handleRefundProcessed = (event: CustomEvent) => {
      console.log('🔄 AdminPanel: Refund processed on another terminal:', event.detail);
      // Refresh orders from database to get updated refund status
      ordersService.getAll().then(orders => {
        setRealTimeOrders(orders);
        window.dispatchEvent(new CustomEvent('ordersUpdated', { 
          detail: { orders, timestamp: new Date() } 
        }));
        showSuccess(`Order #${event.detail.orderId} refund status updated from another terminal`);
      });
    };

    // Set up all event listeners
    window.addEventListener('newOrderCreated', handleNewOrder as EventListener);
    window.addEventListener('ordersForceUpdate', handleOrdersForceUpdate as EventListener);
    window.addEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
    window.addEventListener('refundProcessed', handleRefundProcessed as EventListener);

    const ordersSubscription = subscribeToOrders((orders) => {
      console.log('🔄 AdminPanel: Database orders updated in real-time:', orders.length);
      setRealTimeOrders(orders);
      
      // Dispatch custom event for SalesReports and other components
      window.dispatchEvent(new CustomEvent('ordersUpdated', { 
        detail: { orders, timestamp: new Date() } 
      }));
    });

    const menuSubscription = subscribeToMenuItems((items) => {
      console.log('🔄 AdminPanel: Menu items updated in real-time:', items.length);
      setRealTimeMenuItems(items);
      
      // Dispatch custom event for other components that might need it
      window.dispatchEvent(new CustomEvent('menuItemsUpdated', { 
        detail: { items, timestamp: new Date() } 
      }));
    });

    return () => {
      console.log('🔄 AdminPanel: Cleaning up all real-time subscriptions...');
      window.removeEventListener('newOrderCreated', handleNewOrder as EventListener);
      window.removeEventListener('ordersForceUpdate', handleOrdersForceUpdate as EventListener);
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
      window.removeEventListener('refundProcessed', handleRefundProcessed as EventListener);
      ordersSubscription.unsubscribe();
      menuSubscription.unsubscribe();
    };
  }, [isOpen, showSuccess]);

  // Update local state when props change
  useEffect(() => {
    setRealTimeOrders(initialOrderHistory);
  }, [initialOrderHistory]);

  useEffect(() => {
    setRealTimeMenuItems(initialMenuItems);
  }, [initialMenuItems]);

  // Order status update function
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      setIsLoading(true);
      await ordersService.update(orderId, { status });
      // Real-time subscription will update the UI automatically
    } catch (err) {
      console.error('Error updating order status:', err);
      showError('Failed to update order status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundOrder = async (orderId: string, refundData: Partial<RefundTransaction>) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Processing refund for order ${orderId}:`, refundData);
      
      // Determine refund status
      const refundStatus = refundData.refundType === 'full' ? 'full_refund' : 
                          refundData.refundType === 'partial' ? 'partial_refund' : 'exchanged';
      
      // 1. UPDATE DATABASE FIRST (most important)
      await ordersService.updateRefundStatus(orderId, refundStatus);
      
      // 2. THEN refresh local state from database to ensure consistency
      const updatedOrders = await ordersService.getAll();
      setRealTimeOrders(updatedOrders);
      
      // 3. Print refund receipt
      if (refundData.refundAmount && refundData.refundType && refundData.reason) {
        const originalOrder = updatedOrders.find(o => o.id === orderId);
        if (originalOrder) {
          await ReceiptPrinter.printRefundReceipt({
            refundId: `R-${Date.now()}`,
            originalOrderId: orderId,
            refundType: refundData.refundType,
            refundAmount: refundData.refundAmount,
            reason: refundData.reason,
            refundMethod: refundData.refundMethod || 'cash',
            processedBy: refundData.processedBy || 'Unknown',
            originalOrder
          });
        }
      }
      
      // 4. Dispatch additional real-time events for comprehensive coverage
      window.dispatchEvent(new CustomEvent('ordersUpdated', {
        detail: { orders: updatedOrders, timestamp: new Date() }
      }));
      
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: { type: 'refund_processed', orderId, timestamp: new Date() }
      }));
      
      showSuccess(`Refund processed successfully for Order #${orderId}. Database updated and receipt printed.`);
      
    } catch (error) {
      console.error('❌ Refund processing failed:', error);
      showError(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleLogout = () => {
    showConfirmPopup(
      'Are you sure you want to logout from the admin panel?',
      () => {
        logout(); // Clear global auth state
        onLogout(); // Call the parent logout handler
      },
      'warning',
      {
        title: 'Confirm Logout',
        confirmText: 'Logout',
        cancelText: 'Cancel'
      }
    );
  };

  // Handle order removal (only for managers and admins)
  const handleRemoveOrder = async (orderId: string, orderTotal: number) => {
    if (!hasPermission('canDeleteOrders')) {
      showError('You do not have permission to delete orders');
      return;
    }

    showConfirmPopup(
      `Are you sure you want to permanently remove Order #${orderId}?\n\nOrder Total: ${formatPrice(convertPrice(orderTotal, 'USD'))}\n\nThis action cannot be undone and will:\n• Remove the order from database\n• Remove from localStorage backup\n• Update all connected terminals`,
      async () => {
        setIsLoading(true);
        try {
          console.log(`🗑️ Removing order ${orderId}...`);

          // Remove from database
          const { supabase } = await import('../lib/supabase');
          
          // First remove order items (foreign key constraint)
          const { error: itemsError } = await supabase
            .from('order_items')
            .delete()
            .eq('order_id', (await supabase
              .from('orders')
              .select('id')
              .eq('order_number', orderId)
              .single()
            ).data?.id);

          if (itemsError && itemsError.code !== 'PGRST116') {
            console.warn('Order items removal warning:', itemsError);
          }

          // Then remove the order
          const { error: orderError } = await supabase
            .from('orders')
            .delete()
            .eq('order_number', orderId);

          if (orderError && orderError.code !== 'PGRST116') {
            console.warn('Order removal warning:', orderError);
          }

          // Remove from localStorage fallback
          const fallbackOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
          const filteredOrders = fallbackOrders.filter((order: Order) => order.id !== orderId);
          localStorage.setItem('fallbackOrders', JSON.stringify(filteredOrders));

          // Update local state immediately
          setRealTimeOrders(prev => prev.filter(order => order.id !== orderId));

          // Dispatch update events for other components
          window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
            detail: { 
              removedOrderId: orderId,
              timestamp: new Date(),
              source: 'order_removal'
            }
          }));

          window.dispatchEvent(new CustomEvent('dashboardUpdate', {
            detail: { 
              orders: realTimeOrders.filter(order => order.id !== orderId),
              timestamp: new Date()
            }
          }));

          console.log(`✅ Order ${orderId} removed successfully`);
          showSuccess(`Order #${orderId} has been permanently removed`);

        } catch (error) {
          console.error('❌ Error removing order:', error);
          showError(`Failed to remove order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      },
      'error',
      {
        title: 'Remove Order - PERMANENT ACTION',
        confirmText: 'Yes, Remove Order',
        cancelText: 'Cancel'
      }
    );
  };

  const tabs = [
    { id: 'dashboard' as AdminTab, name: 'Dashboard', icon: BarChart3, permission: 'canAccessDashboard' as const },
    { id: 'orders' as AdminTab, name: 'Orders', icon: Clock, permission: 'canViewOrders' as const },
    { id: 'menu' as AdminTab, name: 'Menu', icon: Package, permission: 'canViewMenu' as const },
    { id: 'reports' as AdminTab, name: 'Reports', icon: DollarSign, permission: 'canViewFinancialReports' as const },
    { id: 'refunds' as AdminTab, name: 'Refunds', icon: RotateCcw, permission: 'canVoidTransactions' as const },
    { id: 'settings' as AdminTab, name: 'Settings', icon: Settings, permission: 'canAccessSettings' as const },
  ].filter(tab => hasPermission(tab.permission));

  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return realTimeOrders.filter((order: Order) => order.timestamp.toDateString() === today);
  };

  const getTodaysRevenue = () => {
    return getTodaysOrders().reduce((total: number, order: Order) => total + order.total, 0);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const [orders, items] = await Promise.all([
                  ordersService.getAll(),
                  menuItemsService.getAll(true)
                ]);
                setRealTimeOrders(orders);
                setRealTimeMenuItems(items);
                showSuccess('Dashboard data refreshed successfully!');
              } catch (err) {
                console.error('Dashboard refresh failed:', err);
                showError('Failed to refresh dashboard data');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          
          <button
            onClick={() => ReceiptPrinter.testPrinter()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>🖨️</span>
            <span>Test Printer</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Today's Orders</p>
              <p className="text-2xl font-bold text-blue-900">{getTodaysOrders().length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatPrice(convertPrice(getTodaysRevenue(), 'USD'))}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-orange-900">{realTimeOrders.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {realTimeOrders.slice(0, 5).map((order: Order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-gray-600">{order.items.length} items • {order.timestamp.toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatPrice(convertPrice(order.total, 'USD'))}</p>
                <button
                  onClick={() => handleUpdateOrderStatus(order.id, 
                    order.status === 'pending' ? 'preparing' :
                    order.status === 'preparing' ? 'ready' :
                    order.status === 'ready' ? 'completed' : 'completed'
                  )}
                  disabled={isLoading || order.status === 'completed'}
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    order.status === 'ready' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } ${order.status !== 'completed' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {isLoading ? 'Updating...' : order.status}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        {hasPermission('canDeleteOrders') && realTimeOrders.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <p className="text-sm text-yellow-800">
              <strong>Manager/Admin:</strong> You can remove orders permanently using the red "Remove" button
            </p>
          </div>
        )}
      </div>
      
      {realTimeOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No orders found</p>
          <p className="text-gray-500 text-sm mt-2">Orders will appear here as they are created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {realTimeOrders.map((order: Order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                <p className="text-sm text-gray-600">{order.timestamp.toLocaleString()}</p>
                {/* Refund Status Badge */}
                {order.refund_status !== 'none' && (
                  <div className="mt-2">
                    {order.refund_status === 'full_refund' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center w-fit">
                        <RotateCcw className="w-3 h-3 mr-1" />Refunded
                      </span>
                    )}
                    {order.refund_status === 'partial_refund' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Partial Refund</span>
                    )}
                    {order.refund_status === 'exchanged' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Exchanged</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatPrice(convertPrice(order.total, 'USD'))}</p>
                <div className="flex items-center justify-end space-x-2 mt-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 
                      order.status === 'pending' ? 'preparing' :
                      order.status === 'preparing' ? 'ready' :
                      order.status === 'ready' ? 'completed' : 'completed'
                    )}
                    disabled={isLoading || order.status === 'completed'}
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                      order.status === 'ready' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } ${order.status !== 'completed' ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {isLoading ? 'Updating...' : order.status}
                  </button>
                  
                  {/* Remove Order Button - Only for Managers and Admins */}
                  {hasPermission('canDeleteOrders') && (
                    <button
                      onClick={() => handleRemoveOrder(order.id, order.total)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove Order (Permanent)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
              <div className="space-y-2">
                {order.items.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.menuItem.name}</span>
                    <span className="font-medium text-gray-900">{formatPrice(convertPrice(item.quantity * item.menuItem.price, 'USD'))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canAccessDashboard"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to view the dashboard.</div>}
          >
            {renderDashboard()}
          </PermissionGuard>
        );
      case 'orders':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canViewOrders"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to view orders.</div>}
          >
            {renderOrders()}
          </PermissionGuard>
        );
      case 'menu':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canViewMenu"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to view the menu.</div>}
          >
            <MenuManagement
              menuItems={realTimeMenuItems}
              onAddItem={onAddMenuItem}
              onUpdateItem={onUpdateMenuItem}
              onDeleteItem={onDeleteMenuItem}
            />
          </PermissionGuard>
        );
      case 'reports':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canViewFinancialReports"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to view reports.</div>}
          >
            <SalesReports
              orders={realTimeOrders}
              currency={currency}
            />
          </PermissionGuard>
        );
      case 'refunds':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canVoidTransactions"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to process refunds.</div>}
          >
            <RefundManagement
              orders={realTimeOrders}
              onRefundOrder={handleRefundOrder}
              currency={currency}
            />
          </PermissionGuard>
        );
      case 'settings':
        return (
          <PermissionGuard
            userRole={userRole}
            requiredPermission="canAccessSettings"
            fallback={<div className="p-6 text-center text-gray-600">Access denied: You don't have permission to view settings.</div>}
          >
            <SettingsComponent
              onSaveSettings={onSaveSettings}
            />
          </PermissionGuard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full h-full overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            {user && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">Logged in as:</p>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{userRole}</p>
              </div>
            )}
          </div>

          <nav className="space-y-2 flex-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900 hover:text-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </div>

      {/* Popup Component */}
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
};
