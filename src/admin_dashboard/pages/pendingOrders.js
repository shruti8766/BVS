// src/admin_dashboard/pages/pendingOrders.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { ordersApi } from '../utils/api';

const PendingOrders = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  
  // NEW: State for pending pricing functionality
  const [pendingPricingOrders, setPendingPricingOrders] = useState([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [selectedOrderForPricing, setSelectedOrderForPricing] = useState(null);
  const [pricingData, setPricingData] = useState({});
  const [finalizingPrices, setFinalizingPrices] = useState(false);

  const BASE_URL = 'http://localhost:5000';

  // Helper utilities
  const safe = (v, fb = '-') => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));
  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      // Filter only pending orders
      const pendingOnly = Array.isArray(data) ? data.filter(o => o.status === 'pending') : [];
      setOrders(pendingOnly);
      
      // NEW: Fetch pending pricing orders
      await fetchPendingPricingOrders();
    } catch (e) {
      setError(e.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch pending pricing orders
  const fetchPendingPricingOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/api/admin/orders/pending-pricing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPendingPricingOrders(Array.isArray(data.pending_orders) ? data.pending_orders : []);
      }
    } catch (e) {
      console.error('Failed to fetch pending pricing orders:', e);
    }
  };

  // NEW: Finalize prices for an order
  const finalizePrices = async (orderId) => {
    if (!selectedOrderForPricing || Object.keys(pricingData).length === 0) {
      alert('Please enter prices for all items');
      return;
    }

    setFinalizingPrices(true);
    try {
      const token = localStorage.getItem('adminToken');
      const items = selectedOrderForPricing.items.map(item => ({
        product_id: item.product_id,
        price_per_unit: parseFloat(pricingData[item.product_id] || item.current_price),
      }));

      const res = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/finalize-prices`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        alert('Prices finalized successfully!');
        setPricingData({});
        setShowPricingForm(false);
        setSelectedOrderForPricing(null);
        await fetchPendingOrders();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert(`Error finalizing prices: ${e.message}`);
    } finally {
      setFinalizingPrices(false);
    }
  };

  // Confirm order (lock price and move to confirmed)
  const confirmOrder = async (orderId) => {
    try {
      await ordersApi.updateStatus(orderId, 'confirmed');
      await fetchPendingOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  // Reject order
  const rejectOrder = async (orderId) => {
    if (!window.confirm('Reject this order?')) return;
    try {
      // You might want to add a 'rejected' status or delete
      await ordersApi.delete(orderId);
      await fetchPendingOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (token) fetchPendingOrders();
  }, [token]);

  // Stats
  const stats = {
    total: orders.length,
    totalValue: orders.reduce((sum, o) => sum + safeNum(o.total_amount), 0),
  };

  // UI Components
  const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );

  const Stat = ({ label, value, color = 'text-green-700' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );

  // Login check
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Admin Access Required</h2>
            <p className="text-gray-600">Please log in from the main dashboard.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
        <div className="max-w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-green-800 mb-1">Pending Orders</h1>
            <p className="text-gray-600 text-sm">New orders awaiting confirmation with locked prices</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Stat label="Pending Orders" value={stats.total} color="text-yellow-700" />
            <Stat label="Pending Pricing" value={pendingPricingOrders.length || 0} color="text-orange-600" />
            <Stat label="Total Value" value={`₹${stats.totalValue.toFixed(2)}`} color="text-green-700" />
          </div>

          {/* ---------- Pending Pricing Section (NEW) ---------- */}
          {pendingPricingOrders.length > 0 && (
            <Card className="mb-10 border-orange-300 bg-orange-50">
              <div className="px-6 py-5 bg-gradient-to-r from-orange-100 to-amber-100 border-b-2 border-orange-300">
                <h3 className="text-xl font-bold text-orange-800">⏳ Pending Price Finalization ({pendingPricingOrders.length})</h3>
                <p className="text-sm text-orange-700 mt-1">Orders waiting for market pricing confirmation</p>
              </div>
              <div className="p-6">
                {showPricingForm && selectedOrderForPricing ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border-2 border-green-200">
                      <h4 className="text-lg font-bold text-green-800 mb-4">
                        Order #{selectedOrderForPricing.id} - {selectedOrderForPricing.hotel_name}
                      </h4>
                      <div className="space-y-4">
                        {selectedOrderForPricing.items.map((item) => (
                          <div key={item.product_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold text-green-800">{item.product_name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} {item.unit_type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Enter price"
                                value={pricingData[item.product_id] || ''}
                                onChange={(e) => setPricingData({
                                  ...pricingData,
                                  [item.product_id]: e.target.value,
                                })}
                                className="w-24 px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-600 w-12">/unit</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => finalizePrices(selectedOrderForPricing.id)}
                          disabled={finalizingPrices}
                          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-all"
                        >
                          {finalizingPrices ? 'Finalizing...' : 'Finalize Prices'}
                        </button>
                        <button
                          onClick={() => { setShowPricingForm(false); setSelectedOrderForPricing(null); setPricingData({}); }}
                          className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPricingOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-l-4 border-orange-500">
                        <div>
                          <p className="font-semibold text-green-800">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.hotel_name} • {order.items?.length || 0} items</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrderForPricing(order);
                            // Initialize pricing data with current prices
                            const initialPrices = {};
                            order.items?.forEach(item => {
                              initialPrices[item.product_id] = item.current_price || '';
                            });
                            setPricingData(initialPrices);
                            setShowPricingForm(true);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-all"
                        >
                          Enter Prices
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="mb-6 bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <p className="text-red-800 font-medium">Error loading orders</p>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={fetchPendingOrders} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Pending Orders Table */}
          <Card>
            <div className="px-6 py-5 bg-yellow-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-yellow-800">New Orders from Hotels</h3>
              <button onClick={fetchPendingOrders} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center text-sm font-medium transition-colors">
                <span className="mr-2">🔄</span> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Hotel</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Locked Price</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl mb-2">📦</span>
                          <p className="text-gray-500 font-medium">No pending orders</p>
                          <p className="text-gray-400 text-sm">New orders from hotels will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const itemsArray = Array.isArray(order.items) ? order.items : [];
                      return (
                        <tr key={order.id} className="hover:bg-yellow-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            #{safe(order.id)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {safe(order.hotel_name)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(order.order_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {itemsArray.length} item(s)
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-700">
                            ₹{safeNum(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => confirmOrder(order.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setSelected(order)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => rejectOrder(order.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* View Order Details Modal */}
          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">Order Details - #{selected.id}</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Hotel</p>
                      <p className="font-medium">{safe(selected.hotel_name)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(selected.order_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Pending
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount (Locked)</p>
                      <p className="font-bold text-green-700 text-lg">₹{safeNum(selected.total_amount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold mb-2">Order Items:</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(Array.isArray(selected.items) ? selected.items : []).map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{safe(item.product_name)}</td>
                              <td className="px-4 py-2 text-sm">{safe(item.quantity)} {safe(item.unit_type)}</td>
                              <td className="px-4 py-2 text-sm">₹{safeNum(item.price_per_unit).toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm font-medium">₹{(safeNum(item.quantity) * safeNum(item.price_per_unit)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        confirmOrder(selected.id);
                        setSelected(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => {
                        rejectOrder(selected.id);
                        setSelected(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      Reject Order
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PendingOrders;
