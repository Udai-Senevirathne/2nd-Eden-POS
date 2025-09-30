import React, { useState } from 'react';
import { CheckCircle, Printer, X, Eye, Copy, FileText } from 'lucide-react';
import { Order } from '../types';
import { useCurrency } from '../utils/currencyUtils';
import { Receipt } from './Receipt';
import ReceiptPrinter from '../services/receiptPrinter';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  currency?: 'USD' | 'LKR';
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  isOpen,
  onClose,
  order,
  currency = 'USD',
}) => {
  const { formatPrice, convertPrice } = useCurrency(currency);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!isOpen || !order) return null;

  const handlePrintReceipt = async (copies: number = 1) => {
    if (!order || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await ReceiptPrinter.printReceipt(order, {
        copies,
        autoPrint: true,
        showPreview: false
      });
      console.log(`✅ Receipt printed successfully (${copies} copies)`);
    } catch (error) {
      console.error('❌ Receipt printing failed:', error);
      alert('Receipt printing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewReceipt = async () => {
    if (!order) return;
    
    try {
      await ReceiptPrinter.printReceipt(order, {
        copies: 1,
        autoPrint: false,
        showPreview: true
      });
    } catch (error) {
      console.error('❌ Receipt preview failed:', error);
    }
  };

  const handlePrintKitchenOrder = async () => {
    if (!order || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await ReceiptPrinter.printKitchenOrder(order);
      console.log('✅ Kitchen order printed successfully');
    } catch (error) {
      console.error('❌ Kitchen order printing failed:', error);
      alert('Kitchen order printing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintMultiple = () => {
    const copies = prompt('How many copies do you want to print?', '2');
    if (copies && !isNaN(Number(copies)) && Number(copies) > 0) {
      handlePrintReceipt(Number(copies));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${showReceiptPreview ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'max-w-md w-full'} transition-all duration-300`}>
        {!showReceiptPreview ? (
          // Confirmation View
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">Thank you for your order</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Order #</span>
                <span className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">{formatPrice(convertPrice(order.total, 'USD'))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Payment</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowReceiptPreview(true)}
                className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Receipt</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePrintReceipt()}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isProcessing ? 'Printing...' : 'Print'}</span>
                </button>
                
                <button
                  onClick={handlePrintMultiple}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Multiple</span>
                </button>
              </div>
              
              <button
                onClick={handlePrintKitchenOrder}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>🔥 Print Kitchen Order</span>
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                New Order
              </button>
            </div>
          </div>
        ) : (
          // Receipt Preview View
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Receipt Preview</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviewReceipt}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handlePrintReceipt()}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isProcessing ? 'Printing...' : 'Print'}</span>
                </button>
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Back
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-center text-sm text-gray-600 mb-4">
                <p>📄 This receipt updates in real-time when you change settings!</p>
                <p>Try changing the header text, footer text, or paper size in Settings → Receipt</p>
              </div>
              
              <div className="flex justify-center">
                <Receipt order={order} currency={currency} />
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};