import React, { useState } from 'react';
import { RotateCcw, Search, RefreshCw, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Order, RefundTransaction } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePopup } from '../hooks/usePopup';
import { useCurrency } from '../utils/currencyUtils';

interface RefundManagementProps {
  orders: Order[];
  onRefundOrder: (orderId: string, refundData: Partial<RefundTransaction>) => void;
  currency?: 'USD' | 'LKR';
}

export const RefundManagement: React.FC<RefundManagementProps> = ({
  orders,
  onRefundOrder,
  currency = 'USD',
}) => {
  const { formatPrice, convertPrice } = useCurrency(currency);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'exchange'>('full');
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card_reversal' | 'store_credit'>('cash');
  const [customRefundAmount, setCustomRefundAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, hasPermission } = useAuth();
  const { showError, showSuccess, showConfirmPopup } = usePopup();

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: 'USD' | 'LKR') => {
    if (currency === 'LKR') {
      return `Rs ${(amount * 325).toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Filter orders that can be refunded (completed and not already refunded)
  const refundableOrders = orders.filter(order => 
    order.status === 'completed' && 
    order.refund_status === 'none' &&
    (searchTerm === '' || 
     order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter orders that have been refunded for history
  const refundedOrders = orders.filter(order => 
    order.refund_status && order.refund_status !== 'none' &&
    (searchTerm === '' || 
     order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check refund permissions based on amount
  const canProcessRefund = (amount: number): boolean => {
    if (!user) return false;
    
    if (hasPermission('canVoidTransactions')) {
      // Admin - unlimited
      return true;
    } else if (hasPermission('canApplyDiscounts')) {
      // Manager - up to $100
      return amount <= 100;
    } else {
      // Staff - up to $20
      return amount <= 20;
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedOrder) return;

    const finalReason = refundReason === 'other' ? customReason : refundReason;
    if (!finalReason.trim()) {
      showError('Please provide a reason for the refund.');
      return;
    }

    let refundAmount: number;
    
    // Calculate refund amount based on type
    if (refundType === 'full') {
      refundAmount = selectedOrder.total;
    } else if (refundType === 'partial') {
      refundAmount = customRefundAmount;
      if (refundAmount <= 0 || refundAmount > selectedOrder.total) {
        showError(`Partial refund amount must be between $0.01 and ${formatPrice(convertPrice(selectedOrder.total, 'USD'))}`);
        return;
      }
    } else {
      refundAmount = 0; // Exchange
    }
    
    if (!canProcessRefund(refundAmount)) {
      showError('You do not have permission to process refunds of this amount. Please get manager approval.');
      return;
    }

    showConfirmPopup(
      `Are you sure you want to process a ${refundType} refund of ${formatPrice(convertPrice(refundAmount, 'USD'))} for Order #${selectedOrder.id}?\n\nReason: ${finalReason}\nMethod: ${refundMethod.replace('_', ' ').toUpperCase()}`,
      async () => {
        setIsProcessing(true);
        
        try {
          const refundData: Partial<RefundTransaction> = {
            refundType,
            refundAmount,
            reason: finalReason,
            refundMethod,
            processedBy: user?.name || 'Unknown',
            refundedItems: selectedOrder.items
          };

          // Process the refund
          await onRefundOrder(selectedOrder.id, refundData);
          
          // Print refund receipt
          try {
            await import('../services/receiptPrinter').then(module => 
              module.default.printRefundReceipt({
                refundId: `R-${Date.now()}`,
                originalOrderId: selectedOrder.id,
                refundType,
                refundAmount,
                reason: finalReason,
                refundMethod,
                processedBy: user?.name || 'Unknown',
                originalOrder: selectedOrder
              })
            );
          } catch (printError) {
            console.warn('Receipt printing failed:', printError);
            showError('Refund processed but receipt printing failed. Please print manually.');
          }
          
          // Reset form
          setSelectedOrder(null);
          setRefundReason('');
          setCustomReason('');
          setRefundType('full');
          setCustomRefundAmount(0);
          setRefundMethod('cash');
          
          showSuccess(`${refundType === 'exchange' ? 'Exchange' : 'Refund'} processed successfully for Order #${selectedOrder.id}`);
          
        } catch (error) {
          console.error('Refund processing failed:', error);
          showError(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsProcessing(false);
        }
      },
      'warning',
      {
        title: `Confirm ${refundType === 'exchange' ? 'Exchange' : 'Refund'}`,
        confirmText: `Process ${refundType === 'exchange' ? 'Exchange' : 'Refund'}`,
        cancelText: 'Cancel'
      }
    );
  };

  const getRefundStatusBadge = (refundStatus: string) => {
    switch (refundStatus) {
      case 'none':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
      case 'full_refund':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center"><RotateCcw className="w-3 h-3 mr-1" />Refunded</span>;
      case 'partial_refund':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Partial Refund</span>;
      case 'exchanged':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"><RefreshCw className="w-3 h-3 mr-1" />Exchanged</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Refund Management</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Refundable Orders</h3>
            <p className="text-sm text-gray-600">{refundableOrders.length} orders available for refund</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {refundableOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedOrder?.id === order.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Order #{order.id}</h4>
                    <p className="text-sm text-gray-600">
                      Table {order.tableNumber} • {order.items.length} items
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{formatPrice(convertPrice(order.total, 'USD'))}</p>
                    {getRefundStatusBadge(order.refund_status)}
                  </div>
                </div>
              </div>
            ))}
            {refundableOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No refundable orders found</p>
                <p className="text-sm">Orders must be completed and not already refunded</p>
              </div>
            )}
          </div>
        </div>

        {/* Refund Processing Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Process Refund</h3>
          </div>
          <div className="p-6">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Order #{selectedOrder.id}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Table: {selectedOrder.tableNumber}</p>
                    <p>Date: {selectedOrder.timestamp.toLocaleString()}</p>
                    <p>Payment: {selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-lg">Total: {formatPrice(convertPrice(selectedOrder.total, 'USD'))}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h5 className="font-medium mb-2">Items</h5>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>{formatPrice(convertPrice(item.menuItem.price * item.quantity, 'USD'))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Type
                    </label>
                    <select
                      value={refundType}
                      onChange={(e) => {
                        const newType = e.target.value as 'full' | 'partial' | 'exchange';
                        setRefundType(newType);
                        if (newType === 'partial') {
                          setCustomRefundAmount(selectedOrder.total * 0.5);
                        } else {
                          setCustomRefundAmount(0);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full">Full Refund</option>
                      <option value="partial">Partial Refund</option>
                      <option value="exchange">Exchange/Store Credit</option>
                    </select>
                  </div>

                  {/* Partial Refund Amount */}
                  {refundType === 'partial' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refund Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.01"
                          max={selectedOrder.total}
                          step="0.01"
                          value={customRefundAmount}
                          onChange={(e) => setCustomRefundAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-2 text-gray-500 text-sm">
                          Max: {formatPrice(convertPrice(selectedOrder.total, 'USD'))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Method
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as 'cash' | 'card_reversal' | 'store_credit')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash Refund</option>
                      <option value="card_reversal">Card Reversal</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Reason *
                    </label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                    >
                      <option value="">Select a reason...</option>
                      <option value="wrong_order">Wrong Order Delivered</option>
                      <option value="quality_issue">Food Quality Issue</option>
                      <option value="customer_dissatisfied">Customer Dissatisfied</option>
                      <option value="staff_error">Staff Error</option>
                      <option value="long_wait">Excessive Wait Time</option>
                      <option value="cold_food">Food Served Cold</option>
                      <option value="allergic_reaction">Allergic Reaction</option>
                      <option value="billing_error">Billing Error</option>
                      <option value="other">Other (Specify Below)</option>
                    </select>
                    
                    {refundReason === 'other' && (
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Please specify the reason for refund..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Refund Amount Display */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">
                          {refundType === 'full' ? 'Full Refund Amount:' :
                           refundType === 'partial' ? 'Partial Refund Amount:' :
                           'Exchange/Store Credit:'}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-900">
                        {refundType === 'exchange' ? 
                          formatPrice(convertPrice(selectedOrder.total, 'USD')) :
                          formatPrice(convertPrice(refundType === 'full' ? selectedOrder.total : customRefundAmount, 'USD'))
                        }
                      </span>
                    </div>
                    
                    {refundType === 'partial' && customRefundAmount > selectedOrder.total && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ Refund amount cannot exceed the original order total
                      </p>
                    )}
                    
                    {!canProcessRefund(refundType === 'full' ? selectedOrder.total : customRefundAmount) && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ This refund requires manager approval due to amount limit
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleProcessRefund}
                    disabled={isProcessing || 
                             !refundReason || 
                             (refundReason === 'other' && !customReason.trim()) ||
                             (refundType === 'partial' && (customRefundAmount <= 0 || customRefundAmount > selectedOrder.total))}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isProcessing || 
                      !refundReason || 
                      (refundReason === 'other' && !customReason.trim()) ||
                      (refundType === 'partial' && (customRefundAmount <= 0 || customRefundAmount > selectedOrder.total))
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : refundType === 'exchange' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 
                     refundType === 'exchange' ? 'Process Exchange' : 
                     refundType === 'partial' ? 'Process Partial Refund' : 
                     'Process Full Refund'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select an order from the left to process a refund</p>
              </div>
            )}
          </div>
        </div>

        {/* Refund History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Refund History</h3>
            <p className="text-sm text-gray-600">{refundedOrders.length} processed refunds</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {refundedOrders.length > 0 ? (
              refundedOrders.map((order) => (
                <div key={order.id} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        Order #{order.id.slice(-6)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.timestamp).toLocaleDateString()} at{' '}
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      REFUNDED
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Original: {formatCurrency(order.total, currency)} → 
                    Refunded: {formatCurrency(order.total, currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {order.refund_status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p>No refunds processed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};