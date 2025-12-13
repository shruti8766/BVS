// final_web/src/admin_dashboard/components/ui/StatusBadge.jsx
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  dispatched: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status, onClick }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}