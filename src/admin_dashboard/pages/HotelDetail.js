import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usersApi } from '../utils/api';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [hotel, setHotel] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]); // NEW: Bills state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false); // NEW: Edit bill modal
  const [editingBill, setEditingBill] = useState(null); // NEW: Current bill being edited
  const [selectedOrder, setSelectedOrder] = useState(null); // NEW: For order details modal
  const [orderForm, setOrderForm] = useState({ delivery_date: '', special_instructions: '' });
  const [billForm, setBillForm] = useState({ paid: false, payment_method: '', paid_date: '', comments: '' }); // NEW: Bill edit form
  const [quantities, setQuantities] = useState({}); // {productId: quantity}
  const [orderLoading, setOrderLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false); // NEW: Bill edit loading

  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchHotel();
    fetchOrders();
    fetchBills(); // NEW: Fetch bills
    fetchProducts();
  }, [id, token, navigate]);

  const fetchHotel = async () => {
    try {
      const data = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.ok) throw new Error('Failed to fetch hotel');
      const response = await data.json();
      // Backend returns {user: {...}, success: true}, extract the user
      setHotel(response.user || response);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/orders?user_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.ok) throw new Error('Failed to fetch orders');
      const response = await data.json();
      // Backend returns {orders: [...], success: true}, extract the orders array
      const ordersData = response.orders || response || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (e) {
      setError(e.message);
    }
  };

  // NEW: Fetch bills for the hotel
  const fetchBills = async () => {
    try {
      const data = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/bills?user_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.ok) throw new Error('Failed to fetch bills');
      const response = await data.json();
      // Backend might return {bills: [...]} or just array, handle both
      const billsData = response.bills || response || [];
      setBills(Array.isArray(billsData) ? billsData : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await fetch('https://api-aso3bjldka-uc.a.run.app/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.ok) throw new Error('Failed to fetch products');
      const productsData = await data.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, qty) => {
    setQuantities(prev => ({ ...prev, [productId]: parseInt(qty) || 0 }));
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setOrderLoading(true);
    try {
      const items = products
        .map(p => ({ product_id: p.id, quantity: quantities[p.id] || 0 }))
        .filter(item => item.quantity > 0);
      if (items.length === 0) {
        alert('Add at least one item');
        return;
      }
      const orderData = {
        user_id: parseInt(id),
        delivery_date: orderForm.delivery_date,
        items,
        special_instructions: orderForm.special_instructions
      };
      const orderRes = await fetch('https://api-aso3bjldka-uc.a.run.app/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderData)
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const orderResult = await orderRes.json();
      const orderId = orderResult.order_id;

      // FIXED: Removed explicit bill creation (backend handles it automatically to avoid duplicates)

      alert('Order created successfully!');
      setShowCreateOrder(false);
      setOrderForm({ delivery_date: '', special_instructions: '' });
      setQuantities({});
      fetchOrders(); // Refresh orders
      fetchBills(); // NEW: Refresh bills (picks up backend-created bill)
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setOrderLoading(false);
    }
  };

  // NEW: Update bill
  const updateBill = async (e) => {
    e.preventDefault();
    setBillLoading(true);
    try {
      const updateData = {
        paid: billForm.paid,
        payment_method: billForm.payment_method,
        paid_date: billForm.paid_date,
        comments: billForm.comments
      };
      const res = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/bills/${editingBill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update bill');
      }
      alert('Bill updated successfully!');
      setShowEditBill(false);
      setEditingBill(null);
      setBillForm({ paid: false, payment_method: '', paid_date: '', comments: '' });
      fetchBills(); // Refresh bills
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setBillLoading(false);
    }
  };

  // NEW: Open edit modal
  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setBillForm({
      paid: bill.paid || false,
      payment_method: bill.payment_method || '',
      paid_date: bill.paid_date || '',
      comments: bill.comments || ''
    });
    setShowEditBill(true);
  };

  // NEW: View bill (adapted from hotel billing)
  const viewBill = async (bill) => {
    // Fetch fresh bill data from backend to ensure order_items are included
    let freshBill = bill;
    try {
      const billRes = await fetch(`https://api-aso3bjldka-uc.a.run.app/api/admin/bills?user_id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (billRes.ok) {
        const billsData = await billRes.json();
        const billsArray = billsData.bills || billsData || [];
        const freshBillData = billsArray.find(b => b.id == bill.id);
        if (freshBillData) {
          freshBill = freshBillData;
          console.log('✅ Fetched fresh bill with items from backend');
        }
      }
    } catch (err) {
      console.warn('Could not fetch fresh bill data, using cached bill');
    }

    // Use hotel details
    const hotelDetails = hotel || {};
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
    
    // Helper function to get product price
    const getPriceForProduct = (productId) => {
      const prod = products.find(p => p.id == productId);
      return prod?.price || 0;
    };

    // Enrich items with pricing information
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
      const amount = parseFloat(freshBill.total_amount || freshBill.amount || 0);
      itemsHtml = `
        <tr>
          <td>1</td>
          <td class="item-name">Vegetables & Fruits Supply</td>
          <td>1</td>
          <td>₹${amount.toFixed(2)}</td>
          <td>₹${amount.toFixed(2)}</td>
        </tr>
      `;
      subtotal = amount;
    }

    // Use bill's tax_rate or default 5%
    const billDate = new Date(freshBill.bill_date);
    const dueDate = freshBill.due_date ? new Date(freshBill.due_date) : new Date(billDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const taxRate = parseFloat(freshBill.tax_rate || 5) / 100;
    const discount = parseFloat(freshBill.discount || 0);
    const discountedSubtotal = subtotal - discount;
    const tax = discountedSubtotal * taxRate;
    const grandTotal = discountedSubtotal + tax;

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
          @page { margin: 0; size: A4 portrait; }
          @media print { 
            body { 
              background: white; 
              padding: 0; 
              margin: 0;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            } 
            .invoice-container { 
              box-shadow: none; 
              max-width: 100%; 
              margin: 0;
              padding: 0;
            } 
            .print-button { display: none; } 
            .header, thead, thead th { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background: #4a7c2c !important; 
            } 
            .header { 
              background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%) !important; 
            } 
            thead { 
              background: #4a7c2c !important; 
            } 
            .header *, .invoice-title h2, thead th { 
              color: white !important; 
            } 
            .invoice-container { 
              page-break-after: avoid; 
            } 
          }
          .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { background: none; border-radius: 0; width: auto; height: auto; display: flex; align-items: center; justify-content: center; }
          .logo img { width: 100px; height: auto; }
          .company-info h1 { font-size: 24px; margin-bottom: 5px; }
          .company-info p { font-size: 13px; opacity: 0.9; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 32px; font-weight: 300; letter-spacing: 2px; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 20px; background: #f8fdf5; }
          .info-box h3 { color: #2d5016; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .info-box p { color: #333; line-height: 1.6; font-size: 14px; }
          .contact-info { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
          .contact-info svg { width: 16px; height: 16px; fill: #4a7c2c; }
          .invoice-details { background: white; padding: 20px 20px; border-bottom: 2px solid #4a7c2c; }
          .invoice-meta { display: flex; justify-content: space-between; font-size: 14px; }
          .invoice-meta div { display: flex; gap: 30px; }
          .invoice-meta strong { color: #2d5016; }
          .items-table { padding: 20px; }
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
          .footer { background: #f8fdf5; padding: 20px; margin-top: 30px; }
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
              <p><strong>${hotelDetails.hotel_name || 'Hotel'}</strong></p>
              <p>${hotelDetails.email || 'N/A'}</p>
              <p>${hotelDetails.address || 'N/A'}</p>
              <p>${hotelDetails.phone || 'N/A'}</p>
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
    if (printWindow && printWindow.document) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Ask user if they want to print immediately
      if (window.confirm('Open invoice for printing?')) {
        printWindow.print();
      } else {
        printWindow.focus();
      }
    } else {
      alert('Failed to open print window. Please allow pop-ups and try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-8 transition-colors duration-200">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 dark:border-green-900 border-t-green-600 dark:border-t-green-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading hotel details…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-8 transition-colors duration-200">
          <div className={`bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md w-full shadow-lg transition-colors duration-200`}>
            <p className="text-red-800 dark:text-red-300 font-medium mb-4">Error: {error}</p>
            <button onClick={() => navigate('/admin/hotels')} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all">
              Back to Hotels
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-8 transition-colors duration-200">
          <div className="text-center text-gray-600 dark:text-gray-400 font-medium">Hotel not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 p-8 w-full transition-colors duration-200">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">
              {safe(hotel.hotel_name)} Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Manage details and orders for this hotel</p>
          </div>
          <button
            onClick={() => navigate('/admin/hotels')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            ← Back to Hotels
          </button>
        </div>

        {/* Hotel Details Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden mb-10 transition-colors duration-200">
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-green-900 border-b-2 border-green-100 dark:border-green-900">
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Hotel Details</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0">
                {safe(hotel.hotel_image) ? (
                  <img
                    src={hotel.hotel_image}
                    alt={hotel.hotel_name}
                    className="w-64 h-48 object-cover rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-64 h-48 bg-green-50 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-green-200 dark:border-green-900">
                    <span className="text-4xl">🏨</span>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(hotel.username)}</p></div>
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(hotel.email)}</p></div>
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(hotel.phone)}</p></div>
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</p><p className="font-semibold text-green-800 dark:text-green-300">{safe(hotel.address)}</p></div>
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p><p className="font-semibold text-green-800 dark:text-green-300">{formatDate(hotel.created_at)}</p></div>
                <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</p><p className="font-semibold text-green-800 dark:text-green-300">{formatDate(hotel.last_login)}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden mb-10 transition-colors duration-200">
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-green-900 border-b-2 border-green-100 dark:border-green-900 flex justify-between items-center">
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Orders</h2>
            <button
              onClick={() => setShowCreateOrder(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              + New Order
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50 dark:bg-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-300 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No orders yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">#{o.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(o.order_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(o.delivery_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatCurrency(o.total_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setSelectedOrder(o)}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs underline transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-green-100 dark:border-green-900 transition-colors duration-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">
                    Order Details - #{selectedOrder.id}
                  </h3>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-green-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-green-900 p-6 rounded-xl border-2 border-green-100 dark:border-green-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-green-800 dark:text-green-300">{safe(hotel?.hotel_name)}</h4>
                        <p className="text-gray-600 dark:text-gray-400">Order #{selectedOrder.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(selectedOrder.total_amount)}</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                        }`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.order_date || selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Date</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.delivery_date)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Info</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{safe(hotel?.email)}</p>
                        <p className="text-gray-600 dark:text-gray-400">{safe(hotel?.phone)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedOrder.special_instructions && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Special Instructions</p>
                      <p className="text-amber-800 dark:text-amber-300">{selectedOrder.special_instructions}</p>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="bg-white dark:bg-gray-800 border-2 border-green-100 dark:border-green-900 rounded-xl overflow-hidden transition-colors duration-200">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 px-6 pt-6">Order Items</p>
                    <div className="border-t-2 border-green-100 dark:border-green-900">
                      <table className="min-w-full">
                        <thead className="bg-green-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Unit</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Price/Unit</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {selectedOrder.items?.length ? selectedOrder.items.map((item, index) => {
                            const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.price_at_order || item.price_per_unit || 0);
                            return (
                              <tr key={index} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {safe(item.product_name, `Product ${item.product_id}`)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                  {safe(item.quantity, 0)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                  {safe(item.unit_type, 'kg')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                  ₹{parseFloat(item.price_at_order || item.price_per_unit || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  ₹{itemTotal.toFixed(2)}
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-300 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                  </div>
                                  <p className="font-medium">No items found</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-green-50">
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-green-700">
                              Grand Total:
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-700">
                              {formatCurrency(selectedOrder.total_amount)}
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

        {/* NEW: Bills Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-100 dark:border-green-900 overflow-hidden mb-10 transition-colors duration-200">
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-green-900 border-b-2 border-green-100 dark:border-green-900">
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Bills</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-50/50 dark:bg-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-300 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No bills yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bills.map(b => {
                    const amount = parseFloat(b.total_amount || b.amount || 0);
                    return (
                      <tr key={b.id} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">#{b.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">#{b.order_id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatCurrency(amount)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(b.bill_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            b.paid ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                          }`}>
                            {b.paid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{b.payment_method || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewBill(b)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs underline transition-colors"
                            >
                              View & Print
                            </button>
                            <button
                              onClick={() => handleEditBill(b)}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs underline transition-colors"
                            >
                              Edit
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
        </div>

        {/* Create Order Modal */}
        {showCreateOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border-2 border-green-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">New Order for {hotel.hotel_name}</h3>
                  <button onClick={() => setShowCreateOrder(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <form onSubmit={createOrder} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={orderForm.delivery_date}
                      onChange={e => setOrderForm({ ...orderForm, delivery_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                    <textarea
                      value={orderForm.special_instructions}
                      onChange={e => setOrderForm({ ...orderForm, special_instructions: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {products.map(p => (
                        <div key={p.id} className="border-2 border-green-100 p-3 rounded-xl hover:border-green-300 transition-colors">
                          <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover rounded-xl mb-2" />
                          <p className="font-medium text-green-800">{p.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(p.price_per_unit)} / {p.unit_type}</p>
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            value={quantities[p.id] || ''}
                            onChange={e => handleQuantityChange(p.id, e.target.value)}
                            className="w-full mt-2 px-3 py-2 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={orderLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {orderLoading ? 'Creating...' : 'Create Order'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Edit Bill Modal */}
        {showEditBill && editingBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border-2 border-green-100 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-800">Edit Bill #{editingBill.id}</h3>
                  <button onClick={() => { setShowEditBill(false); setEditingBill(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <form onSubmit={updateBill} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid</label>
                  <input
                    type="checkbox"
                    checked={billForm.paid}
                    onChange={e => setBillForm({ ...billForm, paid: e.target.checked })}
                    className="w-4 h-4 text-green-600 bg-green-100 border-2 border-green-300 rounded focus:ring-4 focus:ring-green-500/20"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <input
                      type="text"
                      value={billForm.payment_method}
                      onChange={e => setBillForm({ ...billForm, payment_method: e.target.value })}
                      placeholder="e.g., Cash, UPI, Bank Transfer"
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                    <input
                      type="date"
                      value={billForm.paid_date}
                      onChange={e => setBillForm({ ...billForm, paid_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea
                      value={billForm.comments}
                      onChange={e => setBillForm({ ...billForm, comments: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={billLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {billLoading ? 'Updating...' : 'Update Bill'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HotelDetail;