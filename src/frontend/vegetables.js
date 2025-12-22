import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component
const Vegetables = () => {
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
        // Check if click is not on the toggle button
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
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>{`
        .hero-section {
          background-image: url('/vegetables1.jpg');
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
          background: rgba(35, 137, 35, 0.7); /* Green overlay */
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
              <Link to="/vegetables" className="text-sm/6 font-semibold text-white border-b-2 border-white">Vegetables</Link>
              <Link to="/fruits" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Fruits</Link>
              <Link to="/more" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">More</Link>
              <Link to="/features" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Features</Link>
              <Link to="/about" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">About Us</Link>
            </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a href="/login" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Log in <span aria-hidden="true">&rarr;</span></a>
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
        <div className="hero-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-20 sm:pt-24">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-white">
              Vegetables for every need
            </h2>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl font-medium text-pretty text-green-100">
              All types of fresh vegetables, daily supply for hotels, canteens, caterers, and stores in Pune — serving since 2004.
            </p>
          </div>
          <div className="mx-auto mt-8 sm:mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            {/* Primary actions/links */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 text-base/7 font-semibold text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <a href="/login" className="rounded-md bg-green-600 px-3.5 py-2.5 text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                Get price list <span aria-hidden="true">→</span>
              </a>
              <a href="/login" className="text-white hover:text-green-200">
                Place an order <span aria-hidden="true">→</span>
              </a>
              <a href="/login" className="text-white hover:text-green-200">
                Delivery info <span aria-hidden="true">→</span>
              </a>
              <a href="/about" className="text-white hover:text-green-200">
                Contact BVS <span aria-hidden="true">→</span>
              </a>
            </div>
            {/* Highlights */}
            <dl className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-xs sm:text-sm md:text-base text-green-100">Since</dt>
                <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">2004</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-xs sm:text-sm md:text-base text-green-100">Order types</dt>
                <dd className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-white">Bulk & daily</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-xs sm:text-sm md:text-base text-green-100">Service area</dt>
                <dd className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Pune</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-xs sm:text-sm md:text-base text-green-100">Assurance</dt>
                <dd className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-white">Reliable supply</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>


        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-green-800 mb-3 sm:mb-4 px-4">
                🥬 Our Vegetable Categories
              </h2>
              <p className="text-base sm:text-lg text-green-600 max-w-3xl mx-auto px-4">
                Explore our wide range of fresh vegetables, carefully categorized for easy selection. 
                From farm to your kitchen — quality guaranteed since 2004.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/Ga137VrloLbDewdV3BctCCU8hnJrM4Rbv9lrGImvg6Y/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTc0/ODUxMzE1L3Bob3Rv/L3Jvb3QtdmVnZXRh/Ymxlcy1vbi1hLXNs/YXRlLWJhY2tncm91/bmQuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPU02dDBRUmpM/aGlNa2UyVFZ4Vzdt/NEJvQzB4SzZUc1FD/a3JMTml1UGRUa2s9" 
                    alt="Root Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥕</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Root Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Root vegetables grow underground and store energy in their roots. Perfect for soups, curries, and healthy dishes.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Carrot, Beetroot, Turnip, Radish, Sweet Potato, Parsnip</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/iBa4BDABDezkT1SP7h2Gs9u6MjgNP8KIQdivv1BGygY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9ncmVlbi12ZWdl/dGFibGVzLWRhcmst/bGVhZnktZm9vZF8x/MTQzMDktMjA3Ny5q/cGc_c2VtdD1haXNf/aHlicmlkJnc9NzQw/JnE9ODA" 
                    alt="Leafy Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥬</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Leafy Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Rich in nutrients where the edible part is the leaf or foliage. Packed with vitamins and minerals.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Spinach, Cabbage, Lettuce, Kale, Bok Choy, Mustard Greens</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/k9DjcMxgGDYZNXR-xSP5ZT0Ix48zKqbWs5qCkh3z2zs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9ncmVl/bm15bGlmZS53cGVu/Z2luZXBvd2VyZWQu/Y29tL3dwLWNvbnRl/bnQvdXBsb2Fkcy8y/MDE3LzAyL0J1bGJz/LmpwZw" 
                    alt="Bulb Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🧅</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Bulb Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Underground bulb-like structures with strong flavors. Essential for cooking and adding aroma to dishes.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Onion, Garlic, Shallot, Leek, Chives, Elephant Garlic</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/_ne96fLLr9GtaeQfsvyTcv4pQqJkQIlfA45GwP6Utg8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Y29va2luZ2h1Yi5j/b20vd3AtY29udGVu/dC91cGxvYWRzLzIw/MjQvMDcvc3RlbXMt/dmVnZXRhYmxlLTE0/MDB4OTM2LmpwZw" 
                    alt="Stem Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🌱</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Stem Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Edible stalks and stems perfect for salads and stir-fries. Crisp, fresh, and full of fiber.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Asparagus, Celery, Bamboo Shoots, Kohlrabi, Lemongrass</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/YJsPh_Q_bXfx9QfhbDC_IAE7j41sdOgNnE7NXPAKP1U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9iYWxj/b255Z2FyZGVud2Vi/LmItY2RuLm5ldC93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMi8w/Ny9hcnRpY2hva2Uu/anBn" 
                    alt="Flower Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥦</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Flower Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The flowering parts of plants consumed as vegetables. Delicate and nutritious.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Cauliflower, Broccoli, Artichoke, Banana Flower, Romanesco</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/8siVA6QPC9DloNnJpRNBb5MNXb1Pg6A1q2rMpgOGcsI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zYW4t/ai5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDIvMDEt/aGVhbHRoaWVzdC1m/cnVpdHMtdmVnZXRh/Ymxlcy1SRVYwMi5q/cGc" 
                    alt="Fruit Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🍅</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Fruit Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    From the fruiting part of plants, usually containing seeds. Versatile for all cooking styles.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Tomato, Cucumber, Eggplant, Bell Pepper, Okra, Squash</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/tg3qgIMiyOj39mCEq5N91Vngvy1DSpT9JIKdkf46Kqw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly92ZWdn/aWVzaW5mby5jb20v/cG9kZGVkLWltYWdl/cy9saW1hLWJlYW4t/cG9kZGVkLXZlZ2dp/ZS1zbWFsbC5qcGc" 
                    alt="Podded Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🫘</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Podded Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Legumes with edible pods, rich in protein and fiber. Essential for healthy diet.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Green Beans, Peas, Lentils, Chickpeas, Mung Beans</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/kCLRPUvzVmGdwgK4q4ZPsnJm_H69FZ-O7ePHQPU-PR0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9teWJp/Z2ZhdGdyYWluZnJl/ZWxpZmUuY29tL3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDIzLzA5/L3R1YmVyLXZlZ2V0/YWJsZXMuanBn" 
                    alt="Tuber Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥔</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Tuber Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Thickened underground stems or roots rich in starch. Perfect for all meal types.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Potato, Yam, Jerusalem Artichoke, Cassava, Taro</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/bzLc_1Qa-WhGuDvbVNSCI2POVeLqFHTabq7QxVTpuqw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9nZXR0/eWltYWdlcy02MDE3/OTk0MTUtMi02ODc3/OTEzNzZjMGRiLmpw/Zz9jcm9wPTAuNjY3/eHc6MS4wMHhoOzAu/MjU5eHcsMCZyZXNp/emU9NjQwOio" 
                    alt="Marrow Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥒</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Marrow Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Soft, fleshy vegetables with high water content. Hydrating and perfect for summer dishes.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Zucchini, Cucumber, Pumpkin, Bottle Gourd, Ridge Gourd</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/PMiHhrG56Kbnizrc73a29a9_EYyPGPkDvNJaXBznj8E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kM2l4/Z2U2aWNkNG5qdi5j/bG91ZGZyb250Lm5l/dC93cC1jb250ZW50/L3VwbG9hZHMvMjAy/MC8xMC9hbGxpdW0t/dmVnZXRhYmxlcy5q/cGc" 
                    alt="Allium Family Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🧄</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Allium Family
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Strong aroma and flavor enhancers with health benefits. Essential for every kitchen.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Onion, Garlic, Chives, Shallot, Leek</p>
                  </div>
                </div>
              </div>
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://imgs.search.brave.com/IJJ2F6_SXBVz9Evj5y4SoOcSWvtjFkz12UZh56c6Wnk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9hc3NvcnRtZW50/LWRpZmZlcmVudC1j/cnVjaWZlcm91cy12/ZWdldGFibGVzXzE2/NTUzNi0zNDguanBn/P3NlbXQ9YWlzX2h5/YnJpZCZ3PTc0MA" 
                    alt="Cruciferous Vegetables" 
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Fresh</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🥬</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Cruciferous Vegetables
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Cabbage family members with cancer-fighting properties. Superfood for health-conscious cooking.
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Examples:</p>
                    <p className="text-xs text-gray-500 mt-1">Broccoli, Cauliflower, Cabbage, Kale, Brussels Sprouts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Market Yard Pune Information Section */}
        <div className="overflow-hidden bg-gradient-to-b from-[#f0f9f0] to-[#e8f5e8] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
              <div className="lg:pt-4 lg:pr-8">
                <div className="lg:max-w-lg">
                  <h2 className="text-base font-semibold leading-7 text-[#164216]">Farmer's Direct Connect  </h2>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-[#164216] sm:text-5xl">Market Yard Pune</p>
                  <p className="mt-6 text-lg/8 text-[#1d641d]">Located in the heart of Gultekdi, Market Yard Pune is one of India's largest wholesale vegetable and fruit markets. We connect farmers directly to restaurants, hotels, and caterers with fresh, quality produce delivered daily.</p>
                  <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-[#1d641d] lg:max-w-none">
                    <div className="relative pl-9">
                      <dt className="inline font-semibold text-[#164216]">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="absolute top-1 left-1 size-5 text-[#227d22]" aria-hidden="true">
                          <path d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" fillRule="evenodd" />
                        </svg>
                        Daily Fresh Operations
                      </dt>
                      <dd className="inline"> Open from 6:00 AM to 10:00 PM daily. Peak hours are early morning (6-12 PM) when freshest produce arrives from farms across Maharashtra.</dd>
                    </div>
                    <div className="relative pl-9">
                      <dt className="inline font-semibold text-[#164216]">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="absolute top-1 left-1 size-5 text-[#227d22]" aria-hidden="true">
                          <path d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" fillRule="evenodd" />
                        </svg>
                        Quality Assured
                      </dt>
                      <dd className="inline"> Every product is carefully selected and inspected. We maintain strict quality standards for all vegetables, fruits, and seasonal specialties.</dd>
                    </div>
                    <div className="relative pl-9">
                      <dt className="inline font-semibold text-[#164216]">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="absolute top-1 left-1 size-5 text-[#227d22]" aria-hidden="true">
                          <path d="M4.632 3.533A2 2 0 0 1 6.577 2h6.846a2 2 0 0 1 1.945 1.533l1.976 8.234A3.489 3.489 0 0 0 16 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234Z" />
                          <path d="M4 13a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4H4Zm11.24 2a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V15Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75h-.01Z" clipRule="evenodd" fillRule="evenodd" />
                        </svg>
                        Wholesale Pricing
                      </dt>
                      <dd className="inline">Special rates for bulk orders, restaurants, hotels, and caterers. Contact us at <a href="tel:9881325644" className="text-[#227d22] font-bold hover:text-[#164216]">9881325644</a> for quotes.</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <img src="https://nikkitapatro.wordpress.com/wp-content/uploads/2020/05/6.jpeg" alt="Market Yard Fresh Vegetables" className="w-[48rem] max-w-none max-h-[600px] object-cover rounded-xl shadow-xl ring-1 ring-[#bce4bc] sm:w-[57rem] md:-ml-4 lg:-ml-0" />
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
    </>
  );
};

export default Vegetables;