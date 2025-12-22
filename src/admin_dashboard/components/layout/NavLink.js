// src/admin_dashboard/components/layout/NavLink.js
import { Link } from 'react-router-dom';

export default function NavLink({ href, icon: Icon, label, active, collapsed }) {
  const activeClasses = active
    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 shadow-sm'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

  return (
    <Link
      to={href}
      className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors duration-200 ${activeClasses}`}
      title={collapsed ? label : ''}
    >
      <Icon className="w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}