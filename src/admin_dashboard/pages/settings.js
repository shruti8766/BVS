// // src/admin_dashboard/pages/settings.js
// import React, { useState, useEffect } from 'react';
// import Layout from '../components/layout/Layout';
// import { profileApi } from '../utils/api';

// const Settings = () => {
//   // ──────────────────────────────────────────────────────
//   // 1. Auth state (shared)
//   // ──────────────────────────────────────────────────────
//   const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // ──────────────────────────────────────────────────────
//   // 2. Settings state
//   // ──────────────────────────────────────────────────────
//   const [profile, setProfile] = useState({});
//   const [systemSettings, setSystemSettings] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('profile');  // Tabs: profile, password, website, system, notifications

//   // Modals
//   const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [confirmAction, setConfirmAction] = useState('');

//   console.log('profileApi:', profileApi);

//   // ──────────────────────────────────────────────────────
//   // 3. Helper utilities
//   // ──────────────────────────────────────────────────────
//   const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
//   const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

//   // ──────────────────────────────────────────────────────
//   // 4. Login handler (same)
//   // ──────────────────────────────────────────────────────
//   const handleLogin = async e => {
//     e.preventDefault();
//     setLoggingIn(true);
//     setLoginError('');

//     try {
//       const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginForm),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message || 'Login failed');

//       localStorage.setItem('adminToken', data.token);
//       setToken(data.token);
//     } catch (err) {
//       setLoginError(err.message);
//     } finally {
//       setLoggingIn(false);
//     }
//   };

//   // ──────────────────────────────────────────────────────
//   // 5. Data fetching
//   // ──────────────────────────────────────────────────────
//   const fetchSettings = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const [profileData, settingsData] = await Promise.all([
//         profileApi.getProfile(),
//         profileApi.getSystemSettings(),
//       ]);
//       setProfile(profileData);
//       setSystemSettings(settingsData);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateProfile = async (profileData) => {
//     try {
//       await profileApi.updateProfile(profileData);
//       await fetchSettings();  // Refresh
//       setError('Profile updated successfully');
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   const changePassword = async () => {
//     if (passwordForm.new !== passwordForm.confirm) {
//       setError('New passwords do not match');
//       return;
//     }
//     try {
//       await profileApi.changePassword({
//         current_password: passwordForm.current,
//         new_password: passwordForm.new,
//       });
//       setPasswordForm({ current: '', new: '', confirm: '' });
//       setShowPasswordModal(false);
//       setError('Password changed successfully');
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   const updateSystemSettings = async (settingsData) => {
//     try {
//       await profileApi.updateSystemSettings(settingsData);
//       await fetchSettings();
//       setError('Settings updated successfully');
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken');
//     setToken('');
//   };

//   useEffect(() => {
//     if (token) fetchSettings();
//   }, [token]);

//   // ──────────────────────────────────────────────────────
//   // 7. Render – login first
//   // ──────────────────────────────────────────────────────
//   if (!token) {
//     return (
//       <Layout>
//         <div className="p-6 max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h2 className="text-xl font-bold mb-4">Admin Login</h2>
//             {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
//             <form onSubmit={handleLogin} className="space-y-4">
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={loginForm.username}
//                 onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={loginForm.password}
//                 onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <button
//                 type="submit"
//                 disabled={loggingIn}
//                 className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {loggingIn ? 'Logging in…' : 'Login'}
//               </button>
//             </form>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   if (loading) {
//     return (
//       <Layout>
//         <div className="p-6 flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
//           <span className="text-gray-600">Loading settings...</span>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="p-6">

//         {/* ---------- Header ---------- */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
//           <p className="text-gray-600 mt-2">Manage your profile, website, and system configurations</p>
//         </div>

//         {/* ---------- Tabs ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
//           <div className="border-b border-gray-200">
//             <nav className="flex space-x-8">
//               {['profile', 'password', 'website', 'system', 'notifications'].map(tab => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                     activeTab === tab
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           {/* ---------- Profile Tab ---------- */}
//           {activeTab === 'profile' && (
//             <div className="p-6">
//               <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
//               <form onSubmit={e => { e.preventDefault(); updateProfile({ email: profile.email, phone: profile.phone }); }} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
//                   <input value={safe(profile.username)} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                   <span>{safe(profile.email)}</span>
//                   <input
//                     name="email"
//                     value={safe(profile.email)}
//                     onChange={e => setProfile({ ...profile, email: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                   <input
//                     name="phone"
//                     value={safe(profile.phone)}
//                     onChange={e => setProfile({ ...profile, phone: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                   Update Profile
//                 </button>
//               </form>
//             </div>
//           )}

//           {/* ---------- Password Tab ---------- */}
//           {activeTab === 'password' && (
//             <div className="p-6">
//               <h3 className="text-lg font-medium mb-4">Change Password</h3>
//               <p className="text-sm text-gray-600 mb-4">Enter your current password and new password.</p>
//               <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4">
//                 Change Password
//               </button>
//             </div>
//           )}

//           {/* ---------- Website Tab ---------- */}
//           {activeTab === 'website' && (
//             <div className="p-6">
//               <h3 className="text-lg font-medium mb-4">Website Settings</h3>
//               <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
//                   <span>{safe(systemSettings.company_name)}</span>
//                   <input
//                     value={safe(systemSettings.company_name)}
//                     onChange={e => setSystemSettings({ ...systemSettings, company_name: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={safeNum(systemSettings.tax_rate)}
//                     onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
//                   <select
//                     value={safe(systemSettings.currency)}
//                     onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="INR">INR (₹)</option>
//                     <option value="USD">USD ($)</option>
//                   </select>
//                 </div>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                   Update Website Settings
//                 </button>
//               </form>
//             </div>
//           )}

//           {/* ---------- System Tab ---------- */}
//           {activeTab === 'system' && (
//             <div className="p-6">
//               <h3 className="text-lg font-medium mb-4">System Settings</h3>
//               <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (hours)</label>
//                   <input
//                     type="number"
//                     value={safeNum(systemSettings.session_timeout / 3600)}
//                     onChange={e => setSystemSettings({ ...systemSettings, session_timeout: e.target.value * 3600 })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={safe(systemSettings.tax_rate)}
//                     onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                   Update System Settings
//                 </button>
//               </form>
//             </div>
//           )}

//           {/* ---------- Notifications Tab ---------- */}
//           {activeTab === 'notifications' && (
//             <div className="p-6">
//               <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
//               <div className="space-y-4">
//                 <div>
//                   <label className="flex items-center">
//                     <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                     <span className="ml-2 text-sm text-gray-700">Email notifications for new orders</span>
//                   </label>
//                 </div>
//                 <div>
//                   <label className="flex items-center">
//                     <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                     <span className="ml-2 text-sm text-gray-700">SMS alerts for low stock</span>
//                   </label>
//                 </div>
//                 <div>
//                   <label className="flex items-center">
//                     <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                     <span className="ml-2 text-sm text-gray-700">Daily revenue reports</span>
//                   </label>
//                 </div>
//                 <button onClick={() => setError('Preferences saved')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                   Save Preferences
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ---------- Password Change Modal ---------- */}
//         {showPasswordModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-md w-full">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
//                   <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//                 </div>
//                 <form onSubmit={e => { e.preventDefault(); changePassword(); }} className="space-y-4">
//                   <input
//                     type="password"
//                     placeholder="Current Password"
//                     value={passwordForm.current}
//                     onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                   <input
//                     type="password"
//                     placeholder="New Password"
//                     value={passwordForm.new}
//                     onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                   <input
//                     type="password"
//                     placeholder="Confirm New Password"
//                     value={passwordForm.confirm}
//                     onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                   <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
//                     Change Password
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Confirmation Modal (for destructive actions) ---------- */}
//         {showConfirmModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-md w-full">
//               <div className="p-6">
//                 <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Action</h3>
//                 <p className="text-gray-600 mb-6">Are you sure you want to {confirmAction}?</p>
//                 <div className="flex justify-end space-x-3">
//                   <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded-lg">
//                     Cancel
//                   </button>
//                   <button onClick={() => { setShowConfirmModal(false); /* Execute action */ }} className="px-4 py-2 bg-red-600 text-white rounded-lg">
//                     Confirm
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ---------- Error/Success Message ---------- */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
//             <span className="text-red-600 text-lg mr-3">⚠️</span>
//             <div>
//               <p className="text-red-800 font-medium">{error}</p>
//             </div>
//           </div>
//         )}

//         {/* ---------- Logout Button ---------- */}
//         <div className="mt-8 flex justify-end">
//           <button onClick={handleLogout} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
//             Logout
//           </button>
//         </div>

//         {/* ---------- Footer ---------- */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
//           <span className="text-blue-600 text-lg mr-3">API</span>
//           <div>
//             <p className="text-blue-800 font-medium">Connected to live backend</p>
//             <p className="text-blue-700 text-sm">Settings loaded | http://127.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Settings;
// src/admin_dashboard/pages/settings.js
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
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const QuickAction = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
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
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
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
      const [profileData, settingsData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getSystemSettings(),
      ]);
      setProfile(profileData);
      setSystemSettings(settingsData);
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Admin Login</h2>
            {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
        {/* ---------- Header ---------- */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
            Settings
          </h1>
          <p className="text-gray-600 text-lg font-medium">Manage your profile, website, and system configurations</p>
        </div>

        {/* ---------- Tabs ---------- */}
        <Card className="mb-10">
          <div className="border-b-2 border-green-100">
            <nav className="flex space-x-8 p-6">
              {['profile', 'password', 'website', 'system', 'notifications'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab
                      ? 'border-green-500 text-green-600 hover:text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-green-200'
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
              <h3 className="text-xl font-bold text-green-800 mb-4">Profile Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateProfile({ email: profile.email, phone: profile.phone }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input value={safe(profile.username)} disabled className="w-full px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    value={safe(profile.email)}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="phone"
                    value={safe(profile.phone)}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
              <h3 className="text-xl font-bold text-green-800 mb-4">Change Password</h3>
              <p className="text-sm text-gray-600 mb-4">Enter your current password and new password.</p>
              <QuickAction onClick={() => setShowPasswordModal(true)} className="!w-full !text-sm">
                Change Password
              </QuickAction>
            </div>
          )}

          {/* ---------- Website Tab ---------- */}
          {activeTab === 'website' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4">Website Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    value={safe(systemSettings.company_name)}
                    onChange={e => setSystemSettings({ ...systemSettings, company_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={safeNum(systemSettings.tax_rate)}
                    onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={safe(systemSettings.currency)}
                    onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
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
              <h3 className="text-xl font-bold text-green-800 mb-4">System Settings</h3>
              <form onSubmit={e => { e.preventDefault(); updateSystemSettings(systemSettings); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={safeNum(systemSettings.session_timeout / 3600)}
                    onChange={e => setSystemSettings({ ...systemSettings, session_timeout: e.target.value * 3600 })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={safe(systemSettings.tax_rate)}
                    onChange={e => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                <QuickAction type="submit" className="!w-full !text-sm">
                  Update System Settings
                </QuickAction>
              </form>
            </div>
          )}

          {/* ---------- Notifications Tab ---------- */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-sm text-gray-700">Email notifications for new orders</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-sm text-gray-700">SMS alerts for low stock</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-sm text-gray-700">Daily revenue reports</span>
                  </label>
                </div>
                <QuickAction onClick={() => setError('Preferences saved')} className="!w-full !text-sm">
                  Save Preferences
                </QuickAction>
              </div>
            </div>
          )}
        </Card>

        {/* ---------- Password Change Modal ---------- */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-green-800">Change Password</h3>
                  <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
                </div>
                <form onSubmit={e => { e.preventDefault(); changePassword(); }} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.new}
                    onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
                <h3 className="text-xl font-bold text-green-800 mb-4">Confirm Action</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to {confirmAction}?</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border-2 border-green-200 text-gray-700 rounded-xl hover:bg-green-50 transition-all">
                    Cancel
                  </button>
                  <QuickAction onClick={() => { setShowConfirmModal(false); /* Execute action */ }} className="!from-red-500 !to-red-600 !px-4 !py-2">
                    Confirm
                  </QuickAction>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ---------- Error/Success Message ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">{error}</p>
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