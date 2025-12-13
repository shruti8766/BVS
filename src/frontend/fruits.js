import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const Fruits = () => {
  const [showChatbot, setShowChatbot] = useState(false);

    const toggleChatbot = () => {
      setShowChatbot(!showChatbot);
    };

  return (
    <>
      {/* Head content as static imports or handled by router; styles and scripts here */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>{`
        .hero-section {
          background-image: url('/fruit.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        /* Green overlay ONLY on the background image */
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 125, 11, 0.7); /* Green overlay */
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
          bottom: 80px;
          right: 20px;
          z-index: 1000;
          width: 350px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease-in-out;
          transform: scale(0.95);
          opacity: 0;
          visibility: hidden;
        }

        .chatbot-window.visible {
          transform: scale(1);
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
          background: #10b981;
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          transition: all 0.3s ease;
        }

        .chatbot-toggle:hover {
          background: #059669;
          transform: scale(1.1);
        }

        .chatbot-toggle:active {
          transform: scale(0.95);
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
      `}</style>
      <div className="bg-white">
              <header className="header-section">
              <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                  <a href="index.html" className="-m-1.5 p-1.5">
                    <span className="sr-only">Bhairavnath Vegetables Supplier (BVS)</span>
                    <img src="/logo1.png" alt="Fresh Foods Logo" className="h-24 w-auto" />
                  </a>
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
            </header>
      
            {/* FIXED: Hero section with proper overlay containment */}
            <div className="hero-section">
              <div className="hero-content mx-auto max-w-7xl px-6 lg:px-8 w-full">
                <div className="mx-auto max-w-2xl lg:mx-0">
                  <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                Fresh Fruits for Every Season
              </h2>
              <p className="mt-8 text-lg font-medium text-pretty text-green-100 sm:text-xl/8">
                Premium quality fresh fruits, delivered daily to hotels, restaurants, caterers, and stores across Pune. Nutritious, delicious, and always fresh since 2004.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
              {/* Primary actions/links */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base/7 font-semibold text-white sm:grid-cols-2 md:flex lg:gap-x-10">
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
              <dl className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Since</dt>
                  <dd className="text-4xl font-semibold tracking-tight text-white">2004</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Order types</dt>
                  <dd className="text-4xl font-semibold tracking-tight text-white">Bulk & daily</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Service area</dt>
                  <dd className="text-4xl font-semibold tracking-tight text-white">Pune</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-base/7 text-green-100">Assurance</dt>
                  <dd className="text-4xl font-semibold tracking-tight text-white">Reliable supply</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16">
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

          {/* Nutritional Benefits Section */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 md:p-12 text-white">
                  <h3 className="text-3xl font-bold mb-6 flex items-center">
                    <span className="mr-3">🍊</span> Why Choose Fresh Fruits?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">💪</span>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Boosts Immunity</h4>
                        <p className="text-green-100">Rich in Vitamin C and antioxidants to strengthen your immune system</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">❤️</span>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Heart Health</h4>
                        <p className="text-green-100">Natural fiber and potassium support cardiovascular wellness</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✨</span>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Glowing Skin</h4>
                        <p className="text-green-100">Vitamins A, C, and E promote healthy, radiant skin</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚡</span>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Natural Energy</h4>
                        <p className="text-green-100">Natural sugars and nutrients provide sustained energy without crashes</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 md:p-12 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h3 className="text-3xl font-bold mb-6 text-green-800 flex items-center">
                    <span className="mr-3">🛒</span> Fruit Selection Tips
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                        <span className="mr-2">🔍</span> Check for Freshness
                      </h4>
                      <p className="text-gray-600 text-sm">Look for bright colors, firm texture, and pleasant aroma. Avoid bruises or soft spots.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <span className="mr-2">📅</span> Seasonal is Best
                      </h4>
                      <p className="text-gray-600 text-sm">Choose fruits in season for peak flavor, nutrition, and better prices.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
                      <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                        <span className="mr-2">🌡️</span> Storage Matters
                      </h4>
                      <p className="text-gray-600 text-sm">Some fruits ripen at room temperature (bananas, avocados), others need refrigeration (berries, grapes).</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <span className="mr-2">🍎</span> Mix & Match
                      </h4>
                      <p className="text-gray-600 text-sm">Combine different colors for maximum nutritional benefits - each color offers unique nutrients!</p>
                    </div>
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

          {/* Chatbot Toggle Button */}
          <button 
            className="chatbot-toggle"
            onClick={toggleChatbot}
            aria-label="Open chatbot"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Chatbot Window */}
          <div className={`chatbot-window ${showChatbot ? 'visible' : 'hidden'}`}>
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