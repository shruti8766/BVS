// final_web/src/admin_dashboard/components/modals/UpdateStatusModal.jsx
const statuses = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered'];

export default function UpdateStatusModal({ open, onClose, order, onUpdate }) {
  if (!open || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newStatus = e.target.status.value;
    onUpdate(order.id, newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Update Status – Order #{order.id}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                name="status"
                defaultValue={order.status}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}