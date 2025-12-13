// final_web/src/admin_dashboard/components/ui/OrdersTable.jsx
import EmptyState from './EmptyState';
export default function InventoryTable({ rows = [] }) {
  if (rows.length === 0) {
    return <EmptyState icon="orders" title="No orders" description="Get started by creating a new order." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* thead … */}
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r, i) => (
            <tr key={i}>{/* map columns */}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}