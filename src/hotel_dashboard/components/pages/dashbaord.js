// src/hotel_dashboard/components/pages/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function HotelDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_bills: 0,
    cart_items: 0,
    active_products: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [today, setToday] = useState(new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  const BASE_URL = 'http://localhost:5000';

  // NEW: Fetch cart from backend API (same as cart.jsx)
  const fetchCartFromAPI = async () => {
    try {
      const token = localStorage.getItem('hotelToken');
      if (!token) return [];
     
      const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('🛒 Cart from API for hotel:', user?.hotel_name, 'Items:', data.items);
        return data.items || [];
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching cart from API:', error);
      return [];
    }
  };

  // UPDATED: Calculate cart item count from backend API
  const calculateCartItemCount = async () => {
    try {
      const cartItems = await fetchCartFromAPI();
     
      if (cartItems.length === 0) {
        return 0;
      }
      // Calculate total number of items (sum of quantities)
      const totalItems = cartItems.reduce((total, item) => {
        return total + (item.quantity || 1);
      }, 0);
     
      console.log('🔢 Cart item count from API for', user?.hotel_name, ':', totalItems);
      return totalItems;
    } catch (error) {
      console.error('❌ Error calculating cart item count:', error);
      return 0;
    }
  };

  // Fetch dashboard data from multiple endpoints
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');

        if (!token) {
          logout();
          navigate('/login');
          return;
        }

        // Fetch multiple data sources in parallel
        const [ordersResponse, billsResponse, productsResponse] = await Promise.all([
          fetch(`${BASE_URL}/api/hotel/orders`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${BASE_URL}/api/hotel/bills`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${BASE_URL}/api/products`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        // Check authentication
        if (ordersResponse.status === 401 || billsResponse.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
        if (!billsResponse.ok) throw new Error('Failed to fetch bills');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');

        const orders = await ordersResponse.json();
        const bills = await billsResponse.json();
        const products = await productsResponse.json();

        console.log('Dashboard API Data:', { orders, bills, products });

        // Calculate stats
        const totalOrders = Array.isArray(orders) ? orders.length : 0;
        
        // Count pending bills
        const pendingBills = Array.isArray(bills) 
          ? bills.filter(bill => {
              const isPaid = bill.paid === false || bill.paid === 0;
              const isPendingStatus = bill.status === 'pending' || bill.payment_status === 'pending';
              return isPaid || isPendingStatus;
            }).length 
          : 0;

        // Count active products
        const activeProducts = Array.isArray(products) 
          ? products.filter(product => product.is_available !== false).length 
          : 0;

        // Calculate cart ITEM COUNT from backend API
        const cartItemCount = await calculateCartItemCount();

        // Get recent orders
        const recentOrdersData = Array.isArray(orders) 
          ? orders
              .sort((a, b) => new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at))
              .slice(0, 3)
          : [];

        setStats({
          total_orders: totalOrders,
          pending_bills: pendingBills,
          cart_items: cartItemCount,
          active_products: activeProducts,
        });

        setRecentOrders(recentOrdersData);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, logout, navigate]);

  // UPDATED: Real-time cart updates using API
  useEffect(() => {
    const updateCartInRealTime = async () => {
      const newCartItemCount = await calculateCartItemCount();
      setStats(prev => ({
        ...prev,
        cart_items: newCartItemCount
      }));
    };

    // Update immediately
    updateCartInRealTime();

    // Set up interval for real-time updates
    const interval = setInterval(updateCartInRealTime, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [user]); // Added user as dependency to recalculate when user changes

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'dispatched':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
      return (
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
            <div className="text-center">
              <img
                src="/broc.jpg"
                alt="Loading"
                className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
              />
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your dashboard...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header with Date & Greeting */}
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-4xl font-bold text-green-800 mb-2 flex items-center justify-center lg:justify-start">
              <span className="mr-3">🌿</span> 
              Welcome Back, {user?.hotel_name || user?.username || 'Hotel User'}!
            </h1>
            <p className="text-lg text-green-600 flex items-center justify-center lg:justify-start">
              <span className="mr-2">📅</span> Today is {today}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Quick Stats Cards - ADD CART ITEMS CARD BACK */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                key: 'total_orders', 
                label: 'Total Orders', 
                value: stats.total_orders, 
                icon: '📦', 
                color: 'bg-white border-green-200 text-green-800',
                link: '/hotel/orders'
              },
              { 
                key: 'pending_bills', 
                label: 'Pending Bills', 
                value: stats.pending_bills, 
                icon: '💰', 
                color: 'bg-white border-yellow-200 text-yellow-800',
                link: '/hotel/bills'
              },
              { // UNCOMMENT THIS CARD
                key: 'cart_items',
                label: 'Cart Items',
                value: stats.cart_items,
                icon: '🛒',
                color: 'bg-white border-blue-200 text-blue-800',
                link: '/hotel/cart'
              },
              { 
                key: 'active_products', 
                label: 'Active Products', 
                value: stats.active_products, 
                icon: '🥬', 
                color: 'bg-white border-emerald-200 text-emerald-800',
                link: '/hotel/products'
              },
            ].map(({ key, label, value, icon, color, link }) => (
              <Link
                key={key}
                to={link}
                className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300 ${color} hover:bg-green-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                  </div>
                  <span className="text-4xl">{icon}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-green-100">
            <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <span className="mr-2">⚡</span> Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/hotel/products"
                className="flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mr-3">🥕</span>
                <div>
                  <p className="font-medium text-green-800">Browse Products</p>
                  <p className="text-sm text-green-600">Add fresh items to cart</p>
                </div>
              </Link>
              <Link
                to="/hotel/cart"
                className="flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mr-3">🛒</span>
                <div>
                  <p className="font-medium text-green-800">View Cart</p>
                  <p className="text-sm text-green-600">Review & place order</p>
                </div>
              </Link>
              <Link
                to="/hotel/orders"
                className="flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-green-800">Track Orders</p>
                  <p className="text-sm text-green-600">See status updates</p>
                </div>
              </Link>
              <Link
                to="/hotel/bills"
                className="flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mr-3">💳</span>
                <div>
                  <p className="font-medium text-green-800">Manage Bills</p>
                  <p className="text-sm text-green-600">View & pay invoices</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-green-100">
            <div className="p-6 border-b border-green-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-green-800 flex items-center">
                  <span className="mr-2">📦</span> Recent Orders
                </h2>
                <Link
                  to="/hotel/orders"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                >
                  View All → 
                </Link>
              </div>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-lg font-medium text-green-800 mb-2">No recent orders yet</h3>
                <p className="text-green-600 mb-4">Get started by browsing our fresh products!</p>
                <Link
                  to="/hotel/products"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-green-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-200">
                    {recentOrders.map((order) => {
                      const total = parseFloat(order.total_amount || order.amount || 0);
                      return (
                        <tr key={order.id} className="hover:bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                            #{order.id || order.order_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(order.order_date || order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-800">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              to={`/hotel/orders/${order.id || order.order_id}`} 
                              className="text-green-600 hover:text-green-700"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Deliveries */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <span className="mr-2">🚚</span> Upcoming Deliveries
            </h2>
            {recentOrders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status)).length > 0 ? (
              <ul className="space-y-2">
                {recentOrders
                  .filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status))
                  .slice(0, 2)
                  .map(order => (
                    <li key={order.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-2xl mr-3">📦</span>
                      <div className="flex-1">
                        <p className="font-medium text-green-800">Order #{order.id}</p>
                        <p className="text-sm text-green-600">
                          {formatDate(order.delivery_date || order.order_date)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🚚</span>
                <p className="text-green-600 mb-2">No upcoming deliveries</p>
                <p className="text-sm text-green-500">Place an order to schedule your next fresh supply!</p>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/hotel/orders" className="text-green-600 hover:text-green-700 font-semibold">
                Manage Deliveries → 
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center text-sm text-green-600 py-6 border-t border-green-200">
            💚 Powered by Bhairavnath Vegetables Supplier | Freshness Guaranteed
          </div>
        </div>
      </div>
    </Layout>
  );
}