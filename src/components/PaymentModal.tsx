import React, { useState } from 'react';
import { X, CreditCard, DollarSign, MapPin } from 'lucide-react';
import { useCurrency } from '../utils/currencyUtils';
import { usePopup } from '../hooks/usePopup';
import { Popup } from './Popup';
import { LoadingButton } from './Loading';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentMethod: 'cash' | 'card', tableNumber: string) => void;
  totalAmount: number;
  currency?: 'USD' | 'LKR';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  totalAmount,
  currency = 'USD',
}) => {
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card'>('cash');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { formatPrice, convertPrice } = useCurrency(currency);

  // Initialize popup functionality
  const { popup, showError, closePopup } = usePopup();

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!selectedTable) {
      showError('Please select a table number');
      return;
    }
    
    setIsProcessing(true);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    onPaymentComplete(selectedPayment, selectedTable);
  };

  const paymentMethods = [
    {
      id: 'cash' as const,
      name: 'Cash Payment',
      icon: DollarSign,
      description: 'Pay with cash',
    },
    {
      id: 'card' as const,
      name: 'Card Payment',
      icon: CreditCard,
      description: 'Credit/Debit Card',
    },
  ];

  // Generate table options (you can customize this)
  const tableOptions = [
    'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
    'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10',
    'Takeaway', 'Dining'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Complete Order</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Total Amount */}
          <div className="mb-6">
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(convertPrice(totalAmount, 'USD'))}</p>
            </div>
          </div>

          {/* Table Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <MapPin className="w-4 h-4 inline mr-1" />
              Select Table/Location
            </label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {tableOptions.slice(0, 10).map((table) => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedTable === table
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {tableOptions.slice(10).map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedTable(option)}
                  className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedTable === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map(method => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPayment === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${
                        selectedPayment === method.id ? 'text-blue-500' : 'text-gray-600'
                      }`} />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complete Payment Button */}
          <LoadingButton
            onClick={handlePayment}
            loading={isProcessing}
            disabled={!selectedTable}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
              !selectedTable && !isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? 'Processing Order' : 'Complete Order & Print Receipt'}
          </LoadingButton>
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