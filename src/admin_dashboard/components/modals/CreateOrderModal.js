// // final_web/src/admin_dashboard/components/modals/CreateOrderModal.jsx
// import { useState } from 'react';

// export default function CreateOrderModal({ open, onClose }) {
//   const [valid, setValid] = useState(false);

//   if (!open) return null;

//   const handleInput = (e) => {
//     const form = e.currentTarget.form;
//     setValid(form.checkValidity());
//   };

//   return (
//     <div className="fixed inset-0 overflow-y-auto z-50">
//       <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
//         <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

//         <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>

//           <form className="space-y-4" onInput={handleInput}>
//             {/* All <select>/<input> fields exactly as in the original HTML */}
//             {/* … */}
//           </form>

//           <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
//             <button
//               disabled={!valid}
//               className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
//             >
//               Save Order
//             </button>
//             <button
//               onClick={onClose}
//               className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// final_web/src/admin_dashboard/components/modals/CreateOrderModal.jsx
import { useState, useEffect } from 'react';
import { ordersApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function CreateOrderModal({ open, onClose, onSuccess }) {
  const { token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [valid, setValid] = useState(false);

  // Load hotels & products
  useEffect(() => {
    if (open && token) {
      ordersApi.get('/api/admin/users', token).then(r => setHotels(r.data));
      ordersApi.get('/api/products', token).then(r => setProducts(r.data));
    }
  }, [open, token]);

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = i => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const newItems = [...items];
    newItems[i][field] = field === 'quantity' ? parseInt(val) || 0 : val;
    setItems(newItems);
  };

  const checkValidity = () => {
    const hasHotel = selectedHotel;
    const hasDate = deliveryDate;
    const hasItems = items.length > 0 && items.every(it => it.product_id && it.quantity > 0);
    setValid(hasHotel && hasDate && hasItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ordersApi.post(
        '/api/hotel/orders',
        {
          hotel_id: selectedHotel,
          delivery_date: deliveryDate,
          special_instructions: instructions,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        },
        token
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Order (Admin)</h3>
          <form onSubmit={handleSubmit} onInput={checkValidity} className="space-y-5">
            {/* Hotel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
              <select
                required
                value={selectedHotel}
                onChange={e => setSelectedHotel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Hotel</option>
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.hotel_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions (optional)</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Order Items</label>
                <button type="button" onClick={addItem} className="text-primary-600 text-sm hover:underline">
                  + Add Item
                </button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <select
                    required
                    value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} – ₹{p.price_per_unit}/{p.unit_type}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-500">Add at least one item</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}