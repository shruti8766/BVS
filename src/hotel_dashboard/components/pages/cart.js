// src/hotel_dashboard/components/pages/cart.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layout/Layout'; // Assuming you have a Layout component
import { useAuth } from '../hooks/useAuth'; // For user context

export default function Cart() {
  const { user, logout } = useAuth(); // Get user for hotel_name, etc.
  const navigate = useNavigate();
  const [cart, setCart] = useState([]); // [{product_id, quantity}]
  const [products, setProducts] = useState([]); // For display
  const [cartTotal, setCartTotal] = useState({ total_amount: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchingTotal, setFetchingTotal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [productsError, setProductsError] = useState(''); // Separate error for products
  // NEW: States for confirmation modal and prompts
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const BASE_URL = 'http://localhost:5000';
  const MIN_ORDER_VALUE = 200; // Minimum order value in INR

  

  // Debounced calculateTotal to avoid too many API calls
  const debouncedCalculateTotal = useCallback(
    debounce(async () => {
      if (cart.length === 0) {
        setCartTotal({ total_amount: 0, item_count: 0 });
        return;
      }

      try {
        setFetchingTotal(true);
        setError('');
        const token = localStorage.getItem('hotelToken');
        const res = await fetch(`${BASE_URL}/api/hotel/cart/calculate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: cart }),
        });

        console.log('Cart calculate response status:', res.status); // DEBUG

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Failed to calculate total: ${res.status}`);
        }

        const data = await res.json();
        console.log('Cart total data:', data); // DEBUG
        setCartTotal(data);
      } catch (err) {
        console.error('Cart total error:', err); // DEBUG
        setError(err.message);
        // Fallback: Calculate locally if API fails
        const fallbackTotal = cart.reduce((sum, item) => {
          const product = products.find(p => p.id === item.product_id);
          return sum + ((product?.price_per_unit || 0) * item.quantity);
        }, 0);
        setCartTotal({ total_amount: fallbackTotal, item_count: cart.length });
      } finally {
        setFetchingTotal(false);
      }
    }, 500), // 500ms debounce
    [cart, products, logout, navigate] // Dependencies
  );

  // Auto-calculate total whenever cart changes
  useEffect(() => {
    debouncedCalculateTotal();
  }, [debouncedCalculateTotal]);

  // Load cart from API and fetch products
  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log('Loading cart from API...'); // DEBUG
        setError('');
        const token = localStorage.getItem('hotelToken');
        const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Cart load response status:', res.status); // DEBUG

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Failed to load cart: ${res.status}`);
        }

        const data = await res.json();
        console.log('Loaded cart from API:', data.items); // DEBUG
        setCart(data.items || []);
      } catch (err) {
        console.error('Error loading cart:', err);
        setError('Failed to load cart');
        setCart([]);
      }
    };

    const fetchProducts = async () => {
      try {
        console.log('Fetching products...'); // DEBUG
        setProductsError('');
        const token = localStorage.getItem('hotelToken');
        const res = await fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Products response status:', res.status); // DEBUG

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const data = await res.json();
        console.log('Products data:', data); // DEBUG
        setProducts(data);
      } catch (err) {
        console.error('Products fetch error:', err); // DEBUG
        setProductsError(err.message);
        setProducts([]); // Ensure empty array, don't block cart display
      } finally {
        setLoading(false);
      }
    };

    loadCart();
    fetchProducts();
  }, [navigate, logout]);

  // Get cart items with product details (show even if product not found)
  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return { ...item, product: product || { name: 'Unknown Product', price_per_unit: 0, unit_type: 'unit' } }; // Fallback
  });

  // Update quantity (triggers auto-recalculate via useEffect)
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    try {
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to update quantity: ${res.status}`);
      }

      // Update local state
      setCart(prev =>
        prev.map(item => {
          if (item.product_id === productId) {
            return { ...item, quantity };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Update quantity error:', err);
      setError(err.message);
    }
  };

  // Remove from cart (triggers auto-recalculate via useEffect)
  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to remove item: ${res.status}`);
      }

      // Update local state
      setCart(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error('Remove from cart error:', err);
      setError(err.message);
    }
  };

  // Manual recalculate (for button, but auto is primary)
  const calculateTotal = async () => {
    debouncedCalculateTotal.flush(); // Flush debounce immediately for manual trigger
  };

  // Add to cart from recommended (same as products page)
  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to add to cart: ${res.status}`);
      }

      // Update local state
      setCart(prev => {
        const existing = prev.find(item => item.product_id === productId);
        if (existing) {
          return prev.map(item => 
            item.product_id === productId 
              ? { ...item, quantity: existing.quantity + 1 } 
              : item
          );
        } else {
          return [...prev, { product_id: productId, quantity: 1 }];
        }
      });
    } catch (err) {
      console.error('Add to cart error:', err);
      setError(err.message);
    }
  };

  // NEW: Handle confirmation modal submit
  const handleConfirmOrder = async () => {
    // Compute tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDateStr = tomorrow.toISOString().split('T')[0];

    try {
      setPlacingOrder(true);
      setError('');
      const token = localStorage.getItem('hotelToken');

      const res = await fetch(`${BASE_URL}/api/hotel/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delivery_date: deliveryDateStr,
          special_instructions: specialInstructions,
          items: cart,
        }),
      });

      console.log('Order placement response status:', res.status); // DEBUG

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to place order: ${res.status}`);
      }

      const data = await res.json();
      console.log('Order placed:', data); // DEBUG
      alert(`${data.delivery_info || 'Order placed successfully!'} Order ID: ${data.order_id}`);
      
      // Clear cart on server
      try {
        await fetch(`${BASE_URL}/api/hotel/cart/clear`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (clearErr) {
        console.error('Failed to clear cart:', clearErr);
      }
      
      setCart([]); // Clear local state
      setShowConfirmModal(false); // Close modal
      setSpecialInstructions(''); // Reset fields
      navigate('/hotel/orders'); // Assuming orders page exists
    } catch (err) {
      console.error('Order placement error:', err); // DEBUG
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // UPDATED: Place order - now opens confirmation modal instead of confirm/prompt
  const placeOrder = () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    // Check minimum order value
    if (cartTotal.total_amount < MIN_ORDER_VALUE) {
      setError(`Please add more vegetables to meet the minimum order value of ₹${MIN_ORDER_VALUE}. We recommend bulk orders for hotels to ensure fresh and cost-effective delivery.`);
      return;
    }

    // Check availability (closed on Saturday, unavailable for Friday orders)
    // const today = new Date();
    // const day = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    // if (day === 5 || day === 6) {
    //   setError('We are unavailable on weekends. Please place your order from Sunday to Thursday.');
    //   return;
    // }

    // Open confirmation modal
    setShowConfirmModal(true);
  };

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Show 4 recommended products at bottom (or all if less)
  const recommendedProducts = products.slice(0, 4);

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
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your cart...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <Link to="/hotel/products" className="inline-flex items-center text-green-600 hover:text-green-700 mb-2">
                ← Back to Products
              </Link>
              <h1 className="text-3xl font-bold text-green-800">
                Shopping Cart
              </h1>
              <p className="text-green-700">
                Review your items, {user?.hotel_name || 'Hotel User'}.
              </p>
            </div>
          </div>

          {/* Products Error (separate from general error) */}
          {productsError && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700">
                Warning: Could not load product details ({productsError}). Items shown without images/prices.
              </p>
            </div>
          )}

          {/* General Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">Your cart is empty</h3>
              <Link
                to="/hotel/products"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-green-100">
                  <h2 className="text-xl font-semibold text-green-800">Cart Items ({cartItems.length})</h2>
                </div>
                <div className="divide-y divide-green-100">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-green-800">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            ₹{item.product.price_per_unit || 'N/A'}/ {item.product.unit_type || 'unit'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 border border-green-200 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 text-green-600 hover:text-green-800 font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-8 h-8 text-green-600 hover:text-green-800 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Actions (No Recalculate button) */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-12">
                <div className="flex justify-end items-center mb-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal ({cartTotal.item_count} items):</p>
                    <p className="text-2xl font-bold text-green-800">₹{cartTotal.total_amount.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placingOrder || cartTotal.total_amount === 0}
                  className="w-full bg-emerald-600 text-white py-4 rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg disabled:opacity-50"
                >
                  {placingOrder ? 'Placing Order...' : `Place Order - ₹${cartTotal.total_amount.toFixed(2)}`}
                </button>
              </div>

              {/* Recommended Products Section */}
              {recommendedProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                  <div className="p-6 border-b border-green-100">
                    <h2 className="text-xl font-semibold text-green-800 mb-2">
                      Missing Something? Add More
                    </h2>
                    <p className="text-green-700 text-sm">Quick picks to complete your order</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                    {recommendedProducts.map((product) => (
                      <div key={product.id} className="text-center border-r border-green-100 last:border-r-0 pr-4 last:pr-0">
                        <div className="mb-2">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg mx-auto"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                              <span className="text-gray-500 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-green-800 text-sm mb-1">{product.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">₹{product.price_per_unit}/ {product.unit_type}</p>
                        <button
                          onClick={() => addToCart(product.id)}
                          className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View More Products Link with Arrow */}
              <div className="text-center">
                <Link
                  to="/hotel/products"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                  <span className="mr-1">→</span> View More Products
                </Link>
              </div>
            </>
          )}

          {/* NEW: Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-green-800 mb-4">Confirm Order Placement</h2>
                <p className="text-gray-700 mb-4">Are you sure you want to place this order?</p>
                {/* NEW: Static delivery info message */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800">
                    📦 Your order will be delivered <strong>tomorrow between 11 AM to 3 PM</strong>.
                  </p>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions (optional)</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="E.g., Deliver before 8 AM"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={placingOrder}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placingOrder ? 'Placing...' : 'Confirm & Place Order'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}