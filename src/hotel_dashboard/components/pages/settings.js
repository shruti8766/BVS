// src/hotel_dashboard/components/pages/settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

// ──────────────────────────────────────────────────────
// 1. Reusable UI Components
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl dark:hover:shadow-green-800/30 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const QuickAction = ({ onClick, children, disabled = false, className = '', type = 'button' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type={type}
    className={`px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
  >
    {children}
  </button>
);

export default function HotelSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    hotel_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  // Define initial profile for reset
  const initialProfile = {
    hotel_name: '',
    email: '',
    phone: '',
    address: '',
  };

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  const safe = (v, fb = '') => (v !== undefined && v !== null ? v : fb);

  // Fetch profile and bills data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');
        
        // Fetch profile from correct endpoint
        const profileRes = await fetch(`${BASE_URL}/api/hotel/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileRes.json();
        setProfile({
          hotel_name: profileData.hotel_name || user?.hotel_name || '',
          email: profileData.email || user?.email || '',
          phone: profileData.phone || user?.phone || '',
          address: profileData.address || user?.address || '',
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, logout, navigate]);

  // Update profile (PUT to /api/hotel/profile - implement in backend if needed)
  const updateProfile = async (updatedData) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to update profile');
      }

      const data = await res.json();
      setProfile({ ...profile, ...updatedData });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/auth/password/change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully! Please log in again.');
      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="text-center">
            <img
              src="/broc.jpg"
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg transition-colors duration-200">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 w-full transition-colors duration-200">
        {/* ---------- Header ---------- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-1">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your profile and security</p>
        </div>

        {/* ---------- Alerts ---------- */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-200">
            <p className="text-red-700 dark:text-red-300 transition-colors duration-200">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-200">
            <p className="text-green-700 dark:text-green-300 transition-colors duration-200">{success}</p>
          </div>
        )}

        {/* ---------- Tabs with Divider ---------- */}
        <Card className="mb-10">
          <div className="border-b-2 border-green-100 dark:border-green-900">
            <nav className="flex items-center p-6">
              {['profile', 'password'].map((tab, index) => (
                <div key={tab} className="flex items-center">
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                      activeTab === tab
                        ? 'border-green-500 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-green-200 dark:hover:border-green-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                  {index < 1 && (
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-4" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* ---------- Profile Tab ---------- */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Profile Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateProfile({ hotel_name: profile.hotel_name, email: profile.email, phone: profile.phone, address: profile.address }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hotel Name</label>
                  <input value={safe(profile.hotel_name)} onChange={e => setProfile({ ...profile, hotel_name: e.target.value })} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={safe(profile.email)}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={safe(profile.phone)}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <textarea
                    value={safe(profile.address)}
                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all resize-none"
                  />
                </div>
                <QuickAction type="submit" className="!w-full !text-sm">
                  Update Profile
                </QuickAction>
              </form>
            </div>
          )}

          {/* ---------- Password Tab ---------- */}
          {activeTab === 'password' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter your current password and new password.</p>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  minLength={6}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordForm.confirm_new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  required
                />
                <QuickAction type="submit" className="!w-full !text-sm">
                  Update Password
                </QuickAction>
              </form>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}