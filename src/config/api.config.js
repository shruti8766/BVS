// API Configuration for BVS Application
// This file centralizes all API endpoint configurations

/**
 * Environment-based API URL Configuration
 * 
 * PRODUCTION: Uses deployed Firebase Cloud Functions URL
 * DEVELOPMENT: Uses localhost for local testing
 * 
 * To switch between environments:
 * 1. Change NODE_ENV in your .env file
 * 2. Or manually set IS_PRODUCTION to true/false below
 */

// Automatic environment detection (if using .env file)
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENV === 'production';

// Manual override (uncomment to force production or development)
// const IS_PRODUCTION = true;  // Force production
// const IS_PRODUCTION = false; // Force development

// API URLs
const API_CONFIG = {
  PRODUCTION_URL: 'https://api-aso3bjldka-uc.a.run.app',
  DEVELOPMENT_URL: 'https://api-aso3bjldka-uc.a.run.app',
};

// Current active API URL
export const BASE_URL = IS_PRODUCTION ? API_CONFIG.PRODUCTION_URL : API_CONFIG.DEVELOPMENT_URL;

// Export individual URLs for backwards compatibility
export const ADMIN_API_URL = BASE_URL;
export const HOTEL_API_URL = BASE_URL;
export const CHATBOT_API_URL = BASE_URL;

// API Endpoints - organized by feature
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    CHECK_SESSION: '/api/auth/session/check',
    CHANGE_PASSWORD: '/api/auth/password/change',
  },
  
  // Chatbot
  CHATBOT: {
    CHAT: '/chat',
    TTS: '/tts',
  },
  
  // Public APIs
  PUBLIC: {
    PRODUCTS: '/api/public/products',
    VEGETABLES: '/api/public/vegetables',
    HISTORY: '/api/public/history',
  },
  
  // Admin Dashboard
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    ANALYTICS: '/api/admin/analytics',
    ANALYTICS_TRENDS: '/api/admin/analytics/trends',
    
    // Orders
    ORDERS: '/api/admin/orders',
    ORDER_STATUS: (id) => `/api/admin/orders/${id}/status`,
    PENDING_ORDERS: '/api/admin/orders/pending',
    PENDING_PRICING: '/api/admin/orders/pending-pricing',
    FINALIZE_PRICES: (id) => `/api/admin/orders/${id}/finalize-prices`,
    TODAYS_VEGETABLES: '/api/admin/orders/todays-vegetables',
    VEGETABLES_HISTORY: '/api/admin/orders/vegetables-history',
    TODAYS_HOTELS_ORDERS: '/api/admin/orders/todays-hotels-orders',
    HOTELS_ORDERS_HISTORY: '/api/admin/orders/hotels-orders-history',
    TODAYS_FILLING: '/api/admin/orders/todays-filling',
    FILLING_HISTORY: '/api/admin/orders/filling-history',
    
    // Products
    PRODUCTS: '/api/admin/products',
    PRODUCT_BY_ID: (id) => `/api/admin/products/${id}`,
    PRODUCT_STOCK: (id) => `/api/admin/products/${id}/stock`,
    
    // Users
    USERS: '/api/admin/users',
    USER_BY_ID: (id) => `/api/admin/users/${id}`,
    
    // Suppliers
    SUPPLIERS: '/api/admin/suppliers',
    SUPPLIER_BY_ID: (id) => `/api/admin/suppliers/${id}`,
    
    // Bills
    BILLS: '/api/admin/bills',
    
    // Sessions
    SESSIONS: '/api/admin/sessions',
    REVOKE_SESSION: (id) => `/api/admin/sessions/${id}`,
    
    // Profile & Settings
    PROFILE: '/api/admin/profile',
    SETTINGS: '/api/admin/settings',
    
    // Support Tickets
    SUPPORT_TICKETS: '/api/admin/support/tickets',
    SUPPORT_TICKET_BY_ID: (id) => `/api/admin/support/tickets/${id}`,
    SUPPORT_TICKET_REPLY: (id) => `/api/admin/support/tickets/${id}/reply`,
    SUPPORT_TICKET_CLOSE: (id) => `/api/admin/support/tickets/${id}/close`,
  },
  
  // Hotel Dashboard
  HOTEL: {
    DASHBOARD: '/api/hotel/dashboard',
    
    // Orders
    ORDERS: '/api/hotel/orders',
    ORDER_BY_ID: (id) => `/api/hotel/orders/${id}`,
    
    // Bills
    BILLS: '/api/hotel/bills',
    
    // Cart
    CART: '/api/hotel/cart',
    CART_ITEM: (id) => `/api/hotel/cart/${id}`,
    CART_CLEAR: '/api/hotel/cart/clear',
    CART_CALCULATE: '/api/hotel/cart/calculate',
    
    // Profile
    PROFILE: '/api/hotel/profile',
    
    // Support
    SUPPORT_TICKETS: '/api/hotel/support-tickets',
  },
  
  // Common
  PRODUCTS: '/api/products',
  HEALTH: '/health',
};

// Helper function to build full URL
export const getApiUrl = (endpoint) => {
  return `${BASE_URL}${endpoint}`;
};

// Helper function for API calls with token
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('hotelToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Log current configuration
console.log('🔧 API Configuration Loaded:');
console.log('  Environment:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('  Base URL:', BASE_URL);
console.log('  To change: Update IS_PRODUCTION in src/config/api.config.js');

export default {
  BASE_URL,
  API_ENDPOINTS,
  getApiUrl,
  fetchWithAuth,
  IS_PRODUCTION,
};
