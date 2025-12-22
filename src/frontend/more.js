import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const More = () => {
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
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>{`
        .hero-bg {
          background-image: url('https://imgs.search.brave.com/c2eDpVhTrqhjHE4pzWQKgZIyeixxgzlByXaFRDhs22s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTY1/Nzg3NTQ2Ny9waG90/by9mcmVzaC1ncmVl/bi1vcmdhbmljLXZl/Z2V0YWJsZXMtYW5k/LWZydWl0cy1vbi1n/cmVlbi1iYWNrZ3Jv/dW5kLWhlYWx0aHkt/Zm9vZC1kaWV0LWFu/ZC1kZXRveC5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9YkZi/cjZaVjhWNkYzM0hs/dkdHV2FEWXRDYzEx/YWZBbXFUby02eEZp/ZkNidz0');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }
        
        .hero-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 134, 13, 0.7);
          z-index: 0;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
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

        /* Mobile: Add responsive padding like Home page */
        @media (max-width: 640px) {
          .relative.min-h-screen {
            padding-top: 5rem !important;
            padding-bottom: 2rem !important;
            min-height: auto !important;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .relative.min-h-screen {
            padding-top: 8rem !important;
            padding-bottom: 3rem !important;
            min-height: auto !important;
          }
        }

        @media (min-width: 769px) {
          .relative.min-h-screen {
            padding-top: 8rem !important;
            padding-bottom: 4rem !important;
            min-height: auto !important;
          }
        }
      `}</style>
      {/* Header & Hero Section - Combined */}
        <div className="relative min-h-screen">
        {/* Background Image */}
        <img 
            src="/puls.jpg" 
            alt="Fresh vegetables and pulses background"
            className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Green overlay */}
        <div className="absolute inset-0 bg-green-900/70"></div>
        
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
            <div className="flex lg:flex-1">
                <a href="/" className="-m-1.5 p-1.5">
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
              <Link to="/fruits" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Fruits</Link>
              <Link to="/more" className="text-sm/6 font-semibold text-white border-b-2 border-white">More</Link>
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

        {/* Hero Content */}
        <div className="relative z-10 py-20 sm:py-32 md:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="mx-auto max-w-2xl lg:mx-0">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                Premium Pulses & Pantry Essentials
                </h2>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-green-100">
                Quality pulses, traditional banana leaves, dry fruits, and kitchen staples — daily supply for hotels, restaurants, and caterers across Pune since 2004.
                </p>
            </div>

            <div className="mx-auto mt-8 sm:mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 text-base font-semibold text-white sm:grid-cols-2 md:flex lg:gap-x-10">
                <a href="#price-list" className="rounded-md bg-green-600 px-3.5 py-2.5 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                    Get price list <span aria-hidden="true" className="text-green-200">&rarr;</span>
                </a>
                <a href="#order" className="text-white hover:text-green-200">
                    Place an order <span aria-hidden="true" className="text-green-200">&rarr;</span>
                </a>
                <a href="#delivery" className="text-white hover:text-green-200">
                    Delivery info <span aria-hidden="true" className="text-green-200">&rarr;</span>
                </a>
                <a href="#contact" className="text-white hover:text-green-200">
                    Contact BVS <span aria-hidden="true" className="text-green-200">&rarr;</span>
                </a>
                </div>

                <dl className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
                <div className="flex flex-col-reverse gap-1">
                    <dt className="text-xs sm:text-sm font-medium leading-6 text-green-100">Since</dt>
                    <dd className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">2004</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                    <dt className="text-xs sm:text-sm font-medium leading-6 text-green-100">Range</dt>
                    <dd className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white">Staples & pantry</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                    <dt className="text-xs sm:text-sm font-medium leading-6 text-green-100">Service area</dt>
                    <dd className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Pune</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                    <dt className="text-xs sm:text-sm font-medium leading-6 text-green-100">Assurance</dt>
                    <dd className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white">Reliable supply</dd>
                </div>
                </dl>
            </div>
            </div>
        </div>
        </div>

        {/* Products Section */}
        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-green-800 mb-3 sm:mb-4 px-4">
                Our Product Range
              </h2>
              <p className="text-base sm:text-lg text-green-600 max-w-3xl mx-auto px-4">
                From protein-rich pulses to traditional serving essentials — everything your kitchen needs for authentic, quality food service.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://www.finedininglovers.com/sites/default/files/article_content_images/Different_varieties_of_lentils_%C2%A9Sporrer%2C%20Brigitte_Stockfood.jpg"
                    alt="Pulses and lentils"
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Protein Rich</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🫘</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Pulses & Lentils
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Premium quality dals and beans in whole/split forms. Essential protein sources for bulk kitchens and authentic Indian cuisine.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">High Protein</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Fiber Rich</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Popular Varieties:</p>
                    <p className="text-xs text-gray-500 mt-1">Toor, Chana, Moong, Masoor, Urad, Rajma, Kabuli Chana</p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://t3.ftcdn.net/jpg/01/48/94/42/360_F_148944249_wZJDhd4XFiSPcYCTu1SY8g1eH5AYFR72.jpg"
                    alt="Banana leaves and wraps"
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Eco-Friendly</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🍃</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Banana Leaves
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Traditional, hygienic serving solution for thalis and banquets. Natural aroma enhancer with eco-friendly benefits.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Traditional</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Hygienic</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Perfect For:</p>
                    <p className="text-xs text-gray-500 mt-1">Thali Service, Wedding Banquets, Steamed Dishes, Wraps</p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://www.shutterstock.com/image-photo/dried-fruit-that-has-had-600nw-2489832773.jpg"
                    alt="Dry fruits and nuts"
                    className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-300 lg:h-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Premium</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-2">🌰</span>
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors">
                      Dry Fruits & Nuts
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Premium quality dry fruits for sweets, bakery, and festive catering. Perfect for garnishing and specialty dishes.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Energy</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Premium</span>
                  </div>
                  <div className="pt-4 border-t border-green-100">
                    <p className="text-xs text-green-700 font-medium">Varieties:</p>
                    <p className="text-xs text-gray-500 mt-1">Almonds, Cashews, Raisins, Dates, Pistachios, Walnuts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipe Inspiration Section */}
            <div className="mx-auto max-w-7xl mt-20">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-xl p-8 md:p-12">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-amber-900 mb-4">
                    Popular Recipes with Our Products
                  </h3>
                  <p className="text-amber-700 max-w-2xl mx-auto">
                    Authentic Indian dishes your customers love, made easy with quality ingredients from BVS
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-3">🍛</div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Dal Tadka</h4>
                    <p className="text-sm text-gray-600 mb-3">Classic comfort food made with Toor dal, tempered with cumin and mustard seeds</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Toor Dal</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Spices</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-3">🥘</div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Rajma Masala</h4>
                    <p className="text-sm text-gray-600 mb-3">Rich kidney bean curry, a North Indian favorite perfect for large gatherings</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Rajma</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Tomatoes</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-3">🍚</div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Kheer</h4>
                    <p className="text-sm text-gray-600 mb-3">Traditional rice pudding garnished with premium dry fruits for celebrations</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Dry Fruits</span>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Rice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Footer */}
        <footer className="footer-bg text-white relative mt-24">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
              <Link to="/" className="text-sm/6 text-white/90 hover:text-white transition-colors">Home</Link>  {/* Fixed: to="/" (no .js) */}
              <Link to="/vegetables" className="text-sm/6 text-white/90 hover:text-white transition-colors">Vegetables</Link>  {/* Fixed: to="/vegetables" (no .js) */}
              <Link to="/fruits" className="text-sm/6 text-white/90 hover:text-white transition-colors">Fruits</Link>
              <Link to="/more" className="text-sm/6 text-white/90 hover:text-white transition-colors">More</Link>
              <Link to="/features" className="text-sm/6 text-white/90 hover:text-white transition-colors">Features</Link>
              <Link to="/about" className="text-sm/6 text-white/90 hover:text-white transition-colors">About Us</Link>
            </div>
            
            <div className="flex justify-center items-center pt-8 border-t border-white/20">
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

export default More;