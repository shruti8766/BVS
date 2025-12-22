// // src/hotel_dashboard/components/layout/Topbar.js
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import {         
//   Bars3Icon,
//   MagnifyingGlassIcon,
//   ShoppingCartIcon,
//   BellIcon,
//   ChevronDownIcon,
// } from '@heroicons/react/24/outline';

// export default function Topbar({ onMenuClick, onCartClick }) {
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const navigate = useNavigate();
//   const { logout, user } = useAuth();  // Assume user object has hotel details

//   // ---- SEARCH ROUTES -------------------------------------------------
//   const searchMap = {
//     dashboard: '/hotel/dashboard',
//     orders: '/hotel/orders',
//     bills: '/hotel/bills',
//     products: '/hotel/products',
//     cart: '/hotel/cart',
//     profile: '/hotel/profile',
//     settings: '/hotel/settings',
//     support: '/hotel/support',
//   };

//   const handleSearch = (e) => {
//     if (e.key !== 'Enter') return;
//     const q = searchQuery.trim().toLowerCase();
//     const route = searchMap[q];
//     if (route) {
//       navigate(route);
//       setSearchQuery('');
//     }
//   };

//   // ---- LOGOUT --------------------------------------------------------
//   const doLogout = () => {
//     logout();                 // clears token + state
//     navigate('/login', { replace: true });
//   };

//   // Assume user is the logged-in hotel user
//   const displayName = user?.hotel_name || user?.username || 'Hotel User';

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200">
//       <div className="flex items-center justify-between h-16 px-4">
//         {/* LEFT */}
//         <div className="flex items-center space-x-4">
//           <button
//             className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
//             onClick={onMenuClick}
//           >
//             <Bars3Icon className="w-5 h-5" />
//           </button>

//           <div className="relative">
//             <input
//               type="search"
//               placeholder="Search… (orders, products, cart…)"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               onKeyDown={handleSearch}
//               className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
//             />
//             <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div className="flex items-center space-x-4">
//           {/* Date range – you can keep it as is for order filtering */}
//           <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm">
//             <option>Today</option>
//             <option>This Week</option>
//             <option>This Month</option>
//             <option>Custom Range</option>
//           </select>

//           {/* Cart button */}
//           <button
//             className="p-2 rounded-lg hover:bg-gray-100 relative"
//             onClick={onCartClick}
//           >
//             <ShoppingCartIcon className="w-5 h-5" />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
//           </button>

//           {/* Notification bell */}
//           <button
//             className="p-2 rounded-lg hover:bg-gray-100 relative"
//             onClick={() => {}}  // Can integrate notifications later
//           >
//             <BellIcon className="w-5 h-5" />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//           </button>

//           {/* USER DROPDOWN */}
//           <div className="relative">
//             <button
//               className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
//               onClick={() => setUserMenuOpen((v) => !v)}
//             >
//               <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
//                 <span className="text-primary-700 font-medium text-sm">
//                   {displayName.charAt(0).toUpperCase()}
//                 </span>
//               </div>
//               <span className="hidden md:block text-sm font-medium truncate max-w-32">
//                 {displayName}
//               </span>
//               <ChevronDownIcon className="w-4 h-4" />
//             </button>

//             {userMenuOpen && (
//               <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                 <button
//                   onClick={() => {
//                     navigate('/hotel/profile');
//                     setUserMenuOpen(false);
//                   }}
//                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 >
//                   Profile
//                 </button>
//                 <button
//                   onClick={() => {
//                     navigate('/hotel/settings');
//                     setUserMenuOpen(false);
//                   }}
//                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 >
//                   Settings
//                 </button>
//                 <button
//                   onClick={doLogout}
//                   className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//                 >
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }
// src/hotel_dashboard/components/layout/Topbar.js
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {         
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BellIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Topbar({ onMenuClick }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]); // [{product_id, quantity}]
  const [products, setProducts] = useState([]); // For display
  const [cartTotal, setCartTotal] = useState({ total_amount: 0, item_count: 0 });
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const navigate = useNavigate();
  const { logout, user } = useAuth();  // Assume user object has hotel details

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // ---- SEARCH ROUTES -------------------------------------------------
  const searchMap = {
    dashboard: '/hotel/dashboard',
    orders: '/hotel/orders',
    bills: '/hotel/bills',
    products: '/hotel/products',
    cart: '/hotel/cart',
    profile: '/hotel/profile',
    settings: '/hotel/settings',
    support: '/hotel/support',
  };

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim().toLowerCase();
    const route = searchMap[q];
    if (route) {
      navigate(route);
      setSearchQuery('');
    }
  };

  // ---- LOGOUT --------------------------------------------------------
  const doLogout = () => {
    logout();                 // clears token + state
    navigate('/login', { replace: true });
  };

  // Load cart count on mount for badge
  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const token = localStorage.getItem('hotelToken');
        if (!token) return;
        const res = await fetch(`${BASE_URL}/api/hotel/cart`, {
          method: 'GET',
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
          return; // Silently fail for badge
        }

        const data = await res.json();
        setCartTotal(prev => ({ ...prev, item_count: data.items?.length || 0 }));
      } catch (err) {
        console.error('Error loading cart count:', err);
      }
    };

    loadCartCount();
  }, [navigate, logout]);

  // Load full cart when slideover opens
  useEffect(() => {
    let isMounted = true;

    const loadFullCart = async () => {
      if (!cartOpen) return;

      try {
        setLoadingCart(true);
        setCartError('');
        const token = localStorage.getItem('hotelToken');
        if (!token) {
          setCartError('Not authenticated');
          setLoadingCart(false);
          return;
        }

        // Fetch cart items
        const cartRes = await fetch(`${BASE_URL}/api/hotel/cart`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!cartRes.ok) {
          if (cartRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Failed to load cart: ${cartRes.status}`);
        }

        const cartData = await cartRes.json();
        const items = cartData.items || [];
        if (isMounted) setCart(items);

        // Fetch products
        const productsRes = await fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!productsRes.ok) {
          if (productsRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Failed to fetch products: ${productsRes.status}`);
        }

        const productsData = await productsRes.json();
        // Extract products array from response or use as-is if already array
        const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
        if (isMounted) setProducts(productsArray);

        // Calculate total locally (avoid unreliable /calculate endpoint)
        if (items.length > 0) {
          const fallbackTotal = items.reduce((sum, item) => {
            const product = productsArray.find(p => p.id === item.product_id);
            return sum + ((product?.price_per_unit || 0) * item.quantity);
          }, 0);
          if (isMounted) setCartTotal({ total_amount: fallbackTotal, item_count: items.length });
        } else {
          if (isMounted) setCartTotal({ total_amount: 0, item_count: 0 });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading full cart:', err);
          setCartError(err.message);
        }
      } finally {
        if (isMounted) setLoadingCart(false);
      }
    };

    loadFullCart();

    return () => {
      isMounted = false;
    };
  }, [cartOpen, navigate, logout]);

  // Get cart items with product details
  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return { ...item, product: product || { name: 'Unknown Product', price_per_unit: 0, unit_type: 'unit' } };
  });

  // Close slideover
  const closeCart = () => setCartOpen(false);

  // Assume user is the logged-in hotel user
  const displayName = user?.hotel_name || user?.username || 'Hotel User';

  // Only render if user is authenticated (to avoid issues on login page)
  if (!user) {
    return null;
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* LEFT */}
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            <div className="relative">
              <input
                type="search"
                placeholder="Search… (orders, products, cart…)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center space-x-4">

            {/* Cart button */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCartIcon className="w-10 h-5" />
              {cartTotal.item_count > 0 && (
                <span className="absolute top-1 right-1 min-w-[1.2rem] h-5 flex items-center justify-center ">
                  {cartTotal.item_count}
                </span>
              )}
            </button>

            {/* Notification bell */}
            {/* <button
              className="p-2 rounded-lg hover:bg-gray-100 relative"
              onClick={() => {}}  // Can integrate notifications later
            >
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button> */}

            {/* USER DROPDOWN */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium truncate max-w-32">
                  {displayName}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      navigate('/hotel/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/hotel/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <button
                    onClick={doLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Slideover */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={closeCart}
          />
          
          {/* Slideover Panel */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingCart ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : cartError ? (
                  <div className="text-center py-8 text-red-600">
                    <p>{cartError}</p>
                    <button
                      onClick={() => navigate('/hotel/cart')}
                      className="mt-2 text-green-600 underline"
                    >
                      Go to Cart
                    </button>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <Link
                      to="/hotel/products"
                      className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      onClick={closeCart}
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Img</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                              <p className="text-xs text-gray-500">
                                Quantity: {item.quantity} {item.product.unit_type || 'unit'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600">{cartTotal.item_count} item(s) in cart</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 p-4 space-y-3">
                {cartItems.length > 0 && (
                  <>
                    <Link
                      to="/hotel/cart"
                      className="block w-full bg-green-600 text-white py-3 rounded-lg text-center font-semibold hover:bg-green-700"
                      onClick={closeCart}
                    >
                      View Full Cart
                    </Link>
                    <button
                      onClick={() => {
                        navigate('/hotel/cart');
                        closeCart();
                      }}
                      className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg text-center font-semibold hover:bg-gray-300"
                    >
                      Checkout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
