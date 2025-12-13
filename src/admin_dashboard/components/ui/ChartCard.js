// final_web/src/admin_dashboard/components/ui/ChartCard.jsx
export default function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg relative">
        {children}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Loading chart data...
        </div>
      </div>
    </div>
  );
}