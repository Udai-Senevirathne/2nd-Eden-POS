import React from 'react';
import { Clock, Eye } from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onViewOrder }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.slice(0, 10).map(order => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono text-sm font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{order.items.length} items • ${order.total.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{order.timestamp.toLocaleString()}</p>
              </div>
              
              <button
                onClick={() => onViewOrder(order)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};