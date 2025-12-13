import Modal from '../ui/Modal';

export default function NewOrderModal({ open, setOpen, showToast }) {
  const footer = (
    <>
      <button
        onClick={() => setOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus-trap"
      >
        Cancel
      </button>
      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus-trap" disabled>
        Place Order
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Place New Order" footer={footer}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Products</label>
          <div className="text-center py-8 text-gray-500">Loading products…</div>
        </div>
        <div>
          <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Date
          </label>
          <input type="date" id="delivery-date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-trap" required />
        </div>
        <div>
          <label htmlFor="special-instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            id="special-instructions"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-trap"
            placeholder="Any special delivery instructions..."
          />
        </div>
      </div>
    </Modal>
  );
}