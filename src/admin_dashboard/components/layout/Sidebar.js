// src/admin_dashboard/components/layout/Sidebar.js
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavLink from './NavLink';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  CubeIcon,
  TagIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  XMarkIcon,
  UserCircleIcon as ProfileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { href: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { href: '/admin/pending-orders', icon: ClockIcon, label: "Today's Orders" },
  { href: '/admin/todays-vegetables', icon: SquaresPlusIcon, label: "Today's Vegetables" },
  { href: '/admin/todays-filling', icon: CubeIcon, label: "Today's Filling" },
  { href: '/admin/orders',    icon: ShoppingCartIcon, label: 'Orders' },
  { href: '/admin/hotels',    icon: BuildingOfficeIcon, label: 'Hotels' },
  { href: '/admin/inventory', icon: CubeIcon, label: 'Inventory' },
  { href: '/admin/products',  icon: TagIcon, label: 'Products' },
  { href: '/admin/suppliers', icon: TruckIcon, label: 'Suppliers' },
  { href: '/admin/billing',   icon: CurrencyRupeeIcon, label: 'Billing' },
  { href: '/admin/users',     icon: UsersIcon, label: 'Users' },
  { href: '/admin/settings',  icon: Cog6ToothIcon, label: 'Settings' },
  { href: '/admin/support',   icon: LifebuoyIcon, label: 'Support' },
  { href: '/admin/profile', icon: ProfileIcon, label: 'Profile' },
];

export default function Sidebar({ open, onClose, onCollapsedChange }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode } = useTheme();

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onCollapsedChange) {
      onCollapsedChange(newState);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-4 z-50">
        <button
          onClick={handleCollapse}
          className="bg-green-700 dark:bg-green-800 text-white p-1.5 rounded-full shadow-lg hover:bg-green-800 dark:hover:bg-green-900 transition-all duration-300"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      {/* ---------- LOGO ---------- */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 transition-colors duration-200">
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
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5 dark:text-gray-200" />
        </button>
      </div>
      {/* ---------- END LOGO ---------- */}

      <nav className="mt-8 px-4 space-y-2 flex-1 overflow-y-auto pb-4">
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