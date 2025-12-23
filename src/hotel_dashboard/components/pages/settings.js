// src/hotel_dashboard/components/pages/settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function HotelSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'security'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    hotel_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editing, setEditing] = useState(false);
  const [passwordChange, setPasswordChange] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [bills, setBills] = useState([]); // For real billing summary

  // Define initial profile for reset
  const initialProfile = {
    hotel_name: '',
    email: '',
    phone: '',
    address: '',
  };

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Custom confirm function to avoid restricted globals
  const showConfirm = (message) => {
    // eslint-disable-next-line no-alert
    return window.confirm(message);
  };

  // Reset handler
  const handleReset = () => {
    if (showConfirm('Are you sure you want to reset profile to defaults?')) {
      setProfile({ ...initialProfile });
      setSuccess('Profile reset to defaults.');
    }
  };

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

        // Fetch real bills for summary
        const billsRes = await fetch(`${BASE_URL}/api/hotel/bills`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!billsRes.ok) {
          if (billsRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch bills');
        }

        const billsData = await billsRes.json();
        // Extract bills array from response {bills: [...], success: true}
        const billsArray = billsData.bills || (Array.isArray(billsData) ? billsData : []);
        setBills(billsArray);
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
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordChange.new_password !== passwordChange.confirm_new_password) {
      setError('New passwords do not match');
      return;
    }
    if (passwordChange.new_password.length < 6) {
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
          current_password: passwordChange.current_password,
          new_password: passwordChange.new_password,
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
      setPasswordChange({ current_password: '', new_password: '', confirm_new_password: '' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Forgot password handler (redirect to login with forgot flow, or implement email send)
  const handleForgotPassword = () => {
    // For simplicity, redirect to login page (assume login has forgot link)
    logout();
    navigate('/login?tab=forgot'); // Assume login handles ?tab=forgot
  };

  // Save profile changes
  const saveChanges = () => {
    updateProfile({
      hotel_name: profile.hotel_name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });
  };

  // Compute real billing stats
  const totalSpent = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
  const pendingBills = bills.filter(bill => !bill.paid).length;
  const totalInvoices = bills.length;

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
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg transition-colors duration-200">Broccoli is crunching your settings...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-8 w-full transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 mb-2 flex items-center transition-colors duration-200">
              <span className="mr-3">⚙️</span> Hotel Settings
            </h1>
            <p className="text-green-700 dark:text-green-300 transition-colors duration-200">
              Manage your profile and security, {user?.hotel_name || 'Hotel User'}.
            </p>
          </div>

          {/* Alerts */}
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 p-6 sticky top-8 transition-colors duration-200">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: '👤' },
                    { id: 'security', label: 'Security', icon: '🔒' },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-left text-sm ${
                        activeSection === section.id
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3 text-lg">{section.icon}</span>
                      {section.label}
                    </button>
                  ))}
                </nav>

              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {activeSection === 'profile' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 p-6 animate-fade-in transition-colors duration-200">
                  <h2 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-4 flex items-center transition-colors duration-200">
                    <span className="mr-2">👤</span> Hotel Profile
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Hotel Name</label>
                      <input
                        type="text"
                        value={profile.hotel_name}
                        onChange={(e) => setProfile({ ...profile, hotel_name: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors text-gray-900 dark:text-white ${
                          editing ? 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Email (Optional)</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          disabled={!editing}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors text-gray-900 dark:text-white ${
                            editing ? 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!editing}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors text-gray-900 dark:text-white ${
                            editing ? 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Address</label>
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        disabled={!editing}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors resize-none text-gray-900 dark:text-white ${
                          editing ? 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between">
                      <button
                        onClick={() => setEditing(!editing)}
                        className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                      >
                        {editing ? 'Cancel' : 'Edit Profile'}
                      </button>
                      {editing && (
                        <button
                          onClick={saveChanges}
                          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                          Save Changes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 p-6 animate-fade-in transition-colors duration-200">
                  <h2 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-4 flex items-center transition-colors duration-200">
                    <span className="mr-2">🔒</span> Security & Account
                  </h2>
                  <div className="space-y-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Current Password</label>
                        <input
                          type="password"
                          value={passwordChange.current_password}
                          onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">New Password</label>
                        <input
                          type="password"
                          value={passwordChange.new_password}
                          onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
                          required
                          minLength={6}
                          className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordChange.confirm_new_password}
                          onChange={(e) => setPasswordChange({ ...passwordChange, confirm_new_password: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-green-600 dark:bg-green-700 text-white py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold text-sm"
                      >
                        Update Password
                      </button>
                    </form>
                    <button
                      onClick={handleForgotPassword}
                      className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 transition-colors duration-200"
                    >
                      Forgot Password? Reset via Email
                    </button>
                    {/* Session Info */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                      <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 transition-colors duration-200">Active Sessions</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">Current device: Secure • Expires in 8 hours</p>
                      <button
                        onClick={() => { alert('Logging out all sessions...'); logout(); }}
                        className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline transition-colors duration-200"
                      >
                        Revoke All Sessions
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Tips */}
          <div className="mt-12 text-center text-sm text-green-600 dark:text-green-400 transition-colors duration-200">
            💡 Changes sync instantly. Contact support for help.
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
}