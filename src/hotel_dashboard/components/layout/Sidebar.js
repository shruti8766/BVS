// src/hotel_dashboard/components/layout/Sidebar.js
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavLink from '../layout/NavLink';

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

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-4 z-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-green-600 text-white p-1.5 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ---------- LOGO ---------- */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex-1 flex justify-center">
            {/* NEW LOGO - Centered and Bigger */}
            <img
              src="/logo1.png"             
              alt="BVS Logo"
              className="h-16 w-19 object-contain"
            />
          </div>
        )}

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      {/* ---------- END LOGO ---------- */}

      <nav className="mt-8 px-4 space-y-2">
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
    </aside>
  );
}