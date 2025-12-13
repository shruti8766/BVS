// Create this file: src/hotel_dashboard/components/SlideOver.jsx
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SlideOver({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0">
        <div className="flex h-full flex-col overflow-y-scroll bg-white pb-12 shadow-xl">
          <div className="flex items-start justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Cart</h2>
            <button
              type="button"
              className="ml-3 flex h-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close panel</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {/* Cart items will go here */}
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}