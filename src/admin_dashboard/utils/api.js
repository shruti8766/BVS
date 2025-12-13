// // src/admin_dashboard/utils/api.js

// const BASE = 'http://127.0.0.1:5000';  // ADD THIS

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

const BASE = 'http://127.0.0.1:5000';

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
  getAll: () => apiCall('/api/admin/orders'),
  updateStatus: (id, status) =>
    apiCall(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { status } }),
};

// src/admin_dashboard/utils/api.js (add to existing productsApi)
export const productsApi = {
  getAll: () => apiCall('/api/products'),
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
  getAll: () => apiCall('/api/admin/bills'),  // All bills
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
  getAll: () => apiCall('/api/admin/users'),
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