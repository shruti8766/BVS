
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { billsApi, ordersApi, usersApi } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

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

const Stat = ({ label, value, color = 'text-green-700' }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-green-900/20 border border-gray-200 dark:border-green-900 p-4 lg:p-6">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</h3>
    <div className={`text-2xl font-semibold ${color} ${color === 'text-green-700' ? 'dark:text-green-400' : color === 'text-emerald-700' ? 'dark:text-emerald-400' : 'dark:text-orange-400'}`}>{value}</div>
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
// 3. Main Billing Component
// ──────────────────────────────────────────────────────
const Billing = () => {
  // ──────────────────────────────────────────────────────
  // 1. Auth state (shared)
  // ──────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  // ──────────────────────────────────────────────────────
  // 2. Bills state
  // ──────────────────────────────────────────────────────
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]); // For display
  const [hotels, setHotels] = useState([]); // For display
  const [products, setProducts] = useState([]); // For adding items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchHotel, setSearchHotel] = useState('');
  const [selected, setSelected] = useState(null);
  // NEW: Edit mode state
  const [editMode, setEditMode] = useState(false);
  // CRUD modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  // NEW: For create modal
  const [tempHotelName, setTempHotelName] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [addedItems, setAddedItems] = useState([]);
  const [tempProductId, setTempProductId] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';
  console.log('billsApi:', billsApi);
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
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
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
  // 5. Data fetching & CRUD
  // ──────────────────────────────────────────────────────
  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billsApi.getAll();
      setBills(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchOrdersAndHotels = async () => {
    try {
      const [ordersData, hotelsData, productsRes] = await Promise.all([
        ordersApi.getAll(),
        usersApi.getAll(),
        fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        // Backend returns {products: [...], success: true}, extract the products array
        const productsList = productsData.products || productsData || [];
        console.log('Products loaded for billing:', productsList);
        console.log('First product sample:', productsList[0]);
        setProducts(Array.isArray(productsList) ? productsList : []);
      } else {
        console.error('Failed to load products for billing, status:', productsRes.status);
        const errorData = await productsRes.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setProducts([]);
      }
    } catch (e) {
      setError(e.message);
    }
  };
  // NEW: Check or create client
  const checkCreateClient = async (name) => {
    if (!name.trim()) {
      alert('Enter client name');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const users = await res.json();
      const existing = users.find(u => u.hotel_name.toLowerCase() === name.toLowerCase());
      if (existing) {
        setSelectedHotelId(existing.id);
        alert(`Existing client "${name}" selected.`);
      } else {
        const newUser = {
          username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
          password: 'temp123', // Admin can reset later
          hotel_name: name,
          email: '',
          phone: '',
          address: ''
        };
        const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newUser)
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          setSelectedHotelId(createData.user.id);
          alert(`New client "${name}" created.`);
        } else {
          const err = await createRes.json();
          throw new Error(err.error || 'Failed to create client');
        }
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };
  // NEW: Add temp item
  const addTempItem = () => {
    if (!tempProductId || !tempQty || tempQty <= 0) {
      alert('Select product and valid quantity');
      return;
    }
    if (!tempPrice || parseFloat(tempPrice) <= 0) {
      alert('Please enter a valid price per unit');
      return;
    }
    const prod = products.find(p => p.id == tempProductId);
    if (!prod) {
      alert('Product not found');
      return;
    }
    
    const price = parseFloat(tempPrice);
    
    const newItem = {
      id: prod.id,
      name: prod.name,
      price: price,
      qty: parseFloat(tempQty)
    };
    
    console.log('Adding item:', newItem);
    setAddedItems([...addedItems, newItem]);
    setTempProductId('');
    setTempQty(1);
    setTempPrice('');
  };
  // NEW: Update subtotal
  useEffect(() => {
    const total = addedItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
    setSubtotal(total);
  }, [addedItems]);
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotelId) {
      alert('Please select or add a client first');
      return;
    }
    if (addedItems.length === 0) {
      alert('Please add at least one product');
      return;
    }
    const formData = new FormData(e.target);
    const billData = {
      bill_date: formData.get('bill_date'),
      due_date: formData.get('due_date'),
      tax_rate: parseFloat(formData.get('tax_rate') || 5),
      discount: parseFloat(formData.get('discount') || 0),
      payment_method: formData.get('payment_method') || '',
      paid: formData.get('paid') === 'true',
      comments: formData.get('comments') || ''
    };
    try {
      setError(null);
      // Create order first
      const orderData = {
        user_id: selectedHotelId,
        delivery_date: billData.bill_date, // Use bill date for past supply
        items: addedItems.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          price: item.price // Include manual price
        })),
        special_instructions: ''
      };
      console.log('Creating order with data:', orderData);
      console.log('Added items:', addedItems);
      const orderRes = await fetch(`${BASE_URL}/api/admin/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const orderResult = await orderRes.json();
      const orderId = orderResult.order_id;
      // Prepare bill data
      const subtotal = addedItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
      const discountedSubtotal = subtotal - billData.discount;
      const tax = discountedSubtotal * (billData.tax_rate / 100);
      const totalAmount = discountedSubtotal + tax;
      const finalBillData = {
        ...billData,
        order_id: orderId,
        hotel_id: selectedHotelId,
        amount: subtotal,
        total_amount: totalAmount
      };
      // Create bill
      const billRes = await fetch(`${BASE_URL}/api/admin/bills`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalBillData)
      });
      if (!billRes.ok) {
        const err = await billRes.json();
        throw new Error(err.error || 'Failed to create bill');
      }
      // Success
      alert('Bill created successfully!');
      setShowCreate(false);
      setSelectedHotelId(null); // Reset selection
      setAddedItems([]);
      setTempProductId('');
      setTempQty(1);
      await fetchBills();
      await fetchOrdersAndHotels(); // NEW: Refresh orders to include new one with items
    } catch (e) {
      setError(e.message);
      alert(`Error: ${e.message}`);
    }
  };
  const createBill = async (billData) => {
    // Legacy function - not used in new modal
  };
  const updateBill = async (id, billData) => {
    try {
      // Similar calc for update
      const subtotal = safeNum(billData.amount);
      const taxRate = safeNum(billData.tax_rate, 5) / 100;
      const discount = safeNum(billData.discount, 0);
      const discountedSubtotal = subtotal - discount;
      const tax = discountedSubtotal * taxRate;
      const totalAmount = discountedSubtotal + tax;
      const finalData = { ...billData, total_amount: totalAmount };
      await billsApi.update(id, finalData);
      await fetchBills();
      setShowEdit(false);
      setEditingBill(null);
    } catch (e) {
      setError(e.message);
    }
  };
  // NEW: Inline update functions
  const updatePaid = async (id, paid) => {
    try {
      await billsApi.update(id, { paid });
      await fetchBills();
    } catch (e) {
      setError(e.message);
      alert(`Error updating paid status: ${e.message}`);
    }
  };
  const updatePaymentMethod = async (id, payment_method) => {
    try {
      await billsApi.update(id, { payment_method });
      await fetchBills();
    } catch (e) {
      setError(e.message);
      alert(`Error updating payment method: ${e.message}`);
    }
  };
  const updateComments = async (id, comments) => {
    try {
      await billsApi.update(id, { comments });
      await fetchBills();
    } catch (e) {
      setError(e.message);
      alert(`Error updating comments: ${e.message}`);
    }
  };
  useEffect(() => {
    if (token) {
      fetchBills();
      fetchOrdersAndHotels();
    }
  }, [token]);
  // ──────────────────────────────────────────────────────
  // UPDATED: viewBill (unchanged)
  // ──────────────────────────────────────────────────────
  const viewBill = async (bill) => {
    // UPDATED: Fetch fresh bill data from backend to ensure order_items are included
    let freshBill = bill;
    try {
      const billRes = await fetch(`${BASE_URL}/api/admin/bills?limit=1&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (billRes.ok) {
        const billsData = await billRes.json();
        const freshBillData = billsData.bills?.find(b => b.id == bill.id);
        if (freshBillData) {
          freshBill = freshBillData;
          console.log('✅ Fetched fresh bill with items from backend');
        }
      }
    } catch (err) {
      console.warn('Could not fetch fresh bill data, using cached bill');
    }
    
    // Find hotel details from list
    let hotel = hotels.find(h => h.id == freshBill.hotel_id) || {};
    if (!hotel.hotel_name && freshBill.hotel_name) {
      hotel = { ...hotel, hotel_name: freshBill.hotel_name };
    }
    // UPDATED: Fetch full profile like in hotel code, but for specific hotel via admin endpoint
    // Assuming backend has /api/admin/hotels/${id} or similar; adjust if needed
    // Here using /api/hotels/${id} to match pattern
    if (!hotel.address || !hotel.email || !hotel.phone || !hotel.hotel_name) {
      try {
        const profileRes = await fetch(`${BASE_URL}/api/hotels/${freshBill.hotel_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (profileRes.ok) {
          const fullHotel = await profileRes.json();
          hotel = { ...hotel, ...fullHotel };
          console.log('Fetched full hotel profile for invoice:', fullHotel); // Debug
        } else {
          console.warn('Failed to fetch full hotel profile, using partial data');
        }
      } catch (err) {
        console.error('Profile fetch in viewBill failed:', err);
      }
    }
    // Fallback
    if (!hotel.hotel_name) {
      hotel = { hotel_name: 'Hotel', email: 'N/A', address: 'N/A', phone: 'N/A' };
    }
    // Find order
    const order = orders.find(o => o.id == freshBill.order_id) || {};
    
    console.log('📋 Bill ID:', freshBill.id);
    console.log('📋 Bill items array:', freshBill.items);
    console.log('📋 Order items array:', order.items);
    
    // PRIORITY: Use bill.items if available (stored when bill was created)
    // Fallback to order.items if bill doesn't have items
    let itemsToDisplay = [];
    
    if (freshBill.items && Array.isArray(freshBill.items) && freshBill.items.length > 0) {
      itemsToDisplay = freshBill.items.filter(item => {
        const hasProduct = item.product_id || item.product_name;
        const hasQuantity = item.quantity && parseFloat(item.quantity) > 0;
        const isValid = hasProduct && hasQuantity;
        if (!isValid) {
          console.log('❌ Skipping invalid item from bill:', item);
        }
        return isValid;
      });
      console.log('✅ Using freshBill.items - found', itemsToDisplay.length, 'items');
    } else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      // Fallback to order items
      itemsToDisplay = order.items.filter(item => {
        const hasProduct = item.product_id || item.product_name;
        const hasQuantity = item.quantity && parseFloat(item.quantity) > 0;
        const isValid = hasProduct && hasQuantity;
        if (!isValid) {
          console.log('❌ Skipping invalid item from order:', item);
        }
        return isValid;
      });
      console.log('✅ Using order.items - found', itemsToDisplay.length, 'items');
    } else {
      console.log('⚠️ No items found in freshBill or order - showing fallback message');
    }
    
    const enrichedItems = itemsToDisplay.map(item => {
      const lockedPrice = parseFloat(item.price_at_order || item.price_per_unit || 0);
      const fallbackPrice = parseFloat(getPriceForProduct(item.product_id) || 0);
      const finalPrice = lockedPrice > 0 ? lockedPrice : fallbackPrice;
      
      return {
        ...item,
        price_per_unit: finalPrice
      };
    });
    
    // Build items HTML
    let itemsHtml = '';
    let subtotal = 0;
    enrichedItems.forEach((item, idx) => {
      const itemTotal = parseFloat(item.quantity) * item.price_per_unit;
      subtotal += itemTotal;
      itemsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td class="item-name">${item.product_name || 'Unknown Item'}</td>
          <td>${item.quantity} ${item.unit_type || 'units'}</td>
          <td>₹${item.price_per_unit.toFixed(2)}</td>
          <td>₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });
    
    // If NO items were found, show fallback for old bills
    if (enrichedItems.length === 0) {
      console.log('⚠️ No items to display - this is likely an old bill without order_items stored');
      itemsHtml = `
        <tr>
          <td>1</td>
          <td class="item-name">Vegetables & Fruits Supply</td>
          <td>1</td>
          <td>₹${safeNum(freshBill.total_amount || freshBill.amount).toFixed(2)}</td>
          <td>₹${safeNum(freshBill.total_amount || freshBill.amount).toFixed(2)}</td>
        </tr>
      `;
      subtotal = safeNum(freshBill.total_amount || freshBill.amount);
    }
    // Use bill's tax_rate or default 5%
    const taxRate = safeNum(freshBill.tax_rate, 5) / 100;
    const discount = safeNum(freshBill.discount, 0);
    const discountedSubtotal = subtotal - discount;
    const tax = discountedSubtotal * taxRate;
    const grandTotal = discountedSubtotal + tax;
    const billDate = new Date(freshBill.bill_date);
    const dueDate = freshBill.due_date ? new Date(freshBill.due_date) : new Date(billDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - Bhairavnath Vegetables Supplier</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f0f0f0; padding: 20px; }
          .invoice-container { max-width: 850px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .print-button { position: fixed; top: 20px; right: 20px; background: #4a7c2c; color: white; border: none; padding: 12px 24px; font-size: 16px; font-family: 'Georgia', serif; cursor: pointer; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000; }
          .print-button:hover { background: #2d5016; }
          @media print { body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .invoice-container { box-shadow: none; max-width: 100%; } .print-button { display: none; } .header, thead, thead th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #4a7c2c !important; } .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%) !important; } thead { background: #4a7c2c !important; } .header *, .invoice-title h2, thead th { color: white !important; } .invoice-container { page-break-after: avoid; } }
          .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { background: none; border-radius: 0; width: auto; height: auto; display: flex; align-items: center; justify-content: center; }
          .logo img { width: 100px; height: auto; }
          .company-info h1 { font-size: 24px; margin-bottom: 5px; }
          .company-info p { font-size: 13px; opacity: 0.9; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 32px; font-weight: 300; letter-spacing: 2px; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 30px; background: #f8fdf5; }
          .info-box h3 { color: #2d5016; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .info-box p { color: #333; line-height: 1.6; font-size: 14px; }
          .contact-info { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
          .contact-info svg { width: 16px; height: 16px; fill: #4a7c2c; }
          .invoice-details { background: white; padding: 20px 30px; border-bottom: 2px solid #4a7c2c; }
          .invoice-meta { display: flex; justify-content: space-between; font-size: 14px; }
          .invoice-meta div { display: flex; gap: 30px; }
          .invoice-meta strong { color: #2d5016; }
          .items-table { padding: 30px; }
          table { width: 100%; border-collapse: collapse; }
          thead { background: #4a7c2c; color: white; }
          th { padding: 12px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          th:last-child, td:last-child { text-align: right; }
          tbody tr { border-bottom: 1px solid #e0e0e0; }
          tbody tr:hover { background: #f8fdf5; }
          td { padding: 15px 12px; font-size: 14px; color: #333; }
          .item-name { font-weight: 600; color: #2d5016; }
          .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
          .totals-box { width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
          .total-row.subtotal { border-top: 1px solid #e0e0e0; }
          .total-row.tax { color: #666; }
          .total-row.grand-total { border-top: 2px solid #4a7c2c; font-size: 18px; font-weight: bold; color: #2d5016; padding-top: 15px; margin-top: 10px; }
          .footer { background: #f8fdf5; padding: 25px 30px; margin-top: 30px; }
          .footer-content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer h4 { color: #2d5016; font-size: 14px; margin-bottom: 10px; }
          .footer p { font-size: 13px; color: #666; line-height: 1.6; }
          .thank-you { text-align: center; padding: 20px; background: #2d5016; color: white; font-size: 14px; }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
      
        <div class="invoice-container">
          <div class="header">
            <div class="logo-section">
              <div class="logo">
                <img src="/mainlogo.jpg" alt="BVS Logo" />
              </div>
              <div class="company-info">
                <h1>Bhairavnath Vegetables Supplier</h1>
                <p>Fresh Vegetables • Fruits • Pulses & More</p>
              </div>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
            </div>
          </div>
        
          <div class="info-section">
            <div class="info-box">
              <h3>From</h3>
              <p><strong>Bhairavnath Vegetables Supplier</strong></p>
              <p>Owner: Maruti Bajirao Gaikwad</p>
              <div class="contact-info">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM20 8l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <span>surajgaikwad9812@gmail.com</span>
              </div>
              <div class="contact-info">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                <span>+91 9881325644</span>
              </div>
            </div>
          
            <div class="info-box">
              <h3>Bill To</h3>
              <p><strong>${hotel.hotel_name || 'Hotel'}</strong></p>
              <p>${hotel.email || 'N/A'}</p>
              <p>${hotel.address || 'N/A'}</p>
              <p>${hotel.phone || 'N/A'}</p>
            </div>
          </div>
        
          <div class="invoice-details">
            <div class="invoice-meta">
              <div>
                <span><strong>Invoice No:</strong> BILL-${freshBill.id}</span>
                <span><strong>Date:</strong> ${formatDate(freshBill.bill_date)}</span>
              </div>
              <div>
                <span><strong>Due Date:</strong> ${formatDate(freshBill.due_date || dueDate)}</span>
              </div>
            </div>
          </div>
        
          <div class="items-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          
            <div class="totals">
              <div class="totals-box">
                <div class="total-row subtotal">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                ${discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
                <div class="total-row grand-total">
                  <span>TOTAL:</span>
                  <span>₹${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        
          <div class="footer">
            <div class="footer-content">
              <div>
                <h4>Payment Terms</h4>
                <p>Payment is due within 10 days from the invoice date. We accept cash, bank transfer, and UPI payments.</p>
                ${freshBill.comments ? `<p><strong>Comments:</strong> ${freshBill.comments}</p>` : ''}
              </div>
              <div>

              
              </div>
            </div>
          </div>
        
          <div class="thank-you">
            Thank you for your business! For any queries, contact 9881325644.
          </div>
        </div>
      
        <script>
          function calculateTotals() {
            // Static for print
          }
          calculateTotals();
        </script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  
    // Ask user if they want to print immediately
    if (window.confirm('Open invoice for printing?')) {
      printWindow.print();
    } else {
      printWindow.focus();
    }
  };
  // Get price for product (unused now but kept)
  const getPriceForProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? parseFloat(product.price_per_unit || 0) : 0;
  };
  // ──────────────────────────────────────────────────────
  // 6. Stats & filtering
  // ──────────────────────────────────────────────────────
  const stats = bills.reduce(
    (acc, b) => {
      acc.total++;
      if (b.paid) acc.paid++;
      else acc.pending++;
      acc[b.payment_method] = (acc[b.payment_method] || 0) + 1;
      return acc;
    },
    { total: 0, paid: 0, pending: 0 }
  );
  const filtered = (filter === 'all'
    ? bills
    : filter === 'paid'
      ? bills.filter(b => b.paid)
      : bills.filter(b => !b.paid)
  ).filter(b => 
    b.hotel_name?.toLowerCase().includes(searchHotel.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchHotel.toLowerCase())
  );
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite] dark:opacity-80"
            />
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Broccoli is crunching your bills...</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 w-full">
        {/* ---------- Header + Add Button ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-1">
              Billing Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Create, view, and manage invoices for hotels, events, and caterers</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by hotel name..."
              value={searchHotel}
              onChange={e => setSearchHotel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 md:flex-none"
            />
            {/*<button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium whitespace-nowrap"
            >
              + Create Bill
            </button>*/}
          </div>
          {/* <QuickAction onClick={() => setShowCreate(true)}>
            + Create Bill
          </QuickAction> */}
        </div>
        {/* ---------- Stats Cards ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Stat label="Total Bills" value={safe(stats.total, 0).toLocaleString() || 0} color="text-green-700" />
          <Stat label="Paid" value={safe(stats.paid, 0).toLocaleString() || 0} color="text-emerald-700" />
          <Stat label="Pending" value={safe(stats.pending, 0).toLocaleString() || 0} color="text-orange-600" />
        </div>
        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">Error loading data</p>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <button onClick={fetchBills} className="mt-2 px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}
        {/* ---------- Table with Filters ---------- */}
        <Card>
          <div className="px-6 py-5 bg-green-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
              >
                <option value="all">All Bills</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  editMode
                    ? 'bg-red-500 dark:bg-red-700 text-white border border-red-500 dark:border-red-600 hover:bg-red-600 dark:hover:bg-red-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {editMode ? 'Save' : 'Edit'}
              </button>
              <button onClick={fetchBills} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center text-sm font-medium transition-colors">
                <span className="mr-2">🔄</span> Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50 dark:bg-gray-800/50">
                  {['ID', 'Hotel', 'Order ID', 'Amount', 'Date', 'Paid', 'Payment Method', 'Comments', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl mb-2">💰</span>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No bills found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(b => {
                    const displayAmount = safeNum(b.total_amount || b.amount);
                    return (
                      <tr key={b.id} className={`hover:bg-green-50/30 dark:hover:bg-gray-800/30 transition-colors ${editMode ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                          #{safe(b.id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {safe(b.hotel_name)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          #{safe(b.order_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                          ₹{displayAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(b.bill_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editMode ? (
                            <input
                              type="checkbox"
                              checked={b.paid}
                              onChange={e => updatePaid(b.id, e.target.checked)}
                              className="rounded border-green-300 dark:border-green-700 text-green-600 dark:bg-gray-700 focus:ring-green-500 dark:focus:ring-green-400"
                            />
                          ) : (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              b.paid ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                            }`}>
                              {b.paid ? 'Completed' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editMode ? (
                            <select
                              value={safe(b.payment_method, '')}
                              onChange={e => updatePaymentMethod(b.id, e.target.value)}
                              className="border-2 border-green-200 dark:border-green-800 rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                              <option value="">Select</option>
                              <option value="UPI">UPI</option>
                              <option value="COD">COD</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{safe(b.payment_method) || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editMode ? (
                            <input
                              defaultValue={safe(b.comments, '')}
                              onBlur={e => updateComments(b.id, e.target.value)}
                              className="border-2 border-green-200 dark:border-green-800 rounded-xl px-2 py-1 w-48 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Add comments..."
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{safe(b.comments) || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewBill(b)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-xs font-medium underline transition-colors"
                            >
                              View & Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {/* ---------- Create Bill Modal - UPDATED: Manual products & client ---------- */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Create New Bill</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl transition-colors">×</button>
              </div>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Client - Simplified Dropdown + Add New */}
                <div className="border-2 border-green-200 dark:border-green-800 p-4 rounded-xl dark:bg-gray-800/50">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Client (Hotel/Event/Caterer)</label>
                  <select
                    value={selectedHotelId || ''}
                    onChange={e => setSelectedHotelId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required
                  >
                    <option value="">Choose existing client...</option>
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.hotel_name} (ID: {h.id})
                      </option>
                    ))}
                  </select>
                  {selectedHotelId && (
                    <p className="text-sm text-green-600 dark:text-green-400 mb-2">Selected: {hotels.find(h => h.id === selectedHotelId)?.hotel_name}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("Enter new client name (e.g., New Caterer):");
                        if (!name || !name.trim()) return;
                        // Quick create with minimal fields
                        fetch(`${BASE_URL}/api/admin/users`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
                            password: 'temp123', // Change later
                            hotel_name: name.trim(),
                            email: '', // Optional—add later
                            phone: '',
                            address: ''
                          })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.user) {
                            setSelectedHotelId(data.user.id);
                            alert(`New client "${name}" created (ID: ${data.user.id}). Edit details later if needed.`);
                            // Refetch hotels to update dropdown
                            fetchOrdersAndHotels();
                          } else {
                            alert(`Error: ${data.error || 'Failed to create'}`);
                          }
                        })
                        .catch(err => alert(`Error: ${err.message}`));
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white rounded-xl text-sm hover:from-emerald-600 hover:to-teal-700 dark:hover:from-emerald-600 dark:hover:to-teal-700 transition-all"
                    >
                      + Add New Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedHotelId(null)}
                      className="px-3 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-xl text-sm hover:bg-gray-600 dark:hover:bg-gray-500 transition-all"
                      disabled={!selectedHotelId}
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">New clients get temp password 'temp123'. Edit via Users page.</p>
                </div>
                {/* Products */}
                <div className="border-2 border-green-200 dark:border-green-800 p-4 rounded-xl dark:bg-gray-800/50">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Products</label>
                  {addedItems.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-green-50 dark:divide-gray-700">
                        <thead>
                          <tr className="bg-green-50/50 dark:bg-gray-800/50">
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-gray-700">
                          {addedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-green-50/30 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.qty}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{item.price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{(item.qty * item.price).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setAddedItems(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs font-medium transition-colors"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={tempProductId}
                      onChange={e => setTempProductId(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={e => setTempPrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder="Price/unit"
                      className="w-28 px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    />
                    <input
                      type="number"
                      value={tempQty}
                      onChange={e => setTempQty(e.target.value)}
                      min="1"
                      step="0.01"
                      placeholder="Qty"
                      className="w-20 px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all"
                    />
                    <QuickAction type="button" onClick={addTempItem} className="!px-4 !py-3 !text-sm" disabled={!tempProductId || !tempQty || tempQty <= 0 || !tempPrice || parseFloat(tempPrice) <= 0}>
                      Add
                    </QuickAction>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Subtotal: ₹{subtotal.toFixed(2)}</p>
                </div>
                {/* Bill Date & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Date</label>
                    <input name="bill_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <input name="due_date" type="date" defaultValue={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                  </div>
                </div>
                {/* Amount (Subtotal) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtotal Amount</label>
                  <input name="amount" type="number" step="0.01" value={subtotal} readOnly className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all bg-green-50 dark:bg-gray-600" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                    <input name="tax_rate" type="number" step="0.01" defaultValue="5" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
                    <input name="discount" type="number" step="0.01" defaultValue="0" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                    <select name="payment_method" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all">
                      <option value="">Select</option>
                      <option value="UPI">UPI</option>
                      <option value="COD">COD</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid</label>
                    <select name="paid" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments</label>
                  <textarea name="comments" className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" rows="2" placeholder="Add any comments..."></textarea>
                </div>
                <QuickAction type="submit" className="!w-full !text-sm" disabled={!selectedHotelId || addedItems.length === 0}>
                  Create Bill
                </QuickAction>
              </form>
            </Card>
          </div>
        )}
        {/* ---------- Edit Bill Modal (updated with comments) ---------- */}
        {showEdit && editingBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Edit Bill #{safe(editingBill.id)}</h3>
                <button onClick={() => { setShowEdit(false); setEditingBill(null); }} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl transition-colors">×</button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  updateBill(editingBill.id, Object.fromEntries(formData));
                }}
                className="space-y-4"
              >
                <input name="amount" type="number" step="0.01" defaultValue={editingBill.amount} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" required />
                <input name="tax_rate" type="number" step="0.01" defaultValue={editingBill.tax_rate} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <input name="discount" type="number" step="0.01" defaultValue={editingBill.discount} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" />
                <select name="payment_method" defaultValue={editingBill.payment_method || ''} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all">
                  <option value="">Select</option>
                  <option value="UPI">UPI</option>
                  <option value="COD">COD</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <select name="paid" defaultValue={editingBill.paid} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
                <textarea name="comments" defaultValue={safe(editingBill.comments, '')} className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 focus:border-green-500 dark:focus:border-green-600 transition-all" rows="2" placeholder="Comments"></textarea>
                <QuickAction type="submit" className="!w-full !text-sm !from-emerald-500 !to-teal-600 dark:!from-emerald-700 dark:!to-teal-800">
                  Update Bill
                </QuickAction>
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); setEditingBill(null); }}
                  className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
export default Billing;