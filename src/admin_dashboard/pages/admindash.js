// src/admin_dashboard/pages/admindash.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ordersApi,
  analyticsApi,
  productsApi,
  usersApi,
  billsApi,
  supportApi,
} from '../utils/api';

// ──────────────────────────────────────────────────────
// 1. Date Formatter
// ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const options = { day: '2-digit', month: 'short' };
  return date.toLocaleDateString('en-IN', options); // "03 Nov"
};

// ──────────────────────────────────────────────────────
// 2. SVG Icons (Beautiful, Reusable)
// ──────────────────────────────────────────────────────
const Icons = {
  Cart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Package: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Box: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Help: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
};

// ──────────────────────────────────────────────────────
// 3. Reusable UI Components (Modern, Animated)
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700', Icon, trend }) => (
  <Card hover className="relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl ${color === 'text-green-700' ? 'bg-green-100' : color === 'text-emerald-700' ? 'bg-emerald-100' : color === 'text-teal-700' ? 'bg-teal-100' : color === 'text-orange-600' ? 'bg-orange-100' : color === 'text-red-600' ? 'bg-red-100' : 'bg-green-100'}`}>
          {Icon && <Icon />}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <Icons.TrendUp />
            <span className="text-xs font-semibold text-green-700">+{trend}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  </Card>
);

const MiniTable = ({ title, headers, rows, linkTo, emptyMsg = 'No data' }) => (
  <Card>
    <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100 flex justify-between items-center">
      <h3 className="text-xl font-bold text-green-800">{title}</h3>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors">
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-green-50/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-green-50/30 transition-colors">
                {r.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-sm font-medium text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </Card>
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
// 4. Main Dashboard Component
// ──────────────────────────────────────────────────────
export default function Admindash() {
  const token = localStorage.getItem('adminToken');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ───── Login Handler ─────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('adminToken', data.token);
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // ───── Fetch Dashboard Data ─────
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        dash,
        orders,
        products,
        users,
        bills,
        tickets,
      ] = await Promise.all([
        analyticsApi.getDashboard().catch(() => ({})),
        ordersApi.getAll().catch(() => []),
        productsApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        billsApi.getAll().catch(() => []),
        supportApi.getAll().catch(() => []),
      ]);

      setStats({
        totalOrders: dash.total_orders ?? 0,
        revenue: dash.month_revenue ?? 0,
        pendingPayments: dash.pending_payments ?? 0,
        outOfStock: dash.out_of_stock ?? 0,
        totalHotels: Array.isArray(users) ? users.length : 0,
        openTickets: Array.isArray(tickets) ? tickets.filter(t => t.status === 'open').length : 0,
      });

      const recent = Array.isArray(orders)
        ? orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(o => [
              `#${o.id}`,
              o.hotel_name || '—',
              `₹${o.total_amount?.toLocaleString() || 0}`,
              o.status,
              formatDate(o.created_at),
            ])
        : [];
      setRecentOrders(recent);

      const low = Array.isArray(products)
        ? products
            .filter(p => (p.stock_quantity ?? 0) < 10)
            .slice(0, 5)
            .map(p => [p.name, p.stock_quantity ?? 0, p.unit || 'kg'])
        : [];
      setLowStock(low);

      const billsRecent = Array.isArray(bills)
        ? bills
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(b => [
              `#${b.id}`,
              b.hotel_name || '—',
              `₹${b.total?.toLocaleString() || 0}`,
              b.status,
              formatDate(b.created_at),
            ])
        : [];
      setRecentBills(billsRecent);

      const openT = Array.isArray(tickets)
        ? tickets
            .filter(t => t.status === 'open')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(t => [`#${t.id}`, t.subject, formatDate(t.created_at)])
        : [];
      setOpenTickets(openT);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const refresh = () => fetchDashboard();

  // ───── Login Screen ─────
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Admin Login</h2>
            {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
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

  // ───── Loading ─────
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ───── Main Dashboard UI ─────
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="p-8 w-full">

          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg font-medium">Welcome back! Here's your business overview.</p>
            </div>
            <button
              onClick={refresh}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Icons.Refresh />
              Refresh Data
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <Card className="mb-6 bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-600 text-lg">Warning</span>
                <div>
                  <p className="text-red-800 font-medium">Failed to load data</p>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={refresh} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    Retry
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <Stat label="Total Orders" value={stats.totalOrders?.toLocaleString() || 0} Icon={Icons.Cart} color="text-green-700" trend={12} />
            <Stat label="Revenue" value={`₹${stats.revenue?.toLocaleString() || 0}`} Icon={Icons.Chart} color="text-emerald-700" trend={8} />
            <Stat label="Pending Payments" value={stats.pendingPayments || 0} Icon={Icons.Receipt} color="text-orange-600" />
            <Stat label="Out of Stock" value={stats.outOfStock || 0} Icon={Icons.Package} color="text-red-600" />
            <Stat label="Active Hotels" value={stats.totalHotels || 0} Icon={Icons.Building} color="text-teal-700" trend={5} />
            <Stat label="Open Tickets" value={stats.openTickets || 0} Icon={Icons.Help} color="text-green-700" />
          </div>

          {/* Quick Links */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { to: '/admin/orders', label: 'Orders', Icon: Icons.Cart },
                { to: '/admin/products', label: 'Products', Icon: Icons.Package },
                { to: '/admin/inventory', label: 'Inventory', Icon: Icons.Box },
                { to: '/admin/billing', label: 'Billing', Icon: Icons.Receipt },
                { to: '/admin/users', label: 'Hotels', Icon: Icons.Building },
                { to: '/admin/support', label: 'Support', Icon: Icons.Help },
                { to: '/admin/analytics', label: 'Analytics', Icon: Icons.Chart },
                { to: '/admin/settings', label: 'Settings', Icon: Icons.Settings },
              ].map(({ to, label, Icon }) => (
                <QuickLink key={to} to={to} label={label} Icon={Icon} />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <Card>
              <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                <h3 className="text-xl font-bold text-green-800">Revenue Trend</h3>
                <p className="text-sm text-gray-600 mt-1">Monthly performance overview</p>
              </div>
              <div className="p-8 h-80 flex items-center justify-center bg-gradient-to-br from-green-50/30 to-transparent">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
                    <Icons.Chart />
                  </div>
                  <p className="text-gray-500 font-medium">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-400 mt-2">Connect Chart.js for live data</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-800">Orders Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Order status breakdown</p>
              </div>
              <div className="p-8 h-80 flex items-center justify-center bg-gradient-to-br from-emerald-50/30 to-transparent">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Icons.Cart />
                  </div>
                  <p className="text-gray-500 font-medium">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-400 mt-2">Connect Chart.js for live data</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Mini Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <MiniTable title="Recent Orders" headers={['ID', 'Hotel', 'Amount', 'Status', 'Date']} rows={recentOrders} linkTo="/admin/orders" />
            <MiniTable title="Low Stock Items" headers={['Product', 'Stock', 'Unit']} rows={lowStock} linkTo="/admin/inventory" emptyMsg="All items well stocked" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <MiniTable title="Recent Bills" headers={['ID', 'Hotel', 'Total', 'Status', 'Date']} rows={recentBills} linkTo="/admin/billing" />
            <MiniTable title="Open Support Tickets" headers={['ID', 'Subject', 'Date']} rows={openTickets} linkTo="/admin/support" emptyMsg="No open tickets" />
          </div>

        </div>
      </div>
    </Layout>
  );
}