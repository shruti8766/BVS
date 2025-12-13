// final_web/src/admin_dashboard/components/ui/KPI.jsx
export default function KPI({ title, value, description, change }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {change && (
          <div className="px-2 py-1 bg-gray-100 rounded-full">
            <span className="text-xs text-gray-600">{change}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 skeleton h-8 w-20 mb-2">
        {value ?? '—'}
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}