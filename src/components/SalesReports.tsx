import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  Download,
  Filter,
  PieChart,
  Star
} from 'lucide-react';
import { Order, MenuItem } from '../types';

interface SalesReportsProps {
  orders: Order[];
}

type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: { item: MenuItem; quantity: number; revenue: number }[];
  revenueByCategory: { category: string; revenue: number; percentage: number }[];
  dailySales: { date: string; revenue: number; orders: number }[];
  hourlyDistribution: { hour: number; orders: number; revenue: number }[];
}

export const SalesReports: React.FC<SalesReportsProps> = ({ orders }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [realTimeOrders, setRealTimeOrders] = useState<Order[]>(orders);
  const [isUpdating, setIsUpdating] = useState(false);

  // Listen for real-time order updates
  useEffect(() => {
    const handleOrdersUpdate = (event: CustomEvent) => {
      console.log('📊 SalesReports: Received real-time order update');
      setIsUpdating(true);
      setRealTimeOrders(event.detail.orders);
      
      // Show update indicator briefly
      setTimeout(() => setIsUpdating(false), 1500);
    };

    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('📊 SalesReports: Dashboard update received');
      setRealTimeOrders(event.detail.orders);
    };

    const handleForceUpdate = (event: CustomEvent) => {
      console.log('📊 SalesReports: Force update received');
      setIsUpdating(true);
      setRealTimeOrders(event.detail.orders);
      setTimeout(() => setIsUpdating(false), 1000);
    };

    // Listen to multiple event types for comprehensive updates
    window.addEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
    window.addEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
    window.addEventListener('ordersForceUpdate', handleForceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
      window.removeEventListener('ordersForceUpdate', handleForceUpdate as EventListener);
    };
  }, []);

  // Update real-time orders when props change
  useEffect(() => {
    setRealTimeOrders(orders);
  }, [orders]);

  // Filter orders based on selected period
  useEffect(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        }
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    const filtered = realTimeOrders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= startDate && orderDate <= endDate;
    });

    setFilteredOrders(filtered);
    console.log(`📊 SalesReports: Filtered ${filtered.length} orders for period: ${selectedPeriod}`);
  }, [selectedPeriod, customStartDate, customEndDate, realTimeOrders]);

  // Calculate metrics
  useEffect(() => {
    if (filteredOrders.length === 0) {
      setMetrics(null);
      return;
    }

    // Total revenue and orders
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalRevenue / totalOrders;

    // Top selling items
    const itemSales = new Map<string, { item: MenuItem; quantity: number; revenue: number }>();
    
    filteredOrders.forEach(order => {
      order.items.forEach(orderItem => {
        const itemId = orderItem.menuItem.id;
        const existing = itemSales.get(itemId);
        
        if (existing) {
          existing.quantity += orderItem.quantity;
          existing.revenue += orderItem.quantity * orderItem.menuItem.price;
        } else {
          itemSales.set(itemId, {
            item: orderItem.menuItem,
            quantity: orderItem.quantity,
            revenue: orderItem.quantity * orderItem.menuItem.price
          });
        }
      });
    });

    const topSellingItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Revenue by category
    const categoryRevenue = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItem.category;
        const revenue = item.quantity * item.menuItem.price;
        categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + revenue);
      });
    });

    const revenueByCategory = Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      revenue,
      percentage: (revenue / totalRevenue) * 100
    }));

    // Daily sales
    const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
    filteredOrders.forEach(order => {
      const dateKey = order.timestamp.toDateString();
      const existing = dailySalesMap.get(dateKey);
      
      if (existing) {
        existing.revenue += order.total;
        existing.orders += 1;
      } else {
        dailySalesMap.set(dateKey, { revenue: order.total, orders: 1 });
      }
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Hourly distribution
    const hourlyMap = new Map<number, { orders: number; revenue: number }>();
    filteredOrders.forEach(order => {
      const hour = order.timestamp.getHours();
      const existing = hourlyMap.get(hour);
      
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total;
      } else {
        hourlyMap.set(hour, { orders: 1, revenue: order.total });
      }
    });

    const hourlyDistribution = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour - b.hour);

    setMetrics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      revenueByCategory,
      dailySales,
      hourlyDistribution
    });
  }, [filteredOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportReport = () => {
    if (!metrics) return;

    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      metrics: {
        ...metrics,
        dailySales: metrics.dailySales.map(day => ({
          ...day,
          date: new Date(day.date).toISOString()
        }))
      }
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
            <p className="text-gray-600">Analyze your business performance and trends</p>
          </div>
          {isUpdating && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">Updating...</span>
            </div>
          )}
        </div>
        <button
          onClick={exportReport}
          disabled={!metrics}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Report Period</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {(['today', 'week', 'month', 'year'] as ReportPeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-2 rounded-lg font-medium capitalize transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 'week' ? 'Last 7 Days' : 
               period === 'month' ? 'This Month' : 
               period === 'year' ? 'This Year' : period}
            </button>
          ))}
          <button
            onClick={() => setSelectedPeriod('custom')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'custom'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {!metrics ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No orders found for the selected period.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageOrderValue)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.topSellingItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-400 animate-ping' : 'bg-green-400'}`}></div>
                  <span className="text-xs text-gray-500">Real-time</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Daily Sales
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {metrics.dailySales.map((day, index) => {
                  const maxRevenue = Math.max(...metrics.dailySales.map(d => d.revenue));
                  const widthPercentage = (day.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 w-16">
                          {formatDate(day.date)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${widthPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(day.revenue)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {day.orders} orders
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Revenue by Category
              </h3>
              <div className="space-y-4">
                {metrics.revenueByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === 0 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-600" />
              Top Selling Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Quantity Sold</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topSellingItems.map((item, index) => (
                    <tr key={item.item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.item.name}</div>
                          <div className="text-sm text-gray-600">{item.item.description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.item.category === 'food' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatCurrency(item.item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly Distribution */}
          {metrics.hourlyDistribution.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Hourly Sales Distribution
              </h3>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourData = metrics.hourlyDistribution.find(h => h.hour === hour);
                  const maxOrders = Math.max(...metrics.hourlyDistribution.map(h => h.orders));
                  const heightPercentage = hourData ? (hourData.orders / maxOrders) * 100 : 0;
                  
                  return (
                    <div key={hour} className="text-center">
                      <div className="h-20 flex items-end justify-center mb-2">
                        <div
                          className="w-6 bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600"
                          style={{ height: `${heightPercentage}%`, minHeight: hourData ? '4px' : '0px' }}
                          title={hourData ? `${hourData.orders} orders, ${formatCurrency(hourData.revenue)}` : 'No orders'}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};