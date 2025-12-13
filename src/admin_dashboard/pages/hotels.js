// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '../components/layout/Layout';
// import { usersApi } from '../utils/api';

// const Hotels = () => {
//   // ──────────────────────────────────────────────────────
//   // 1. Auth state (shared with orders)
//   // ──────────────────────────────────────────────────────
//   const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');
//   // ──────────────────────────────────────────────────────
//   // 2. Hotels state
//   // ──────────────────────────────────────────────────────
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all');
//   const navigate = useNavigate();
//   console.log('usersApi:', usersApi);
//   // ──────────────────────────────────────────────────────
//   // 3. Helper utilities
//   // ──────────────────────────────────────────────────────
//   const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
//   const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));
//   const formatDate = d =>
//     d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
//   // ──────────────────────────────────────────────────────
//   // 4. Login handler (same as orders)
//   // ──────────────────────────────────────────────────────
//   const handleLogin = async e => {
//     e.preventDefault();
//     setLoggingIn(true);
//     setLoginError('');
//     try {
//       const res = await fetch('http://127.0.0.1:5000/api/auth/login', { // Use 127.0.0.1
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginForm),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || 'Login failed');
//       localStorage.setItem('adminToken', data.token);
//       setToken(data.token);
//     } catch (err) {
//       setLoginError(err.message);
//     } finally {
//       setLoggingIn(false);
//     }
//   };
//   // ──────────────────────────────────────────────────────
//   // 5. Data fetching
//   // ──────────────────────────────────────────────────────
//   const fetchHotels = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await usersApi.getAll(); // /api/admin/users
//       setHotels(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError(e.message);
//       setHotels([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//   // Load hotels only when we have a token
//   useEffect(() => {
//     if (token) fetchHotels();
//   }, [token]);
//   // ──────────────────────────────────────────────────────
//   // 6. Stats & filtering
//   // ──────────────────────────────────────────────────────
//   const stats = hotels.reduce(
//     (acc, h) => {
//       acc.total++;
//       // Add more stats if needed (e.g., active based on last_login)
//       return acc;
//     },
//     { total: 0 }
//   );
//   const filtered = filter === 'all' ? hotels : hotels.filter(h => h.status === filter); // Filter by status if added later
//   // ──────────────────────────────────────────────────────
//   // 7. Render – login screen first
//   // ──────────────────────────────────────────────────────
//   if (!token) {
//     return (
//       <Layout>
//         <div className="p-6 max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h2 className="text-xl font-bold mb-4">Admin Login</h2>
//             {loginError && (
//               <p className="text-red-600 text-sm mb-3">{loginError}</p>
//             )}
//             <form onSubmit={handleLogin} className="space-y-4">
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={loginForm.username}
//                 onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={loginForm.password}
//                 onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <button
//                 type="submit"
//                 disabled={loggingIn}
//                 className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {loggingIn ? 'Logging in…' : 'Login'}
//               </button>
//             </form>
//           </div>
//         </div>
//       </Layout>
//     );
//   }
//   // ──────────────────────────────────────────────────────
//   // 8. Main UI (same theme as orders)
//   // ──────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <Layout>
//         <div className="p-6 flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
//           <span className="text-gray-600">Loading hotels…</span>
//         </div>
//       </Layout>
//     );
//   }
//   return (
//     <Layout>
//       <div className="p-6">
//         {/* ---------- Header ---------- */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Hotels Management</h1>
//           <p className="text-gray-600 mt-2">View and manage all registered hotels</p>
//         </div>
//         {/* ---------- Stats Cards (simple for now) ---------- */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
//           {['total'].map(k => {
//             const label = 'Total Hotels';
//             const color = 'text-gray-900';
//             return (
//               <div key={k} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
//                 <p className="text-sm text-gray-600">{label}</p>
//                 <p className={`text-2xl font-bold ${color}`}>{safe(stats[k], 0)}</p>
//               </div>
//             );
//           })}
//           {/* Add more: Active Hotels, Inactive, etc. when you have status field */}
//         </div>
//         {/* ---------- Error ---------- */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
//             <span className="text-red-600 text-lg mr-3">⚠️</span>
//             <div>
//               <p className="text-red-800 font-medium">Error loading data</p>
//               <p className="text-red-700 text-sm">{error}</p>
//               <button onClick={fetchHotels} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}
//         {/* ---------- Filters & Refresh ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center space-x-4">
//             <label className="text-sm font-medium text-gray-700">Filter by status:</label>
//             <select
//               value={filter}
//               onChange={e => setFilter(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Hotels</option>
//               {/* Add options like <option value="active">Active</option> when status field exists */}
//             </select>
//           </div>
//           <button
//             onClick={fetchHotels}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
//           >
//             <span className="mr-2">🔄</span>
//             Refresh
//           </button>
//         </div>
//         {/* ---------- Table ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {['ID', 'Hotel Name', 'Image', 'Username', 'Email', 'Phone', 'Address', 'Created At', 'Last Login', 'Actions'].map(h => (
//                     <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
//                       <div className="flex flex-col items-center">
//                         <span className="text-4xl mb-2">🏨</span>
//                         <p className="text-lg">No hotels found</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map(h => (
//                     <tr key={h.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         #{safe(h.id)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(h.hotel_name)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {safe(h.hotel_image) ? (
//                           <img
//                             src={h.hotel_image}
//                             alt={safe(h.hotel_name)}
//                             className="w-10 h-10 rounded-lg object-cover border"
//                             onError={(e) => {
//                               e.target.style.display = 'none';
//                               e.target.nextSibling.style.display = 'block';
//                             }}
//                           />
//                         ) : (
//                           <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
//                             🏨
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(h.username)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(h.email)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(h.phone)}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {safe(h.address)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {formatDate(h.created_at)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {formatDate(h.last_login)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => navigate(`/admin/hotels/${h.id}`)}
//                             className="text-blue-600 hover:text-blue-900 text-xs underline"
//                           >
//                             View
//                           </button>
//                           {/* Add Edit/Delete buttons later */}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//         {/* ---------- Footer API note ---------- */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
//           <span className="text-blue-600 text-lg mr-3">API</span>
//           <div>
//             <p className="text-blue-800 font-medium">Connected to live backend</p>
//             <p className="text-blue-700 text-sm">Hotels loaded: {hotels.length} | http://127.0.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Hotels;

// src/admin_dashboard/pages/hotels.js
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
    <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100 flex justify-between items-center">
      <h3 className="text-xl font-bold text-green-800">{title}</h3>
      {linkTo && (
        <a href={linkTo} className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors">
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
                    <Icons.Building />
                  </div>
                  <p className="text-gray-500 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className={`hover:bg-green-50/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(r)}>
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
      const res = await fetch('http://localhost:5000/api/auth/login', {
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
  const filtered = filter === 'all' ? hotels : hotels.filter(h => h.status === filter); // Filter by status if added later
  // ──────────────────────────────────────────────────────
  // 7. Render – login screen first
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
  // ──────────────────────────────────────────────────────
  // 8. Main UI (same theme as orders)
  // ──────────────────────────────────────────────────────
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
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your hotels...</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="p-8 w-full">
          {/* ---------- Header ---------- */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                Hotels Management
              </h1>
              <p className="text-gray-600 text-lg font-medium">View and manage all registered hotels</p>
            </div>
            <button
              onClick={fetchHotels}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Icons.Refresh />
              Refresh Data
            </button>
          </div>

          {/* ---------- Error ---------- */}
          {error && (
            <Card className="mb-6 bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-600 text-lg">Warning</span>
                <div>
                  <p className="text-red-800 font-medium">Failed to load data</p>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={fetchHotels} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
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

          

          {/* ---------- Table ---------- */}
          <MiniTable
            title="Hotels List"
            headers={['ID', 'Hotel Name', 'Image', 'Username', 'Email', 'Phone', 'Address', 'Created At', 'Last Login', 'Actions']}
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
                <span key="address" className="block max-w-xs truncate">{safe(h.address)}</span>,
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