// // src/admin_dashboard/pages/inventory.js
// import React, { useState, useEffect } from 'react';
// import Layout from '../components/layout/Layout';
// import { productsApi } from '../utils/api';

// const Inventory = () => {
//   // ──────────────────────────────────────────────────────
//   // 1. Auth state (shared)
//   // ──────────────────────────────────────────────────────
//   const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // ──────────────────────────────────────────────────────
//   // 2. Inventory state (products with stock focus)
//   // ──────────────────────────────────────────────────────
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all');
//   const [selected, setSelected] = useState(null);

//   // Quick stock update modal
//   const [showStockUpdate, setShowStockUpdate] = useState(false);
//   const [updatingProduct, setUpdatingProduct] = useState(null);
//   const [newStock, setNewStock] = useState(0);

//   console.log('productsApi:', productsApi);

//   // ──────────────────────────────────────────────────────
//   // 3. Helper utilities
//   // ──────────────────────────────────────────────────────
//   const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
//   const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

//   const formatDate = d =>
//     d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

//   const getStockColor = (stock) => {
//     if (stock === 0) return 'text-red-600 bg-red-100';
//     if (stock < 10) return 'text-yellow-600 bg-yellow-100';
//     return 'text-green-600 bg-green-100';
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
//   // 5. Data fetching & stock update
//   // ──────────────────────────────────────────────────────
//   const fetchInventory = async () => {
//     fetchProducts();  // Reuse products fetch
//   };

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await productsApi.getAll();
//       setProducts(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError(e.message);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateStock = async () => {
//     if (!updatingProduct || newStock === undefined) return;
//     try {
//       await productsApi.updateStock(updatingProduct.id, newStock);
//       await fetchProducts();  // Refresh
//       setShowStockUpdate(false);
//       setUpdatingProduct(null);
//       setNewStock(0);
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchInventory();
//   }, [token]);

//   // ──────────────────────────────────────────────────────
//   // 6. Stats & filtering
//   // ──────────────────────────────────────────────────────
//   const stats = products.reduce(
//     (acc, p) => {
//       acc.total++;
//       if (p.stock_quantity > 0) acc.available++;
//       if (p.stock_quantity < 10) acc.lowStock++;
//       if (p.stock_quantity === 0) acc.outOfStock++;
//       return acc;
//     },
//     { total: 0, available: 0, lowStock: 0, outOfStock: 0 }
//   );

//   const filtered = filter === 'all' 
//     ? products 
//     : filter === 'low-stock' 
//       ? products.filter(p => p.stock_quantity < 10) 
//       : filter === 'out-of-stock' 
//         ? products.filter(p => p.stock_quantity === 0)
//         : products.filter(p => p.category === filter);

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
//           <span className="text-gray-600">Loading inventory…</span>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="p-6">

//         {/* ---------- Header ---------- */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
//           <p className="text-gray-600 mt-2">Monitor and update stock levels for products</p>
//         </div>

//         {/* ---------- Stats Cards ---------- */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//           {[
//             { key: 'total', label: 'Total Items', color: 'text-gray-900' },
//             { key: 'available', label: 'In Stock', color: 'text-green-600' },
//             { key: 'lowStock', label: 'Low Stock', color: 'text-yellow-600' },
//             { key: 'outOfStock', label: 'Out of Stock', color: 'text-red-600' },
//           ].map(({ key, label, color }) => (
//             <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
//               <p className="text-sm text-gray-600">{label}</p>
//               <p className={`text-2xl font-bold ${color}`}>{safe(stats[key], 0)}</p>
//             </div>
//           ))}
//         </div>

//         {/* ---------- Error ---------- */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
//             <span className="text-red-600 text-lg mr-3">⚠️</span>
//             <div>
//               <p className="text-red-800 font-medium">Error loading inventory</p>
//               <p className="text-red-700 text-sm">{error}</p>
//               <button onClick={fetchInventory} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ---------- Filters & Refresh ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center space-x-4">
//             <label className="text-sm font-medium text-gray-700">Filter by:</label>
//             <select
//               value={filter}
//               onChange={e => setFilter(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Items</option>
//               <option value="low-stock">Low Stock</option>
//               <option value="out-of-stock">Out of Stock</option>
//               {/* Dynamic categories */}
//               {[...new Set(products.map(p => p.category))].map(cat => (
//                 <option key={cat} value={cat}>{cat}</option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={fetchInventory}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
//           >
//             <span className="mr-2">🔄</span> Refresh
//           </button>
//         </div>

//         {/* ---------- Table ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {['Image', 'Name', 'Category', 'Price', 'Current Stock', 'Unit Type', 'Available', 'Actions'].map(h => (
//                     <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
//                       <div className="flex flex-col items-center">
//                         <span className="text-4xl mb-2">📦</span>
//                         <p className="text-lg">No inventory items found</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map(p => (
//                     <tr key={p.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <img src={p.image_url || 'https://via.placeholder.com/60x60?text=?'} alt={p.name} className="w-12 h-12 object-cover rounded" />
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {safe(p.name)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(p.category)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         ₹{safeNum(p.price_per_unit).toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStockColor(p.stock_quantity)}`}>
//                           {safeNum(p.stock_quantity)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(p.unit_type)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
//                           p.is_available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
//                         }`}>
//                           {p.is_available ? 'Yes' : 'No'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => { setUpdatingProduct(p); setNewStock(p.stock_quantity); setShowStockUpdate(true); }}
//                             className="text-blue-600 hover:text-blue-900 text-xs"
//                           >
//                             Update Stock
//                           </button>
//                           <button
//                             onClick={() => setSelected(p)}
//                             className="text-blue-600 hover:text-blue-900 text-xs underline"
//                           >
//                             View
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* ---------- Stock Update Modal ---------- */}
//         {showStockUpdate && updatingProduct && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-sm w-full">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-bold text-gray-900">Update Stock for {safe(updatingProduct.name)}</h3>
//                   <button onClick={() => { setShowStockUpdate(false); setUpdatingProduct(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <div className="space-y-4">
//                   <p className="text-sm text-gray-600">Current Stock: {safeNum(updatingProduct.stock_quantity)}</p>
//                   <input
//                     type="number"
//                     min="0"
//                     value={newStock}
//                     onChange={e => setNewStock(parseInt(e.target.value) || 0)}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="New stock quantity"
//                   />
//                   <button
//                     onClick={updateStock}
//                     className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
//                   >
//                     Update Stock
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Details Modal ---------- */}
//         {selected && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-xl font-bold text-gray-900">
//                     {safe(selected.name)} - Stock Details
//                   </h3>
//                   <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <img src={selected.image_url || 'https://via.placeholder.com/200x200?text=No+Image'} alt={selected.name} className="w-full h-48 object-cover rounded-lg" />
//                     </div>
//                     <div className="space-y-4">
//                       <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold">{safe(selected.name)}</p></div>
//                       <div><p className="text-sm text-gray-600">Description</p><p>{safe(selected.description)}</p></div>
//                       <div><p className="text-sm text-gray-600">Category</p><p className="font-semibold">{safe(selected.category)}</p></div>
//                       <div><p className="text-sm text-gray-600">Unit Type</p><p className="font-semibold">{safe(selected.unit_type)}</p></div>
//                       <div><p className="text-sm text-gray-600">Price per Unit</p><p className="font-semibold">₹{safeNum(selected.price_per_unit).toFixed(2)}</p></div>
//                       <div><p className="text-sm text-gray-600">Available</p>
//                         <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
//                           selected.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                         }`}>
//                           {selected.is_available ? 'Yes' : 'No'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-900 mb-2">Stock Information</p>
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <p className="text-sm text-gray-600">Current Stock: <span className={`font-semibold ${getStockColor(selected.stock_quantity)}`}>{safeNum(selected.stock_quantity)}</span></p>
//                       <p className="text-sm text-gray-600 mt-2">Status: {selected.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Footer ---------- */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
//           <span className="text-blue-600 text-lg mr-3">API</span>
//           <div>
//             <p className="text-blue-800 font-medium">Connected to live backend</p>
//             <p className="text-blue-700 text-sm">Inventory items: {products.length} | http://127.0.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Inventory;
// src/admin_dashboard/pages/inventory.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { productsApi } from '../utils/api';

const Inventory = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. Inventory state (products with stock focus)
  // ──────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // Quick stock update modal
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

  console.log('productsApi:', productsApi);

  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600 bg-red-100';
    if (stock < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
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
  // 5. Data fetching & stock update
  // ──────────────────────────────────────────────────────
  const fetchInventory = async () => {
    fetchProducts();  // Reuse products fetch
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!updatingProduct) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/products/${updatingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          stock_quantity: newStock
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update product');
      }
      await fetchProducts();  // Refresh
      setShowStockUpdate(false);
      setUpdatingProduct(null);
      setNewStock(0);
      setNewPrice(0);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (token) fetchInventory();
  }, [token]);

  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = products.reduce(
    (acc, p) => {
      acc.total++;
      if (p.stock_quantity > 0) acc.available++;
      if (p.stock_quantity < 10) acc.lowStock++;
      if (p.stock_quantity === 0) acc.outOfStock++;
      return acc;
    },
    { total: 0, available: 0, lowStock: 0, outOfStock: 0 }
  );

  const filtered = filter === 'all' 
    ? products 
    : filter === 'low-stock' 
      ? products.filter(p => p.stock_quantity < 10) 
      : filter === 'out-of-stock' 
        ? products.filter(p => p.stock_quantity === 0)
        : products.filter(p => p.category === filter);

  // ──────────────────────────────────────────────────────
  // 7. Render – login first
  // ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 p-8 max-w-md w-full">
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
                {loggingIn ? 'Logging in…' : 'Login'}
              </button>
            </form>
          </div>
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
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
        {/* ---------- Header ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-1">Inventory Management</h1>
            <p className="text-gray-600 text-sm">Monitor and update stock levels for products</p>
          </div>
        </div>

        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'total', label: 'Total Items', value: safe(stats.total, 0), color: 'text-gray-700' },
            { key: 'available', label: 'In Stock', value: safe(stats.available, 0), color: 'text-emerald-700', trend: 5 },
            { key: 'lowStock', label: 'Low Stock', value: safe(stats.lowStock, 0), color: 'text-orange-600' },
            { key: 'outOfStock', label: 'Out of Stock', value: safe(stats.outOfStock, 0), color: 'text-red-600' },
          ].map(({ key, label, value, color, trend }) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">{label}</h3>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-emerald-700' ? 'bg-emerald-100' : color === 'text-orange-600' ? 'bg-orange-100' : color === 'text-red-600' ? 'bg-red-100' : 'bg-green-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={key === 'total' ? 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' : key === 'available' ? 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' : key === 'lowStock' ? 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' : 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'} />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <div className={`text-2xl font-semibold ${color}`}>{value}</div>
                {trend !== undefined && (
                  <div className="flex items-center mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-xs font-semibold text-green-600 ml-1">+{trend}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <div className="mb-10 bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 font-bold">Error loading inventory</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button onClick={fetchInventory} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors font-semibold">
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Table ---------- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-10">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-green-800">Inventory Items</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
              >
                <option value="all">All Items</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                {/* Dynamic categories */}
                {[...new Set(products.map(p => p.category))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50">
                  {['Image', 'Name', 'Category', 'Current Stock', 'Unit Type', 'Available', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">No inventory items found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <img src={p.image_url || 'https://via.placeholder.com/60x60?text=?'} alt={p.name} className="w-10 h-10 object-cover rounded-lg\" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {safe(p.name)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {safe(p.category)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStockColor(p.stock_quantity)}`}>
                          {safeNum(p.stock_quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {safe(p.unit_type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm\">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { 
                              setUpdatingProduct(p); 
                              setNewStock(safeNum(p.stock_quantity)); 
                              setShowStockUpdate(true); 
                            }}
                            className="text-green-600 hover:text-green-700 text-xs underline transition-colors"
                          >
                            Update Product
                          </button>
                          <button
                            onClick={() => setSelected(p)}
                            className="text-emerald-600 hover:text-emerald-700 text-xs underline transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- Stock Update Modal ---------- */}
        {showStockUpdate && updatingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border-2 border-green-100 max-w-sm w-full shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">Update Product: {safe(updatingProduct.name)}</h3>
                  <button onClick={() => { setShowStockUpdate(false); setUpdatingProduct(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Current Stock: <span className={`font-semibold ${getStockColor(updatingProduct.stock_quantity)}`}>{safeNum(updatingProduct.stock_quantity)}</span></p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={e => setNewStock(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      placeholder="New stock quantity"
                    />
                  </div>
                  <button
                    onClick={updateProduct}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Update Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Details Modal ---------- */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border-2 border-green-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">
                    {safe(selected.name)} - Stock Details
                  </h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img src={selected.image_url || 'https://via.placeholder.com/200x200?text=No+Image'} alt={selected.name} className="w-full h-48 object-cover rounded-xl shadow-lg" />
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-sm font-medium text-gray-600">Name</p><p className="font-semibold text-green-800">{safe(selected.name)}</p></div>
                      <div><p className="text-sm font-medium text-gray-600">Description</p><p className="text-gray-700">{safe(selected.description)}</p></div>
                      <div><p className="text-sm font-medium text-gray-600">Category</p><p className="font-semibold text-green-800">{safe(selected.category)}</p></div>
                      <div><p className="text-sm font-medium text-gray-600">Unit Type</p><p className="font-semibold text-green-800">{safe(selected.unit_type)}</p></div>
                      <div><p className="text-sm font-medium text-gray-600">Available</p>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selected.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selected.is_available ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">Stock Information</p>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-100">
                      <p className="text-sm text-gray-600">Current Stock: <span className={`font-semibold ${getStockColor(selected.stock_quantity)}`}>{safeNum(selected.stock_quantity)}</span></p>
                      <p className="text-sm text-gray-600 mt-2">Status: <span className="font-semibold text-green-800">{selected.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;