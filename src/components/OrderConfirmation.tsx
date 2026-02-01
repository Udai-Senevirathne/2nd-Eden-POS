import React, { useState } from 'react';
import { CheckCircle, Printer, X, Eye, Copy, FileText } from 'lucide-react';
import { Order } from '../types';
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
      alert(`Receipt printing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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
      console.log('✅ Receipt preview opened successfully');
    } catch (error) {
      console.error('❌ Receipt preview failed:', error);
      alert(`Receipt preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      alert(`Kitchen order printing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintMultiple = () => {
    const copies = prompt('How many copies do you want to print?', '2');
    if (copies && !isNaN(Number(copies)) && Number(copies) > 0) {
      handlePrintReceipt(Number(copies));
    } else if (copies !== null) {
      alert('Please enter a valid number of copies.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close modal when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl ${showReceiptPreview ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'max-w-md w-full'} transition-all duration-300 relative pointer-events-auto`}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {!showReceiptPreview ? (
          // Confirmation View
          <div className="p-8 text-center">
            {/* Green checkmark circle */}
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
            <p className="text-gray-500 mb-8 text-lg">Thank you for your order</p>

            {/* Order details section */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 text-lg">Order #</span>
                <span className="font-mono text-lg font-semibold">{order.id.slice(0, 6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 text-lg">Total</span>
                <span className="text-2xl font-bold text-gray-900">Rs {order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 text-lg">Payment</span>
                <span className="text-lg font-medium capitalize text-gray-900">{order.paymentMethod}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('👁️ Preview button clicked');
                  setShowReceiptPreview(true);
                }}
                className="w-full flex items-center justify-center space-x-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 text-lg transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Eye className="w-5 h-5" />
                <span>Preview Receipt</span>
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖨️ Print button clicked');
                    handlePrintReceipt();
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none cursor-pointer"
                >
                  <Printer className="w-5 h-5" />
                  <span>{isProcessing ? 'Printing...' : 'Print'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📑 Multiple button clicked');
                    handlePrintMultiple();
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none cursor-pointer"
                >
                  <Copy className="w-5 h-5" />
                  <span>Multiple</span>
                </button>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔥 Kitchen order button clicked');
                  handlePrintKitchenOrder();
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                <span>🔥 Print Kitchen Order</span>
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🆕 New Order button clicked');
                  onClose();
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 text-lg cursor-pointer"
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('👁️ Preview section - Preview button clicked');
                    handlePreviewReceipt();
                  }}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖨️ Preview section - Print button clicked');
                    handlePrintReceipt();
                  }}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isProcessing ? 'Printing...' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('⬅️ Back button clicked');
                    setShowReceiptPreview(false);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
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
        
        {/* Close button - ensuring it's always clickable */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔴 Close button clicked');
            onClose();
          }}
          className="absolute top-4 right-4 p-3 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white shadow-md border border-gray-200"
          type="button"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};