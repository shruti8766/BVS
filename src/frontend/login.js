import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';  
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const Login = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const mobileMenuBtnRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const chatbotRef = useRef(null);
   const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  // ──────────────────────────────────────────────────────
  // 2. Auth state (new – mirrors the first component)
  // ──────────────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────
  // 3. Real login handler (FIXED: payload.user.role)
  // ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Decode JWT to get role (FIX: backend has payload.user.role)
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      const role = payload.user.role; // CORRECTED!

      // Clear any old tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('hotelToken');

      if (role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else if (role === 'hotel') {
        localStorage.setItem('hotelToken', data.token);
        navigate('/hotel/dashboard');
      } else {
        throw new Error('Unknown user role');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/* ── Global Styles (unchanged) ── */}
      <style>{`
        body {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            min-height: 100vh;
        }

        .min-h-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .flex-grow {
            flex-grow: 1;
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
          background: linear-gradient(90deg, transparent 0%, #10b981 10%, #10b981 90%, transparent 100%);
          margin: 0 auto;
          width: 95%;
          position: absolute;
          top: 120px;
          left: 2.5%;
          right: 2.5%;
          z-index: 45;
          opacity: 0.8;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
        }
          
      .footer-fix {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid #dcfce7;
        padding: 1.5rem 0;
        text-align: center;
        }

      .text-center.py-6 {
        margin-top: auto;
      }

      /* Decorative line separator */
      .decorative-line {
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, #22c55e 10%, #22c55e 90%, transparent 100%);
        margin: 0 auto;
        width: 95%;
        position: absolute;
        top: 120px;
        left: 2.5%;
        right: 2.5%;
        z-index: 45;
        opacity: 0.3;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.2);
      }
      `}</style>

      {/* ── Header / Nav (unchanged) ── */}
      <header className="absolute inset-x-0 top-0 z-50">
          <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
              <div className="flex lg:flex-1">
                  <a href="index.html" className="-m-1.5 p-1.5">
                      <span className="sr-only">Bhairavnath Vegetables Supplier (BVS)</span>
                      <img src="/logo1.png" alt="Fresh Foods Logo" className="h-24 w-auto" />
                  </a>
              </div>
              <div className="flex lg:hidden">
                  <button type="button" ref={mobileMenuBtnRef} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
                      <span className="sr-only">Open main menu</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                          <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                  </button>
              </div>
              <div className="hidden lg:flex lg:gap-x-12">
                <Link to="/" className="text-sm font-semibold text-gray-700 hover:text-green-600">Home</Link>  {/* Import Link & use to="/" */}
                <Link to="/vegetables" className="text-sm font-semibold text-gray-700 hover:text-green-600">Vegetables</Link>
                <Link to="/fruits" className="text-sm font-semibold text-gray-700 hover:text-green-600">Fruits</Link>
                <Link to="/more" className="text-sm font-semibold text-gray-700 hover:text-green-600">More</Link>
                <Link to="/features" className="text-sm font-semibold text-gray-700 hover:text-green-600">Features</Link>
                <Link to="/about" className="text-sm font-semibold text-gray-700 hover:text-green-600">About Us</Link>
              </div>
              <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                  <a href="login.html" className="text-sm font-semibold text-green-600"> <span aria-hidden="true"></span></a>
              </div>
          </nav>
          
          {/* Mobile menu */}
          <div ref={mobileMenuRef} className="hidden lg:hidden bg-white shadow-lg">
              <div className="px-6 py-4 space-y-2">
                <Link to="/" className="block py-2 text-base font-semibold text-gray-700 hover:text-green-600">Home</Link>
                <Link to="/vegetables" className="block py-2 text-base font-semibold text-gray-700 hover:text-green-600">Vegetables</Link>
                <Link to="/fruits" className="block py-2 text-base font-semibold text-gray-700 hover:text-green-600">Fruits</Link>
                <Link to="/more" className="block py-2 text-base font-semibold text-gray-700 hover:text-green-600">More</Link>
                <Link to="/about" className="block py-2 text-base font-semibold text-gray-700 hover:text-green-600">About Us</Link>
              </div>
          </div>
      </header>

      {/* Decorative line separator */}
      <div className="decorative-line" />

      {/* ── MAIN LOGIN SECTION ── */}
      <div className="flex flex-col min-h-screen">
        <div className="pt-32" />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              {/* <p className="text-3xl font-bold text-green-800 mb-2">
                Bhairavnath Vegetable Suppliers
              </p> */}
              <p className="text-green-700 text-lg">BVS Partner Login – your supply, simplified.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Welcome Back
              </h2>

              {/* ── REAL FORM (React controlled) ── */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username / Email */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                  <input type="checkbox" id="remember" className="w-4 h-4 text-green-600 rounded" />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  {loading ? 'Signing in…' : 'Login'}
                </button>
              </form>

              {/* ── Registration hint (kept, no credentials) ── */}
              <div className="mt-6 mb-6 border-t border-gray-200" />
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-green-800 font-medium mb-1">New Partner?</p>
                    <p className="text-sm text-green-700">
                      Call <a href="tel:9881325644" className="font-bold text-green-900 hover:text-green-700 underline mx-1">9881325644</a> for registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="w-full py-6 bg-white border-t border-green-100 mt-auto">
          <div className="text-center text-sm text-green-700">
            <p>For Hotels • Canteens • Caterers across Pune</p>
          </div>
        </div>
      </div>

      {/* Chatbot Toggle Button */}
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

export default Login;