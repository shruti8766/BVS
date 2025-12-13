// // final_web/src/admin_dashboard/components/ui/OrdersTable.jsx
// import EmptyState from './EmptyState';
// export default function OrdersTable({ rows = [] }) {
//   if (rows.length === 0) {
//     return <EmptyState icon="orders" title="No orders" description="Get started by creating a new order." />;
//   }

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         {/* thead … */}
//         <tbody className="bg-white divide-y divide-gray-200">
//           {rows.map((r, i) => (
//             <tr key={i}>{/* map columns */}</tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
// final_web/src/admin_dashboard/components/ui/OrdersTable.jsx
import EmptyState from './EmptyState';

export default function OrdersTable({ rows = [] }) {
  if (rows.length === 0) {
    return <EmptyState icon="orders" title="No orders" description="Get started by creating a new order." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hotel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{row.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.hotel}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.items}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.total}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}