// // src/admin_dashboard/pages/products.js
// import React, { useState, useEffect } from 'react';
// import Layout from '../components/layout/Layout';
// import { productsApi } from '../utils/api';

// const Products = () => {
//   // ──────────────────────────────────────────────────────
//   // 1. Auth state (shared)
//   // ──────────────────────────────────────────────────────
//   const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // ──────────────────────────────────────────────────────
//   // 2. Products state
//   // ──────────────────────────────────────────────────────
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all');
//   const [selected, setSelected] = useState(null);

//   // CRUD modals
//   const [showCreate, setShowCreate] = useState(false);
//   const [showEdit, setShowEdit] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);

//   console.log('productsApi:', productsApi);

//   // ──────────────────────────────────────────────────────
//   // 3. Helper utilities
//   // ──────────────────────────────────────────────────────
//   const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
//   const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

//   const formatDate = d =>
//     d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

//   // Image placeholder
//   const getImageUrl = (url) => url || 'https://via.placeholder.com/80x80?text=No+Image';

//   // ──────────────────────────────────────────────────────
//   // 4. Login handler (same)
//   // ──────────────────────────────────────────────────────
//   // const handleLogin = async e => {
//   //   e.preventDefault();
//   //   setLoggingIn(true);
//   //   setLoginError('');

//   //   try {
//   //     const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
//   //       method: 'POST',
//   //       headers: { 'Content-Type': 'application/json' },
//   //       body: JSON.stringify(loginForm),
//   //     });

//   //     const data = await res.json();

//   //     if (!res.ok) throw new Error(data.message || 'Login failed');

//   //     localStorage.setItem('adminToken', data.token);
//   //     setToken(data.token);
//   //   } catch (err) {
//   //     setLoginError(err.message);
//   //   } finally {
//   //     setLoggingIn(false);
//   //   }
//   // };

//   // ──────────────────────────────────────────────────────
//   // 5. Data fetching
//   // ──────────────────────────────────────────────────────
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

//   // const createProduct = async (productData) => {
//   //   try {
//   //     await productsApi.create(productData);
//   //     await fetchProducts();  // Refresh list
//   //     setShowCreate(false);
//   //   } catch (e) {
//   //     setError(e.message);
//   //   }
//   // };

//   const createProduct = async (productData) => {
//     try {
//       // Sanitize data
//       const sanitizedData = {
//         ...productData,
//         price_per_unit: safeNum(productData.price_per_unit, 0),
//         stock_quantity: parseInt(productData.stock_quantity, 10) || 0,
//         is_available: productData.is_available === 'true',
//       };
//       if (sanitizedData.name.length > 100) {
//         throw new Error('Name too long');
//       }
//       await productsApi.create(sanitizedData);
//       await fetchProducts();
//       setShowCreate(false);
//       setError(null);  // Clear any prior error
//     } catch (e) {
//       console.error('Create failed:', e);  // Log for dev
//       setError(e.message || 'Failed to create product');
//     }
//   };

//   // const updateProduct = async (id, productData) => {
//   //   try {
//   //     await productsApi.update(id, productData);
//   //     await fetchProducts();
//   //     setShowEdit(false);
//   //     setEditingProduct(null);
//   //   } catch (e) {
//   //     setError(e.message);
//   //   }
//   // };
//   const updateProduct = async (id, productData) => {
//     try {
//       // Sanitize (prevents empty → 400)
//       const sanitizedData = {
//         name: (productData.name || '').trim(),
//         description: productData.description || '',
//         price_per_unit: safeNum(productData.price_per_unit, null),
//         stock_quantity: parseInt(productData.stock_quantity, 10) || null,
//         image_url: productData.image_url || '',
//         category: (productData.category || '').trim(),
//         unit_type: productData.unit_type || 'kg',
//         is_available: productData.is_available === 'true' || productData.is_available === true ? 'true' : 'false',  // Stringify for consistency
//       };
      
//       // Require basics (send only if valid; else error early)
//       if (!sanitizedData.name) throw new Error('Name is required');
//       if (sanitizedData.price_per_unit === null || sanitizedData.price_per_unit <= 0) throw new Error('Price must be positive');
//       if (sanitizedData.stock_quantity === null || sanitizedData.stock_quantity < 0) throw new Error('Stock must be non-negative');
//       if (!sanitizedData.category) throw new Error('Category is required');
      
//       // Length checks (mirror backend)
//       if (sanitizedData.name.length > 100) throw new Error('Name too long (max 100 chars)');
//       if (sanitizedData.category.length > 50) throw new Error('Category too long (max 50 chars)');
      
//       console.log('Sanitized update data:', sanitizedData); 
//       const response = await productsApi.update(id, sanitizedData);
//       console.log('Update response:', response);
      
//       await productsApi.update(id, sanitizedData);
//       await fetchProducts();
//       setShowEdit(false);
//       setEditingProduct(null);
//       setError(null);
//     } catch (e) {
//       console.error('Update failed:', e);
//       setError(e.message || 'Failed to update product');
//     }
//   };

//   const deleteProduct = async (id) => {
//     if (!window.confirm('Delete this product?')) return;
//     try {
//       await productsApi.delete(id);
//       await fetchProducts();
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchProducts();
//   }, [token]);

//   // ──────────────────────────────────────────────────────
//   // 6. Stats & filtering
//   // ──────────────────────────────────────────────────────
//   const stats = products.reduce(
//     (acc, p) => {
//       acc.total++;
//       if (p.is_available) acc.available++;
//       if (p.stock_quantity < 10) acc.lowStock++;
//       acc[p.category] = (acc[p.category] || 0) + 1;
//       return acc;
//     },
//     { total: 0, available: 0, lowStock: 0 }
//   );

//   const filtered = filter === 'all' 
//     ? products 
//     : filter === 'available' 
//       ? products.filter(p => p.is_available) 
//       : filter === 'low-stock' 
//         ? products.filter(p => p.stock_quantity < 10) 
//         : products.filter(p => p.category === filter);

//   // ──────────────────────────────────────────────────────
//   // 7. Render – login first
//   // ──────────────────────────────────────────────────────
//   // if (!token) {
//   //   return (
//   //     <Layout>
//   //       <div className="p-6 max-w-md mx-auto">
//   //         <div className="bg-white rounded-xl shadow-sm border p-6">
//   //           <h2 className="text-xl font-bold mb-4">Admin Login</h2>
//   //           {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
//   //           <form onSubmit={handleLogin} className="space-y-4">
//   //             <input
//   //               type="text"
//   //               placeholder="Username"
//   //               value={loginForm.username}
//   //               onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
//   //               className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//   //               required
//   //             />
//   //             <input
//   //               type="password"
//   //               placeholder="Password"
//   //               value={loginForm.password}
//   //               onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
//   //               className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//   //               required
//   //             />
//   //             <button
//   //               type="submit"
//   //               disabled={loggingIn}
//   //               className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//   //             >
//   //               {loggingIn ? 'Logging in…' : 'Login'}
//   //             </button>
//   //           </form>
//   //         </div>
//   //       </div>
//   //     </Layout>
//   //   );
//   // }

//   if (loading) {
//     return (
//       <Layout>
//         <div className="p-6 flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
//           <span className="text-gray-600">Loading products…</span>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="p-6">

//         {/* ---------- Header + Add Button ---------- */}
//         <div className="mb-8 flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
//             <p className="text-gray-600 mt-2">Manage vegetable inventory and pricing</p>
//           </div>
//           <button
//             onClick={() => setShowCreate(true)}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
//           >
//             + Add Product
//           </button>
//         </div>

//         {/* ---------- Stats Cards ---------- */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//           {[
//             { key: 'total', label: 'Total Products', color: 'text-gray-900' },
//             { key: 'available', label: 'Available', color: 'text-green-600' },
//             { key: 'lowStock', label: 'Low Stock', color: 'text-yellow-600' },
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
//               <p className="text-red-800 font-medium">Error</p>
//               <p className="text-red-700 text-sm">{error}</p>
//               <button onClick={fetchProducts} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
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
//               <option value="all">All Products</option>
//               <option value="available">Available</option>
//               <option value="low-stock">Low Stock</option>
//               {/* Dynamic category filter */}
//               {Object.keys(stats).filter(k => typeof stats[k] !== 'number').map(cat => (
//                 <option key={cat} value={cat}>{cat}</option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={fetchProducts}
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
//                   {['Image', 'Name', 'Category', 'Price', 'Stock', 'Unit', 'Available', 'Created At', 'Actions'].map(h => (
//                     <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
//                       <div className="flex flex-col items-center">
//                         <span className="text-4xl mb-2">🥕</span>
//                         <p className="text-lg">No products found</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map(p => (
//                     <tr key={p.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <img src={getImageUrl(p.image_url)} alt={p.name} className="w-12 h-12 object-cover rounded" />
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {safe(p.name)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {safe(p.category)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         ₹{safeNum(p.price_per_unit).toFixed(2)}
//                       </td>
//                       <td className={`px-6 py-4 whitespace-nowrap text-sm ${p.stock_quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
//                         {safeNum(p.stock_quantity)}
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
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {formatDate(p.created_at)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => { setEditingProduct(p); setShowEdit(true); }}
//                             className="text-blue-600 hover:text-blue-900 text-xs"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             onClick={() => deleteProduct(p.id)}
//                             className="text-red-600 hover:text-red-900 text-xs"
//                           >
//                             Delete
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

//         {/* ---------- Create Modal ---------- */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
//                   <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <form
//                   onSubmit={e => {
//                     e.preventDefault();
//                     const formData = new FormData(e.target);
//                     createProduct(Object.fromEntries(formData));
//                   }}
//                   className="space-y-4"
//                 >
//                   <input name="name" placeholder="Product Name" className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="description" placeholder="Description" className="w-full px-3 py-2 border rounded-lg" />
//                   <input name="price_per_unit" type="number" step="0.01" placeholder="Price per Unit" className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="stock_quantity" type="number" placeholder="Stock Quantity" className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="image_url" placeholder="Image URL (optional)" className="w-full px-3 py-2 border rounded-lg" />
//                   <input name="category" placeholder="Category" className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="unit_type" placeholder="Unit Type (e.g., kg)" className="w-full px-3 py-2 border rounded-lg" required />
//                   <select name="is_available" className="w-full px-3 py-2 border rounded-lg" defaultValue="true">
//                     <option value="true">Available</option>
//                     <option value="false">Unavailable</option>
//                   </select>
//                   <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
//                     Create Product
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Edit Modal ---------- */}
//         {showEdit && editingProduct && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
//                   <button onClick={() => { setShowEdit(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <form
//                   onSubmit={e => {
//                     e.preventDefault();
//                     const formData = new FormData(e.target);
//                     const rawData = Object.fromEntries(formData);
//                     console.log('Raw form data:', rawData);  // Debug: Check what's sent
//                     updateProduct(editingProduct.id, rawData);
//                   }}
//                   className="space-y-4"
//                 >
//                   <input name="name" defaultValue={safe(editingProduct.name, '')} className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="description" defaultValue={safe(editingProduct.description, '')} className="w-full px-3 py-2 border rounded-lg" />
//                   <input name="price_per_unit" type="number" step="0.01" defaultValue={safeNum(editingProduct.price_per_unit, 0).toFixed(2)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg" required min="0" />
//                   <input name="stock_quantity" type="number" defaultValue={safeNum(editingProduct.stock_quantity, 0)} placeholder="0" className="w-full px-3 py-2 border rounded-lg" required min="0" />
//                   <input name="image_url" defaultValue={safe(editingProduct.image_url, '')} className="w-full px-3 py-2 border rounded-lg" />
//                   <input name="category" defaultValue={safe(editingProduct.category, '')} className="w-full px-3 py-2 border rounded-lg" required />
//                   <input name="unit_type" defaultValue={safe(editingProduct.unit_type, 'kg')} className="w-full px-3 py-2 border rounded-lg" />
//                   <select name="is_available" defaultValue={editingProduct.is_available ? "true" : "false"} className="w-full px-3 py-2 border rounded-lg" required>
//                     <option value="true">Available</option>
//                     <option value="false">Unavailable</option>
//                   </select>
//                   <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
//                     Update Product
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Details Modal ---------- */}
//         {selected && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-xl font-bold text-gray-900">
//                     {safe(selected.name)} Details
//                   </h3>
//                   <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <img src={getImageUrl(selected.image_url)} alt={selected.name} className="w-full h-64 object-cover rounded-lg mb-4" />
//                   </div>
//                   <div className="space-y-4">
//                     <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold">{safe(selected.name)}</p></div>
//                     <div><p className="text-sm text-gray-600">Description</p><p>{safe(selected.description)}</p></div>
//                     <div><p className="text-sm text-gray-600">Price</p><p className="font-semibold text-lg">₹{safeNum(selected.price_per_unit).toFixed(2)}</p></div>
//                     <div><p className="text-sm text-gray-600">Stock</p><p className={`font-semibold ${selected.stock_quantity < 10 ? 'text-red-600' : ''}`}>{safeNum(selected.stock_quantity)}</p></div>
//                     <div><p className="text-sm text-gray-600">Category</p><p className="font-semibold">{safe(selected.category)}</p></div>
//                     <div><p className="text-sm text-gray-600">Unit Type</p><p className="font-semibold">{safe(selected.unit_type)}</p></div>
//                     <div><p className="text-sm text-gray-600">Available</p>
//                       <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
//                         selected.is_available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
//                       }`}>
//                         {selected.is_available ? 'Yes' : 'No'}
//                       </span>
//                     </div>
//                     <div><p className="text-sm text-gray-600">Created At</p><p className="font-semibold">{formatDate(selected.created_at)}</p></div>
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
//             <p className="text-blue-700 text-sm">Products loaded: {products.length} | http://127.0.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Products;
// src/admin_dashboard/pages/products.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { productsApi } from '../utils/api';

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

const Stat = ({ label, value, color = 'text-green-700' }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
    <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
    <div className={`text-2xl font-semibold ${color}`}>{value}</div>
  </div>
);

const MiniTable = ({ headers, rows, emptyMsg = 'No data', onEdit, onDelete, onView }) => (
  <Card>
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
                  <span className="text-4xl mb-2">🥕</span>
                  <p className="text-gray-500 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const product = r.slice(-1)[0];  // Last element is the product object
              return (
                <tr key={i} className="hover:bg-green-50/30 transition-colors">
                  {r.slice(0, -1).map((cell, j) => (  // All but actions/product
                    <td key={j} className="px-6 py-4 text-sm font-medium text-gray-700">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-green-600 hover:text-green-900 text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => onView(product)}
                        className="text-green-600 hover:text-green-900 text-xs font-medium underline transition-colors"
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
    className={`px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
  >
    {children}
  </button>
);

// ──────────────────────────────────────────────────────
// 3. Main Products Component
// ──────────────────────────────────────────────────────
const Products = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. Products state
  // ──────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // CRUD modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  console.log('productsApi:', productsApi);

  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

  // Image placeholder
  const getImageUrl = (url) => url || 'https://via.placeholder.com/80x80?text=No+Image';

  // ──────────────────────────────────────────────────────
  // 4. Login handler (same)
  // ──────────────────────────────────────────────────────
  // const handleLogin = async e => {
  //   e.preventDefault();
  //   setLoggingIn(true);
  //   setLoginError('');

  //   try {
  //     const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(loginForm),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) throw new Error(data.message || 'Login failed');

  //     localStorage.setItem('adminToken', data.token);
  //     setToken(data.token);
  //   } catch (err) {
  //     setLoginError(err.message);
  //   } finally {
  //     setLoggingIn(false);
  //   }
  // };

  // ──────────────────────────────────────────────────────
  // 5. Data fetching
  // ──────────────────────────────────────────────────────
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

  // const createProduct = async (productData) => {
  //   try {
  //     await productsApi.create(productData);
  //     await fetchProducts();  // Refresh list
  //     setShowCreate(false);
  //   } catch (e) {
  //     setError(e.message);
  //   }
  // };

  const createProduct = async (productData) => {
    try {
      // Sanitize data
      const sanitizedData = {
        ...productData,
        price_per_unit: safeNum(productData.price_per_unit, 0),
        stock_quantity: parseInt(productData.stock_quantity, 10) || 0,
        is_available: productData.is_available === 'true',
      };
      if (sanitizedData.name.length > 100) {
        throw new Error('Name too long');
      }
      await productsApi.create(sanitizedData);
      await fetchProducts();
      setShowCreate(false);
      setError(null);  // Clear any prior error
    } catch (e) {
      console.error('Create failed:', e);  // Log for dev
      setError(e.message || 'Failed to create product');
    }
  };

  // const updateProduct = async (id, productData) => {
  //   try {
  //     await productsApi.update(id, productData);
  //     await fetchProducts();
  //     setShowEdit(false);
  //     setEditingProduct(null);
  //   } catch (e) {
  //     setError(e.message);
  //   }
  // };
  const updateProduct = async (id, productData) => {
    try {
      // Sanitize (prevents empty → 400)
      const sanitizedData = {
        name: (productData.name || '').trim(),
        description: productData.description || '',
        price_per_unit: safeNum(productData.price_per_unit, null),
        stock_quantity: parseInt(productData.stock_quantity, 10) || null,
        image_url: productData.image_url || '',
        category: (productData.category || '').trim(),
        unit_type: productData.unit_type || 'kg',
        is_available: productData.is_available === 'true' || productData.is_available === true ? 'true' : 'false',  // Stringify for consistency
      };
      
      // Require basics (send only if valid; else error early)
      if (!sanitizedData.name) throw new Error('Name is required');
      if (sanitizedData.price_per_unit === null || sanitizedData.price_per_unit <= 0) throw new Error('Price must be positive');
      if (sanitizedData.stock_quantity === null || sanitizedData.stock_quantity < 0) throw new Error('Stock must be non-negative');
      if (!sanitizedData.category) throw new Error('Category is required');
      
      // Length checks (mirror backend)
      if (sanitizedData.name.length > 100) throw new Error('Name too long (max 100 chars)');
      if (sanitizedData.category.length > 50) throw new Error('Category too long (max 50 chars)');
      
      console.log('Sanitized update data:', sanitizedData); 
      const response = await productsApi.update(id, sanitizedData);
      console.log('Update response:', response);
      
      await fetchProducts();
      setShowEdit(false);
      setEditingProduct(null);
      setError(null);
    } catch (e) {
      console.error('Update failed:', e);
      setError(e.message || 'Failed to update product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsApi.delete(id);
      await fetchProducts();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = products.reduce(
    (acc, p) => {
      acc.total++;
      if (p.is_available) acc.available++;
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    { total: 0, available: 0 }
  );

  const filtered = filter === 'all' 
    ? products 
    : filter === 'available' 
      ? products.filter(p => p.is_available) 
      : products.filter(p => p.category === filter);

  const tableRows = filtered.map(p => [
    <img key="img" src={getImageUrl(p.image_url)} alt={p.name} className="w-12 h-12 object-cover rounded" />,
    safe(p.name),
    safe(p.category),
    safe(p.unit_type),
    <span key="avail" className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      p.is_available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
    }`}>
      {p.is_available ? 'Yes' : 'No'}
    </span>,
    formatDate(p.created_at),
    p  // Product object for actions
  ]);

  // ──────────────────────────────────────────────────────
  // 7. Render – login first
  // ──────────────────────────────────────────────────────
  // if (!token) {
  //   return (
  //     <Layout>
  //       <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
  //         <Card className="p-8 max-w-md w-full">
  //           <h2 className="text-2xl font-bold text-green-800 mb-6">Admin Login</h2>
  //           {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
  //           <form onSubmit={handleLogin} className="space-y-4">
  //             <input
  //               type="text"
  //               placeholder="Username"
  //               value={loginForm.username}
  //               onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
  //               className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
  //               required
  //             />
  //             <input
  //               type="password"
  //               placeholder="Password"
  //               value={loginForm.password}
  //               onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
  //               className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
  //               required
  //             />
  //             <button
  //               type="submit"
  //               disabled={loggingIn}
  //               className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
  //             >
  //               {loggingIn ? 'Logging in...' : 'Login'}
  //             </button>
  //           </form>
  //         </Card>
  //       </div>
  //     </Layout>
  //   );
  // }

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
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your vegetables...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
        {/* ---------- Header + Add Button ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-1">
              Products Management
            </h1>
            <p className="text-gray-600 text-sm">Manage vegetable inventory and pricing</p>
          </div>
          <QuickAction onClick={() => setShowCreate(true)}>
            + Add Product
          </QuickAction>
        </div>

        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Stat label="Total Products" value={safe(stats.total, 0).toLocaleString() || 0} color="text-green-700" />
          <Stat label="Available" value={safe(stats.available, 0).toLocaleString() || 0} color="text-emerald-700" />
          <Stat label="Categories" value={safe([...new Set(products.map(p => p.category))].length, 0)} color="text-blue-600" />
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
                <button onClick={fetchProducts} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ---------- Table ---------- */}
        <MiniTable
          headers={['Image', 'Name', 'Category', 'Unit', 'Available', 'Created At', 'Actions']}
          rows={tableRows}
          emptyMsg="No products found"
          onEdit={(p) => { setEditingProduct(p); setShowEdit(true); }}
          onDelete={deleteProduct}
          onView={setSelected}
        />

        {/* ---------- Create Modal ---------- */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800">Add New Product</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createProduct(Object.fromEntries(formData));
                }}
                className="space-y-4"
              >
                <input name="name" placeholder="Product Name" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="description" placeholder="Description" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="price_per_unit" type="hidden" value="0.00" />
                <input name="stock_quantity" type="hidden" value="999999" />
                <input name="image_url" placeholder="Image URL (optional)" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="category" placeholder="Category" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="unit_type" placeholder="Unit Type (e.g., kg)" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <select name="is_available" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white" defaultValue="true">
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
                <QuickAction type="submit" className="!w-full !text-sm">
                  Create Product
                </QuickAction>
              </form>
            </Card>
          </div>
        )}

        {/* ---------- Edit Modal ---------- */}
        {showEdit && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800">Edit Product</h3>
                <button onClick={() => { setShowEdit(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const rawData = Object.fromEntries(formData);
                  console.log('Raw form data:', rawData);  // Debug: Check what's sent
                  updateProduct(editingProduct.id, rawData);
                }}
                className="space-y-4"
              >
                <input name="name" defaultValue={safe(editingProduct.name, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="description" defaultValue={safe(editingProduct.description, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="price_per_unit" type="hidden" value="0.00" />
                <input name="stock_quantity" type="hidden" value="999999" />
                <input name="image_url" defaultValue={safe(editingProduct.image_url, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="category" defaultValue={safe(editingProduct.category, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="unit_type" defaultValue={safe(editingProduct.unit_type, 'kg')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <select name="is_available" defaultValue={editingProduct.is_available ? "true" : "false"} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white" required>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
                <QuickAction type="submit" className="!w-full !text-sm !from-emerald-500 !to-teal-600">
                  Update Product
                </QuickAction>
              </form>
            </Card>
          </div>
        )}

        {/* ---------- Details Modal ---------- */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">
                    {safe(selected.name)} Details
                  </h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img src={getImageUrl(selected.image_url)} alt={selected.name} className="w-full h-64 object-cover rounded-2xl mb-4" />
                  </div>
                  <div className="space-y-4">
                    <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold text-green-800">{safe(selected.name)}</p></div>
                    <div><p className="text-sm text-gray-600">Description</p><p>{safe(selected.description)}</p></div>
                    <div><p className="text-sm text-gray-600">Price</p><p className="font-semibold text-lg text-emerald-700">₹{safeNum(selected.price_per_unit).toFixed(2)}</p></div>
                    <div><p className="text-sm text-gray-600">Stock</p><p className={`font-semibold ${selected.stock_quantity < 10 ? 'text-red-600' : 'text-gray-700'}`}>{safeNum(selected.stock_quantity)}</p></div>
                    <div><p className="text-sm text-gray-600">Category</p><p className="font-semibold text-green-800">{safe(selected.category)}</p></div>
                    <div><p className="text-sm text-gray-600">Unit Type</p><p className="font-semibold">{safe(selected.unit_type)}</p></div>
                    <div><p className="text-sm text-gray-600">Available</p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        selected.is_available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {selected.is_available ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div><p className="text-sm text-gray-600">Created At</p><p className="font-semibold">{formatDate(selected.created_at)}</p></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Products;