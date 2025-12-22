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
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700 dark:text-green-300' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 transition-colors duration-200">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</h3>
    <div className={`text-2xl font-semibold ${color}`}>{value}</div>
  </div>
);

const MiniTable = ({ headers, rows, emptyMsg = 'No data', onEdit, onDelete, onView }) => (
  <Card>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-green-50/50 dark:bg-gray-700">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
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
                  <span className="text-4xl mb-2">🥕</span>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const product = r.slice(-1)[0];  // Last element is the product object
              return (
                <tr key={i} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                  {r.slice(0, -1).map((cell, j) => (  // All but actions/product
                    <td key={j} className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => onView(product)}
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
  //     const res = await fetch('https://api-aso3bjldka-uc.a.run.app/api/auth/login', {
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
      console.log('🛒 Fetched products data:', data);
      console.log('🛒 Type:', typeof data, 'IsArray:', Array.isArray(data));
      
      // Ensure we always set an array
      if (Array.isArray(data)) {
        console.log('✅ Data is array, setting products:', data.length, 'items');
        setProducts(data);
      } else if (data && typeof data === 'object' && data.products && Array.isArray(data.products)) {
        console.log('✅ Extracting from data.products:', data.products.length, 'items');
        setProducts(data.products);
      } else if (data && typeof data === 'object') {
        console.log('⚠️ Data is object, searching for array values');
        const values = Object.values(data).find(v => Array.isArray(v));
        setProducts(values || []);
      } else {
        console.log('❌ Data is not array or object, defaulting to empty array');
        setProducts([]);
      }
    } catch (e) {
      console.error('❌ Error fetching products:', e);
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
      console.log('Creating product with data:', productData);
      const result = await productsApi.create(productData);
      console.log('Create result:', result);
      alert('Product created successfully!');
      await fetchProducts();
      setShowCreate(false);
      setError(null);
    } catch (e) {
      console.error('Create failed with error:', e);
      console.error('Error message:', e.message);
      const errorMsg = e.message || 'Failed to create product';
      setError(errorMsg);
      alert(`Failed to create product: ${errorMsg}`);
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
      console.log('Updating product with data:', id, productData);
      const response = await productsApi.update(id, productData);
      console.log('Update response:', response);
      alert('Product updated successfully!');
      await fetchProducts();
      setShowEdit(false);
      setEditingProduct(null);
      setError(null);
    } catch (e) {
      console.error('Update failed with error:', e);
      console.error('Error message:', e.message);
      const errorMsg = e.message || 'Failed to update product';
      setError(errorMsg);
      alert(`Failed to update product: ${errorMsg}`);
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
  // Safety guard: ensure products is always an array
  const safeProductsArray = Array.isArray(products) ? products : [];
  console.log('🔍 Products type check:', typeof products, 'IsArray:', Array.isArray(products), 'Length:', safeProductsArray.length);

  const stats = safeProductsArray.reduce(
    (acc, p) => {
      acc.total++;
      if (p.is_available) acc.available++;
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    { total: 0, available: 0 }
  );

  const filtered = filter === 'all' 
    ? safeProductsArray 
    : filter === 'available' 
      ? safeProductsArray.filter(p => p.is_available) 
      : safeProductsArray.filter(p => p.category === filter);

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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Broccoli is crunching your vegetables...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 p-8 w-full transition-colors duration-200">
        {/* ---------- Header + Add Button ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-1">
              Products Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage vegetable inventory and pricing</p>
          </div>
          <QuickAction onClick={() => setShowCreate(true)}>
            + Add Product
          </QuickAction>
        </div>

        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Stat label="Total Products" value={safe(stats.total, 0).toLocaleString() || 0} color="text-green-700" />
          <Stat label="Available" value={safe(stats.available, 0).toLocaleString() || 0} color="text-emerald-700" />
          <Stat label="Categories" value={safe([...new Set(safeProductsArray.map(p => p.category))].length, 0)} color="text-blue-600" />
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
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
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-green-900 transition-colors duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Add New Product</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createProduct(Object.fromEntries(formData));
                }}
                className="space-y-4"
              >
                <input name="product_name" placeholder="Product Name" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="description" placeholder="Description" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="current_price" type="number" step="0.01" placeholder="Price per Unit" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="stock_quantity" type="number" placeholder="Stock Quantity" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="image_url" placeholder="Image URL (optional)" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="category" placeholder="Category" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="unit" placeholder="Unit Type (e.g., kg)" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
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
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-green-900 transition-colors duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Edit Product</h3>
                <button onClick={() => { setShowEdit(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl transition-colors">×</button>
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
                <input name="product_name" defaultValue={safe(editingProduct.name, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="description" defaultValue={safe(editingProduct.description, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="current_price" type="number" step="0.01" defaultValue={safeNum(editingProduct.price_per_unit, 0)} placeholder="Price per Unit" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="stock_quantity" type="number" defaultValue={safeNum(editingProduct.stock_quantity, 0)} placeholder="Stock Quantity" className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="image_url" defaultValue={safe(editingProduct.image_url, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <input name="category" defaultValue={safe(editingProduct.category, '')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" required />
                <input name="unit" defaultValue={safe(editingProduct.unit_type, 'kg')} className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
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
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-green-900 transition-colors duration-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                    {safe(selected.name)} Details
                  </h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl transition-colors">×</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img src={getImageUrl(selected.image_url)} alt={selected.name} className="w-full h-64 object-cover rounded-2xl mb-4" />
                  </div>
                  <div className="space-y-4">
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Name</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(selected.name)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Description</p><p className="dark:text-gray-300">{safe(selected.description)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Price</p><p className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">₹{safeNum(selected.price_per_unit).toFixed(2)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Stock</p><p className={`font-semibold ${selected.stock_quantity < 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{safeNum(selected.stock_quantity)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Category</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(selected.category)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Unit Type</p><p className="font-semibold dark:text-gray-300">{safe(selected.unit_type)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
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