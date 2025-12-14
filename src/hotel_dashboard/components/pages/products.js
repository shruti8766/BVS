// src/hotel_dashboard/components/pages/products.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layout/Layout'; // Assuming you have a Layout component
import { useAuth } from '../hooks/useAuth'; // For user context

export default function Products() {
  const { user, logout } = useAuth(); // Get user for hotel_name, etc.
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // Dropdown state
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const [cartCount, setCartCount] = useState(0); // Cart badge
  const [showToast, setShowToast] = useState(''); // Toast notification

  const BASE_URL = 'http://localhost:5000';

  // Fetch products (GET /api/products)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');
        const res = await fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            logout(); // Invalidate session
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch products');
        }

        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data); // Initial filter
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate, logout]);

  // Load initial cart count from API
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const token = localStorage.getItem('hotelToken');
        const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const count = data.items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        }
      } catch (err) {
        console.error('Failed to load cart count:', err);
      }
    };

    if (localStorage.getItem('hotelToken')) {
      updateCartCount();
    }
  }, [navigate, logout]);

  // Filter products by category and search
  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  // Add to cart with quantity
  const addToCart = async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId, quantity }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to add to cart');
      }

      setShowToast(`${quantity > 1 ? `${quantity}x ` : ''}Added to cart!`);
      setTimeout(() => setShowToast(''), 2000);
      
      // Update cart count
      setCartCount(prev => prev + quantity);
    } catch (err) {
      console.error('Add to cart error:', err);
      // Optionally show error toast
    }
  };

  // Extract unique categories for dropdown
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Split products into sections (e.g., Vegetables first, then others)
  const vegetableProducts = filteredProducts.filter(p => p.category === 'Vegetables');
  const otherProducts = filteredProducts.filter(p => p.category !== 'Vegetables');

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
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your products...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header with Search & Filter */}
          <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                Products Catalog
              </h1>
              <p className="text-green-700">
                Welcome back, {user?.hotel_name || 'Hotel User'}! Fresh picks just for you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <Link
                to="/hotel/cart"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center text-sm"
              >
                View Cart ({cartCount})
              </Link>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex-1 text-sm"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in">
              {showToast}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Vegetables Section */}
          {vegetableProducts.length > 0 && (
            <>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
                  <span className="mr-2">🥬</span> Fresh Vegetables
                </h2>
                <div className="grid grid-cols-7 gap-6 mb-12">
                  {vegetableProducts.map((product) => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                  ))}
                </div>
              </div>
              <hr className="border-green-200 my-8" />
            </>
          )}

          {/* Other Products Section */}
          {otherProducts.length > 0 && (
            <>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
                  <span className="mr-2">🌱</span> More Essentials
                </h2>
                <div className="grid grid-cols-7 gap-6 mb-12">
                  {otherProducts.map((product) => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty Products Message */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">No products found</h3>
              <p className="text-green-600 mb-4">Try adjusting your search or category.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .low-stock {
          background-color: #fef3c7 !important;
          color: #92400e !important;
        }
      `}</style>
    </Layout>
  );
}

// Reusable Product Card Component
function ProductCard({ product, addToCart }) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    setQuantity(1); // Reset quantity selector
  };

  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col">
      <div className="relative flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center h-32">
            <span className="text-green-600 font-semibold text-xs text-center px-1">{product.name}</span>
          </div>
        )}
      </div>
      <div className="px-2 py-2 flex-1 flex flex-col justify-between">
        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-800 text-center mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {/* Quantity Selector */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <div className="flex items-center border border-green-200 rounded px-1 py-0.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 text-green-600 hover:text-green-800 font-bold text-sm flex items-center justify-center"
            >
              -
            </button>
            <span className="w-5 text-center text-sm font-medium mx-1">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-6 h-6 text-green-600 hover:text-green-800 font-bold text-sm flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-20 bg-green-600 text-white px-2 py-1.5 rounded text-sm hover:bg-green-700 transition-all duration-300 font-semibold mx-auto"
        >
          Add
        </button>
      </div>
    </div>
  );
}