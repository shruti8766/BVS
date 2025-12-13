// // final_web/src/admin_dashboard/components/ui/EmptyState.jsx
// export default function EmptyState({ icon, title, description }) {
//   return (
//     <tr>
//       <td colSpan="7" className="px-6 py-12 text-center">
//         <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           {/* placeholder path */}
//         </svg>
//         <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
//         <p className="mt-1 text-sm text-gray-500">{description}</p>
//       </td>
//     </tr>
//   );
// }
// src/admin_dashboard/components/ui/EmptyState.jsx
export default function EmptyState({ title, description }) {
  return (
    <tr>
      <td colSpan="7" className="px-6 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {/* any generic icon – you can copy the one from the original HTML */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </td>
    </tr>
  );
}