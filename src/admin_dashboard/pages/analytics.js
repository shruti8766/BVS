// // src/admin_dashboard/pages/analytics.js
// import React, { useState, useEffect } from 'react';
// import Layout from '../components/layout/Layout';
// import { analyticsApi, productsApi } from '../utils/api';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// const Analytics = () => {
//   // ──────────────────────────────────────────────────────
//   // 1. Auth state (shared)
//   // ──────────────────────────────────────────────────────
//   const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // ──────────────────────────────────────────────────────
//   // 2. Analytics state
//   // ──────────────────────────────────────────────────────
//   const [dashboard, setDashboard] = useState({});
//   const [trends, setTrends] = useState([]);  // For charts
//   const [topProducts, setTopProducts] = useState([]);
//   const [lowStock, setLowStock] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   console.log('analyticsApi:', analyticsApi);

//   // ──────────────────────────────────────────────────────
//   // 3. Helper utilities
//   // ──────────────────────────────────────────────────────
//   const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
//   const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

//   const formatDate = d =>
//     d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

//   // Compute daily/weekly/monthly from trends (or orders)
//   const computeRevenue = (data) => {
//     const today = new Date();
//     const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
//     const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

//     const todayRevenue = safeNum(data.filter(d => new Date(d.date).toDateString() === today.toDateString()).reduce((sum, d) => sum + safeNum(d.revenue), 0));
//     const weekRevenue = safeNum(data.filter(d => new Date(d.date) >= weekAgo).reduce((sum, d) => sum + safeNum(d.revenue), 0));
//     const monthRevenue = safeNum(data.filter(d => new Date(d.date) >= monthAgo).reduce((sum, d) => sum + safeNum(d.revenue), 0));

//     return { today: todayRevenue, week: weekRevenue, month: monthRevenue };
//   };

//   // ──────────────────────────────────────────────────────
//   // 4. Login handler (same)
//   // ──────────────────────────────────────────────────────
//   const handleLogin = async e => {
//     e.preventDefault();
//     setLoggingIn(true);
//     setLoginError('');

//     try {
//       const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
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
//   const fetchAnalytics = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Dashboard stats
//       const dashboardData = await analyticsApi.getDashboard();
//       setDashboard(dashboardData);

//       // Orders for trends
//       const ordersData = await analyticsApi.getOrders();
//       // Compute trends from orders (daily revenue)
//       const dailyTrends = [];
//       const ordersByDate = ordersData.reduce((acc, order) => {
//         const date = new Date(order.created_at).toISOString().split('T')[0];
//         acc[date] = (acc[date] || 0) + safeNum(order.total_amount);
//         return acc;
//       }, {});
//       Object.entries(ordersByDate).slice(0, 30).forEach(([date, revenue]) => {
//         dailyTrends.push({ date, revenue });
//       });
//       setTrends(dailyTrends);

//       // Top products (from orders or products)
//       const productsData = await analyticsApi.getProducts();
//       // Simulate top (in real: aggregate from order_items)
//       const top = productsData.slice(0, 5).map(p => ({ ...p, sales: Math.random() * 100 }));
//       setTopProducts(top.sort((a, b) => b.sales - a.sales));

//       // Low stock
//       const low = productsData.filter(p => safeNum(p.stock_quantity) < 10);
//       setLowStock(low);

//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchAnalytics();
//   }, [token]);

//   const revenueStats = computeRevenue(trends);

//   // ──────────────────────────────────────────────────────
//   // 7. Render – login first
//   // ──────────────────────────────────────────────────────
//   if (!token) {
//     return (
//       <Layout>
//         <div className="p-6 max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h2 className="text-xl font-bold mb-4">Admin Login</h2>
//             {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
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

//   if (loading) {
//     return (
//       <Layout>
//         <div className="p-6 flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
//           <span className="text-gray-600">Loading analytics...</span>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="p-6">

//         {/* ---------- Header ---------- */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
//           <p className="text-gray-600 mt-2">Business insights, revenue trends, and performance metrics</p>
//         </div>

//         {/* ---------- Stats Cards ---------- */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//           {[
//             { key: 'total_orders', label: 'Total Orders', color: 'text-gray-900' },
//             { key: 'total_revenue', label: 'Total Revenue', color: 'text-green-600', prefix: '₹' },
//             { key: 'pending_orders', label: 'Pending Orders', color: 'text-yellow-600' },
//             { key: 'total_products', label: 'Total Products', color: 'text-blue-600' },
//             { key: 'this_month_revenue', label: 'This Month', color: 'text-purple-600', prefix: '₹' },
//             { key: 'lowStock', label: 'Low Stock Items', color: 'text-orange-600' },
//           ].map(({ key, label, color, prefix = '' }) => (
//             <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
//               <p className="text-sm text-gray-600">{label}</p>
//               <p className={`text-2xl font-bold ${color}`}>
//                 {prefix}{safeNum(dashboard[key]).toLocaleString('en-IN')}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* ---------- Error ---------- */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
//             <span className="text-red-600 text-lg mr-3">⚠️</span>
//             <div>
//               <p className="text-red-800 font-medium">Error loading data</p>
//               <p className="text-red-700 text-sm">{error}</p>
//               <button onClick={fetchAnalytics} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ---------- Charts ---------- */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {/* Revenue Trend Line Chart */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h4 className="text-lg font-medium mb-4">Revenue Trends (Last 30 Days)</h4>
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={trends}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
//                 <Legend />
//                 <Line type="monotone" dataKey="revenue" stroke="#4a7c2c" strokeWidth={2} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Orders Overview Bar Chart */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h4 className="text-lg font-medium mb-4">Orders Overview</h4>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={trends}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="revenue" fill="#82ca9d" name="Orders" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* ---------- Revenue Breakdown ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <h4 className="text-lg font-medium mb-4">Revenue Breakdown</h4>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="text-center p-4 border-r">
//               <p className="text-2xl font-bold text-green-600">₹{revenueStats.today.toLocaleString()}</p>
//               <p className="text-sm text-gray-600">Today</p>
//             </div>
//             <div className="text-center p-4 border-r">
//               <p className="text-2xl font-bold text-blue-600">₹{revenueStats.week.toLocaleString()}</p>
//               <p className="text-sm text-gray-600">This Week</p>
//             </div>
//             <div className="text-center p-4">
//               <p className="text-2xl font-bold text-purple-600">₹{revenueStats.month.toLocaleString()}</p>
//               <p className="text-sm text-gray-600">This Month</p>
//             </div>
//           </div>
//         </div>

//         {/* ---------- Top Products Table ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h4 className="text-lg font-medium mb-4">Top Selling Products</h4>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {topProducts.map((p, i) => (
//                   <tr key={p.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       {safe(p.name)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {safeNum(p.sales).toFixed(0)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       ₹{safeNum(p.price_per_unit * p.sales).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* ---------- Low Stock Alert ---------- */}
//         {lowStock.length > 0 && (
//           <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
//             <h4 className="text-lg font-medium mb-2 text-yellow-800">Low Stock Alert ({lowStock.length} items)</h4>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {lowStock.slice(0, 6).map(p => (
//                 <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm">
//                   <p className="font-medium">{safe(p.name)}</p>
//                   <p className="text-sm text-yellow-800">Stock: {safeNum(p.stock_quantity)}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ---------- Footer ---------- */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
//           <span className="text-blue-600 text-lg mr-3">API</span>
//           <div>
//             <p className="text-blue-800 font-medium">Connected to live backend</p>
//             <p className="text-blue-700 text-sm">Analytics loaded | http://127.0.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Analytics;
// src/admin_dashboard/pages/analytics.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { analyticsApi, productsApi } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden ${className}`}>
    {children}
  </div>
);
const Stat = ({ label, value, color = 'text-green-700', prefix = '' }) => (
  <Card hover className="relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-6">
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{prefix}{value}</p>
    </div>
  </Card>
);
// ──────────────────────────────────────────────────────
// 3. Main Analytics Component
// ──────────────────────────────────────────────────────
const Analytics = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  // ──────────────────────────────────────────────────────
  // 2. Analytics state
  // ──────────────────────────────────────────────────────
  const [dashboard, setDashboard] = useState({});
  const [trends, setTrends] = useState([]); // For charts
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log('analyticsApi:', analyticsApi);
  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));
  // Compute daily/weekly/monthly from trends (or orders)
  const computeRevenue = (data) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayRevenue = safeNum(data.filter(d => new Date(d.date).toDateString() === today.toDateString()).reduce((sum, d) => sum + safeNum(d.revenue), 0));
    const weekRevenue = safeNum(data.filter(d => new Date(d.date) >= weekAgo).reduce((sum, d) => sum + safeNum(d.revenue), 0));
    const monthRevenue = safeNum(data.filter(d => new Date(d.date) >= monthAgo).reduce((sum, d) => sum + safeNum(d.revenue), 0));
    return { today: todayRevenue, week: weekRevenue, month: monthRevenue };
  };
  // ──────────────────────────────────────────────────────
  // 4. Login handler (same)
  // ──────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
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
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
     
      // Dashboard stats
      const dashboardData = await analyticsApi.getDashboard();
      setDashboard(dashboardData);
      // Orders for trends
      const ordersData = await analyticsApi.getOrders();
      // Compute trends from orders (daily revenue)
      const dailyTrends = [];
      const ordersByDate = ordersData.reduce((acc, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + safeNum(order.total_amount);
        return acc;
      }, {});
      Object.entries(ordersByDate).slice(0, 30).forEach(([date, revenue]) => {
        dailyTrends.push({ date, revenue });
      });
      setTrends(dailyTrends);
      // Top products (from orders or products)
      const productsData = await analyticsApi.getProducts();
      // Simulate top (in real: aggregate from order_items)
      const top = productsData.slice(0, 5).map(p => ({ ...p, sales: Math.random() * 100 }));
      setTopProducts(top.sort((a, b) => b.sales - a.sales));
      // Low stock
      const low = productsData.filter(p => safeNum(p.stock_quantity) < 10);
      setLowStock(low);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (token) fetchAnalytics();
  }, [token]);
  const revenueStats = computeRevenue(trends);
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
        {/* ---------- Header ---------- */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg font-medium">Business insights, revenue trends, and performance metrics</p>
        </div>
        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Stat label="Total Orders" value={safeNum(dashboard.total_orders).toLocaleString('en-IN') || 0} color="text-green-700" />
          <Stat label="Total Revenue" value={`${safeNum(dashboard.total_revenue).toLocaleString('en-IN')}`} color="text-emerald-700" prefix="₹" />
          <Stat label="Pending Orders" value={safeNum(dashboard.pending_orders).toLocaleString('en-IN') || 0} color="text-orange-600" />
          <Stat label="Total Products" value={safeNum(dashboard.total_products).toLocaleString('en-IN') || 0} color="text-teal-700" />
          <Stat label="This Month" value={`${safeNum(dashboard.this_month_revenue).toLocaleString('en-IN')}`} color="text-purple-700" prefix="₹" />
          <Stat label="Low Stock Items" value={safeNum(dashboard.lowStock).toLocaleString('en-IN') || 0} color="text-red-600" />
        </div>
        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">Error loading data</p>
                <p className="text-red-700 text-sm">{error}</p>
                <button onClick={fetchAnalytics} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}
        {/* ---------- Charts ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          {/* Revenue Trend Line Chart */}
          <Card>
            <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
              <h4 className="text-xl font-bold text-green-800">Revenue Trends (Last 30 Days)</h4>
            </div>
            <div className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          {/* Orders Overview Bar Chart */}
          <Card>
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-100">
              <h4 className="text-xl font-bold text-emerald-800">Orders Overview</h4>
            </div>
            <div className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#34d399" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        {/* ---------- Revenue Breakdown ---------- */}
        <Card className="mb-10">
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
            <h4 className="text-xl font-bold text-green-800">Revenue Breakdown</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <p className="text-3xl font-bold text-green-700">₹{revenueStats.today.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-600 mt-1">Today</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                <p className="text-3xl font-bold text-emerald-700">₹{revenueStats.week.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-600 mt-1">This Week</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-teal-700">₹{revenueStats.month.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-600 mt-1">This Month</p>
              </div>
            </div>
          </div>
        </Card>
        {/* ---------- Top Products Table ---------- */}
        <Card className="mb-10">
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
            <h4 className="text-xl font-bold text-green-800">Top Selling Products</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {topProducts.map((p, i) => (
                  <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {safe(p.name)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {safeNum(p.sales).toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      ₹{safeNum(p.price_per_unit * p.sales).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {/* ---------- Low Stock Alert ---------- */}
        {lowStock.length > 0 && (
          <Card className="mb-10 bg-orange-50 border-orange-200">
            <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100">
              <h4 className="text-xl font-bold text-orange-800">Low Stock Alert ({lowStock.length} items)</h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lowStock.slice(0, 6).map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                    <p className="font-medium text-gray-700">{safe(p.name)}</p>
                    <p className="text-sm text-orange-700">Stock: {safeNum(p.stock_quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

// Add this to your global CSS file (e.g., globals.css or index.css) for the running animation
/*
@keyframes run {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(10px) rotate(5deg);
  }
  50% {
    transform: translateX(0) rotate(0deg);
  }
  75% {
    transform: translateX(-10px) rotate(-5deg);
  }
}
.animate-[run_1s_ease-in-out_infinite] {
  animation: run 1s ease-in-out infinite;
}
*/

export default Analytics;