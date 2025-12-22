import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot';

const Features = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState(null);
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

  // Auto-rotate screenshots every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const dashboardScreenshots = [
    {
      id: 0,
      title: '📊 Dashboard Overview',
      description: 'Get a bird\'s-eye view of all your orders and bills at a glance',
      features: ['Real-time KPIs', 'Recent Orders', 'Quick Statistics', 'Activity Feed'],
      image: '/dashboard.jpg'
    },
    {
      id: 1,
      title: '🛒 Place Orders Online',
      description: 'Browse fresh vegetables and place orders in seconds',
      features: ['Product Catalog', 'Smart Cart', 'Quick Reorder', 'Bulk Ordering'],
      image: '/order.jpg'
    },
    {
      id: 2,
      title: '📄 Digital Bills',
      description: 'Access all your bills online. Download or print instantly',
      features: ['Bill History', 'Payment Status', 'PDF Download', 'Email Delivery'],
      image: '/in.jpg'
    },
    {
      id: 3,
      title: '🍅 More',
      description: 'Explore additional products and features',
      features: ['Product Variety', 'Special Offers', 'Seasonal Items', 'Bulk Discounts'],
      image: '/more.jpg'
    }
  ];

  const benefits = [
    {
      icon: '⚡',
      title: 'Real-time Order Management',
      description: 'Place and track orders 24/7 with instant confirmations'
    },
    {
      icon: '💳',
      title: 'Digital Billing System',
      description: 'Get instant bills with multiple payment options'
    },
    {
      icon: '📊',
      title: 'Live Inventory Tracking',
      description: 'Check product availability in real-time'
    },
    {
      icon: '🔔',
      title: 'Automated Notifications',
      description: 'Stay updated with SMS, email, and in-app alerts'
    },
    {
      icon: '📈',
      title: 'Order History & Reports',
      description: 'Access complete order history and analytics'
    },
    {
      icon: '💰',
      title: 'Easy Price Comparison',
      description: 'Compare prices and make informed decisions'
    }
  ];

  const features = [
    { icon: '🔐', text: 'Secure Login & Authentication' },
    { icon: '📱', text: 'Mobile-Responsive Design' },
    { icon: '🔔', text: 'Real-time Notifications' },
    { icon: '💰', text: 'Multiple Payment Methods' },
    { icon: '📊', text: 'Analytics & Reports' },
    { icon: '🚚', text: 'Delivery Tracking' },
    { icon: '💬', text: 'Support Chat' },
    { icon: '🌐', text: 'Multi-language Support' }
  ];

  const stats = [
    { number: '50+', label: 'Hotels Trust Us' },
    { number: '10,000+', label: 'Orders Delivered' },
    { number: '99%', label: 'On-Time Delivery' },
    { number: '20+', label: 'Years Experience' }
  ];

  return (
    <>
      <style>{`
        .hero-features-bg {
          background-image: url('https://media.istockphoto.com/id/944478708/photo/couple-eating-lunch-with-fresh-salad-and-appetizers.jpg?s=612x612&w=0&k=20&c=xZdIIHvakQrYCbR59RM8nrhEnw-xu4nE-BOeOhQPnck=');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          display: block;
        }

        /* Mobile: Add responsive padding like Home page */
        @media (max-width: 640px) {
          .hero-features-bg {
            padding-top: 5rem;
            padding-bottom: 2rem;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .hero-features-bg {
            padding-top: 8rem;
            padding-bottom: 3rem;
          }
        }

        @media (min-width: 769px) {
          .hero-features-bg {
            padding-top: 8rem;
            padding-bottom: 4rem;
          }
        }
        
        .hero-features-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(80, 140, 80, 0.7); /* Green overlay, matches fruits.js */
          z-index: 0;
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

        .screenshot-placeholder {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 3px dashed #4caf50;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .screenshot-placeholder::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(76, 175, 80, 0.05) 10px,
              rgba(76, 175, 80, 0.05) 20px
            );
        }

        .feature-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
        }

        .tab-button {
          transition: all 0.3s ease;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          transform: scale(1.05);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .slide-in {
          animation: slideIn 0.6s ease-out forwards;
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
        {/* Navigation */}
        <header className="absolute inset-x-0 top-0 z-[60]">
          <nav className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
            <div className="flex lg:flex-1 relative z-[70]">
              <Link to="/" className="-m-1.5 p-1.5">
                <img src="/logo1.png" alt="BVS Logo" className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-xl" />
              </Link>
            </div>
            <div className="flex lg:hidden relative z-[70]">
              <button type="button" onClick={toggleMobileMenu} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white hover:bg-white/10 transition-colors">
                <span className="sr-only">Open main menu</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="hidden lg:flex lg:gap-x-12">
              <Link to="/" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Home</Link>
              <Link to="/vegetables" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Vegetables</Link>
              <Link to="/fruits" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Fruits</Link>
              <Link to="/more" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">More</Link>
              <Link to="/features" className="text-sm font-semibold text-white hover:text-green-200 transition-colors border-b-2 border-white">Features</Link>
              <Link to="/about" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">About Us</Link>
            </div>
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <Link to="/login" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </nav>
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-green-800 border-t border-white/10 relative z-[70]">
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

        {/* Hero Section */}
        <div className="hero-features-bg">
          <div className="relative z-10 px-4 sm:px-6 py-20 sm:py-32 md:py-12 lg:py-16 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6 px-4">
                Manage Your Restaurant Supply Chain Like Never Before
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-green-50 max-w-2xl mx-auto px-4">
                A complete digital dashboard for hotels, restaurants, canteens & caterers
              </p>
              
              {/* Quick Stats */}
              <div className="mt-12 sm:mt-16 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold text-white">{stat.number}</div>
                    <div className="text-sm text-green-100 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        

        {/* Dashboard Preview Section */}
        <div id="demo" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl mb-4">
                See Your Dashboard in Action
              </h2>
              <p className="text-lg text-green-600">
                Interactive preview of all the features you'll get access to
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {dashboardScreenshots.map((screenshot) => (
                <button
                  key={screenshot.id}
                  onClick={() => setActiveTab(screenshot.id)}
                  className={`tab-button px-6 py-3 rounded-xl font-semibold text-sm ${
                    activeTab === screenshot.id
                      ? 'active shadow-lg'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {screenshot.title}
                </button>
              ))}
            </div>

            {/* Screenshot Display */}
            <div className="slide-in">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-2xl border-2 border-green-200">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={dashboardScreenshots[activeTab].image} 
                    alt={dashboardScreenshots[activeTab].title} 
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                  {/* Overlay with blur and text */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-8">
                    <h3 className="text-4xl font-bold mb-4 drop-shadow-lg">
                      {dashboardScreenshots[activeTab].title}
                    </h3>
                    <p className="text-xl mb-6 max-w-xl text-center drop-shadow-md">
                      {dashboardScreenshots[activeTab].description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {dashboardScreenshots[activeTab].features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-green-700 shadow-lg"
                        >
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Breakdown */}
        <div className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("https://dynamic-media-cdn.tripadvisor.com/media/photo-o/31/6a/64/11/enjoy-a-delightful-spread.jpg?w=900&h=500&s=1")'
            }}
          />
          {/* Green Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-800/70 to-emerald-900/70" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">🎯 All-in-One Solution</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
                Your Restaurant Operations,
                <br />
                <span className="text-green-200">Powered by Technology</span>
              </h2>
              <p className="text-xl text-green-50 max-w-3xl mx-auto leading-relaxed">
                From ordering to billing, tracking to insights — experience the future of restaurant supply management with our comprehensive digital platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {/* Enterprise-Grade Reliability */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 h-80 text-center border border-white/30 hover:bg-white/20 hover:scale-105 transition-all shadow-xl group overflow-hidden flex flex-col items-center justify-center">
                <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-green-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Enterprise</span>
                <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-green-400 shadow-lg group-hover:scale-110 transition-transform text-4xl">🏢</div>
                <h3 className="text-lg font-bold text-white mb-2">Enterprise-Grade Reliability</h3>
                <p className="text-green-100 text-sm mb-3">Zero downtime, robust security, and 24/7 support trusted by the city’s top hotels.</p>
                <div className="mt-2 text-xs text-blue-100">SLA-backed uptime</div>
              </div>
              {/* Multi-Outlet Management */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 h-80 text-center border border-white/30 hover:bg-white/20 hover:scale-105 transition-all shadow-xl group overflow-hidden flex flex-col items-center justify-center">
                <span className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-blue-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">For Chains</span>
                <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-400 shadow-lg group-hover:scale-110 transition-transform text-4xl">🏨</div>
                <h3 className="text-lg font-bold text-white mb-2">Multi-Outlet Management</h3>
                <p className="text-green-100 text-sm mb-3">Control all your branches from a single dashboard—centralized orders, billing, and analytics.</p>
                <div className="mt-2 text-xs text-blue-100">Branch-level controls</div>
              </div>
              {/* Automated Procurement */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 h-80 text-center border border-white/30 hover:bg-white/20 hover:scale-105 transition-all shadow-xl group overflow-hidden flex flex-col items-center justify-center">
                <span className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">AI-powered</span>
                <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform text-4xl">🤖</div>
                <h3 className="text-lg font-bold text-white mb-2">Automated Procurement</h3>
                <p className="text-green-100 text-sm mb-3">Set rules for recurring orders, minimum stock, and approvals—let the system handle the rest.</p>
                <div className="mt-2 text-xs text-green-200">Smart order rules</div>
              </div>
              {/* Real-Time Spend Insights */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 h-80 text-center border border-white/30 hover:bg-white/20 hover:scale-105 transition-all shadow-xl group overflow-hidden flex flex-col items-center justify-center">
                <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-400 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Analytics</span>
                <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-green-500 shadow-lg group-hover:scale-110 transition-transform text-4xl">📊</div>
                <h3 className="text-lg font-bold text-white mb-2">Real-Time Spend Insights</h3>
                <p className="text-green-100 text-sm mb-3">Track your food costs, wastage, and supplier performance with live analytics and custom reports.</p>
                <div className="mt-2 text-xs text-blue-100">Live cost tracking</div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-green-100 text-lg font-medium">
                ✨ Trusted by 30+ hotels across Pune • 10,000+ orders processed • 
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl mb-4">
                Get Started in 3 Simple Steps
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Register Your Hotel</h3>
                <p className="text-gray-600">For registration, contact the owner: <a href="tel:9881325644" className="text-green-700 underline hover:text-green-900">9881325644</a></p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Browse & Order</h3>
                <p className="text-gray-600">Navigate our catalog and place orders with ease</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Track & Receive</h3>
                <p className="text-gray-600">Get real-time updates and receive fresh produce</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer-bg text-white relative">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8">
            {/* Navigation Links Row */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
              <Link to="/" className="text-sm/6 text-white/90 hover:text-white transition-colors">Home</Link>
              <Link to="/vegetables" className="text-sm/6 text-white/90 hover:text-white transition-colors">Vegetables</Link>
              <Link to="/fruits" className="text-sm/6 text-white/90 hover:text-white transition-colors">Fruits</Link>
              <Link to="/more" className="text-sm/6 text-white/90 hover:text-white transition-colors">More</Link>
              <Link to="/features" className="text-sm/6 text-white/90 hover:text-white transition-colors">Features</Link>
              <Link to="/about" className="text-sm/6 text-white/90 hover:text-white transition-colors">About Us</Link>
            </div>
            
            {/* Bottom Row with Copyright */}
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

export default Features;
