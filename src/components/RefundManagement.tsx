import React, { useState } from 'react';
import { RotateCcw, Search, RefreshCw, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Order, RefundTransaction } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePopup } from '../hooks/usePopup';

interface RefundManagementProps {
  orders: Order[];
  onRefundOrder: (orderId: string, refundData: Partial<RefundTransaction>) => void;
}

export const RefundManagement: React.FC<RefundManagementProps> = ({
  orders,
  onRefundOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'exchange'>('full');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card_reversal' | 'store_credit'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, hasPermission } = useAuth();
  const { showError, showSuccess, showConfirmPopup } = usePopup();

  // Filter orders that can be refunded (completed and not already refunded)
  const refundableOrders = orders.filter(order => 
    order.status === 'completed' && 
    order.refund_status === 'none' &&
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

  const handleProcessRefund = () => {
    if (!selectedOrder) return;

    const refundAmount = refundType === 'full' ? selectedOrder.total : 0; // For now, full refunds only
    
    if (!canProcessRefund(refundAmount)) {
      showError('You do not have permission to process refunds of this amount. Please get manager approval.');
      return;
    }

    if (!refundReason.trim()) {
      showError('Please provide a reason for the refund.');
      return;
    }

    showConfirmPopup(
      `Are you sure you want to process a ${refundType} refund of $${refundAmount.toFixed(2)} for Order #${selectedOrder.id}?`,
      () => {
        setIsProcessing(true);
        
        const refundData: Partial<RefundTransaction> = {
          refundType,
          refundAmount,
          reason: refundReason,
          refundMethod,
          processedBy: user?.name || 'Unknown',
          refundedItems: refundType === 'full' ? selectedOrder.items : []
        };

        onRefundOrder(selectedOrder.id, refundData);
        
        // Reset form
        setSelectedOrder(null);
        setRefundReason('');
        setRefundType('full');
        setIsProcessing(false);
        
        showSuccess(`Refund processed successfully for Order #${selectedOrder.id}`);
      },
      'warning',
      {
        title: 'Confirm Refund',
        confirmText: 'Process Refund',
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <p className="font-semibold text-lg">${order.total.toFixed(2)}</p>
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
                    <p className="font-semibold text-lg">Total: ${selectedOrder.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h5 className="font-medium mb-2">Items</h5>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
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
                      onChange={(e) => setRefundType(e.target.value as 'full' | 'partial' | 'exchange')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full">Full Refund</option>
                      <option value="partial" disabled>Partial Refund (Coming Soon)</option>
                      <option value="exchange" disabled>Exchange (Coming Soon)</option>
                    </select>
                  </div>

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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a reason...</option>
                      <option value="wrong_order">Wrong Order</option>
                      <option value="quality_issue">Food Quality Issue</option>
                      <option value="customer_dissatisfied">Customer Dissatisfied</option>
                      <option value="staff_error">Staff Error</option>
                      <option value="long_wait">Long Wait Time</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Refund Amount */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-medium">Refund Amount: ${selectedOrder.total.toFixed(2)}</span>
                    </div>
                    {!canProcessRefund(selectedOrder.total) && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ This refund requires manager approval due to amount limit
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleProcessRefund}
                    disabled={isProcessing || !refundReason}
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      isProcessing || !refundReason
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Process Refund'}
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
      </div>
    </div>
  );
};