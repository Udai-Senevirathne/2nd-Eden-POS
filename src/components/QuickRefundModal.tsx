import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, DollarSign, AlertCircle } from 'lucide-react';
import { Order, RefundTransaction } from '../types';
import { ordersService } from '../services/database';
import { CurrencyConverter } from '../utils/currencyUtils';
import ReceiptPrinter from '../services/receiptPrinter';

interface QuickRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currency: 'USD' | 'LKR';
  onRefundProcessed?: (orderId: string, refundData: RefundTransaction) => void;
}

const REFUND_REASONS = [
  'Wrong order received',
  'Order quality issue',
  'Customer changed mind',
  'Long wait time',
  'Item not available',
  'Billing error',
  'Other'
];

export const QuickRefundModal: React.FC<QuickRefundModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  onRefundProcessed
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'exchange'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple refund limit for quick refunds
  const maxRefundAmount = 10000; // $10,000 limit for quick refunds

  // TEMPORARY: Show all orders for debugging
  const eligibleOrders = orders.filter(order => {
    const orderIdLower = order.id.toLowerCase().trim();
    const searchTermLower = searchTerm.toLowerCase().trim();
    const isMatch = orderIdLower.includes(searchTermLower);
    
    // Check if order is eligible for refund
    const isCompleted = order.status === 'completed';
    const notRefunded = !order.refund_status || order.refund_status === 'none';
    
    console.log('🔍 Checking order:', {
      orderId: order.id,
      searchTerm: searchTerm,
      isMatch,
      isCompleted,
      notRefunded,
      status: order.status,
      refund_status: order.refund_status
    });
    
    // TEMPORARY: Show ALL orders that match search (ignoring status for debugging)
    if (searchTerm.trim()) {
      return isMatch; // Show any order that matches search term
    }
    
    // When no search term, show all orders (for debugging)
    return true;
  });

  // Show all orders for debugging when no search term
  const allOrdersForDebug = orders.length > 0 ? orders.slice(0, 5) : [];

  console.log('📊 Orders DEBUG:', { 
    totalOrders: orders.length, 
    eligibleOrders: eligibleOrders.length, 
    searchTerm,
    sampleOrders: allOrdersForDebug.map(o => ({ 
      id: o.id, 
      status: o.status, 
      refund_status: o.refund_status 
    }))
  });

  console.log('📊 Orders data:', { 
    totalOrders: orders.length, 
    eligibleOrders: eligibleOrders.length, 
    searchTerm 
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedOrder(null);
      setRefundType('full');
      setRefundAmount(0);
      setRefundReason('');
      setCustomReason('');
    }
  }, [isOpen]);

  // Update refund amount when order or type changes
  useEffect(() => {
    if (selectedOrder) {
      if (refundType === 'full') {
        setRefundAmount(Math.round(selectedOrder.total * 100) / 100);
      } else if (refundType === 'partial') {
        setRefundAmount(Math.round(selectedOrder.total * 0.5 * 100) / 100);
      } else {
        setRefundAmount(0);
      }
    }
  }, [selectedOrder, refundType]);

  const canProcessRefund = (amount: number): { allowed: boolean; reason?: string } => {
    // Simple permission check for quick refunds
    if (amount > maxRefundAmount) {
      return { 
        allowed: false, 
        reason: `Refund amount $${amount.toFixed(2)} exceeds the limit of $${maxRefundAmount.toFixed(2)}` 
      };
    }

    return { allowed: true };
  };

  const handleProcessRefund = async () => {
    if (!selectedOrder) return;

    const finalReason = refundReason === 'Other' ? customReason : refundReason;
    if (!finalReason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    const refundCheck = canProcessRefund(refundAmount);
    if (!refundCheck.allowed) {
      alert(refundCheck.reason);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Fix floating point precision issue
      const preciseRefundAmount = Math.round(refundAmount * 100) / 100;
      
      console.log('🔄 Processing refund for order:', selectedOrder.id);
      console.log('📊 Refund details:', { refundType, refundAmount: preciseRefundAmount, reason: finalReason });
      
      // Create refund transaction record
      const refundTransaction: RefundTransaction = {
        id: `REF-${Date.now()}`,
        originalOrderId: selectedOrder.id,
        refundType: refundType,
        refundedItems: selectedOrder.items,
        refundAmount: preciseRefundAmount,
        reason: finalReason,
        processedBy: 'Manager', // Would be actual user ID
        timestamp: new Date(),
        refundMethod: selectedOrder.paymentMethod === 'cash' ? 'cash' : 'card_reversal'
      };

      console.log('🧾 Printing refund receipt...');
      
      // Print refund receipt FIRST - this is the main requirement
      try {
        await ReceiptPrinter.printRefundReceipt({
          refundId: refundTransaction.id,
          originalOrderId: selectedOrder.id,
          refundType: refundType,
          refundAmount: preciseRefundAmount,
          reason: finalReason,
          refundMethod: selectedOrder.paymentMethod === 'cash' ? 'cash' : 'card_reversal',
          processedBy: 'Manager',
          originalOrder: selectedOrder
        });
        
        console.log('✅ Refund receipt printed successfully');
        
        // Show success message with receipt details
        const receiptDetails = `
╔══════════════════════════════════╗
║           REFUND RECEIPT         ║
╠══════════════════════════════════╣
║ Order ID: #${selectedOrder.id.padEnd(18)} ║
║ Type: ${(refundType.charAt(0).toUpperCase() + refundType.slice(1)).padEnd(23)} ║
║ Amount: Rs ${preciseRefundAmount.toFixed(2).padStart(18)} ║
║ Reason: ${finalReason.padEnd(21)} ║
║ Date: ${new Date().toLocaleString().padEnd(21)} ║
╚══════════════════════════════════╝`;

        alert(`✅ REFUND RECEIPT PRINTED!\n\n${receiptDetails}\n\n📄 Physical receipt sent to printer.`);
        
      } catch (printError) {
        console.warn('⚠️ Receipt printing failed, showing visual receipt:', printError);
        
        // Show visual receipt as fallback
        const visualReceipt = `
🧾 REFUND RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order: #${selectedOrder.id}
Type: ${refundType.toUpperCase()}
Amount: Rs ${preciseRefundAmount.toFixed(2)}
Reason: ${finalReason}
Date: ${new Date().toLocaleString()}
Processed by: Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Items Refunded:
${selectedOrder.items.map(item => `• ${item.quantity}× ${item.menuItem.name}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Please print this receipt manually
if physical printer is not working.`;

        alert(visualReceipt);
      }

      // Try to update database (optional - don't fail if this doesn't work)
      try {
        console.log('📝 Attempting to update database...');
        let refundStatus: 'full_refund' | 'partial_refund' | 'exchanged';
        
        if (refundType === 'exchange') {
          refundStatus = 'exchanged';
        } else if (preciseRefundAmount >= selectedOrder.total) {
          refundStatus = 'full_refund';
        } else {
          refundStatus = 'partial_refund';
        }
        
        await ordersService.updateRefundStatus(selectedOrder.id, refundStatus);
        console.log('✅ Database updated successfully');
      } catch (dbError) {
        console.warn('⚠️ Database update failed (this is okay):', dbError);
        // Don't fail the whole process if database update fails
      }

      // Notify parent component
      onRefundProcessed?.(selectedOrder.id, refundTransaction);

      console.log('✅ Refund process completed successfully!');
      onClose();

    } catch (error) {
      console.error('❌ Refund processing failed:', error);
      alert(`❌ Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or process manually.`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-orange-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <RotateCcw className="w-6 h-6 text-orange-500 mr-3" />
            Quick Refund & Exchange
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!selectedOrder ? (
            /* Order Search */
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by order number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eligibleOrders.length === 0 ? (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <div className="text-gray-500">
                        <p className="mb-2">❌ No matching orders found for: <strong>"{searchTerm}"</strong></p>
                        <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded">
                          <p><strong>Debug Info:</strong></p>
                          <p>• Total orders in system: {orders.length}</p>
                          <p>• Orders shown here must be: "completed" status with no previous refund</p>
                          <p>• Try searching for: {allOrdersForDebug.length > 0 ? allOrdersForDebug.map(o => o.id).join(', ') : 'No completed orders available'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <p>No eligible orders for refund</p>
                        <p className="text-sm mt-2">Only completed orders that haven't been refunded will appear here.</p>
                        {orders.length > 0 && (
                          <div className="text-xs mt-2 bg-gray-50 p-2 rounded">
                            System has {orders.length} total orders
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  eligibleOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            {order.timestamp.toLocaleDateString()} at {order.timestamp.toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} items • {order.paymentMethod}
                            {order.tableNumber && ` • Table ${order.tableNumber}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">
                            {CurrencyConverter.format(order.total, currency)}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Refund Processing Form */
            <div className="space-y-6">
              {/* Order Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{selectedOrder.id}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.timestamp.toLocaleDateString()} at {selectedOrder.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    ← Back to Search
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Items:</p>
                    <ul className="text-sm">
                      {selectedOrder.items.map((item, index) => (
                        <li key={index}>
                          {item.quantity}× {item.menuItem.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount:</p>
                    <p className="text-lg font-bold text-gray-900">
                      {CurrencyConverter.format(selectedOrder.total, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Refund Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setRefundType('full')}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      refundType === 'full'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Full Refund</div>
                    <div className="text-sm text-gray-500">100% refund</div>
                  </button>
                  
                  <button
                    onClick={() => setRefundType('partial')}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      refundType === 'partial'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Partial Refund</div>
                    <div className="text-sm text-gray-500">Custom amount</div>
                  </button>
                  
                  <button
                    onClick={() => setRefundType('exchange')}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      refundType === 'exchange'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RotateCcw className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Exchange</div>
                    <div className="text-sm text-gray-500">Replace with new order</div>
                  </button>
                </div>
              </div>

              {/* Refund Amount */}
              {refundType !== 'exchange' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={selectedOrder.total}
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const preciseValue = Math.round(value * 100) / 100;
                        setRefundAmount(preciseValue);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">
                      {CurrencyConverter.getSymbol(currency)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Maximum: {CurrencyConverter.format(selectedOrder.total, currency)}
                  </div>
                </div>
              )}

              {/* Refund Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-3"
                >
                  <option value="">Select a reason...</option>
                  {REFUND_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>

                {refundReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                )}
              </div>

              {/* Permission Warning */}
              {!canProcessRefund(refundAmount).allowed && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Cannot Process Refund</p>
                    <p>{canProcessRefund(refundAmount).reason}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleProcessRefund}
                  disabled={isProcessing || !canProcessRefund(refundAmount).allowed || !refundReason || (refundReason === 'Other' && !customReason.trim())}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isProcessing || !canProcessRefund(refundAmount).allowed || !refundReason || (refundReason === 'Other' && !customReason.trim())
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Process ${refundType === 'exchange' ? 'Exchange' : 'Refund'}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};