// src/hotel_dashboard/components/layout/Sidebar.js
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
} from '@heroicons/react/24/outline';

const navItems = [
  { href: '/hotel/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { href: '/hotel/orders', icon: DocumentTextIcon, label: 'Orders' },
  { href: '/hotel/bills', icon: ChartBarIcon, label: 'Bills' },
  { href: '/hotel/products', icon: TagIcon, label: 'Products' },
  { href: '/hotel/cart', icon: ShoppingCartIcon, label: 'Cart' },
  { href: '/hotel/profile', icon: ProfileIcon, label: 'Profile' },
  { href: '/hotel/settings', icon: Cog6ToothIcon, label: 'Settings' },
  { href: '/hotel/support', icon: LifebuoyIcon, label: 'Support' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* ---------- LOGO ---------- */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex-1 flex justify-center">
          {/* NEW LOGO - Centered and Bigger */}
          <img
            src="/logo1.png"             
            alt="BVS Logo"
            className="h-16 w-19 object-contain"
          />
        </div>

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
            label={item.label}
            active={location.pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}