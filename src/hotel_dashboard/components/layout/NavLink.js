// src/hotel_dashboard/components/layout/NavLink.js
import { Link } from 'react-router-dom';

export default function NavLink({ href, icon: Icon, label, active, collapsed }) {
  const activeClasses = active
    ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
    : 'text-gray-700 hover:bg-gray-100';

  return (
    <Link
      to={href}
      className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors ${activeClasses}`}
      title={collapsed ? label : ''}
    >
      <Icon className="w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}