import { Order, CartItem } from '../types';

export const generateOrderId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const createOrderFromCart = (
  cartItems: CartItem[],
  paymentMethod: 'cash' | 'card',
  tableNumber: string
): Order => {
  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  return {
    id: generateOrderId(),
    items: cartItems.map(item => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      notes: item.notes,
    })),
    total,
    status: 'pending',
    timestamp: new Date(),
    paymentMethod,
    tableNumber,
  };
};