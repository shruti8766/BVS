// src/hotel_dashboard/components/pages/billing.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';  // Assume this exposes setUser if needed

export default function HotelBills() {
  const { user, logout, setUser } = useAuth();  // ADD: Destructure setUser (if available; else use local state below)
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  // NEW: Local fallback for profile (if setUser not exposed)
  const [hotelProfile, setHotelProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Fetch bills, orders, products, AND profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');

        // NEW: Fetch profile FIRST (ensures full details for invoice)
        const profileRes = await fetch(`${BASE_URL}/api/hotel/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileRes.json();
        console.log('Fetched profile:', profileData);  // Debug: Check if full details load

        // Merge with existing user (via setUser if available, else local)
        if (setUser) {
          setUser(prev => ({ ...prev, ...profileData }));
        } else {
          setHotelProfile(profileData);  // Fallback local state
        }

        // Fetch products
        const productsRes = await fetch(`${BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          // Extract products array from response {products: [...], success: true}
          const productsArray = productsData.products || (Array.isArray(productsData) ? productsData : []);
          setProducts(productsArray);
        }

        // Fetch bills
        const billsRes = await fetch(`${BASE_URL}/api/hotel/bills`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!billsRes.ok) {
          if (billsRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch bills');
        }

        const billsData = await billsRes.json();
        console.log('Fetched bills for hotel:', user?.hotel_name, billsData); // Debug log
        // Extract bills array from response {bills: [...], success: true}
        const billsArray = billsData.bills || (Array.isArray(billsData) ? billsData : []);
        setBills(billsArray);

        // Fetch orders (for linking/context)
        const ordersRes = await fetch(`${BASE_URL}/api/hotel/orders`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!ordersRes.ok) {
          if (ordersRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch orders');
        }

        const ordersData = await ordersRes.json();
        console.log('Fetched orders for hotel:', user?.hotel_name, ordersData); // Debug log
        // Extract orders array from response {orders: [...], success: true}
        const ordersArray = ordersData.orders || (Array.isArray(ordersData) ? ordersData : []);
        setOrders(ordersArray);
      } catch (err) {
        console.error('Fetch error:', err); // Debug log
        setError(err.message);
        setBills([]);
        setOrders([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if user is logged in
      fetchData();
    }
  }, [user, logout, navigate, setUser]);  // ADD: setUser to deps if used

  // Get price for product
  const getPriceForProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? parseFloat(product.price_per_unit || 0) : 0;
  };

  // Format date
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  // Stats (unchanged)
  const stats = bills.reduce(
    (acc, b) => {
      acc.total++;
      if (b.paid) acc.paid++;
      else acc.pending++;
      return acc;
    },
    { total: 0, paid: 0, pending: 0 }
  );

  // Filtered bills (unchanged)
  const filtered = filter === 'all'
    ? bills
    : filter === 'paid'
      ? bills.filter(b => b.paid)
      : bills.filter(b => !b.paid);

  // Find order for bill (unchanged)
  const getOrderForBill = (orderId) => orders.find(o => o.order_id === orderId) || {};

  // UPDATED: viewBill – Use merged/fresh profile
  const viewBill = async (bill) => {  // ADD: async for potential re-fetch
    // Use user (now merged) or fallback to local profile
    let hotel = user || {};
    if (!hotel.hotel_name && hotelProfile) {
      hotel = { ...hotel, ...hotelProfile };
    }

    // FINAL FALLBACK: If still missing, fetch fresh (rare, but bulletproof)
    if (!hotel.hotel_name) {
      try {
        const token = localStorage.getItem('hotelToken');
        const profileRes = await fetch(`${BASE_URL}/api/hotel/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const freshProfile = await profileRes.json();
          hotel = { ...hotel, ...freshProfile };
          console.log('Fetched fresh profile for invoice:', freshProfile);  // Debug
        }
      } catch (err) {
        console.error('Profile fetch in viewBill failed:', err);
      }
    }

    const order = getOrderForBill(bill.order_id);
    const amount = parseFloat(bill.total_amount || bill.amount || 0);
    const billDate = new Date(bill.bill_date);
    const dueDate = new Date(billDate.getTime() + 10 * 24 * 60 * 60 * 1000);

    console.log('📋 View Bill - Bill Items:', bill.items);
    console.log('📋 View Bill - Order Items:', order.items);
    console.log('📋 Bill status:', bill.bill_status, 'Pricing status:', bill.pricing_status);

    // Use bill.items (from backend) first, fallback to order.items
    const billItems = bill.items && bill.items.length > 0 ? bill.items : (order.items || []);
    
    // Use LOCKED prices from price_at_order (finalized prices), not current product prices
    const enrichedItems = billItems?.map(item => {
      const lockedPrice = parseFloat(item.price_at_order);
      const fallbackPrice = parseFloat(item.price_per_unit || getPriceForProduct(item.product_id) || 0);
      const finalPrice = lockedPrice || fallbackPrice;
      
      console.log(`📦 ${item.product_name}: price_at_order=${item.price_at_order}, using ₹${finalPrice}`);
      
      return {
        ...item,
        price_per_unit: finalPrice
      };
    }) || [];

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

  // UPDATED: Header – Use merged profile for display too
  const displayName = user?.hotel_name || hotelProfile?.hotel_name || 'Hotel User';

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
              <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your bills...</p>
            </div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header – UPDATED */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center">
              <span className="mr-3">💰</span> My Bills
            </h1>
            <p className="text-green-700">View your invoices and payment history, {displayName}.</p>
          </div>

          {/* Error (unchanged) */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Stats Cards (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { key: 'total', label: 'Total Bills', color: 'bg-green-100 text-green-800', icon: '📋' },
              { key: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: '✅' },
              { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
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

          {/* Filters (unchanged) */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-green-700">Filter by status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Bills</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table (unchanged) */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-green-200">
                <thead className="bg-green-50">
                  <tr>
                    {['ID', 'Order ID', 'Amount', 'Date', 'Status', 'Payment Method', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">💳</span>
                          <p className="text-lg text-green-800">No bills yet</p>
                          <p className="text-green-600">Place an order to generate invoices.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const amount = parseFloat(b.total_amount || b.amount || 0);
                      const isDraft = b.bill_status === 'draft' || b.is_draft;
                      
                      return (
                        <tr key={b.bill_id} className="hover:bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                            #{b.bill_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                            #{b.order_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-800">
                            {isDraft ? (
                              <span className="text-orange-600 italic">Calculating...</span>
                            ) : (
                              `₹${amount.toFixed(2)}`
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(b.bill_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              isDraft ? 'bg-orange-100 text-orange-800' :
                              b.bill_status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              b.bill_status === 'paid' || b.paid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isDraft ? '⏳ Awaiting Prices' :
                               b.bill_status === 'sent' ? '📧 Sent' :
                               b.bill_status === 'paid' || b.paid ? '✅ Paid' : '⏳ Unpaid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {isDraft ? '—' : (b.payment_method || 'N/A')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isDraft ? (
                              <span className="text-gray-400 italic">Pending</span>
                            ) : (
                              <button
                                onClick={() => viewBill(b)}
                                className="text-green-600 hover:text-green-800 underline text-sm"
                              >
                                View & Print
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer (unchanged) */}
          <div className="mt-8 text-center text-sm text-green-600">
            💡 Questions about a bill? Contact support.
          </div>
        </div>
      </div>
    </Layout>
  );
}