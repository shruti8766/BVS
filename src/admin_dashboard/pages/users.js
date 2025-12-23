import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usersApi } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// ──────────────────────────────────────────────────────
// 1. Date Formatter (from dashboard)
// ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};

// ──────────────────────────────────────────────────────
// 2. Reusable UI Components (Adapted from dashboard)
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl dark:hover:shadow-green-800/30 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700' }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-green-900/20 border border-gray-200 dark:border-green-900 p-4 lg:p-6">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</h3>
    <div className={`text-2xl font-semibold ${color} ${color === 'text-green-700' ? 'dark:text-green-400' : color === 'text-teal-700' ? 'dark:text-teal-400' : 'dark:text-gray-400'}`}>{value}</div>
  </div>
);

const MiniTable = ({ headers, rows, emptyMsg = 'No data', onEdit, onDelete, onView }) => (
  <Card>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-green-50/50 dark:bg-gray-800/50">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50 dark:divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl mb-2">👥</span>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const user = r.slice(-1)[0];  // Last element is the user object
              return (
                <tr key={i} className="hover:bg-green-50/30 dark:hover:bg-gray-800/30 transition-colors">
                  {r.slice(0, -1).map((cell, j) => (  // All but actions/user
                    <td key={j} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {cell}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => onView(user.id)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-xs font-medium underline transition-colors"
                      >
                        View
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
);

const QuickAction = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
  >
    {children}
  </button>
);

// ──────────────────────────────────────────────────────
// 3. Main Users Component
// ──────────────────────────────────────────────────────
const Users = () => {
  const navigate = useNavigate();
  
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. Users state
  // ──────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // CRUD modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  console.log('usersApi:', usersApi);

  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);

  // ──────────────────────────────────────────────────────
  // 4. Login handler (same)
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
  // 5. Data fetching & CRUD
  // ──────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      await usersApi.create(userData);
      await fetchUsers();
      setShowCreate(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const res = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      await fetchUsers();
      setShowEdit(false);
      setEditingUser(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteUser = async (id) => {
    const userName = users.find(u => u.id === id)?.hotel_name || 'this user';
    setUserToDelete({ id, name: userName });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await usersApi.delete(userToDelete.id);
      await fetchUsers();
      setError(null);  // Clear errors
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (e) {
      console.error('Delete failed:', e);
      setError(e.message || 'Failed to delete user');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = users.reduce(
    (acc, u) => {
      acc.total++;
      acc[u.role || 'hotel'] = (acc[u.role || 'hotel'] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  const filtered = filter === 'all' 
    ? users 
    : users.filter(u => u.role === filter);

  const tableRows = filtered.map(u => [
    `#${safe(u.id)}`,
    safe(u.username),
    <span key="role" className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      u.role === 'hotel' ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-gray-100 text-gray-800 border-gray-200'
    }`}>
      {safe(u.role)}
    </span>,
    safe(u.hotel_name),
    safe(u.email),
    safe(u.phone),
    formatDate(u.created_at),
    formatDate(u.last_login),
    u  // User object for actions
  ]);

  // ──────────────────────────────────────────────────────
  // 7. Render – login first
  // ──────────────────────────────────────────────────────
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 dark:border-green-900 border-t-green-600 dark:border-t-green-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-full">
        {/* ---------- Header + Add Button ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-1">
              Users Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage hotel users and accounts</p>
          </div>
          <QuickAction onClick={() => setShowCreate(true)}>
            + Add User
          </QuickAction>
        </div>

        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Stat label="Total Users" value={safe(stats.total, 0).toLocaleString() || 0} color="text-green-700" />
          <Stat label="Hotel Users" value={safe(stats.hotel, 0).toLocaleString() || 0} color="text-teal-700" />
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">Error loading data</p>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <button onClick={fetchUsers} className="mt-2 px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ---------- Table with Filters ---------- */}
        <Card>
          <div className="px-6 py-5 bg-green-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by role:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              >
                <option value="all">All Users</option>
                <option value="hotel">Hotel Users</option>
                {/* Add <option value="admin">Admin</option> if needed */}
              </select>
            </div>
            <button onClick={fetchUsers} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center text-sm font-medium transition-colors">
              <span className="mr-2">🔄</span> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50 dark:bg-gray-800/50 border-b-2 border-green-200 dark:border-green-900">
                  {['ID', 'Username', 'Role', 'Hotel Name', 'Email', 'Phone', 'Created At', 'Last Login', 'Actions'].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl mb-2">👥</span>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableRows.map((r, i) => {
                    const user = r.slice(-1)[0];
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        {r.slice(0, -1).map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {cell}
                          </td>
                        ))}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => { setEditingUser(user); setShowEdit(true); }}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => navigate(`/admin/hotels/${user.id}`)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                            >
                              View
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

        {/* ---------- Create User Modal ---------- */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Add New User</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const userData = Object.fromEntries(formData);
                  userData.role = 'hotel';  // Default
                  createUser(userData);
                }}
                className="space-y-4"
              >
                <input name="username" placeholder="Username" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="password" type="password" placeholder="Password" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="hotel_name" placeholder="Hotel Name" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="hotel_image" placeholder="Hotel Image URL" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="email" type="email" placeholder="Email (Optional)" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="phone" placeholder="Phone" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="address" placeholder="Address" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <QuickAction type="submit" className="!w-full !text-sm">
                  Create User
                </QuickAction>
              </form>
            </Card>
          </div>
        )}

        {/* ---------- Edit User Modal ---------- */}
        {showEdit && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Edit User #{safe(editingUser.id)}</h3>
                <button onClick={() => { setShowEdit(false); setEditingUser(null); }} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  updateUser(editingUser.id, Object.fromEntries(formData));
                }}
                className="space-y-4"
              >
                <input name="hotel_name" defaultValue={editingUser.hotel_name} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="hotel_image" defaultValue={safe(editingUser.hotel_image, '')} placeholder="Hotel Image URL" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="email" type="email" defaultValue={editingUser.email} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="phone" defaultValue={editingUser.phone} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="address" defaultValue={editingUser.address} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <QuickAction type="submit" className="!w-full !text-sm !from-emerald-500 !to-teal-600 dark:!from-emerald-700 dark:!to-teal-800">
                  Update User
                </QuickAction>
              </form>
            </Card>
          </div>
        )}

        {/* ---------- Details Modal ---------- */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400">
                    {safe(selected.hotel_name)} Details
                  </h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl transition-colors">×</button>
                </div>
                <div className="space-y-6">
                  {/* ---------- Hotel Image ---------- */}
                  <div className="flex justify-center mb-6">
                    {safe(selected.hotel_image) ? (
                      <img
                        src={selected.hotel_image}
                        alt={safe(selected.hotel_name)}
                        className="w-full max-w-md h-64 object-cover rounded-2xl shadow-lg"
                      />
                    ) : (
                      <div className="w-full max-w-md h-64 bg-green-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-green-200 dark:border-green-900">
                        <span className="text-gray-500 dark:text-gray-400 text-lg">No image available</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Username</p><p className="font-semibold text-green-800 dark:text-green-400">{safe(selected.username)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="font-semibold text-green-800 dark:text-green-400">{safe(selected.role)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Hotel Name</p><p className="font-semibold text-green-800 dark:text-green-400">{safe(selected.hotel_name)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="font-semibold text-gray-800 dark:text-gray-200">{safe(selected.email)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="font-semibold text-gray-800 dark:text-gray-200">{safe(selected.phone)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Address</p><p className="font-semibold text-gray-800 dark:text-gray-200">{safe(selected.address)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Created At</p><p className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(selected.created_at)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p><p className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(selected.last_login)}</p></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ---------- Delete Confirmation Modal ---------- */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-sm w-full bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-900">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
                    Delete User?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete <span className="font-bold text-green-700 dark:text-green-400">{safe(userToDelete.hotel_name)}</span>?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    This will remove all their orders, bills, and related tickets. This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmDelete()}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 text-white font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
                  >
                    Delete
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

export default Users;