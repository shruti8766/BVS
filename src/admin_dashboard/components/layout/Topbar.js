// src/admin_dashboard/components/layout/Topbar.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* LEFT */}
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="relative">
            <input
              type="search"
              placeholder="Search… (orders, products…)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-4">
          
          {/* USER DROPDOWN */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium text-sm">A</span>
              </div>
              <span className="hidden md:block text-sm font-medium">Admin</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={doLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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