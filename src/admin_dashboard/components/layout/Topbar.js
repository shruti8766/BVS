// src/admin_dashboard/components/layout/Topbar.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle';
import {         
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function Topbar({ onMenuClick, onCartClick }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();                     // ← GET LOGOUT

  // ---- SEARCH ROUTES -------------------------------------------------
  const searchMap = {
    dashboard: '/admin/dashboard',
    orders:    '/admin/orders',
    hotels:    '/admin/hotels',
    inventory: '/admin/inventory',
    products:  '/admin/products',
    suppliers: '/admin/suppliers',
    billing:   '/admin/billing',
    analytics: '/admin/analytics',
    users:     '/admin/users',
    settings:  '/admin/settings',
    support:   '/admin/support',
    profile:   '/admin/profile',
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

  return (
    <header className="sticky top-0 z-30 px-2 py-2 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
        {/* LEFT */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          <button
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={onMenuClick}
          >
            <Bars3Icon className="w-5 h-5 dark:text-gray-200" />
          </button>

          <div className="relative hidden sm:block flex-1 max-w-xs lg:max-w-md">
            <input
              type="search"
              placeholder="Search… (orders, products…)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* THEME TOGGLE */}
          <ThemeToggle />
          
          {/* USER DROPDOWN */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">A</span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-gray-100">Admin</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-900 dark:text-gray-100" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 transition-colors">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={doLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
              
            )}
          </div>
        </div>
      </div>
    </header>
    
  );
  
}