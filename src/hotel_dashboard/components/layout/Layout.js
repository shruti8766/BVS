// src/hotel_dashboard/components/layout/Layout.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SlideOver from './Slideover';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const openSlideOver = () => setSlideOverOpen(true);
  const closeSlideOver = () => setSlideOverOpen(false);

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to content
      </a>

      {/* Toast container */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2 max-w-sm" />

      <div className="flex h-screen bg-gray-50">
        {/* Mobile backdrop */}
        <div
          className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden ${
            sidebarOpen ? '' : 'hidden'
          }`}
          onClick={closeSidebar}
        />

        <Sidebar open={sidebarOpen} onClose={closeSidebar} collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <Topbar onMenuClick={toggleSidebar} onCartClick={openSlideOver} />
          <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-3 sm:py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
              <p className="text-xs sm:text-sm text-gray-500">
                © 2024 Bhairavnath Vegetables Supplier. All rights reserved.
              </p>
              <span className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-0">Version 1.0.0</span>
            </div>
          </footer>
        </div>
      </div>

      <SlideOver open={slideOverOpen} onClose={closeSlideOver} />
    </>
  );
}