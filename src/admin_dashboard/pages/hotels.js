
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usersApi } from '../utils/api';

// ──────────────────────────────────────────────────────
// 1. SVG Icons (Beautiful, Reusable) - Copied from Dashboard
// ──────────────────────────────────────────────────────
const Icons = {
  Building: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  <Card hover className="relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-xl ${color === 'text-green-700' ? 'bg-green-100' : color === 'text-emerald-700' ? 'bg-emerald-100' : color === 'text-teal-700' ? 'bg-teal-100' : color === 'text-orange-600' ? 'bg-orange-100' : color === 'text-red-600' ? 'bg-red-100' : 'bg-green-100'}`}>
          {Icon && <Icon />}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-700">+{trend}%</span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  </Card>
);

const MiniTable = ({ title, headers, rows, linkTo, emptyMsg = 'No data', onRowClick }) => (
  <Card>
    <div className="px-6 py-5 bg-green-50 dark:bg-green-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 className="text-xl font-bold text-green-800 dark:text-green-300">{title}</h3>
      {linkTo && (
        <a href={linkTo} className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1 transition-colors">
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-white dark:bg-gray-800">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.Building />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(r)}>
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
  </Card>
);

// ──────────────────────────────────────────────────────
// 3. Main Component (Functionality Unchanged)
// ──────────────────────────────────────────────────────
const Hotels = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared with orders)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  // ──────────────────────────────────────────────────────
  // 2. Hotels state
  // ──────────────────────────────────────────────────────
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  console.log('usersApi:', usersApi);
  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));
  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  // ──────────────────────────────────────────────────────
  // 4. Login handler (same as orders)
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
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll(); // /api/admin/users
      setHotels(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };
  // Load hotels only when we have a token
  useEffect(() => {
    if (token) fetchHotels();
  }, [token]);
  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = hotels.reduce(
    (acc, h) => {
      acc.total++;
      // Add more stats if needed (e.g., active based on last_login)
      return acc;
    },
    { total: 0 }
  );
  const filtered = (filter === 'all' ? hotels : hotels.filter(h => h.status === filter)).filter(h =>
    h.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
  // ──────────────────────────────────────────────────────
  // 8. Main UI (same theme as orders)
  // ──────────────────────────────────────────────────────
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
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Broccoli is crunching your hotels...</p>
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
                Hotels Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage all registered hotels</p>
            </div>
            <button
              onClick={fetchHotels}
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
                  <button onClick={fetchHotels} className="mt-2 px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600">
                    Retry
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ---------- Stats Cards (simple for now) ---------- */}
          <div className="grid grid-cols-1 gap-6 mb-10">
            <Stat label="Total Hotels" value={stats.total?.toLocaleString() || 0} Icon={Icons.Building} color="text-teal-700" trend={5} />
          </div>

          {/* ---------- Search Bar ---------- */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="text"
              placeholder="Search by hotel name, username, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
            />
          </div>

          {/* ---------- Table ---------- */}
          <MiniTable
            title="Hotels List"
            headers={['ID', 'Hotel Name', 'Image', 'Username', 'Email', 'Phone', 'Created At', 'Last Login', 'Actions']}
            rows={
              filtered.map(h => [
                `#${safe(h.id)}`,
                safe(h.hotel_name),
                safe(h.hotel_image) ? (
                  <div key="img-container" className="relative">
                    <img
                      src={h.hotel_image}
                      alt={safe(h.hotel_name)}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-green-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = '<div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 text-2xl">🏨</div>';
                      }}
                    />
                  </div>
                ) : (
                  <div key="fallback" className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 text-2xl">
                    🏨
                  </div>
                ),
                safe(h.username),
                safe(h.email),
                safe(h.phone),
                formatDate(h.created_at),
                formatDate(h.last_login),
                <div key="actions" className="flex space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/hotels/${h.id}`); }}
                    className="text-green-600 hover:text-green-700 text-xs underline transition-colors"
                  >
                    View
                  </button>
                  {/* Add Edit/Delete buttons later */}
                </div>,
              ])
            }
            emptyMsg="No hotels found"
            onRowClick={null}
          />

        </div>
      </div>
    </Layout>
  );
};

export default Hotels;