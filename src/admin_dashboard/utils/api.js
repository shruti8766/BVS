// // src/admin_dashboard/utils/api.js

// const BASE = 'https://api-aso3bjldka-uc.a.run.app';  // ADD THIS

// const apiCall = async (endpoint, { method = 'GET', body } = {}) => {
//   const token = localStorage.getItem('adminToken');
  
//   console.log('Sending request to:', endpoint);
//   console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

//   const headers = { 'Content-Type': 'application/json' };
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const res = await fetch(`${BASE}${endpoint}`, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   console.log('Response status:', res.status);

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || `HTTP ${res.status}`);
//   }
//   return res.json();
// };

// export const ordersApi = {
//   getAll: () => apiCall('/api/admin/orders'),
//   updateStatus: (id, status) =>
//     apiCall(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { status } }),
// };
// src/admin_dashboard/utils/api.js

// src/admin_dashboard/utils/api.js

// src/admin_dashboard/utils/api.js

// API Configuration - Switch between development and production
// PRODUCTION: Deployed Firebase Cloud Functions
const BASE = 'https://api-aso3bjldka-uc.a.run.app';
// DEVELOPMENT: Uncomment the line below for local testing
// const BASE = 'https://api-aso3bjldka-uc.a.run.app';

const apiCall = async (endpoint, { method = 'GET', body } = {}) => {
  const token = localStorage.getItem('adminToken');
  
  console.log('Sending request to:', endpoint);
  console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  if (body) {
    console.log('Request body:', body);  // NEW: Log payload
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('Response status:', res.status);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.log('Full error response:', errData);  // NEW: Log full err for debug
    const errorMsg = errData.error || errData.message || `HTTP ${res.status}`;
    throw new Error(errorMsg);  // FIXED: Prioritize 'error' key
  }
  return res.json();
};

export const ordersApi = {
  getAll: async () => {
    const response = await apiCall('/api/admin/orders');
    // Backend returns {orders: [...], success: true}, extract the orders array
    return response.orders || response || [];
  },
  updateStatus: (id, status) =>
    apiCall(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { status } }),
};

// src/admin_dashboard/utils/api.js (add to existing productsApi)
export const productsApi = {
  getAll: async () => {
    const response = await apiCall('/api/products');
    // Backend returns {products: [...], success: true}, extract the products array
    return response.products || response || [];
  },
  create: (productData) =>
    apiCall('/api/admin/products', { method: 'POST', body: productData }),
  update: (id, productData) =>
    apiCall(`/api/admin/products/${id}`, { method: 'PUT', body: productData }),
  delete: (id) =>
    apiCall(`/api/admin/products/${id}`, { method: 'DELETE' }),
  // NEW: For inventory - update stock specifically
  updateStock: (id, stockQuantity) =>
    apiCall(`/api/admin/products/${id}/stock`, { method: 'PATCH', body: { stock_quantity: stockQuantity } }),
};

// NEW: Suppliers API (CRUD – based on Postman pattern)
export const suppliersApi = {
  getAll: () => apiCall('/api/admin/suppliers'),  // All suppliers
  create: (supplierData) =>
    apiCall('/api/admin/suppliers', { method: 'POST', body: supplierData }),
  update: (id, supplierData) =>
    apiCall(`/api/admin/suppliers/${id}`, { method: 'PUT', body: supplierData }),
  delete: (id) =>
    apiCall(`/api/admin/suppliers/${id}`, { method: 'DELETE' }),
};

// NEW: Bills API (CRUD)
export const billsApi = {
  getAll: async () => {
    const response = await apiCall('/api/admin/bills');
    // Backend returns {bills: [...], total: N}, extract the bills array
    return response.bills || response || [];
  },
  create: (billData) =>
    apiCall('/api/admin/bills', { method: 'POST', body: billData }),
  update: (id, billData) =>
    apiCall(`/api/admin/bills/${id}`, { method: 'PUT', body: billData }),
  // Add PDF/print endpoint if needed later
};

export const analyticsApi = {
  getDashboard: () => apiCall('/api/admin/dashboard'),  // Core stats
  getOrders: () => apiCall('/api/admin/orders'),  // For trends
  getProducts: () => apiCall('/api/products'),  // For product stats
};

// export const usersApi = {
//   getAll: () => apiCall('/api/admin/users'),
//   create: (userData) =>
//     apiCall('/api/admin/users', { method: 'POST', body: userData }),
//   update: (id, userData) =>
//     apiCall(`/api/admin/users/${id}`, { method: 'PUT', body: userData }),
//   delete: (id) =>
//     apiCall(`/api/admin/users/${id}`, { method: 'DELETE' }),
// };

// In utils/api.js, add:
export const usersApi = {
  getAll: async () => {
    const response = await apiCall('/api/admin/users');
    // Backend returns {users: [...], success: true}, extract the users array
    return response.users || response || [];
  },
  create: (userData) => apiCall('/api/admin/users', { method: 'POST', body: userData }),
  update: (id, userData) => apiCall(`/api/admin/users/${id}`, { method: 'PUT', body: userData }),
  delete: (id) => apiCall(`/api/admin/users/${id}`, { method: 'DELETE' }),
};

export const profileApi = {
  getProfile: () => apiCall('/api/admin/profile'),  // Get current admin profile
  updateProfile: (profileData) =>
    apiCall('/api/admin/profile', { method: 'PUT', body: profileData }),
  changePassword: (passwordData) =>
    apiCall('/api/auth/password/change', { method: 'POST', body: passwordData }),
  // System settings (if backend has /api/admin/settings)
  getSystemSettings: () => apiCall('/api/admin/settings'),
  updateSystemSettings: (settingsData) =>
    apiCall('/api/admin/settings', { method: 'PUT', body: settingsData }),
  // Notification preferences
  getNotificationPreferences: () => apiCall('/api/admin/notifications/preferences'),
  updateNotificationPreferences: (preferencesData) =>
    apiCall('/api/admin/notifications/preferences', { method: 'PUT', body: preferencesData }),
};


// ---- inside api.js (add at the bottom) ----
export const supportApi = {
  getAll: () => apiCall('/api/admin/support/tickets'),               // GET list
  getOne: (id) => apiCall(`/api/admin/support/tickets/${id}`),      // GET single
  create: (data) => apiCall('/api/admin/support/tickets', { method: 'POST', body: data }),
  reply: (id, message) => apiCall(`/api/admin/support/tickets/${id}/reply`, {
    method: 'POST',
    body: { message },
  }),
  close: (id) => apiCall(`/api/admin/support/tickets/${id}/close`, { method: 'PATCH' }),
  health: () => apiCall('/api/health'),                              // simple ping
};