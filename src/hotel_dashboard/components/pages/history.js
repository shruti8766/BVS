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

  const BASE_URL = 'http://localhost:5000';

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
        // Sort by date descending (newest first)
        const sortedOrders = (Array.isArray(ordersData) ? ordersData : []).sort(
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
          setProducts(Array.isArray(productsData) ? productsData : []);
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

      console.log('🔄 Starting reorder for order:', order.id);
      console.log('📦 Items to reorder:', order.items);

      let addedCount = 0;
      let skippedCount = 0;

      // Prepare items for parallel requests
      const itemsToAdd = order.items
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
    const order = orders.find(o => o.id === orderId);
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
          const fullOrder = await response.json();
          console.log('✅ Fetched full order:', fullOrder);
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg"
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 font-medium text-lg">Broccoli is fetching your order history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName = user?.hotel_name || 'Hotel User';

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center">
              <span className="mr-3">🕒</span> Order History
            </h1>
            <p className="text-green-700">
              View your past orders and reorder with one click, {displayName}.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">✅ {successMessage}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📋</span>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-green-800">{filteredOrders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-2">✅</span>
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-800">
                    {filteredOrders.filter(o => o.status === 'delivered' || o.status === 'dispatched').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-2">⏳</span>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🔄</span>
                <div>
                  <p className="text-sm text-gray-600">Quick Reorder</p>
                  <p className="text-sm font-semibold text-green-700">Click below</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">📅 Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setQuickDateFilter(7)}
                    className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => setQuickDateFilter(30)}
                    className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition"
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">🔍 Filter by Status</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Orders</option>
                  <option value="delivered">Delivered Orders</option>
                  <option value="pending">Pending Orders</option>
                </select>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">⚡ Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => navigate('/hotel/products')}
                    className="flex-1 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
                  >
                    ➕ New Order
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List - Grouped by Date */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="flex flex-col items-center">
                <span className="text-6xl mb-4">📦</span>
                <h3 className="text-xl font-bold text-green-800 mb-2">No orders found</h3>
                <p className="text-green-600 mb-6">
                  {startDate || endDate
                    ? 'Try adjusting your date filters'
                    : 'Start ordering to see your history here'}
                </p>
                <button
                  onClick={() => navigate('/hotel/products')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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
                  <div className="flex items-center gap-2 mb-3 bg-green-100 p-3 rounded-lg">
                    <span className="text-xl">📅</span>
                    <h2 className="text-lg font-bold text-green-800">{date}</h2>
                    <span className="text-sm text-green-700 font-medium">({dateOrders.length} order{dateOrders.length > 1 ? 's' : ''})</span>
                  </div>

                  {/* Orders for this date - 2 cards per row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="p-6">
                          {/* Order Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-green-800">
                                  Order #{order.id}
                                </h3>
                                {getStatusBadge(order.status)}
                              </div>
                              <p className="text-sm text-gray-600">
                                🕐 {formatDateTime(order.order_date)}
                              </p>
                            </div>
                            <div className="text-right bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-700">
                                ₹{calculateOrderTotal(order.items).toFixed(2)}
                              </div>
                              <p className="text-sm text-green-600">
                                📦 {order.items?.length || 0} items
                              </p>
                            </div>
                          </div>

                          {/* Order Items Preview */}
                          <div className="border-t border-green-100 pt-4 mb-4 bg-green-50 p-3 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {order.items?.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="text-green-600 font-bold">✓</span>
                                  <span className="font-medium text-gray-900">
                                    {item.product_name || getProductName(item.product_id)}
                                  </span>
                                  <span className="text-gray-600">
                                    × {item.quantity} {item.unit_type}
                                  </span>
                                </div>
                              ))}
                              {order.items?.length > 4 && (
                                <div className="text-sm text-green-700 font-medium">
                                  +{order.items.length - 4} more items...
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition font-medium"
                            >
                              🔍 View Details
                            </button>
                            <button
                              onClick={() => quickReorder(order.id)}
                              disabled={reordering}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-green-200">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        📋 Order #{selectedOrder.id}
                      </h2>
                      <p className="text-sm text-green-100">
                        🕐 {formatDateTime(selectedOrder.order_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="text-white hover:text-green-100 transition"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-bold text-green-800 mb-2">📊 Order Status</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-3">🛒 Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => {
                        const price = parseFloat(item.price_at_order || item.price_per_unit || 0);
                        const itemTotal = price * item.quantity;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">
                                {item.product_name || getProductName(item.product_id)}
                              </p>
                              <p className="text-sm text-gray-600">
                                📦 {item.quantity} {item.unit_type} × ₹{price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-700 text-lg">₹{itemTotal.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-green-300 pt-4 bg-green-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-800">💰 Total Amount</span>
                      <span className="text-3xl font-bold text-green-700">
                        ₹{calculateOrderTotal(selectedOrder.items).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedOrder.special_instructions && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="text-sm font-bold text-yellow-800 mb-2">📝 Special Instructions</h3>
                      <p className="text-gray-700">
                        {selectedOrder.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-bold"
                    >
                      ❌ Close
                    </button>
                    <button
                      onClick={() => {
                        setShowOrderDetails(false);
                        quickReorder(selectedOrder.id);
                      }}
                      disabled={reordering}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
