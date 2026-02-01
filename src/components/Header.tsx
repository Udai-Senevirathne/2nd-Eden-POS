import React from 'react';
import { Store, RotateCcw } from 'lucide-react';
import { CurrencyConverter } from '../utils/currencyUtils';

interface HeaderProps {
  onAdminClick: () => void;
  onRefundClick?: () => void;
  currency?: 'USD' | 'LKR';
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick, onRefundClick, currency = 'USD' }) => {
  const currencySymbol = CurrencyConverter.getSymbol(currency);
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        <button 
          onClick={onAdminClick}
          className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors duration-200 group"
          title="Click to access admin panel"
        >
          <Store className="w-8 h-8 text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />
          <h1 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
            2nd Eden Restaurant
          </h1>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {/* Refund Button */}
          {onRefundClick && (
            <button
              onClick={onRefundClick}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
              title="Process refunds and exchanges"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-medium">Quick Refund</span>
            </button>
          )}
          
          {/* Currency Display */}
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <span className="text-sm font-bold text-gray-900">{currency} ({currencySymbol})</span>
          </div>
        </div>
      </div>
    </header>
  );
};