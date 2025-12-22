// src/hotel_dashboard/components/pages/orders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';  // Assume this exposes setUser if needed
import { fetchHotelProfile, fetchProducts, fetchHotelOrders, fetchHotelBills, fetchHotelOrderById } from '../../utils/api';

export default function HotelOrders() {
  const { user, logout, setUser } = useAuth();  // ADD: Destructure setUser (if available; else use local state below)
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [products, setProducts] = useState([]);
  // NEW: Local fallback for profile (if setUser not exposed)
  const [hotelProfile, setHotelProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch orders, bills, products, AND profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch profile FIRST (ensures full details for invoice)
        const profileData = await fetchHotelProfile();
        console.log('Fetched profile:', profileData);

        // Merge with existing user (via setUser if available, else local)
        if (setUser) {
          setUser(prev => ({ ...prev, ...profileData }));
        } else {
          setHotelProfile(profileData);  // Fallback local state
        }

        // Fetch products
        try {
          const productsData = await fetchProducts();
          const productsArray = productsData.products || productsData;
          setProducts(Array.isArray(productsArray) ? productsArray : []);
        } catch (err) {
          console.warn('Failed to fetch products:', err);
          setProducts([]);
        }

        // Fetch orders for the logged-in hotel only
        try {
          const ordersData = await fetchHotelOrders();
          console.log('Fetched orders for hotel:', user?.hotel_name, ordersData);
          const ordersArray = ordersData.orders || ordersData;
          setOrders(Array.isArray(ordersArray) ? ordersArray : []);
        } catch (ordersErr) {
          console.error('Failed to fetch orders:', ordersErr);
          setOrders([]);
          // Don't throw, continue to fetch bills
        }

        // Fetch bills for the logged-in hotel only
        try {
          const billsData = await fetchHotelBills();
          console.log('Fetched bills for hotel:', user?.hotel_name, billsData);
          const billsArray = billsData.bills || billsData;
          setBills(Array.isArray(billsArray) ? billsArray : []);
        } catch (billsErr) {
          console.error('Failed to fetch bills:', billsErr);
          setBills([]);
          // Don't throw, continue
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout();
          navigate('/login');
        }
        setOrders([]);
        setBills([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if user is logged in
      fetchData();
    }
  }, [user, logout, navigate, setUser]);

  // Get price for product
  const getPriceForProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? parseFloat(product.price_per_unit || 0) : 0;
  };

  // Format date
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  // Stats based on order status
  const stats = orders.reduce(
    (acc, o) => {
      acc.total++;
      if (o.status === 'pending') acc.pending++;
      else if (o.status === 'confirmed' || o.status === 'preparing') acc.confirmed++;
      else if (o.status === 'delivered' || o.status === 'dispatched') acc.delivered++; // Include dispatched as delivered-like
      return acc;
    },
    { total: 0, pending: 0, confirmed: 0, delivered: 0 }
  );

  // Filtered orders
  const filtered = filter === 'all'
    ? orders
    : filter === 'pending'
      ? orders.filter(o => o.status === 'pending')
      : filter === 'confirmed'
        ? orders.filter(o => o.status === 'confirmed' || o.status === 'preparing')
        : orders.filter(o => o.status === 'delivered' || o.status === 'dispatched');

  // Find bill for order
  const getBillForOrder = (orderId) => bills.find(b => b.order_id === orderId);

  // Delete order
  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/hotel/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
        alert('Order deleted successfully');
      } else {
        alert('Failed to delete order');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting order');
    }
  };

  // Open order details modal
  const openOrderDetails = async (order) => {
    try {
      const fullOrder = await fetchHotelOrderById(order.id);
      // Enrich items with prices if missing
      const enrichedItems = fullOrder.items?.map(item => ({
        ...item,
        price_per_unit: parseFloat(item.price_per_unit || getPriceForProduct(item.product_id) || 0)
      })) || [];
      setSelectedOrder({ ...fullOrder, items: enrichedItems });
      setIsOpen(true);
    } catch (err) {
      console.error('Details fetch error:', err);
      // Fallback to the order passed in
      const enrichedItems = order.items?.map(item => ({
        ...item,
        price_per_unit: parseFloat(item.price_per_unit || getPriceForProduct(item.product_id) || 0)
      })) || [];
      setSelectedOrder({ ...order, items: enrichedItems });
      setIsOpen(true);
    }
  };

  // UPDATED: viewBill – Use merged/fresh profile
  const viewBill = async (bill) => {
    // Use user (now merged) or fallback to local profile
    let hotel = user || {};
    if (!hotel.hotel_name && hotelProfile) {
      hotel = { ...hotel, ...hotelProfile };
    }

    // FINAL FALLBACK: If still missing, fetch fresh (rare, but bulletproof)
    if (!hotel.hotel_name) {
      try {
        const freshProfile = await fetchHotelProfile();
        hotel = { ...hotel, ...freshProfile };
        console.log('Fetched fresh profile for invoice:', freshProfile);
      } catch (err) {
        console.error('Profile fetch in viewBill failed:', err);
      }
    }

    const order = orders.find(o => o.id === bill.order_id) || {};
    const amount = parseFloat(bill.total_amount || bill.amount || 0);
    const billDate = new Date(bill.bill_date);
    const dueDate = new Date(billDate.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Use LOCKED prices from price_at_order (finalized prices)
    const enrichedItems = order.items?.map(item => ({
      ...item,
      price_per_unit: parseFloat(item.price_at_order || item.price_per_unit || getPriceForProduct(item.product_id) || 0)
    })) || [];

    // Build items HTML (unchanged)
    let itemsHtml = '';
    let subtotal = 0;
    enrichedItems.forEach((item, idx) => {
      const itemTotal = item.quantity * item.price_per_unit;
      subtotal += itemTotal;
      itemsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td class="item-name">${item.product_name || 'Unknown Item'}</td>
          <td>${item.quantity} ${item.unit_type}</td>
          <td>₹${item.price_per_unit.toFixed(2)}</td>
          <td>₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    if (enrichedItems.length === 0) {
      itemsHtml = `
        <tr>
          <td>1</td>
          <td>Order #${bill.order_id} - Vegetables Supply</td>
          <td>1</td>
          <td>₹${amount.toFixed(2)}</td>
          <td>₹${amount.toFixed(2)}</td>
        </tr>
      `;
      subtotal = amount;
    }

    const tax = subtotal * 0.05;
    const grandTotal = subtotal * 1.05;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - Bhairavnath Vegetables Supplier</title>
        <style>
          /* (unchanged CSS) */
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
                <span><strong>Invoice No:</strong> BILL-${bill.id}</span>
                <span><strong>Date:</strong> ${formatDate(bill.bill_date)}</span>
              </div>
              <div>
                <span><strong>Due Date:</strong> ${formatDate(bill.due_date || dueDate)}</span>
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
                <div class="total-row tax">
                  <span>GST (5%):</span>
                  <span>₹${tax.toFixed(2)}</span>
                </div>
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
    // const printWindow = window.open('', '_blank');
    // printWindow.document.write(html);
    // printWindow.document.close();
    // printWindow.print();
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

  if (loading) {
      return (
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
            <div className="text-center">
              <img
                src="/broc.jpg"
                alt="Loading"
                className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
              />
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your orders...</p>
            </div>
          </div>
        </Layout>
      );
    }

  // UPDATED: Header – Use merged profile for display too
  const displayName = user?.hotel_name || hotelProfile?.hotel_name || 'Hotel User';

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header – UPDATED */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center">
              <span className="mr-3">📦</span> My Orders
            </h1>
            <p className="text-green-700">Track your vegetable orders and delivery history, {displayName}.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { key: 'total', label: 'Total Orders', color: 'bg-green-100 text-green-800', icon: '📋' },
              { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
              { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
              { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '🚚' },
            ].map(({ key, label, color, icon }) => (
              <div key={key} className={`bg-white p-4 rounded-xl shadow-sm border ${color}`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{icon}</span>
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold">{stats[key]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-green-700">Filter by status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending Approval</option>
                <option value="confirmed">Confirmed/Preparing</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => navigate('/hotel/products')} // Assuming a route for new order
                className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
              >
                ➕ New Order
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-green-200">
                <thead className="bg-green-50">
                  <tr>
                    {['ID', 'Date', 'Total', 'Status', 'Delivery Date', 'Bill', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">📦</span>
                          <p className="text-lg text-green-800">No orders yet</p>
                          <p className="text-green-600">Place your first order to get fresh vegetables delivered.</p>
                          <button
                            onClick={() => navigate('/hotel/products')}
                            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Start Ordering
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const total = parseFloat(o.total_amount || 0);
                      const bill = getBillForOrder(o.id);
                      const statusColor = o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          (o.status === 'delivered' || o.status === 'dispatched') ? 'bg-green-100 text-green-800' :
                                          'bg-blue-100 text-blue-800';
                      
                      // NEW: Pricing status badge
                      const pricingStatusColor = o.pricing_status === 'pending_pricing' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800';
                      
                      return (
                        <tr key={o.id} className="hover:bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                            #{o.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(o.order_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {o.pricing_status === 'pending_pricing' ? (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                ⏳ Pending
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-green-800">₹{total.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(o.delivery_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {bill ? (
                              <span className={o.pricing_status === 'pending_pricing' ? 'text-orange-500' : 'text-green-600'}>
                                {o.pricing_status === 'pending_pricing' ? 'Pending' : 'Generated'}
                              </span>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openOrderDetails(o)}
                                className="text-green-600 hover:text-green-800 underline text-sm"
                              >
                                Details
                              </button>
                              {bill && (
                                <button
                                  onClick={() => viewBill(bill)}
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  View Bill
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Order Details Modal - Compact Version */}
          {isOpen && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-green-100">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-green-800">
                      Order Details - #{selectedOrder.id}
                    </h3>
                    <button 
                      onClick={() => setIsOpen(false)} 
                      className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Order Header */}
                    <div className="bg-white border border-green-100 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-green-800">{user?.hotel_name || 'Your Order'}</h4>
                          <p className="text-sm text-gray-600">Order #{selectedOrder.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-emerald-700">₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            selectedOrder.status === 'preparing' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            selectedOrder.status === 'dispatched' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Order Date</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(selectedOrder.order_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Delivery Date</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(selectedOrder.delivery_date)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Pricing Status</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            selectedOrder.pricing_status === 'prices_finalized' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {selectedOrder.pricing_status === 'prices_finalized' ? 'Prices Finalized' : 'Pending Pricing'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {selectedOrder.special_instructions && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Special Instructions</p>
                        <p className="text-sm text-amber-800">{selectedOrder.special_instructions}</p>
                      </div>
                    )}

                    {/* Enhanced Items Table */}
                    <div className="bg-white border border-green-100 rounded-lg overflow-hidden">
                      <p className="text-xs font-medium text-gray-600 px-4 pt-3 pb-2">Order Items</p>
                      <div className="border-t border-green-100">
                        <table className="min-w-full text-sm">
                          <thead className="bg-green-50/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-700 uppercase">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-700 uppercase">Qty</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-700 uppercase">Unit</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-700 uppercase">Price/Unit</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-700 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-50 bg-white">
                            {selectedOrder.items?.length ? selectedOrder.items.map((item, index) => {
                              const pricePerUnit = parseFloat(item.price_at_order || item.price_per_unit || 0);
                              const itemTotal = parseFloat(item.quantity || 0) * pricePerUnit;
                              return (
                                <tr key={index} className="hover:bg-green-50/30 transition-colors">
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {item.product_name || `Product ${item.product_id}`}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {item.quantity || 0}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">
                                    {item.unit_type || 'kg'}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {pricePerUnit > 0 ? `₹${pricePerUnit.toFixed(2)}` : 'Pending'}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                                    {itemTotal > 0 ? `₹${itemTotal.toFixed(2)}` : 'Pending'}
                                  </td>
                                </tr>
                              );
                            }) : (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                    </div>
                                    <p className="text-sm font-medium">No items found</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-green-50/50">
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-right text-xs font-medium text-green-700">
                                Grand Total:
                              </td>
                              <td className="px-4 py-2 text-sm font-bold text-emerald-700">
                                ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-green-600">
            💡 Track your deliveries and manage orders easily. Need help? Contact support.
          </div>
        </div>
      </div>
    </Layout>
  );
}