// src/admin_dashboard/components/layout/NavLink.js
import { Link } from 'react-router-dom';

export default function NavLink({ href, icon: Icon, label, active, collapsed }) {
  const activeClasses = active
    ? 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800 text-primary-900 dark:text-primary-100 border-l-4 border-primary-600 dark:border-primary-400 dark:shadow-md font-bold'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent';

  return (
    <Link
      to={href}
      className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-all duration-300 ease-out ${activeClasses}`}
      style={{ willChange: 'auto' }}
      title={collapsed ? label : ''}
    >
      <Icon className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
      {!collapsed && <span className="transition-opacity duration-300">{label}</span>}
    </Link>
  );
}