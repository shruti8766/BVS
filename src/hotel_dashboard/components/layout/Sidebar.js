// src/hotel_dashboard/components/layout/Sidebar.js
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavLink from '../layout/NavLink';
import { useAuth } from '../hooks/useAuth';

import {
  HomeIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  TagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  XMarkIcon,
  UserCircleIcon as ProfileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const CogIcon = Cog6ToothIcon;

const navItems = [
  { href: '/hotel/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { href: '/hotel/orders', icon: DocumentTextIcon, label: 'Orders' },
  { href: '/hotel/history', icon: ClockIcon, label: 'History' },
  { href: '/hotel/bills', icon: ChartBarIcon, label: 'Bills' },
  { href: '/hotel/products', icon: TagIcon, label: 'Products' },
  { href: '/hotel/cart', icon: ShoppingCartIcon, label: 'Cart' },
  { href: '/hotel/support', icon: LifebuoyIcon, label: 'Support' },
  { href: '/hotel/settings', icon: CogIcon, label: 'Settings' },
];

export default function Sidebar({ open, onClose, collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col p-2 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-28' : 'w-64'}`}
      style={{
        willChange: 'width, transform'
      }}
    >
      {/* Toggle Button */}
      <div className="absolute -right-1 top-4 z-50 pointer-events-auto">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-green-700 dark:bg-green-800 text-white p-1.5 rounded-full shadow-lg hover:bg-green-800 dark:hover:bg-green-900 transition-all duration-300"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Background with rounded edges */}
      <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-2xl pointer-events-none" />
      
      {/* Content wrapper with rounded background */}
      <div className="relative flex flex-col h-full overflow-hidden">

      {/* ---------- LOGO ---------- */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 transition-colors duration-200">
        <div className="flex-1 flex justify-center">
          {/* Logo - stays visible when collapsed, scales appropriately */}
          <img
            src="/logo1.png"             
            alt="BVS Logo"
            className={`object-contain transition-all duration-300 ${collapsed ? 'h-10 w-10' : 'h-16 w-19'}`}
          />
        </div>

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5 dark:text-gray-200" />
        </button>
      </div>
      {/* ---------- END LOGO ---------- */}

      <nav className="mt-8 px-4 space-y-2 flex-1 pb-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={!collapsed ? item.label : ''}
            active={location.pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300`}
          title={collapsed ? 'Logout' : ''}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
      </div>
    </aside>
  );
}