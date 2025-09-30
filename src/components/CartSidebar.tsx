import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';
import { useCurrency } from '../utils/currencyUtils';

interface CartSidebarProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  totalPrice: number;
  currency?: 'USD' | 'LKR';
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalPrice,
  currency = 'USD',
}) => {
  const { formatPrice, convertPrice } = useCurrency(currency);
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Cart Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">{cartItems.length} items</p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No items in cart</p>
            <p className="text-gray-400 text-sm mt-2">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.menuItem.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{item.menuItem.name}</h4>
                    <p className="text-gray-600 text-sm">{formatPrice(convertPrice(item.menuItem.price, 'USD'))} each</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.menuItem.id)}
                    className="p-1 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(convertPrice(item.subtotal, 'USD'))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Subtotal:</span>
              <span className="text-lg font-semibold text-gray-900">{formatPrice(convertPrice(totalPrice, 'USD'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Tax (8.5%):</span>
              <span className="text-lg font-semibold text-gray-900">{formatPrice(convertPrice(totalPrice * 0.085, 'USD'))}</span>
            </div>
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(convertPrice(totalPrice * 1.085, 'USD'))}
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};