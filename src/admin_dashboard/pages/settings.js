import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { profileApi } from '../utils/api';

// ──────────────────────────────────────────────────────
// 1. Date Formatter (from dashboard)
// ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};

// ──────────────────────────────────────────────────────
// 2. Reusable UI Components (Adapted from dashboard)
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl dark:hover:shadow-green-800/30 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden ${className}`}>
    {children}
  </div>
);

const QuickAction = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
  >
    {children}
  </button>
);

// ──────────────────────────────────────────────────────
// 3. Main Settings Component
// ──────────────────────────────────────────────────────
const Settings = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. Settings state
  // ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_new_orders: false,
    sms_low_stock: false,
    daily_reports: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');  // Tabs: profile, password, website, system, notifications

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');

  console.log('profileApi:', profileApi);

  // ──────────────────────────────────────────────────────
  // 3. Helper utilities
  // ──────────────────────────────────────────────────────
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

  // ──────────────────────────────────────────────────────
  // 4. Login handler (same)
  // ──────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('https://api-aso3bjldka-uc.a.run.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // 5. Data fetching
  // ──────────────────────────────────────────────────────
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, settingsData, notificationData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getSystemSettings(),
        profileApi.getNotificationPreferences(),
      ]);
      setProfile(profileData);
      setSystemSettings(settingsData);
      setNotificationPreferences(notificationData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await profileApi.updateProfile(profileData);
      await fetchSettings();  // Refresh
      setError('Profile updated successfully');
    } catch (e) {
      setError(e.message);
    }
  };

  const changePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setError('New passwords do not match');
      return;
    }
    try {
      await profileApi.changePassword({
        current_password: passwordForm.current,
        new_password: passwordForm.new,
      });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
      setError('Password changed successfully');
    } catch (e) {
      setError(e.message);
    }
  };

  const updateSystemSettings = async (settingsData) => {
    try {
      await profileApi.updateSystemSettings(settingsData);
      await fetchSettings();
      setError('Settings updated successfully');
    } catch (e) {
      setError(e.message);
    }
  };

  const updateNotificationPreferences = async () => {
    try {
      const response = await profileApi.updateNotificationPreferences(notificationPreferences);
      // Update state with server response to ensure consistency
      if (response.preferences) {
        setNotificationPreferences(response.preferences);
      }
      setError('Notification preferences saved successfully');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  // ──────────────────────────────────────────────────────
  // 7. Render – login first
  // ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-6">Admin Login</h2>
            {loginError && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{loginError}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite] dark:opacity-80"
            />
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Broccoli is crunching your settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 w-full">
        {/* ---------- Header ---------- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-1">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your profile, website, and system configurations</p>
        </div>

        {/* ---------- Tabs ---------- */}
        <Card className="mb-10">
          <div className="border-b-2 border-green-100 dark:border-green-900">
            <nav className="flex space-x-8 p-6">
              {['profile', 'password', 'website', 'system'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab
                      ? 'border-green-500 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-green-200 dark:hover:border-green-800'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* ---------- Profile Tab ---------- */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Profile Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateProfile({ email: profile.email, phone: profile.phone }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input value={safe(profile.username)} onChange={e => setProfile({ ...profile, username: e.target.value })} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    name="email"
                    value={safe(profile.email)}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    name="phone"
                    value={safe(profile.phone)}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
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
              <QuickAction onClick={() => setShowPasswordModal(true)} className="!w-full !text-sm">
                Change Password
              </QuickAction>
            </div>
          )}

          {/* ---------- Website Tab ---------- */}
          {activeTab === 'website' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Website Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                  <input
                    value={safe(systemSettings.company_name)}
                    onChange={e => setSystemSettings({ ...systemSettings, company_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={safeNum(systemSettings.tax_rate)}
                    onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={safe(systemSettings.currency)}
                    onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <QuickAction type="submit" className="!w-full !text-sm">
                  Update Website Settings
                </QuickAction>
              </form>
            </div>
          )}

          {/* ---------- System Tab ---------- */}
          {activeTab === 'system' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">System Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={safeNum(systemSettings.session_timeout / 3600)}
                    onChange={e => setSystemSettings({ ...systemSettings, session_timeout: e.target.value * 3600 })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={safe(systemSettings.tax_rate)}
                    onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <QuickAction type="submit" className="!w-full !text-sm">
                  Update System Settings
                </QuickAction>
              </form>
            </div>
          )}
        </Card>

        {/* ---------- Password Change Modal ---------- */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Change Password</h3>
                  <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl transition-colors">×</button>
                </div>
                <form onSubmit={e => { e.preventDefault(); changePassword(); }} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.new}
                    onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    required
                  />
                  <QuickAction type="submit" className="!w-full !text-sm">
                    Change Password
                  </QuickAction>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* ---------- Confirmation Modal (for destructive actions) ---------- */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Confirm Action</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to {confirmAction}?</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border-2 border-green-200 dark:border-green-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-green-50 dark:hover:bg-gray-800 transition-all">
                    Cancel
                  </button>
                  <QuickAction onClick={() => { setShowConfirmModal(false); /* Execute action */ }} className="!from-red-500 !to-red-600 dark:!from-red-700 dark:!to-red-800 !px-4 !py-2">
                    Confirm
                  </QuickAction>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ---------- Error/Success Message ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ---------- Logout Button ---------- */}
        <div className="mt-8 flex justify-end">
          <QuickAction onClick={handleLogout} className="!from-gray-500 !to-gray-600 !px-6 !py-2 hover:!from-gray-600 hover:!to-gray-700">
            Logout
          </QuickAction>
        </div>

      </div>
    </Layout>
  );
};

export default Settings;