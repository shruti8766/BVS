// // src/admin_dashboard/pages/profile.js
// import { useState, useEffect } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { CameraIcon, KeyIcon } from '@heroicons/react/24/outline';
// import Layout from '../components/layout/Layout';

// const API_URL = 'http://localhost:5000/api/admin';

// export default function Profile() {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();

//   const [profile, setProfile] = useState({
//     username: '',
//     email: '',
//     phone: '',
//     hotel_name: 'BVS Admin',
//   });
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [passwordData, setPasswordData] = useState({
//     current: '',
//     new: '',
//     confirm: '',
//   });

//   // Fetch profile on mount
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await axios.get(`${API_URL}/profile`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setProfile(res.data);
//       } catch (err) {
//         console.error('Failed to load profile:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProfile();
//   }, [token]);

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       await axios.put(
//         `${API_URL}/profile`,
//         {
//           email: profile.email,
//           phone: profile.phone,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setIsEditing(false);
//     } catch (err) {
//       alert('Failed to save profile');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handlePasswordChange = async () => {
//     if (passwordData.new !== passwordData.confirm) {
//       alert('New passwords do not match');
//       return;
//     }
//     try {
//       await axios.post(
//         `${API_URL}/password/change`,
//         {
//           current_password: passwordData.current,
//           new_password: passwordData.new,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert('Password changed successfully');
//       setShowPasswordModal(false);
//       setPasswordData({ current: '', new: '', confirm: '' });
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to change password');
//     }
//   };

//   if (loading) {
//     return (
//       <Layout>
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//     <div className="p-6 max-w-4xl mx-auto">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {/* Header */}
//         <div className="bg-primary-50 px-6 py-4 border-b border-gray-200">
//           <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
//           <p className="text-sm text-gray-600 mt-1">Manage your account information</p>
//         </div>

//         <div className="p-6">
//           {/* Avatar + Basic Info */}
//           <div className="flex items-center space-x-6 mb-8">
//             <div className="relative">
//               <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
//                 <span className="text-3xl font-bold text-primary-700">
//                   {profile.username?.[0]?.toUpperCase() || 'A'}
//                 </span>
//               </div>
//               <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white hover:bg-primary-700">
//                 <CameraIcon className="w-4 h-4" />
//               </button>
//             </div>

//             <div>
//               <h2 className="text-xl font-semibold text-gray-800">{profile.username}</h2>
//               <p className="text-gray-600">{profile.email}</p>
//               <p className="text-sm text-gray-500">{profile.hotel_name}</p>
//             </div>

//             <div className="ml-auto">
//               {!isEditing ? (
//                 <button
//                   onClick={() => setIsEditing(true)}
//                   className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
//                 >
//                   Edit Profile
//                 </button>
//               ) : (
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={handleSave}
//                     disabled={saving}
//                     className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
//                   >
//                     {saving ? 'Saving...' : 'Save'}
//                   </button>
//                   <button
//                     onClick={() => setIsEditing(false)}
//                     className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Profile Form */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
//               <input
//                 type="text"
//                 value={profile.username || ''}
//                 disabled
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//               <input
//                 type="email"
//                 value={profile.email || ''}
//                 onChange={(e) => setProfile({ ...profile, email: e.target.value })}
//                 disabled={!isEditing}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//               <input
//                 type="text"
//                 value={profile.phone || ''}
//                 onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
//                 disabled={!isEditing}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//               <input
//                 type="text"
//                 value="Administrator"
//                 disabled
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
//               />
//             </div>
//           </div>

//           {/* Change Password Button */}
//           <div className="mt-8 pt-6 border-t border-gray-200">
//             <button
//               onClick={() => setShowPasswordModal(true)}
//               className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg"
//             >
//               <KeyIcon className="w-5 h-5" />
//               <span>Change Password</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Password Change Modal */}
//       {showPasswordModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>

//             <div className="space-y-4">
//               <input
//                 type="password"
//                 placeholder="Current Password"
//                 value={passwordData.current}
//                 onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               />
//               <input
//                 type="password"
//                 placeholder="New Password"
//                 value={passwordData.new}
//                 onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               />
//               <input
//                 type="password"
//                 placeholder="Confirm New Password"
//                 value={passwordData.confirm}
//                 onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               />
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => {
//                   setShowPasswordModal(false);
//                   setPasswordData({ current: '', new: '', confirm: '' });
//                 }}
//                 className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handlePasswordChange}
//                 className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
//               >
//                 Update Password
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//     </Layout>
//   );
// }
// src/admin_dashboard/pages/profile.js
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CameraIcon, KeyIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';

// ──────────────────────────────────────────────────────
// 1. Reusable UI Components (Adapted from dashboard)
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 hover:-translate-y-1' : ''} ${className}`}>
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

const API_URL = 'http://localhost:5000/api/admin';

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    hotel_name: 'BVS Admin',
    profile_image: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        setProfile({
          ...res.data,
          profile_image: res.data.profile_image || ''
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      e.target.value = ''; // Reset input
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      e.target.value = ''; // Reset input
      return;
    }

    setUploadingImage(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const imageUrl = reader.result;
        const adminToken = localStorage.getItem('adminToken');
        
        console.log('Uploading image, size:', imageUrl.length, 'bytes');
        console.log('Current profile data:', profile);
        
        // Only send the profile_image field to update
        const response = await axios.put(
          `${API_URL}/profile`,
          {
            profile_image: imageUrl,
          },
          { 
            headers: { 
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        
        console.log('Upload response:', response.data);
        
        if (response.status === 200) {
          // Update local state immediately
          setProfile(prev => ({ ...prev, profile_image: imageUrl }));
          alert('Profile image updated successfully!');
          
          // Optionally refetch profile to ensure sync
          const profileRes = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
          setProfile({
            ...profileRes.data,
            profile_image: profileRes.data.profile_image || imageUrl
          });
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        console.error('Error response:', err.response?.data);
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update profile image';
        alert(errorMsg);
      } finally {
        setUploadingImage(false);
        e.target.value = ''; // Reset input
      }
    };
    
    reader.onerror = () => {
      alert('Failed to read file');
      setUploadingImage(false);
      e.target.value = ''; // Reset input
    };
    
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      // Build update object with only non-empty fields
      const updateData = {};
      if (profile.email) updateData.email = profile.email;
      if (profile.phone) updateData.phone = profile.phone;
      if (profile.hotel_name) updateData.hotel_name = profile.hotel_name;
      if (profile.profile_image) updateData.profile_image = profile.profile_image;
      
      console.log('Saving profile data:', Object.keys(updateData));
      
      const response = await axios.put(
        `${API_URL}/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      console.log('Save response:', response.data);
      
      if (response.status === 200) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        
        // Refetch profile to ensure sync
        const profileRes = await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        setProfile({
          ...profileRes.data,
          profile_image: profileRes.data.profile_image || profile.profile_image
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      console.error('Error response:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.new.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:5000/api/auth/password/change`,
        {
          current_password: passwordData.current,
          new_password: passwordData.new,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      alert('Password changed successfully! Please login again.');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      
      // Logout after password change
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    } catch (err) {
      console.error('Password change error:', err.response || err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to change password');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
      <Card className="w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 text-lg font-medium">Manage your account information</p>
        </div>

        <div className="p-6">
          {/* Avatar + Basic Info */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-green-200 shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center"><span class="text-3xl font-bold text-green-700">' + (profile.username?.[0]?.toUpperCase() || 'A') + '</span></div>';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-green-700">
                    {profile.username?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-green-600 rounded-full text-white hover:bg-green-700 cursor-pointer transition-all shadow-lg hover:shadow-xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CameraIcon className="w-4 h-4" />
                )}
              </label>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-green-800">{profile.username}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500">{profile.hotel_name}</p>
            </div>

            <div className="ml-auto">
              {!isEditing ? (
                <QuickAction onClick={() => setIsEditing(true)}>
                  Edit Profile
                </QuickAction>
              ) : (
                <div className="flex space-x-2">
                  <QuickAction onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </QuickAction>
                  <QuickAction onClick={() => setIsEditing(false)} className="!from-gray-500 !to-gray-600 !hover:!from-gray-600 !hover:!to-gray-700">
                    Cancel
                  </QuickAction>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={profile.username || ''}
                disabled
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:bg-green-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:bg-green-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={profile.hotel_name || 'BVS Admin'}
                onChange={(e) => setProfile({ ...profile, hotel_name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:bg-green-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value="Administrator"
                disabled
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* Profile Image URL Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image URL 
                <span className="text-xs text-gray-500 ml-2">(Alternative to file upload - paste image URL here)</span>
              </label>
              <input
                type="url"
                value={profile.profile_image || ''}
                onChange={(e) => setProfile({ ...profile, profile_image: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com/your-image.jpg"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:bg-green-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Upload files under 2MB or paste an image URL
              </p>
            </div>
          </div>

          {/* Change Password Button */}
          <div className="mt-8 pt-6 border-t-2 border-green-100">
            <QuickAction onClick={() => setShowPasswordModal(true)} className="!px-4 !py-2 !text-sm flex items-center space-x-2">
              <KeyIcon className="w-5 h-5" />
              <span>Change Password</span>
            </QuickAction>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">Change Password</h3>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <QuickAction onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ current: '', new: '', confirm: '' });
              }} className="!from-gray-500 !to-gray-600 !px-4 !py-2 !hover:!from-gray-600 !hover:!to-gray-700">
                Cancel
              </QuickAction>
              <QuickAction onClick={handlePasswordChange} className="!px-4 !py-2 !text-sm">
                Update Password
              </QuickAction>
            </div>
          </Card>
        </div>
      )}
    </div>
    </Layout>
  );
}