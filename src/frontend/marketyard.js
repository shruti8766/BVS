import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot';

const MarketYard = () => {
  const [showChatbot, setShowChatbot] = useState(false);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const marketFeatures = [
    {
      title: 'Daily Fresh Operations',
      description: 'Open from 6:00 AM to 10:00 PM daily. Peak hours are early morning (6-12 PM) when freshest produce arrives from farms across Maharashtra.',
      icon: '🌅'
    },
    {
      title: 'Quality Assured',
      description: 'Every product is carefully selected and inspected. We maintain strict quality standards for all vegetables, fruits, and seasonal specialties.',
      icon: '✅'
    },
    {
      title: 'Wholesale Pricing',
      description: 'Special rates for bulk orders, restaurants, hotels, and caterers. Contact us for customized quotes and volume discounts.',
      icon: '💰'
    },
    {
      title: 'Direct from Farmers',
      description: 'Connected with the best farmers across Maharashtra. We ensure farm-fresh produce reaches you without middlemen.',
      icon: '🌾'
    },
    {
      title: 'Cold Storage Facilities',
      description: 'State-of-the-art cold storage and logistics infrastructure for optimal preservation and timely delivery.',
      icon: '❄️'
    },
    {
      title: 'Seasonal Specialties',
      description: 'Access to rare and seasonal vegetables, fruits, and organic options throughout the year.',
      icon: '🍎'
    }
  ];

  const whyChooseUs = [
    'Established market hub serving Pune since 2004',
    'Direct sourcing from farmers across Maharashtra',
    'Fresh produce daily with quality assurance',
    'Wholesale rates for restaurants & hotels',
    'Cold storage & logistics facilities available',
    'Seasonal specialties and organic options',
    ' 24/7 customer support for bulk orders',
    'Same-day delivery available in Pune'
  ];

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        .hero-marketyard {
          background-image: url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&h=600&fit=crop');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .hero-marketyard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(80, 140, 80, 0.7);
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 10;
        }

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
      `}</style>

      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-[60]">
        <nav className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1 relative z-[70]">
            <Link to="/" className="-m-1.5 p-1.5">
              <img src="/logo1.png" alt="BVS Logo" className="h-24 w-auto drop-shadow-xl" />
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <Link to="/" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Home</Link>
            <Link to="/vegetables" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Vegetables</Link>
            <Link to="/fruits" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Fruits</Link>
            <Link to="/features" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">Features</Link>
            <Link to="/about" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">About Us</Link>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link to="/login" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="hero-marketyard">
        <div className="hero-content px-6 py-32 sm:py-40 lg:px-8 flex items-center min-h-screen mx-auto max-w-4xl text-center">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6">
              Market Yard Pune
            </h1>
            <p className="mt-6 text-xl leading-8 text-green-50 max-w-2xl mx-auto">
              The Heart of Pune's Fresh Produce Distribution
            </p>
            <p className="mt-4 text-lg text-green-100 max-w-2xl mx-auto">
              One of India's largest wholesale vegetable and fruit markets serving hotels, restaurants, and caterers
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="tel:9881325644"
                className="rounded-md bg-green-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
              >
                Call Us: 9881325644
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Market Yard Details Section */}
      <section className="bg-gradient-to-b from-[#f0f9f0] to-[#e8f5e8] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="lg:pt-4 lg:pr-8">
              <div className="lg:max-w-lg">
                <h2 className="text-base/7 font-semibold text-[#227d22]">Fresh Supply Hub</h2>
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
                    <dd className="inline">Open from 6:00 AM to 10:00 PM daily. Peak hours are early morning (6-12 PM) when freshest produce arrives from farms across Maharashtra.</dd>
                  </div>
                  <div className="relative pl-9">
                    <dt className="inline font-semibold text-[#164216]">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="absolute top-1 left-1 size-5 text-[#227d22]" aria-hidden="true">
                        <path d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" fillRule="evenodd" />
                      </svg>
                      Quality Assured
                    </dt>
                    <dd className="inline">Every product is carefully selected and inspected. We maintain strict quality standards for all vegetables, fruits, and seasonal specialties.</dd>
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
            <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&h=900&fit=crop" alt="Market Yard Fresh Vegetables" className="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-[#bce4bc] sm:w-228 md:-ml-4 lg:-ml-0" />
          </div>
        </div>
      </section>

      {/* Market Features Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-green-600">
              Complete fresh produce solutions for restaurants, hotels, and caterers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {marketFeatures.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-green-800 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gradient-to-br from-green-500 to-emerald-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">
              Why Choose Market Yard?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whyChooseUs.map((reason, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/30">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-white text-lg">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-green-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl mb-6">
              Get In Touch
            </h2>
            <p className="text-xl text-green-700 mb-8">
              Ready to partner with Pune's leading fresh produce supplier?
            </p>
            <div className="space-y-4">
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-lg font-semibold text-green-800">📍 Location</p>
                  <p className="text-gray-700">Gultekdi, Market Yard, Pune 411037</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-800">🕐 Hours</p>
                  <p className="text-gray-700">Daily 6:00 AM - 10:00 PM</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-800">📞 Phone</p>
                  <p className="text-gray-700"><a href="tel:9881325644" className="text-green-600 hover:text-green-800 font-bold">9881325644</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
            <Link to="/" className="text-sm/6 text-white/90 hover:text-white transition-colors">Home</Link>
            <Link to="/vegetables" className="text-sm/6 text-white/90 hover:text-white transition-colors">Vegetables</Link>
            <Link to="/fruits" className="text-sm/6 text-white/90 hover:text-white transition-colors">Fruits</Link>
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
  );
};

export default MarketYard;
