import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '../types';
import { useCurrency } from '../utils/currencyUtils';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  currency?: 'USD' | 'LKR';
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart, currency = 'USD' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { formatPrice, convertPrice } = useCurrency(currency);

  // Default fallback images based on category and subcategory
  const getDefaultImage = (category: string, subcategory: string) => {
    const defaultImages = {
      food: {
        starters: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
        breakfast: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400',
        main: 'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=400',
        desserts: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
        default: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      beverage: {
        coffee: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
        smoothies: 'https://images.pexels.com/photos/775032/pexels-photo-775032.jpeg?auto=compress&cs=tinysrgb&w=400',
        'soft drinks': 'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=400',
        'fresh juices': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
        default: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    };

    const categoryImages = defaultImages[category as keyof typeof defaultImages];
    if (categoryImages) {
      return categoryImages[subcategory.toLowerCase() as keyof typeof categoryImages] || categoryImages.default;
    }
    return defaultImages.food.default;
  };

  const imageUrl = item.image && !imageError 
    ? item.image 
    : getDefaultImage(item.category, item.subcategory);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100">
      <div className="relative">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
        
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full capitalize">
            {item.subcategory}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(convertPrice(item.price, 'LKR'))}
          </span>
          
          <button
            onClick={() => onAddToCart(item)}
            disabled={!item.available}
            className={`flex items-center justify-center w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
              item.available
                ? 'bg-orange-500 hover:bg-orange-600 text-white transform hover:scale-110 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};