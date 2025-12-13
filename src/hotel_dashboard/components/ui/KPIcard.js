import Skeleton from './Skeleton';

export default function KPIcard({ title, value, unit, icon, loading }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-16 rounded" />
        ) : (
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
        )}
        <div className="flex items-center mt-1">
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}