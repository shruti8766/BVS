import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const Home = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [years, setYears] = useState(0);
  const [clients, setClients] = useState(0);
  const [products, setProducts] = useState(0);
  const hasAnimated = useRef(false);
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            // Animate years
            let currentYear = 0;
            const yearTimer = setInterval(() => {
              currentYear++;
              setYears(currentYear);
              if (currentYear >= 20) clearInterval(yearTimer);
            }, 50);
            
            // Animate clients
            let currentClient = 0;
            const clientTimer = setInterval(() => {
              currentClient += 25;
              setClients(currentClient);
              if (currentClient >= 500) clearInterval(clientTimer);
            }, 20);
            
            // Animate products
            let currentProduct = 0;
            const productTimer = setInterval(() => {
              currentProduct += 10;
              setProducts(currentProduct);
              if (currentProduct >= 150) clearInterval(productTimer);
            }, 30);
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats-section');
    if (statsElement) {
      observer.observe(statsElement);
    }

    return () => {
      if (statsElement) {
        observer.unobserve(statsElement);
      }
    };
  }, []);

  // Handle contact form submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const firstName = formData.get('first-name') || '';
    const lastName = formData.get('last-name') || '';
    const email = formData.get('email') || '';
    const company = formData.get('company') || '';
    const phone = formData.get('phone') || '';
    
    // Create WhatsApp message
    const message = `*New Contact Form Submission*%0A%0A*Name:* ${firstName} ${lastName}%0A*Email:* ${email}%0A*Company:* ${company}%0A*Phone:* ${phone}`;
    
    // WhatsApp URL with message
    const whatsappUrl = `https://wa.me/919309510246?text=${message}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    e.target.reset();
  };



  return (
    <>
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
          background: rgba(34, 139, 34, 0.7);
          z-index: 0;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
        }
        
        .stats-bg {
          background-image: url('https://hips.hearstapps.com/hmg-prod/images/fresh-green-vegetable-on-shelf-in-grocery-store-for-royalty-free-image-1761596607.pjpeg?crop=0.85218xw:1xh;center,top&resize=1200:*');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }

        .stats-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(34, 139, 34, 0.85);
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
      <div className="hero-bg">
        <header className="absolute inset-x-0 top-0 z-50">
          <nav aria-label="Global" className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
            <div className="flex lg:flex-1">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Fresh Foods</span>
                {/* <img src="logo1.png" alt="Fresh Foods Logo" className="h-16 sm:h-20 md:h-24 w-auto" /> */}
                <img src="/logo1.png" alt="Fresh Foods Logo" className="h-16 sm:h-20 md:h-24 w-auto" />
              </a>
            </div>
            <div className="flex lg:hidden">
              <button type="button" onClick={toggleMobileMenu} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white hover:bg-white/10 transition-colors">
                <span className="sr-only">Open main menu</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" data-slot="icon" aria-hidden="true" className="size-6">
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="hidden lg:flex lg:gap-x-12">
              <Link to="/" className="text-sm/6 font-semibold text-white border-b-2 border-white">Home</Link>
              <Link to="/vegetables" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Vegetables</Link>
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
          <el-dialog>
            <dialog id="mobile-menu" className="backdrop:bg-transparent lg:hidden">
              <div tabIndex="0" className="fixed inset-0 focus:outline-none">
                <el-dialog-panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-green-800 p-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
                  <div className="flex items-center justify-between">
                    <a href="#" className="-m-1.5 p-1.5">
                      <span className="sr-only">Bhairavnath Vegetables Supplier (BVS)</span>
                      <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=green&shade=500" alt="" className="h-8 w-auto" />
                    </a>
                    <button type="button" command="close" commandfor="mobile-menu" className="-m-2.5 rounded-md p-2.5 text-white">
                      <span className="sr-only">Close menu</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" data-slot="icon" aria-hidden="true" className="size-6">
                        <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-6 flow-root">
                    <div className="-my-6 divide-y divide-white/10">
                      <div className="space-y-2 py-6">
                        <a href="/" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/10">Home</a>
                        <a href="vegetables.html" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/10">Vegetables</a>
                        <a href="fruits.html" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/10">Fruits</a>
                        <a href="" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/10">More</a>
                        <a href="#" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/10">About Us</a>
                      </div>
                      <div className="py-6">
                        <a href="login.html" className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white hover:bg-white/10">Log in</a>
                      </div>
                    </div>
                  </div>
                </el-dialog-panel>
              </div>
            </dialog>
          </el-dialog>
        </header>
        
        {/* Decorative line separator */}
        <div className="decorative-line"></div>

        <div className="relative isolate px-4 sm:px-6 pt-14 lg:px-8 hero-content">
            <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}} className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#22c55e] to-[#15803d] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
            </div>
            <div className="mx-auto max-w-2xl py-20 sm:py-32 md:py-48 lg:py-56">
                <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm/6 text-white ring-1 ring-white/20 hover:ring-white/30">
                    New seasonal products available. <a href="/login" className="font-semibold text-green-200"><span aria-hidden="true" className="absolute inset-0"></span>Shop now <span aria-hidden="true">&rarr;</span></a>
                </div>
                </div>
                <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-balance text-white">Farm se Foodservice, Seedha.</h1>
                <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl font-medium text-pretty text-green-100 px-4 sm:px-0">Daily delivery of fresh produce, pulses, and kitchen essentials to Pune's hospitality industry. 21 years of reliable service.</p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
                    <a href="/login" className="w-full sm:w-auto rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-500 hover:shadow-xl transition-all transform hover:-translate-y-0.5">Shop Now</a>
                    <a href="/about" className="w-full sm:w-auto text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Learn more <span aria-hidden="true">→</span></a>
                </div>
                </div>
            </div>
            <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                <div style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}} className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36rem] -translate-x-1/2 bg-gradient-to-tr from-[#22c55e] to-[#15803d] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
            </div>
            </div>
        </div>

        {/* Why Choose Us Section */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4 px-4">Why Choose Bhairavnath?</h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">We're committed to excellence in every aspect of our service</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-y-16">
              {/* 24/7 Support */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 015.304 0l7.753-7.752a6 6 0 00-8.484-8.485l-7.573 7.573a6 6 0 008.485 8.485l.573-.574m0 0a6 6 0 01 8.484 8.484l-7.573 7.573" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">24/7 Support</h3>
                <p className="mt-2 text-sm text-gray-600">Our team is always ready to assist. Call, WhatsApp, or reach out anytime with questions or special requests for your orders.</p>
              </div>

              {/* Daily Fresh Delivery */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m0 0H3m13.5 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m0 0H21m-9-12a9 9 0 100 18 9 9 0 000-18z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Daily Fresh Delivery</h3>
                <p className="mt-2 text-sm text-gray-600">Farm to table in 24 hours. Our early morning dispatches ensure produce reaches your kitchen at peak freshness every single day.</p>
              </div>

              {/* Bulk & Customized Orders */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m0 0C5.405 7.97 9.25 9 12 9c2.75 0 6.595-1.03 8.25-2.625M4.5 14.25a8.366 8.366 0 00-1.5-.53m19.5.53a8.366 8.366 0 00-1.5.53m0 0a9 9 0 11-18 0" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Bulk & Customized Orders</h3>
                <p className="mt-2 text-sm text-gray-600">Hotels, restaurants, and caterers - we offer flexible packaging, bulk pricing, and tailored orders to fit your exact specifications.</p>
              </div>

              {/* Transparent Pricing */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 3.071-.879 4.242 0M3.75 13.5h16.5" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Transparent Pricing</h3>
                <p className="mt-2 text-sm text-gray-600">No hidden charges. Fair, competitive rates with volume discounts for regular orders. Know exactly what you're paying for.</p>
              </div>

              {/* Organic & Pesticide-Free */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Quality Assured</h3>
                <p className="mt-2 text-sm text-gray-600">Hand-selected produce from trusted local farmers. We prioritize quality over quantity to deliver the best to your table.</p>
              </div>

              {/* Reliable Partner Since 2004 */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">20 Years of Trust</h3>
                <p className="mt-2 text-sm text-gray-600">Since 2004, we've been the preferred choice for hundreds of hotels, restaurants, and households across Pune. Proven reliability.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <div id="stats-section" className="stats-bg py-12 sm:py-16 md:py-20">
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">{years}+</div>
                <div className="text-green-100 text-xs sm:text-sm md:text-base">Years of Excellence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">{clients}+</div>
                <div className="text-green-100 text-xs sm:text-sm md:text-base">Satisfied Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">{products}+</div>
                <div className="text-green-100 text-xs sm:text-sm md:text-base">Product Varieties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">6 Days</div>
                <div className="text-green-100 text-xs sm:text-sm md:text-base">Weekly Delivery (Closed on Saturday)</div>
              </div>
            </div>
          </div>
        </div>


        <div className="relative isolate overflow-hidden bg-green-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32 lg:overflow-visible lg:px-0">
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <svg aria-hidden="true" className="absolute top-0 left-[max(50%,25rem)] h-256 w-512 -translate-x-1/2 mask-[radial-gradient(64rem_64rem_at_top,white,transparent)] stroke-green-800">
            <defs>
                <pattern id="e813992c-7d03-4cc4-a2bd-151760b470a0" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
                <path d="M100 200V.5M.5 .5H200" fill="none" />
                </pattern>
            </defs>
            <svg x="50%" y="-1" className="overflow-visible fill-green-800/50">
                <path d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z" strokeWidth="0" />
            </svg>
            <rect width="100%" height="100%" fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)" strokeWidth="0" />
            </svg>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
            <div className="lg:pr-4">
                <div className="lg:max-w-lg">
                <p className="text-base/7 font-semibold text-green-400">About Us</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">Our Story & Mission</h1>
                <p className="mt-6 text-xl/8 text-gray-300">At Bhairavnath Vegetables Supplier, we've been bridging farms and tables since 2004. Committed to freshness and sustainability, we source organic produce directly from local growers to ensure quality you can taste.</p>
                </div>
            </div>
            </div>
            <div className="-mt-12 -ml-12 p-12 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden">
            {/* <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Fresh produce from our farms" className="w-3xl max-w-none rounded-xl bg-green-800 shadow-xl ring-1 ring-white/10 sm:w-228" /> */}
            <img src="https://cdn.firstcry.com/education/2022/11/08143105/Green-Vegetables-Names-in-English-for-Kids.jpg" alt="Fresh produce from our farms" className="w-3xl max-w-none rounded-xl bg-green-800 shadow-xl ring-1 ring-white/10 sm:w-228" />
            </div>
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
            <div className="lg:pr-4">
                <div className="max-w-xl text-base/7 text-gray-400 lg:max-w-lg">
                <p>Our journey began with a simple passion for fresh, wholesome food. Today, we serve the needs of businesses with the finest vegetables, fruits, and pulses. From seed to shelf, every step is guided by ethical farming and community support.</p>
                <ul role="list" className="mt-8 space-y-8 text-gray-400">
                    <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="mt-1 size-5 flex-none text-green-400">
                        <path d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Quick Turnaround. </strong> Short route times and early-morning dispatches help orders reach kitchens when freshness matters most.</span>
                    </li>
                    <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="mt-1 size-5 flex-none text-green-400">
                        <path d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Bulk-friendly. </strong>  Cartons, sacks, and crate options sized for hotels, canteens, and caterers for smoother back-of-house flow.</span>
                    </li>
                    <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="mt-1 size-5 flex-none text-green-400">
                        <path d="M4.632 3.533A2 2 0 0 1 6.577 2h6.846a2 2 0 0 1 1.945 1.533l1.976 8.234A3.489 3.489 0 0 0 16 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234Z" />
                        <path d="M4 13a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4H4Zm11.24 2a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V15Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75h-.01Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Reliable supply. </strong> Stable partners and clear specifications bring the same grade you expect, every time.</span>
                    </li>
                </ul>
                <p className="mt-8">Our website is your gateway to this world of freshness. Browse seasonal selections and  place orders effortlessly — all designed for convenience and transparency.</p>
                {/* <h2 className="mt-16 text-2xl font-bold tracking-tight text-white">Seamless Online Experience</h2>
                <p className="mt-6">Whether you're stocking up for the week or planning a special meal, our user-friendly platform makes it easy. Secure payments, personalized recommendations, and dedicated customer support ensure a worry-free shopping journey.</p> */}
                </div>
            </div>
            </div>
        </div>
        </div>

        


      {/* What We Offer Section */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4 px-4">What We Offer</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">Fresh vegetables, fruits, pulses, and much more. Tailored selections designed to help you nourish and thrive in every aspect of life.</p>
          </div>
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Fresh Vegetables */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Fresh Vegetables</h3>
              <p className="mt-2 text-sm text-gray-600">Gain focus, overcome nutritional gaps, and take clear steps toward a fulfilling and healthy lifestyle.</p>
            </div>

            {/* Fresh Fruits */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.502 12.502 0 001 12c0 5.831 3.775 10.75 9 12a12.168 12.168 0 011.887-.25 12.18 12.18 0 001.812-.25 12.502 12.502 0 001.618-3.956 11.955 11.955 0 01-3.618-3.04A12.002 12.002 0 0012 9.944a12.002 12.002 0 00-8.618 3.04A12.502 12.502 0 003 12c0-5.831 3.775-10.75 9-12a12.168 12.168 0 011.887.25z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Fresh Fruits</h3>
              <p className="mt-2 text-sm text-gray-600">Discover your nutritional strengths, refine your diet, and confidently pursue the vitality you've always wanted.</p>
            </div>

            {/* Grains and More */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5a2 2 0 00-2 2v4.568c0 .88.92 1.44 1.673 1.342l8.361-1.91a2 2 0 001.05-.04l1.902-1.902a2 2 0 00.04-1.05L13.91 4.673A2 2 0 0013.432 3H9.568zM9.568 21H5a2 2 0 01-2-2v-4.568c0-.88.92-1.44 1.673-1.342l8.361 1.91a2 2 0 001.05.04l1.902 1.902a2 2 0 01-.04 1.05l-1.902 1.902a2 2 0 001.05.04l8.361 1.91c.753.102 1.673-.462 1.673-1.342V15a2 2 0 00-2-2h-4.568c-.88 0-1.44.92-1.342 1.673l1.91 8.361c.102.753-.462 1.673-1.342 1.673z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Pulses & Much More</h3>
              <p className="mt-2 text-sm text-gray-600">Develop resilient habits, embrace seasonal variety, and create sustainable choices for long-term wellness.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Form Section */}
        <section className="relative isolate overflow-hidden bg-green-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32 lg:overflow-visible lg:px-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-12 sm:gap-y-16 lg:grid-cols-2 lg:items-start lg:gap-y-10">
            {/* Left Side: Google Maps */}
            <div className="lg:sticky lg:top-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:overflow-hidden">
            <div className="w-full rounded-xl bg-green-800 shadow-xl ring-1 ring-white/10 overflow-hidden">
                <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7567.863180811065!2d73.86520113991165!3d18.486757655633344!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c020f86e3cc3%3A0xa796d6342ce667e5!2sMarket%20Yard%2C%20Gultekadi%2C%20Pune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1761034105604!5m2!1sen!2sin" 
                width="100%" 
                height="400" 
                style={{border:0}} 
                allowFullScreen=""
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl sm:h-[500px] lg:h-[600px]">
                </iframe>
            </div>
            <div className="mt-4 text-center">
                <p className="text-green-200 text-sm">📍 Market Yard, Gultekadi, Pune, Maharashtra</p>
            </div>
            </div>

            {/* Right Side: Content and Form */}
            <div className="lg:col-start-2 lg:row-start-1">
            <div className="lg:pr-4 px-4 sm:px-0">
                <div className="lg:max-w-lg">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Let's bring freshness to your table</h2>
                </div>
            </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-start-2 lg:row-start-2">
            <div className="lg:pr-4 px-4 sm:px-0">
                <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                    <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-white">First name</label>
                    <input type="text" name="first-name" id="first-name" autoComplete="given-name" className="mt-2 block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm placeholder:text-gray-400" />
                    </div>
                    <div>
                    <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-white">Last name</label>
                    <input type="text" name="last-name" id="last-name" autoComplete="family-name" className="mt-2 block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm placeholder:text-gray-400" />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-white">Email</label>
                    <input type="email" name="email" id="email" autoComplete="email" className="mt-2 block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm placeholder:text-gray-400" />
                </div>
                
                <div>
                    <label htmlFor="company" className="block text-sm font-medium leading-6 text-white">Hotel/Restaurant Name</label>
                    <input type="text" name="company" id="company" className="mt-2 block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm placeholder:text-gray-400" />
                </div>
                
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium leading-6 text-white">Phone Number</label>
                    <input type="tel" name="phone" id="phone" autoComplete="tel" className="mt-2 block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm placeholder:text-gray-400" />
                </div> 
                <button type="submit" className="w-full rounded-md bg-green-600 px-3.5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors">Send Message</button>
                </form>
            </div>
            </div>
        </div>
        </section>

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

export default Home;