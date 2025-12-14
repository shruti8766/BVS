// Hotel Dashboard API Configuration
const BASE_URL = 'http://localhost:5000';

// Helper function to get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('hotelToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ==================== DASHBOARD ====================
export const fetchHotelDashboard = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/dashboard`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
};

// ==================== ORDERS ====================
export const fetchHotelOrders = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/orders`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const fetchHotelOrderById = async (orderId) => {
  const response = await fetch(`${BASE_URL}/api/hotel/orders/${orderId}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch order');
  return response.json();
};

export const placeOrder = async (payload) => {
  const response = await fetch(`${BASE_URL}/api/hotel/orders`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to place order');
  return response.json();
};

// ==================== BILLS ====================
export const fetchHotelBills = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/bills`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch bills');
  return response.json();
};

// ==================== CART ====================
export const fetchCart = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch cart');
  return response.json();
};

export const addToCart = async (productId, quantity) => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!response.ok) throw new Error('Failed to add to cart');
  return response.json();
};

export const updateCartItem = async (productId, quantity) => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart/${productId}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('Failed to update cart item');
  return response.json();
};

export const removeFromCart = async (productId) => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to remove from cart');
  return response.json();
};

export const clearCart = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart/clear`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to clear cart');
  return response.json();
};

export const calculateCartTotal = async (items) => {
  const response = await fetch(`${BASE_URL}/api/hotel/cart/calculate`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error('Failed to calculate cart total');
  return response.json();
};

// ==================== PRODUCTS ====================
export const fetchProducts = async () => {
  const response = await fetch(`${BASE_URL}/api/products`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

// ==================== PROFILE ====================
export const fetchHotelProfile = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/profile`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const updateHotelProfile = async (data) => {
  const response = await fetch(`${BASE_URL}/api/hotel/profile`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

export const changePassword = async (payload) => {
  const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to change password');
  return response.json();
};

// ==================== SUPPORT ====================
export const fetchSupportTickets = async () => {
  const response = await fetch(`${BASE_URL}/api/hotel/support-tickets`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch support tickets');
  return response.json();
};

export const createSupportTicket = async (data) => {
  const response = await fetch(`${BASE_URL}/api/hotel/support-tickets`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create support ticket');
  return response.json();
};

// ==================== ORDER HISTORY ====================
export const fetchOrderHistory = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  const url = `${BASE_URL}/api/hotel/orders${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch order history');
  return response.json();
};

export const reorderFromHistory = async (orderId) => {
  const response = await fetch(`${BASE_URL}/api/hotel/orders/${orderId}/reorder`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to reorder');
  return response.json();
};