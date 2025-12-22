import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const Fruits = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatbotRef = useRef(null);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle click outside to close chatbot
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChatbot && chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        const toggleButton = document.querySelector('.chatbot-toggle');
        if (toggleButton && !toggleButton.contains(event.target)) {
          setShowChatbot(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatbot]);

  return (
    <>
      {/* Head content as static imports or handled by router; styles and scripts here */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>{`
        .hero-section {
          background-image: url('/fru3.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          display: block;
        }

        /* Mobile: Add responsive padding like Home page */
        @media (max-width: 640px) {
          .hero-section {
            padding-top: 5rem;
            padding-bottom: 2rem;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .hero-section {
            padding-top: 8rem;
            padding-bottom: 3rem;
          }
        }

        @media (min-width: 769px) {
          .hero-section {
            padding-top: 8rem;
            padding-bottom: 4rem;
          }
        }

        /* Green overlay ONLY on the background image */
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(27, 119, 27, 0.7); /* Green overlay */
          z-index: 0;
        }

        /* Content stays above the overlay */
        .hero-content {
          position: relative;
          z-index: 1;
        }

        /* Header should be separate from the hero overlay */
        .header-section {
          background: transparent;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
        }

        .full-screen-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .footer-bg {
        background-image: url('https://imgs.search.brave.com/QC0Kz2bV6USwOeeMbo76JkqEeQmWERmTDN4MXIrYqTE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTA0/ODIyMTM0L3Bob3Rv/L3ZhcmlldHktb2Yt/Z3JlZW4tdmVnZXRh/Ymxlcy5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9UTJXUWd6/eVZwQS1nUjJTUVRs/U285N2Z6QnZJSEdC/YzJJY1BnNkhPY3Zw/Yz0');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        }

        .footer-bg::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(34, 139, 34, 0.7);
        z-index: 0;
        }

        /* Compact Chatbot Widget Styles */
        .chatbot-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          z-index: 1000;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease-in-out;
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          visibility: hidden;
        }

        .chatbot-window.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 640px) {
          .chatbot-window {
            width: 90vw;
            height: 70vh;
            bottom: 20px;
            right: 5vw;
            left: 5vw;
          }
        }

        /* Chatbot toggle button */
        .chatbot-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1001;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .chatbot-toggle:hover {
          transform: scale(1.1);
        }

        .chatbot-toggle:active {
          transform: scale(0.95);
        }

        /* Chatbot message tooltip */
        .chatbot-message {
          position: fixed;
          bottom: 110px;
          right: 20px;
          z-index: 1000;
          background: white;
          color: #1f2937;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 200px;
          font-size: 14px;
          font-weight: 500;
          animation: popMessage 15s ease-in-out infinite;
          opacity: 0;
        }

        @keyframes popMessage {
          0% { opacity: 0; transform: translateY(10px); }
          5% { opacity: 1; transform: translateY(0); }
          33.33% { opacity: 1; transform: translateY(0); }
          40% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        .chatbot-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          z-index: 1002;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .chatbot-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        /* Override chatbot internal styles to make it compact */
        .chatbot-container {
          height: 100% !important;
          border-radius: 12px !important;
        }

        .chatbot-container .chat-container {
          height: 100% !important;
          border-radius: 12px !important;
        }

        .chatbot-container .chat-messages-container {
          max-height: 350px !important;
          flex: 1 !important;
        }

        /* Decorative line separator */
        .decorative-line {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, white 10%, white 90%, transparent 100%);
          margin: 0 auto;
          width: 95%;
          position: absolute;
          top: 120px;
          left: 2.5%;
          right: 2.5%;
          z-index: 45;
          opacity: 0.8;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div className="bg-white">
              <header className="header-section">
              <nav aria-label="Global" className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
                <div className="flex lg:flex-1">
                  <a href="index.html" className="-m-1.5 p-1.5">
                    <span className="sr-only">Bhairavnath Vegetables Supplier (BVS)</span>
                    <img src="/logo1.png" alt="Fresh Foods Logo" className="h-16 sm:h-20 md:h-24 w-auto" />
                  </a>
                </div>
                <div className="flex lg:hidden">
                  <button type="button" onClick={toggleMobileMenu} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white hover:bg-white/10 transition-colors">
                    <span className="sr-only">Open main menu</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
                      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                  <Link to="/" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Home</Link>
                  <Link to="/vegetables" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Vegetables</Link>
                  <Link to="/fruits" className="text-sm/6 font-semibold text-white border-b-2 border-white">Fruits</Link>
                  <Link to="/more" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">More</Link>
                  <Link to="/features" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Features</Link>
                  <Link to="/about" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">About Us</Link>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                  <a href="/login" className="text-sm/6 font-semibold text-white">Log in <span aria-hidden="true">&rarr;</span></a>
                </div>
              </nav>
              {/* Mobile menu dropdown */}
              {mobileMenuOpen && (
                <div className="lg:hidden bg-green-800 border-t border-white/10">
                  <div className="px-6 py-4 space-y-2">
                    <Link to="/" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">Home</Link>
                    <Link to="/vegetables" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">Vegetables</Link>
                    <Link to="/fruits" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">Fruits</Link>
                    <Link to="/more" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">More</Link>
                    <Link to="/features" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">Features</Link>
                    <Link to="/about" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-white hover:text-green-200">About Us</Link>
                    <Link to="/login" onClick={toggleMobileMenu} className="block py-2 text-base font-semibold text-green-200 border-t border-white/10 mt-2 pt-4">Log in</Link>
                  </div>
                </div>
              )}
            </header>
            
            {/* Decorative line separator */}
            <div className="decorative-line"></div>
      
            {/* FIXED: Hero section with proper overlay containment */}
            <div className="hero-section">
              <div className="hero-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-32 md:py-12 lg:py-16">
                <div className="mx-auto max-w-2xl lg:mx-0">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-white">
                Fresh Fruits for Every Season
              </h2>
              <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl font-medium text-pretty text-green-100">
                Premium quality fresh fruits, delivered daily to hotels, restaurants, caterers, and stores across Pune. Nutritious, delicious, and always fresh since 2004.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
              {/* Primary actions/links */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-base/7 font-semibold text-white sm:grid-cols-2 md:flex lg:gap-x-10">
                <a href="#price-list" className="rounded-md bg-green-600 px-3.5 py-2.5 text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                  Get price list <span aria-hidden="true">→</span>
                </a>
                <a href="#order" className="text-white hover:text-green-200">
                  Place an order <span aria-hidden="true">→</span>
                </a>
                <a href="#delivery" className="text-white hover:text-green-200">
                  Delivery info <span aria-hidden="true">→</span>
                </a>
                <a href="#contact" className="text-white hover:text-green-200">
                  Contact BVS <span aria-hidden="true">→</span>
                </a>
              </div>

              {/* Highlights */}
              <dl className="mt-16 grid grid-cols-2 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Since</dt>
                  <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">2004</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Order types</dt>
                  <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Bulk & daily</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Service area</dt>
                  <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Pune</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Assurance</dt>
                  <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Reliable supply</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-16 pb-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl mb-4">
                🍇 Our Fruit Categories
              </h2>
              <p className="text-lg text-green-600 max-w-3xl mx-auto">
                Discover nature's sweetest offerings, carefully categorized by type. From juicy berries to tropical delights — fresh, nutritious, and sustainably sourced.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img src="https://imgs.search.brave.com/D_r9kIWGFNXXe7NZTEVhiWdGJSsBl-QnmWzgXQ2L_lg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jdWx0/aXZhdGlvbmFnLmNv/bS93cC1jb250ZW50/L3VwbG9hZHMvMjAy/My8wMS9GbGVzaHkt/RnJ1aXRzLmpwZw" alt="Fleshy Simple Fruits" className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Popular</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🍑</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Fleshy Fruits
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Soft, juicy fruits with edible flesh. Rich in vitamins, minerals, and natural sugars for instant energy.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Vitamin C</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Hydrating</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Mango, Peach, Cherry, Grape, Orange, Apple</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img src="https://imgs.search.brave.com/_-osZv81rB5ytQZ9FpohJ52xFv9RlmHDzmZ2W0LIm1k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9kcnkt/ZnJ1aXRzLXByb3Zp/ZGUtcXVpY2stZW5l/cmd5LWRyeS1mcnVp/dHMtbmF0dXJhbGx5/LWRyaWVkLWRlaHlk/cmF0ZWQtZnJ1aXRz/LWxpa2UtYWxtb25k/cy1jYXNoZXdzLXJh/aXNpbnMtZGF0ZXMt/MzgxODU1NjE3Lmpw/Zw" alt="Dry Fruits & Nuts" className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Nutritious</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥜</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Dry Fruits & Nuts
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Naturally dried or dehydrated fruits. Perfect for long-term storage, packed with concentrated nutrition.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Protein</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Energy</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Almonds, Cashews, Raisins, Dates, Walnuts, Apricots</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img src="https://imgs.search.brave.com/9CemYRYQcldc_o0Mc_n74-kUP5brvWWYwcQXuk3w_EY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTM5/ODIwMTkwL3Bob3Rv/L2JsYWNrYmVycmll/cy1hZ2dyZWdhdGUt/ZnJ1aXRzLWNsdXN0/ZXItb2Ytc21hbGwt/ZHJ1cGVzLXByaWNr/bHktdGhpY2tldHMt/bWljaGlnYW4uanBn/P3M9NjEyeDYxMiZ3/PTAmaz0yMCZjPVRf/cTZyQUNLSHhGYkpn/bkgyX3BHLUJKdXhK/ZlNRSUJXbmlSbF9X/MkRKR3c9" alt="Aggregate Fruits - Berries" className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Antioxidant</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🍓</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Berries & Aggregates
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Multiple ovaries forming one fruit. Superfoods loaded with antioxidants and natural sweetness.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Antioxidants</span>
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">Fiber</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Strawberry, Raspberry, Blackberry, Mulberry</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img src="https://imgs.search.brave.com/byNxsX8wPsFaFQYmfRpSqBsoQJmfXTr1X3wTauaqhYk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cy4x/MjNyZi5jb20vNDUw/d20vc2VyZXpuaXkv/c2VyZXpuaXkxODA0/L3NlcmV6bml5MTgw/NDIxMDc2Lzk5NjI5/NDQ5LWFzc29ydG1l/bnQtb2YtZXhvdGlj/LWZydWl0cy1vbi13/b29kZW4tYmFja2dy/b3VuZC5qcGc_dmVy/PTY" alt="Tropical & Exotic Fruits" className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Tropical</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🍍</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Tropical & Exotic
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Multiple flowers forming one fruit. Exotic flavors from tropical regions, rich in unique nutrients.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Exotic</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Enzymes</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Pineapple, Fig, Jackfruit, Mulberry, Dragon Fruit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote */}
            <section className="relative isolate overflow-hidden bg-green-800 px-6 py-12 sm:py-16 lg:px-8 mb-0 mt-16">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,rgba(34,197,94,0.3),transparent)]"></div>
              <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-green-900 shadow-xl ring-1 shadow-green-500/10 ring-white/5 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
              <div className="mx-auto max-w-2xl lg:max-w-4xl">
                <img src="/mainlogo.jpg" alt="BVS Logo" className="mx-auto h-14" />
                <figure className="mt-6">
                  <blockquote className="text-center text-xl/8 font-semibold text-white sm:text-2xl/9">
                    <p>“From soil to chef’s table, we don’t just deliver vegetables—we deliver standards, accountability, and the backbone of every menu. When quality is your culture, not your campaign, success naturally follows.”</p>
                  </blockquote>
                  <figcaption className="mt-6">
                    <img src="./suraj.png" alt="Suraj Gaikwad" className="mx-auto size-11 rounded-full" />
                    <div className="mt-4 flex items-center justify-center space-x-3 text-base">
                      <div className="font-semibold text-white">Suraj Gaikwad</div>
                      <svg viewBox="0 0 2 2" width="3" height="3" aria-hidden="true" className="fill-white">
                        <circle r="1" cx="1" cy="1" />
                      </svg>
                      <div className="text-green-200">CEO of BVS</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            </section>
        </div>

        {/* What Makes Our Fruits Special */}
        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 mb-3 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full uppercase tracking-wide">
                Quality Standards
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                What Makes Our Fruits Special
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The standards that ensure premium quality in every delivery
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Value Card 1 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    🍎
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Peak Ripeness Selection
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Every fruit is hand-picked at optimal ripeness for maximum flavor and nutrition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 2 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Quality Inspected
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Each batch thoroughly inspected to meet our strict quality and hygiene standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 3 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    🌿
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Natural & Seasonal
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Seasonal fruits sourced naturally for authentic taste and better health benefits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 4 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Daily Fresh Supply
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Delivered fresh every day ensuring you receive fruits at their absolute best.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer-bg text-white relative">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8">
              {/* Navigation Links Row */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
                <Link to="/" className="text-sm/6 text-white/90 hover:text-white transition-colors">Home</Link>  {/* Fixed: to="/" (no .js) */}
                <Link to="/vegetables" className="text-sm/6 text-white/90 hover:text-white transition-colors">Vegetables</Link>  {/* Fixed: to="/vegetables" (no .js) */}
                <Link to="/fruits" className="text-sm/6 text-white/90 hover:text-white transition-colors">Fruits</Link>
                <Link to="/more" className="text-sm/6 text-white/90 hover:text-white transition-colors">More</Link>
                <Link to="/features" className="text-sm/6 text-white/90 hover:text-white transition-colors">Features</Link>
                <Link to="/about" className="text-sm/6 text-white/90 hover:text-white transition-colors">About Us</Link>
              </div>
              
              {/* Bottom Row with Copyright and Social Media */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/20">
              {/* Copyright */}
              <div className="text-sm text-white/90 text-center">
                  &copy; 2004–Present Bhairavnath Vegetables Supplier. All rights reserved.
              </div>
              </div>
          </div>
          </footer>

          {/* Chatbot message tooltip */}
          {!showChatbot && (
            <div className="chatbot-message">
              Hi! What would you like to know today?
            </div>
          )}

          {/* Chatbot Toggle Button */}
          <button 
            className="chatbot-toggle"
            onClick={toggleChatbot}
            aria-label="Open chatbot"
          >
            <img src="/chatboticon.png" alt="Chatbot" className="w-16 h-16" />
          </button>

          {/* Chatbot Window */}
          <div ref={chatbotRef} className={`chatbot-window ${showChatbot ? 'visible' : 'hidden'}`}>
            <button 
              className="chatbot-close"
              onClick={toggleChatbot}
              aria-label="Close chatbot"
            >
              ×
            </button>
            <ChatBot />
          </div>
        </div>
    </>
  );
};

export default Fruits;