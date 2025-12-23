
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ordersApi } from '../utils/api';

// ──────────────────────────────────────────────────────
// 1. SVG Icons (Beautiful, Reusable) - Copied from Dashboard
// ──────────────────────────────────────────────────────
const Icons = {
  Cart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ──────────────────────────────────────────────────────
// 2. Reusable UI Components (Modern, Animated) - Adapted from Dashboard
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700', Icon, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 transition-colors duration-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-green-700' ? 'bg-green-100 dark:bg-green-900' : color === 'text-emerald-700' ? 'bg-emerald-100 dark:bg-emerald-900' : color === 'text-teal-700' ? 'bg-teal-100 dark:bg-teal-900' : color === 'text-orange-600' ? 'bg-orange-100 dark:bg-orange-900' : color === 'text-red-600' ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
        {Icon && <Icon />}
      </div>
    </div>
    <div className="mt-2">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      {trend !== undefined && (
        <div className="flex items-center mt-1">
          <Icons.TrendUp />
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-1">+{trend}%</span>
        </div>
      )}
    </div>
  </div>
);

const MiniTable = ({ title, headers, rows, linkTo, emptyMsg = 'No data', onRowClick, filter }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
    <div className="px-4 py-3 bg-green-50 dark:bg-green-900 border-b border-green-100 dark:border-green-800 flex justify-between items-center">
      <h3 className="text-base font-bold text-green-800 dark:text-green-300">{title}</h3>
      <div className="flex items-center gap-4">
        {filter}
        {linkTo && (
          <Link to={linkTo} className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1 transition-colors">
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-green-50/50 dark:bg-gray-700">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50 dark:divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.Cart />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className={`hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(r)}>
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const QuickLink = ({ to, label, Icon }) => (
  <Link
    to={to}
    className="group relative bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden"
  >
    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    <div className="relative z-10 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
      <Icon />
    </div>
    <span className="relative z-10 text-sm font-bold tracking-wide">{label}</span>
  </Link>
);

// ──────────────────────────────────────────────────────
// 3. Main Component (Functionality Unchanged)
// ──────────────────────────────────────────────────────
const Orders = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. Orders state
  // ──────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  
  // NEW: State for pending pricing orders
  const [pendingPricingOrders, setPendingPricingOrders] = useState([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [selectedOrderForPricing, setSelectedOrderForPricing] = useState(null);
  const [pricingData, setPricingData] = useState({});
  const [finalizingPrices, setFinalizingPrices] = useState(false);

  console.log('ordersApi:', ordersApi);

  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const getStatusInfo = s => {
    const map = {
      pending:   { c: 'bg-orange-100 text-orange-800 border-2 border-orange-200', label: 'Pending' },
      confirmed: { c: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200', label: 'Confirmed' },
      preparing: { c: 'bg-teal-100 text-teal-800 border-2 border-teal-200', label: 'Preparing' },
      dispatched:{ c: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200', label: 'Dispatched'},
      delivered: { c: 'bg-green-100 text-green-800 border-2 border-green-200', label: 'Delivered' },
    };
    return map[s] || { c: 'bg-gray-100 text-gray-800 border-2 border-gray-200', label: 'Unknown' };
  };

  // ──────────────────────────────────────────────────────
  // 4. Login handler
  // ──────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('https://api-aso3bjldka-uc.a.run.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // 5. Data fetching
  // ──────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      console.log('📦 Orders data received:', data);
      console.log('📦 Is array?', Array.isArray(data));
      console.log('📦 Data length:', data?.length);
      setOrders(Array.isArray(data) ? data : []);
      
      // NEW: Fetch pending pricing orders
      await fetchPendingPricingOrders();
    } catch (e) {
      console.error('❌ Error fetching orders:', e);
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
      const res = await fetch('https://api-aso3bjldka-uc.a.run.app/api/admin/orders/pending-pricing', {
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

      const res = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/orders/${orderId}/finalize-prices`, {
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
        await fetchOrders();
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

  const changeStatus = async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = orders.reduce(
    (acc, o) => {
      acc.total++;
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, confirmed: 0, preparing: 0, dispatched: 0, delivered: 0 }
  );

  const filtered = (filter === 'all' ? orders : orders.filter(o => o.status === filter)).filter(o =>
    o.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ──────────────────────────────────────────────────────
  // 7. Render – login screen first
  // ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-6 transition-colors duration-200">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">Admin Login</h2>
            {loginError && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{loginError}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="text-center">
            <img
              src="/broc.jpg"
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Broccoli is crunching your orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 transition-colors duration-200">
        <div className="p-8 w-full">
          {/* ---------- Header ---------- */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-1">
                Orders Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage all hotel vegetable orders</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Icons.Refresh />
              Refresh Data
            </button>
          </div>

          {/* ---------- Error ---------- */}
          {error && (
            <Card className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-600 dark:text-red-400 text-lg">Warning</span>
                <div>
                  <p className="text-red-800 dark:text-red-300 font-medium">Failed to load data</p>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                  <button onClick={fetchOrders} className="mt-2 px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600">
                    Retry
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ---------- Search Bar ---------- */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="text"
              placeholder="Search by hotel name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
            />
          </div>

          {/* ---------- Stats Cards ---------- */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            <Stat label="Total Orders" value={stats.total?.toLocaleString() || 0} Icon={Icons.Cart} color="text-green-700" trend={12} />
            <Stat label="Pending" value={stats.pending || 0} Icon={Icons.Receipt} color="text-yellow-600" />
            <Stat label="Confirmed" value={stats.confirmed || 0} Icon={Icons.Receipt} color="text-emerald-700" />
            <Stat label="Preparing" value={stats.preparing || 0} Icon={Icons.Receipt} color="text-teal-700" />
            <Stat label="Delivered" value={stats.delivered || 0} Icon={Icons.Receipt} color="text-green-700" trend={5} />
          </div>

          {/* ---------- Table ---------- */}
          <MiniTable
            title="Orders List"
            headers={['Order ID', 'Hotel', 'Date', 'Items', 'Total Amount', 'Status', 'Actions']}
            filter={
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by status:</label>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            }
            rows={
              filtered.map(o => {
                const st = getStatusInfo(o.status);
                return [
                  `#${safe(o.id)}`,
                  safe(o.hotel_name),
                  formatDate(o.created_at || o.order_date),
                  `${safe(o.items?.length, 0)} items`,
                  `₹${safeNum(o.total_amount, 0).toFixed(2)}`,
                  <span key="status" className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.c}`}>
                    {st.label}
                  </span>,
                  <div key="actions" className="flex space-x-2">
                    {o.status !== 'delivered' && (
                      <select
                        defaultValue=""
                        onChange={e => e.target.value && changeStatus(o.id, e.target.value)}
                        className="text-xs border-2 border-green-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      >
                        <option value="">Update Status</option>
                        <option value="confirmed">Confirm</option>
                        <option value="preparing">Preparing</option>
                        <option value="dispatched">Dispatch</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(o); }}
                      className="text-green-600 hover:text-green-700 text-xs underline transition-colors"
                    >
                      View Details
                    </button>
                  </div>,
                ];
              }) || []
            }
            emptyMsg="No orders found"
            onRowClick={null}
          />

          {/* ---------- Enhanced Details Modal ---------- */}
          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-green-100 dark:border-green-900 transition-colors duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">
                      Order Details - #{safe(selected.id)}
                    </h3>
                    <button onClick={() => setSelected(null)} className="p-2 hover:bg-green-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                      <Icons.Close />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* ---------- Order Header ---------- */}
                    <Card className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-green-800 dark:text-green-300">{safe(selected.hotel_name)}</h4>
                          <p className="text-gray-600 dark:text-gray-400">Order #{safe(selected.id)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">₹{safeNum(selected.total_amount).toFixed(2)}</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusInfo(selected.status).c}`}>
                            {getStatusInfo(selected.status).label}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* ---------- Order Information ---------- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(selected.order_date || selected.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Date</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(selected.delivery_date)}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Info</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{safe(selected.email)}</p>
                          <p className="text-gray-600 dark:text-gray-400">{safe(selected.phone)}</p>
                        </div>
                      </div>
                    </div>

                    {/* ---------- Special Instructions ---------- */}
                    {selected.special_instructions && (
                      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Special Instructions</p>
                        <p className="text-amber-800 dark:text-amber-300">{selected.special_instructions}</p>
                      </Card>
                    )}

                    {/* ---------- Enhanced Items Table ---------- */}
                    <Card>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 px-6 pt-6">Order Items</p>
                      <div className="border-t border-green-100 dark:border-green-900">
                        <table className="min-w-full">
                          <thead className="bg-green-50/50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Product</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Quantity</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Unit</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Price/Unit</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {selected.items?.length ? selected.items.map((item, index) => {
                              const itemTotal = safeNum(item.quantity) * safeNum(item.price_at_order || item.price_per_unit);
                              return (
                                <tr key={index} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {safe(item.product_name, `Product ${item.product_id}`)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                    {safe(item.quantity, 0)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {safe(item.unit_type, 'kg')}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                    ₹{safeNum(item.price_at_order || item.price_per_unit).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    ₹{itemTotal.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            }) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                      <Icons.Cart />
                                    </div>
                                    <p className="font-medium">No items found</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-green-50/50 dark:bg-gray-700">
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-green-700 dark:text-green-300">
                                Grand Total:
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                ₹{safeNum(selected.total_amount).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </Card>

                    
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Orders;