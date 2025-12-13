// final_web/src/admin_dashboard/components/modals/CreateOrderModal.jsx
import { useState } from 'react';

export default function AddProductModal({ open, onClose }) {
  const [valid, setValid] = useState(false);

  if (!open) return null;

  const handleInput = (e) => {
    const form = e.currentTarget.form;
    setValid(form.checkValidity());
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>

          <form className="space-y-4" onInput={handleInput}>
            {/* All <select>/<input> fields exactly as in the original HTML */}
            {/* … */}
          </form>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              disabled={!valid}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Order
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}