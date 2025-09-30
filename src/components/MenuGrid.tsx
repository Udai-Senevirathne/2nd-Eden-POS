import React from 'react';
import { MenuItem } from '../types';
import { MenuItemCard } from './MenuItemCard';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  currency?: 'USD' | 'LKR';
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onAddToCart, currency = 'USD' }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {items.map(item => (
        <MenuItemCard
          key={item.id}
          item={item}
          onAddToCart={onAddToCart}
          currency={currency}
        />
      ))}
    </div>
  );
};