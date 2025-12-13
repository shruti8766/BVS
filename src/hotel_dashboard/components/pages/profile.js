// src/hotel_dashboard/components/pages/profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function HotelProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    hotel_name: '',
    email: '',
    phone: '',
    address: '',
    username: '', // Read-only, from login
    role: 'hotel', // Static for display
    last_login: '', // From dashboard if available
  });
  const [editing, setEditing] = useState(false);

  const BASE_URL = 'http://localhost:5000';

  // Custom confirm function
  const showConfirm = (message) => {
    // eslint-disable-next-line no-alert
    return window.confirm(message);
  };

  // Fetch profile data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');
        
        // Fetch from dashboard API
        const res = await fetch(`${BASE_URL}/api/hotel/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setProfile({
          hotel_name: data.hotel_info?.name || user?.hotel_name || '',
          email: data.hotel_info?.email || user?.email || '',
          phone: data.hotel_info?.phone || user?.phone || '',
          address: data.hotel_info?.address || user?.address || '',
          username: user?.username || '',
          role: 'hotel',
          last_login: data.hotel_info?.last_login || user?.last_login || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, logout, navigate]);

  // Update profile via PUT (implement in backend if needed)
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
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      throw new Error(errData.error || `HTTP ${res.status}: Failed to update profile`);
    }

    const data = await res.json();
    setProfile({ ...profile, ...updatedData });
    setSuccess(data.message || 'Profile updated successfully!');
    setEditing(false);
  } catch (err) {
    setError(err.message);
  }
};
  // Save changes
  const saveChanges = () => {
    // Basic validation
    if (!profile.hotel_name.trim() || !profile.email.trim() || !profile.phone.trim() || !profile.address.trim()) {
      setError('All fields are required');
      return;
    }
    updateProfile({
      hotel_name: profile.hotel_name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditing(false);
    // Optionally refetch to revert, but for now just toggle
  };

  if (loading) {
      return (
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
            <div className="text-center">
              <img
                src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
                alt="Loading"
                className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
              />
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your profile...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center">
              <span className="mr-3">👤</span> My Profile
            </h1>
            <p className="text-green-700">
              Update your hotel information, {profile.hotel_name || 'Hotel User'}.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Profile Summary Card (Read-only view) */}
          {!editing ? (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Profile Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Username:</span>
                  <span className="text-sm text-gray-600">{profile.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Hotel Name:</span>
                  <span className="text-sm text-gray-600">{profile.hotel_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Email:</span>
                  <span className="text-sm text-gray-600">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Phone:</span>
                  <span className="text-sm text-gray-600">{profile.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Address:</span>
                  <span className="text-sm text-gray-600">{profile.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">Role:</span>
                  <span className="text-sm text-gray-600 bg-green-100 px-2 py-1 rounded-full">{profile.role}</span>
                </div>
                {profile.last_login && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-green-700">Last Login:</span>
                    <span className="text-sm text-gray-600">{new Date(profile.last_login).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            // Edit Form
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Edit Profile</h2>
              <div className="space-y-4">
                {/* Username - Read-only */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Username</span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">{profile.username}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    value={profile.hotel_name}
                    onChange={(e) => setProfile({ ...profile, hotel_name: e.target.value })}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Address</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 resize-none text-sm"
                    required
                  />
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveChanges}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/hotel/settings')} // Link to settings for password
                className="w-full flex items-center justify-center py-2 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                🔒 Change Password
              </button>
              <button
                onClick={() => showConfirm('Logout?') && logout()}
                className="w-full flex items-center justify-center py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
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