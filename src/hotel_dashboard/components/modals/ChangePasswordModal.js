import { useState } from 'react';
import Modal from '../ui/Modal';

export default function ChangePasswordModal({ open, setOpen, showToast }) {
  const [form, setForm] = useState({ cur: '', new: '', confirm: '' });
  const canSubmit = form.cur && form.new && form.new === form.confirm;

  const footer = (
    <>
      <button
        onClick={() => setOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus-trap"
      >
        Cancel
      </button>
      <button
        className={`px-4 py-2 rounded-lg focus-trap ${canSubmit ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        disabled={!canSubmit}
      >
        Change Password
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Change Password" footer={footer}>
      <div className="space-y-4">
        <div>
          <label htmlFor="cur-pwd" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input
            type="password"
            id="cur-pwd"
            value={form.cur}
            onChange={(e) => setForm({ ...form, cur: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-trap"
          />
        </div>
        <div>
          <label htmlFor="new-pwd" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type="password"
            id="new-pwd"
            value={form.new}
            onChange={(e) => setForm({ ...form, new: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-trap"
          />
        </div>
        <div>
          <label htmlFor="confirm-pwd" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <input
            type="password"
            id="confirm-pwd"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-trap"
          />
        </div>
      </div>
    </Modal>
  );
}