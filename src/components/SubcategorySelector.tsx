import React from 'react';

interface SubcategorySelectorProps {
  category: 'food' | 'beverage';
  selectedSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
}

export const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({
  category,
  selectedSubcategory,
  onSubcategoryChange,
}) => {
  const foodSubcategories = [
    { id: 'Starters', name: 'Starters' },
    { id: 'Breakfast', name: 'Breakfast' },
    { id: 'Main', name: 'Main' },
    { id: 'Desserts', name: 'Desserts' },
  ];

  const beverageSubcategories = [
    { id: 'Coffee', name: 'Coffee' },
    { id: 'Tea & Non-Coffee', name: 'Tea & Non-Coffee' },
    { id: 'Cold Beverage', name: 'Cold Beverage' },
    { id: 'Fresh Juice', name: 'Fresh Juice' },
    { id: 'Smoothies', name: 'Smoothies' },
    { id: 'Milkshakes', name: 'Milkshakes' },
    { id: 'Soft Drinks', name: 'Soft Drinks' },
  ];

  const subcategories = category === 'food' ? foodSubcategories : beverageSubcategories;

  return (
    <div className="flex justify-center flex-wrap gap-3">
      {subcategories.map(subcategory => (
        <button
          key={subcategory.id}
          onClick={() => onSubcategoryChange(subcategory.id)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            selectedSubcategory === subcategory.id
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {subcategory.name}
        </button>
      ))}
    </div>
  );
};