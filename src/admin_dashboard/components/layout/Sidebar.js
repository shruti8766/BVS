// src/admin_dashboard/components/layout/Sidebar.js
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavLink from './NavLink';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
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
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
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
  { href: '/admin/unpaid-bills', icon: ExclamationTriangleIcon, label: 'Unpaid Bills' },
  { href: '/admin/users',     icon: UsersIcon, label: 'Users' },
  { href: '/admin/support',   icon: LifebuoyIcon, label: 'Support' },
];

export default function Sidebar({ open, onClose, onCollapsedChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onCollapsedChange) {
      onCollapsedChange(newState);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col p-2 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-28' : 'w-64'}`}
      style={{
        boxShadow: isDarkMode 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          : '0 4px 6px -1px rgba(255, 255, 255, 0.08)',
        willChange: 'width, transform',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Toggle Button */}
      <div className="absolute -right-1 top-4 z-50 pointer-events-auto">
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