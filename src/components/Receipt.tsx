import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useCurrency } from '../utils/currencyUtils';
import { settingsService } from '../services/database';
import { Loading } from './Loading';

interface ReceiptSettings {
  headerText: string;
  footerText: string;
  paperSize: 'thermal-58mm' | 'thermal-80mm' | 'a4';
  autoPrint: boolean;
  showLogo: boolean;
}

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
}

interface ReceiptProps {
  order: Order;
  currency?: 'USD' | 'LKR';
  className?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ 
  order, 
  currency = 'USD', 
  className = '' 
}) => {
  const { formatPrice, convertPrice } = useCurrency(currency);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    headerText: 'Thank you for dining with us!',
    footerText: 'Please come again soon!',
    paperSize: 'thermal-80mm',
    autoPrint: false,
    showLogo: true
  });
  
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: '2nd Eden Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    logoUrl: ''
  });

  // Load settings in real-time
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // Load receipt settings
        const receiptData = await settingsService.get('receipt') as ReceiptSettings;
        if (receiptData) {
          setReceiptSettings(receiptData);
        }

        // Load restaurant settings
        const restaurantData = await settingsService.get('restaurant') as RestaurantSettings;
        if (restaurantData) {
          setRestaurantSettings(restaurantData);
        }
      } catch (error) {
        console.warn('Failed to load receipt settings, using defaults:', error);
        // Try localStorage fallback
        try {
          const localReceipt = localStorage.getItem('receipt');
          const localRestaurant = localStorage.getItem('restaurant');
          
          if (localReceipt) {
            setReceiptSettings(JSON.parse(localReceipt));
          }
          if (localRestaurant) {
            setRestaurantSettings(JSON.parse(localRestaurant));
          }
        } catch (localError) {
          console.warn('localStorage fallback failed:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Set up real-time polling for settings changes
    const interval = setInterval(loadSettings, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate paper size styling
  const getPaperSizeClass = () => {
    switch (receiptSettings.paperSize) {
      case 'thermal-58mm':
        return 'max-w-xs w-58mm'; // ~58mm width
      case 'thermal-80mm':
        return 'max-w-sm w-80mm'; // ~80mm width
      case 'a4':
        return 'max-w-md w-full'; // A4 width
      default:
        return 'max-w-sm';
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className={`${getPaperSizeClass()} bg-white border border-gray-300 rounded-lg p-4 ${className}`}>
        <Loading 
          type="settings"
          size="md" 
          message="Loading receipt settings..."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-300 shadow-lg font-mono text-sm ${getPaperSizeClass()} ${className}`}>
      <div className="p-4 space-y-3">
        {/* Logo Section */}
        {receiptSettings.showLogo && restaurantSettings.logoUrl && (
          <div className="text-center">
            <img 
              src={restaurantSettings.logoUrl} 
              alt="Logo" 
              className="h-16 w-auto mx-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Restaurant Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3">
          <h1 className="font-bold text-lg">{restaurantSettings.name}</h1>
          <div className="text-xs space-y-1 mt-2">
            <p>{restaurantSettings.address}</p>
            <p>Tel: {restaurantSettings.phone}</p>
          </div>
        </div>

        {/* Header Text */}
        {receiptSettings.headerText && (
          <div className="text-center text-xs italic border-b border-dashed border-gray-400 pb-3">
            <p>{receiptSettings.headerText}</p>
          </div>
        )}

        {/* Order Info */}
        <div className="border-b border-dashed border-gray-400 pb-3">
          <div className="flex justify-between text-xs">
            <span>Order #:</span>
            <span className="font-bold">{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Date/Time:</span>
            <span>{formatDateTime(order.timestamp)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Table:</span>
            <span>{order.tableNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Payment:</span>
            <span className="capitalize">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3">
          <div className="text-xs font-bold mb-2">ITEMS:</div>
          {order.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="flex-1">{item.menuItem.name}</span>
                <span className="ml-2">{item.quantity}x</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>@ {formatPrice(convertPrice(item.menuItem.price, 'USD'))}</span>
                <span>{formatPrice(convertPrice(item.menuItem.price * item.quantity, 'USD'))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(convertPrice(order.total / 1.085, 'USD'))}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Tax (8.5%):</span>
            <span>{formatPrice(convertPrice(order.total * 0.085 / 1.085, 'USD'))}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-dashed border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>{formatPrice(convertPrice(order.total, 'USD'))}</span>
          </div>
        </div>

        {/* Footer Text */}
        {receiptSettings.footerText && (
          <div className="text-center text-xs italic border-t border-dashed border-gray-400 pt-3">
            <p>{receiptSettings.footerText}</p>
          </div>
        )}

        {/* Receipt End */}
        <div className="text-center text-xs mt-4">
          <p>*** END OF RECEIPT ***</p>
          <p className="mt-2">Powered by 2nd Eden POS</p>
        </div>
      </div>
    </div>
  );
};