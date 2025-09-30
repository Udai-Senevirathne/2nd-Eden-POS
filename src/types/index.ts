export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'beverage';
  subcategory: string;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  refund_status: 'none' | 'full_refund' | 'partial_refund' | 'exchanged';
  timestamp: Date;
  paymentMethod?: 'cash' | 'card';
  tableNumber?: string;
  customerName?: string;
}

export interface CartItem extends OrderItem {
  subtotal: number;
}

export interface RefundTransaction {
  id: string;
  originalOrderId: string;
  refundType: 'full' | 'partial' | 'exchange';
  refundedItems: OrderItem[];
  refundAmount: number;
  reason: string;
  processedBy: string;
  timestamp: Date;
  refundMethod: 'cash' | 'card_reversal' | 'store_credit';
}