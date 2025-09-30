import React from 'react';
import { UtensilsCrossed, Coffee } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: 'food' | 'beverage';
  onCategoryChange: (category: 'food' | 'beverage') => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex justify-center space-x-4">
      <button
        onClick={() => onCategoryChange('food')}
        className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
          selectedCategory === 'food'
            ? 'bg-orange-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span>FOODS</span>
      </button>

      <button
        onClick={() => onCategoryChange('beverage')}
        className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
          selectedCategory === 'beverage'
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Coffee className="w-5 h-5" />
        <span>BEVERAGES</span>
      </button>
    </div>
  );
};