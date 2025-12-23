// src/hotel_dashboard/components/pages/history.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function OrderHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Date filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // View mode
  const [viewMode, setViewMode] = useState('all'); // 'all', 'delivered', 'pending'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Fetch orders and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');

        if (!token) {
          logout();
          navigate('/login');
          return;
        }

        // Fetch orders
        const ordersRes = await fetch(`${BASE_URL}/api/hotel/orders`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!ordersRes.ok) {
          if (ordersRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch order history');
        }

        const ordersData = await ordersRes.json();
        console.log('📋 Fetched orders:', ordersData);
        // Extract orders array from response {orders: [...], success: true}
        const ordersArray = ordersData.orders || (Array.isArray(ordersData) ? ordersData : []);
        // Sort by date descending (newest first)
        const sortedOrders = ordersArray.sort(
          (a, b) => new Date(b.order_date) - new Date(a.order_date)
        );
        console.log('📊 Total orders:', sortedOrders.length);
        if (sortedOrders.length > 0) {
          console.log('📦 First order items:', sortedOrders[0].items);
        }
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);

        // Fetch products for name mapping
        const productsRes = await fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          // Extract products array from response {products: [...], success: true}
          const productsArray = productsData.products || (Array.isArray(productsData) ? productsData : []);
          setProducts(productsArray);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, logout, navigate]);

  // Filter orders by date range and status
  useEffect(() => {
    let filtered = [...orders];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate <= new Date(endDate);
      });
    }

    // Filter by status
    if (viewMode === 'delivered') {
      filtered = filtered.filter(order => order.status === 'delivered' || order.status === 'dispatched');
    } else if (viewMode === 'pending') {
      filtered = filtered.filter(order => order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing');
    }

    setFilteredOrders(filtered);
  }, [orders, startDate, endDate, viewMode]);

  // Get product name by ID
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  // Get product details by ID
  const getProduct = (productId) => {
    return products.find(p => p.id === productId);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate order total
  const calculateOrderTotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const price = parseFloat(item.price_at_order || item.price_per_unit || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  // Reorder functionality - adds items to cart and navigates
  const handleReorder = async (order) => {
    try {
      setReordering(true);
      setError('');
      setSuccessMessage('');
      const token = localStorage.getItem('hotelToken');

      console.log('🔄 Starting reorder for order:', order.order_id);
      console.log('� Items to reorder:', order.items);

      // Clear existing cart first
      console.log('🗑️ Clearing existing cart...');
      try {
        await fetch(`${BASE_URL}/api/hotel/cart/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ Cart cleared');
      } catch (clearErr) {
        console.warn('⚠️ Could not clear cart, continuing anyway:', clearErr);
      }

      let addedCount = 0;
      let skippedCount = 0;

      // Prepare items for parallel requests
      const itemsToAdd = (order.items || [])
        .map(item => {
          const product = getProduct(item.product_id);
          if (!product) {
            console.warn(`❌ Product ${item.product_id} not available`);
            skippedCount++;
            return null;
          }
          return {
            product,
            product_id: item.product_id,
            quantity: Math.floor(parseFloat(item.quantity) || 1)
          };
        })
        .filter(item => item !== null);

      console.log(`📊 Adding ${itemsToAdd.length} items in parallel...`);

      // Add all items to cart in parallel for faster processing
      const addPromises = itemsToAdd.map(async (item) => {
        try {
          const response = await fetch(`${BASE_URL}/api/hotel/cart`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: item.product_id,
              quantity: item.quantity,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to add ${item.product.name}:`, errorText);
            throw new Error(`Failed to add ${item.product.name}`);
          }
          
          console.log(`✅ Added: ${item.product.name} x ${item.quantity}`);
          return true;
        } catch (err) {
          console.error(`❌ Error adding ${item.product.name}:`, err);
          return false;
        }
      });

      const results = await Promise.all(addPromises);
      addedCount = results.filter(r => r === true).length;

      console.log(`✅ Successfully added ${addedCount} items, skipped ${skippedCount}`);

      if (addedCount > 0) {
        setSuccessMessage(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart! Redirecting...`);
        console.log('🚀 Navigating to cart in 1 second...');
        setTimeout(() => {
          console.log('🚀 Navigating to /hotel/cart now');
          navigate('/hotel/cart');
        }, 1000);
      } else {
        setError('No items could be added. Products may no longer be available.');
        setReordering(false);
      }

      if (skippedCount > 0) {
        console.log(`⚠️ Skipped ${skippedCount} unavailable product(s)`);
      }
    } catch (err) {
      console.error('❌ Reorder error:', err);
      setError(err.message || 'Failed to reorder items');
      setReordering(false);
    }
  };

  // Quick reorder for common orders
  const quickReorder = async (orderId) => {
    const order = orders.find(o => o.order_id === orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return;
    }

    console.log('🔍 Order found:', order);
    console.log('📦 Order items:', order.items);

    // If order doesn't have items, fetch full order details
    if (!order.items || order.items.length === 0) {
      console.log('⚠️ Order has no items, fetching full order details...');
      try {
        const token = localStorage.getItem('hotelToken');
        const response = await fetch(`${BASE_URL}/api/hotel/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Fetched full order:', responseData);
          // Extract order from response {order: {...}, success: true}
          const fullOrder = responseData.order || responseData;
          await handleReorder(fullOrder);
        } else {
          setError('Failed to fetch order details');
          console.error('❌ Failed to fetch order details');
        }
      } catch (err) {
        console.error('❌ Error fetching order:', err);
        setError('Failed to fetch order details');
      }
    } else {
      await handleReorder(order);
    }
  };

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      preparing: { color: 'bg-purple-100 text-purple-800', label: 'Preparing' },
      dispatched: { color: 'bg-indigo-100 text-indigo-800', label: 'Dispatched' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status?.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Quick date filters
  const setQuickDateFilter = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Group orders by date
  const groupOrdersByDate = () => {
    const grouped = {};
    filteredOrders.forEach(order => {
      const date = formatDate(order.order_date);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(order);
    });
    return grouped;
  };

  const groupedOrders = groupOrdersByDate();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6 transition-colors">
          <div className="text-center">
            <img
              src="/broc.jpg"
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg transition-colors">Broccoli is fetching your order history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName = user?.hotel_name || 'Hotel User';

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 dark:bg-gray-950 py-8 w-full transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2 flex items-center transition-colors">
              <span className="mr-3">🕒</span> Order History
            </h1>
            <p className="text-green-700 dark:text-green-400 transition-colors">
              View your past orders and reorder with one click, {displayName}.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
              <p className="text-red-700 dark:text-red-300 font-medium transition-colors">⚠️ {error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors">
              <p className="text-green-700 dark:text-green-300 font-medium transition-colors">✅ {successMessage}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📋</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Orders</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300 transition-colors">{filteredOrders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-2">✅</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Delivered</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300 transition-colors">
                    {filteredOrders.filter(o => o.status === 'delivered' || o.status === 'dispatched').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-2">⏳</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 transition-colors">
                    {filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🔄</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Quick Reorder</p>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 transition-colors">Click below</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-green-200 dark:border-gray-700 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors">📅 Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  />
                  <span className="flex items-center text-gray-500 dark:text-gray-400 transition-colors">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setQuickDateFilter(7)}
                    className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-300 rounded-lg transition-colors"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => setQuickDateFilter(30)}
                    className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-300 rounded-lg transition-colors"
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors">🔍 Filter by Status</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full px-4 py-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                >
                  <option value="all">All Orders</option>
                  <option value="delivered">Delivered Orders</option>
                  <option value="pending">Pending Orders</option>
                </select>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors">⚡ Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => navigate('/hotel/products')}
                    className="flex-1 px-4 py-2 bg-green-800 dark:bg-green-900 text-white rounded-lg hover:bg-green-900 dark:hover:bg-green-950 transition-colors"
                  >
                    ➕ New Order
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List - Grouped by Date */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-green-200 dark:border-gray-700 transition-colors">
              <div className="flex flex-col items-center">
                <span className="text-6xl mb-4">📦</span>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2 transition-colors">No orders found</h3>
                <p className="text-green-600 dark:text-green-400 mb-6 transition-colors">
                  {startDate || endDate
                    ? 'Try adjusting your date filters'
                    : 'Start ordering to see your history here'}
                </p>
                <button
                  onClick={() => navigate('/hotel/products')}
                  className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                >
                  Browse Products
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3 bg-green-100 dark:bg-green-900 p-3 rounded-lg transition-colors">
                    <span className="text-xl">📅</span>
                    <h2 className="text-lg font-bold text-green-800 dark:text-green-300 transition-colors">{date}</h2>
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium transition-colors">({dateOrders.length} order{dateOrders.length > 1 ? 's' : ''})</span>
                  </div>

                  {/* Orders for this date - 2 cards per row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateOrders.map((order) => (
                      <div
                        key={order.order_id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg transition-all"
                      >
                        <div className="p-6">
                          {/* Order Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-green-800 dark:text-green-300 transition-colors">
                                  Order #{order.order_id}
                                </h3>
                                {getStatusBadge(order.status)}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                🕐 {formatDateTime(order.order_date)}
                              </p>
                            </div>
                            <div className="text-right bg-green-50 dark:bg-green-900 p-3 rounded-lg transition-colors">
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300 transition-colors">
                                ₹{calculateOrderTotal(order.items).toFixed(2)}
                              </div>
                              <p className="text-sm text-green-600 dark:text-green-400 transition-colors">
                                📦 {order.items?.length || 0} items
                              </p>
                            </div>
                          </div>

                          {/* Order Items Preview */}
                          <div className="border-t border-green-100 dark:border-gray-700 pt-4 mb-4 bg-green-50 dark:bg-gray-700 p-3 rounded-lg transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {order.items?.slice(0, 4).map((item, idx) => (
                                <div key={`${item.product_id}-${idx}`} className="flex items-center gap-2 text-sm">
                                  <span className="text-green-600 dark:text-green-400 font-bold transition-colors">✓</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                                    {item.product_name || getProductName(item.product_id)}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 transition-colors">
                                    × {item.quantity} {item.unit_type}
                                  </span>
                                </div>
                              ))}
                              {order.items?.length > 4 && (
                                <div className="text-sm text-green-700 dark:text-green-400 font-medium transition-colors">
                                  +{order.items.length - 4} more items...
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-300 rounded-lg transition-colors font-medium"
                            >
                              🔍 View Details
                            </button>
                            <button
                              onClick={() => quickReorder(order.order_id)}
                              disabled={reordering}
                              className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {reordering ? '⏳ Adding to Cart...' : '🔄 Reorder Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order Details Modal */}
          {showOrderDetails && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 transition-colors">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-green-200 dark:border-gray-700 transition-colors">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white p-6 rounded-t-lg transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        📋 Order #{selectedOrder.id}
                      </h2>
                      <p className="text-sm text-green-100 dark:text-green-200 transition-colors">
                        🕐 {formatDateTime(selectedOrder.order_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="text-white hover:text-green-100 dark:hover:text-green-200 transition-colors"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg transition-colors">
                    <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2 transition-colors">📊 Order Status</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-3 transition-colors">🛒 Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => {
                        const price = parseFloat(item.price_at_order || item.price_per_unit || 0);
                        const itemTotal = price * item.quantity;
                        return (
                          <div
                            key={`${item.product_id}-${idx}`}
                            className="flex items-center justify-between p-4 bg-green-50 dark:bg-gray-700 rounded-lg border border-green-200 dark:border-gray-600 hover:bg-green-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 dark:text-gray-100 transition-colors">
                                {item.product_name || getProductName(item.product_id)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                📦 {item.quantity} {item.unit_type} × ₹{price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-700 dark:text-green-300 text-lg transition-colors">₹{itemTotal.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-green-300 dark:border-green-700 pt-4 bg-green-100 dark:bg-green-900 p-4 rounded-lg transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-800 dark:text-green-300 transition-colors">💰 Total Amount</span>
                      <span className="text-3xl font-bold text-green-700 dark:text-green-300 transition-colors">
                        ₹{calculateOrderTotal(selectedOrder.items).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedOrder.special_instructions && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-colors">
                      <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-2 transition-colors">📝 Special Instructions</h3>
                      <p className="text-gray-700 dark:text-gray-300 transition-colors">
                        {selectedOrder.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-bold"
                    >
                      ❌ Close
                    </button>
                    <button
                      onClick={() => {
                        setShowOrderDetails(false);
                        quickReorder(selectedOrder.order_id);
                      }}
                      disabled={reordering}
                      className="flex-1 px-6 py-3 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reordering ? '⏳ Adding to Cart...' : '🔄 Reorder These Items'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
