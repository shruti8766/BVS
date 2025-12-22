// src/admin_dashboard/pages/TodaysHotelsOrders.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';

// Print styles
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .printable-order {
    visibility: visible;
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .printable-order * {
    visibility: visible;
  }
  .invoice-container {
    page-break-after: always;
  }
  .invoice-container:last-child {
    page-break-after: auto;
  }
  .no-print {
    display: none !important;
  }
  .header, .items-table thead {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

const TodaysHotelsOrders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Fetch today's hotels orders
  const fetchTodaysHotelsOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(`${BASE_URL}/api/admin/orders/todays-hotels-orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch today\'s hotels orders');
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotels orders history for a specific date
  const fetchHistoryHotelsOrders = async (date) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const token = localStorage.getItem('adminToken');
      
      const url = `${BASE_URL}/api/admin/orders/hotels-orders-history?date=${date}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch hotels orders history');
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle history date selection
  const handleHistoryDateChange = (e) => {
    const date = e.target.value;
    setSelectedHistoryDate(date);
    if (date) {
      fetchHistoryHotelsOrders(date);
    } else {
      fetchTodaysHotelsOrders();
    }
  };

  useEffect(() => {
    // Only fetch today's data if no date is selected
    if (!selectedHistoryDate) {
      fetchTodaysHotelsOrders();
    }
    // Refresh every 5 minutes (only when no date selected)
    const interval = setInterval(() => {
      if (!selectedHistoryDate) {
        fetchTodaysHotelsOrders();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedHistoryDate]);

  const printOrder = (order) => {
    setSelectedHotel(order);
    setTimeout(() => window.print(), 100);
  };

  const printAll = () => {
    setSelectedHotel('all');
    setTimeout(() => window.print(), 100);
  };

  // Show loading state immediately when data is null
  if (loading || data === null) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading today's hotels orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
              <button
                onClick={fetchTodaysHotelsOrders}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 no-print">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-300">Today's Hotels Orders</h1>
              <div className="flex gap-3">
                {data?.orders?.length > 0 && (
                  <button
                    onClick={printAll}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    Print All
                  </button>
                )}
                <button
                  onClick={selectedHistoryDate ? () => fetchHistoryHotelsOrders(selectedHistoryDate) : fetchTodaysHotelsOrders}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <span>🔄</span>
                  Refresh
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <span className="font-medium">{data?.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📆</span>
                <span className="font-medium">{data?.day}</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              <strong>📋 Orders for Today's Delivery</strong><br/>
              Showing orders placed <strong>yesterday</strong> (for today's delivery).<br/>
              Orders placed today will appear here tomorrow after 1:00 AM.
            </p>
            {data?.target_date && (
              <p className="text-green-600 text-xs mt-1 font-medium">
                📅 Order Date: {data.target_date} → Delivery Date: {data?.date}
              </p>
            )}

            {/* Date Picker for History */}
            <div className="mt-4">
              <label htmlFor="history-date" className="block text-sm font-medium text-gray-700 mb-2">
                📅 View Orders History
              </label>
              <input
                type="date"
                id="history-date"
                value={selectedHistoryDate}
                onChange={handleHistoryDateChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {selectedHistoryDate && (
                <button
                  onClick={() => {
                    setSelectedHistoryDate('');
                    fetchTodaysHotelsOrders();
                  }}
                  className="ml-3 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏨</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-green-700">{data?.total_orders || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {data?.orders?.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-12 text-center no-print">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Today</h3>
              <p className="text-gray-600">No orders for today's delivery</p>
            </div>
          ) : (
            <div className="space-y-6" key={`orders-list-${data?.target_date || 'today'}`}>
              {(data?.orders || [])?.map((order) => (
                <div key={`${order.order_id}-${data?.target_date}`} className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100 no-print">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-green-800">{order.hotel_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Order #{order.order_id}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>📞 {order.phone}</span>
                          <span>📧 {order.email}</span>
                        </div>
                        {order.address && (
                          <p className="text-sm text-gray-600 mt-1">📍 {order.address}</p>
                        )}
                      </div>
                      <button
                        onClick={() => printOrder(order)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <span>🖨️</span>
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-semibold text-gray-700">Sr.No</th>
                          <th className="text-left py-2 text-sm font-semibold text-gray-700">Product</th>
                          <th className="text-left py-2 text-sm font-semibold text-gray-700">Quantity</th>
                          <th className="text-left py-2 text-sm font-semibold text-gray-700">Unit</th>
                          <th className="text-left py-2 text-sm font-semibold text-gray-700">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((item, index) => (
                          <tr key={`${order.order_id}-${index}`} className="border-b border-gray-100">
                            <td className="py-3 text-sm">{index + 1}</td>
                            <td className="py-3 text-sm font-medium">{item.product_name}</td>
                            <td className="py-3 text-sm">{parseFloat(item.quantity).toFixed(2)}</td>
                            <td className="py-3 text-sm">{item.unit_type}</td>
                            <td className="py-3 text-sm text-gray-400">__________</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {order.special_instructions && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Note:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Printable Order (Hidden on screen) */}
          {selectedHotel && (
            <div className="printable-order" style={{ display: 'none' }}>
              <style>
                {`
                  .invoice-container { max-width: 850px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); font-family: 'Georgia', 'Times New Roman', serif; }
                  .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
                  .logo-section { display: flex; align-items: center; gap: 15px; }
                  .logo img { width: 100px; height: auto; }
                  .company-info h1 { font-size: 24px; margin-bottom: 5px; margin: 0; }
                  .company-info p { font-size: 13px; opacity: 0.9; margin: 5px 0 0 0; }
                  .invoice-title h2 { font-size: 32px; font-weight: 300; letter-spacing: 2px; margin: 0; }
                  .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 30px; background: #f8fdf5; }
                  .info-box h3 { color: #2d5016; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                  .info-box p { color: #333; line-height: 1.6; font-size: 14px; margin: 5px 0; }
                  .contact-info { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
                  .invoice-details { background: white; padding: 20px 30px; border-bottom: 2px solid #4a7c2c; }
                  .invoice-meta { display: flex; justify-content: space-between; font-size: 14px; }
                  .invoice-meta span { margin: 0 15px; }
                  .invoice-meta strong { color: #2d5016; }
                  .items-table { padding: 30px; }
                  .items-table table { width: 100%; border-collapse: collapse; }
                  .items-table thead { background: #4a7c2c; color: white; }
                  .items-table th { padding: 12px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
                  .items-table th:last-child { text-align: right; }
                  .items-table tbody tr { border-bottom: 1px solid #e0e0e0; }
                  .items-table tbody tr:hover { background: #f8fdf5; }
                  .items-table td { padding: 15px 12px; font-size: 14px; color: #333; }
                  .items-table td:last-child { text-align: right; }
                  .item-name { font-weight: 600; color: #2d5016; }
                  .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
                  .totals-box { width: 300px; }
                  .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-top: 1px solid #e0e0e0; }
                  .total-row.grand-total { border-top: 2px solid #4a7c2c; font-size: 18px; font-weight: bold; color: #2d5016; padding-top: 15px; margin-top: 10px; }
                  .footer { background: #f8fdf5; padding: 25px 30px; margin-top: 30px; }
                  .footer h4 { color: #2d5016; font-size: 14px; margin-bottom: 10px; }
                  .footer p { font-size: 13px; color: #666; line-height: 1.6; margin: 5px 0; }
                  .thank-you { text-align: center; padding: 20px; background: #2d5016; color: white; font-size: 14px; }
                `}
              </style>
              {selectedHotel === 'all' ? (
                // Print all orders
                (data?.orders || []).map((order) => (
                  <div key={`print-${order.order_id}-${data?.target_date}`} className="invoice-container">
                    <div className="header">
                      <div className="logo-section">
                        <div className="logo">
                          <img src="/mainlogo.jpg" alt="BVS Logo" />
                        </div>
                        <div className="company-info">
                          <h1>Bhairavnath Vegetables Supplier</h1>
                          <p>Fresh Vegetables • Fruits • Pulses & More</p>
                        </div>
                      </div>
                      <div className="invoice-title">
                        <h2>ORDER</h2>
                      </div>
                    </div>
                    
                    <div className="info-section">
                      <div className="info-box">
                        <h3>From</h3>
                        <p><strong>Bhairavnath Vegetables Supplier</strong></p>
                        <p>Owner: Maruti Bajirao Gaikwad</p>
                        <div className="contact-info">
                          <span>📧 surajgaikwad9812@gmail.com</span>
                        </div>
                        <div className="contact-info">
                          <span>📞 +91 9881325644</span>
                        </div>
                      </div>
                      
                      <div className="info-box">
                        <h3>Order For</h3>
                        <p><strong>{order.hotel_name}</strong></p>
                        {order.email && <p>📧 {order.email}</p>}
                        {order.phone && <p>📞 {order.phone}</p>}
                        {order.address && <p>📍 {order.address}</p>}
                      </div>
                    </div>
                    
                    <div className="invoice-details">
                      <div className="invoice-meta">
                        <div>
                          <span><strong>Order No:</strong> {order.order_id}</span>
                          <span><strong>Date:</strong> {data?.date}</span>
                        </div>
                        <div>
                          <span><strong>Day:</strong> {data?.day}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="items-table">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(order.items || []).map((item, index) => (
                            <tr key={`${order.order_id}-${index}`}>
                              <td>{index + 1}</td>
                              <td className="item-name">{item.product_name}</td>
                              <td>{parseFloat(item.quantity).toFixed(2)}</td>
                              <td>{item.unit_type}</td>
                              <td>__________</td>
                              <td>__________</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="totals">
                        <div className="totals-box">
                          <div className="total-row">
                            <span>Subtotal:</span>
                            <span>__________</span>
                          </div>
                          <div className="total-row grand-total">
                            <span>TOTAL:</span>
                            <span>__________</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="footer">
                      <div>
                        <h4>Payment Terms</h4>
                        <p>Payment is due within 10 days from the invoice date. We accept cash, bank transfer, and UPI payments.</p>
                        {order.special_instructions && (
                          <p><strong>Special Instructions:</strong> {order.special_instructions}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="thank-you">
                      Thank you for your business! For any queries, contact 9881325644.
                    </div>
                  </div>
                ))
              ) : (
                // Print single order
                <div className="invoice-container">
                  <div className="header">
                    <div className="logo-section">
                      <div className="logo">
                        <img src="/mainlogo.jpg" alt="BVS Logo" />
                      </div>
                      <div className="company-info">
                        <h1>Bhairavnath Vegetables Supplier</h1>
                        <p>Fresh Vegetables • Fruits • Pulses & More</p>
                      </div>
                    </div>
                    <div className="invoice-title">
                      <h2>ORDER</h2>
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <div className="info-box">
                      <h3>From</h3>
                      <p><strong>Bhairavnath Vegetables Supplier</strong></p>
                      <p>Owner: Maruti Bajirao Gaikwad</p>
                      <div className="contact-info">
                        <span>📧 surajgaikwad9812@gmail.com</span>
                      </div>
                      <div className="contact-info">
                        <span>📞 +91 9881325644</span>
                      </div>
                    </div>
                    
                    <div className="info-box">
                      <h3>Order For</h3>
                      <p><strong>{selectedHotel.hotel_name}</strong></p>
                      {selectedHotel.email && <p>📧 {selectedHotel.email}</p>}
                      {selectedHotel.phone && <p>📞 {selectedHotel.phone}</p>}
                      {selectedHotel.address && <p>📍 {selectedHotel.address}</p>}
                    </div>
                  </div>
                  
                  <div className="invoice-details">
                    <div className="invoice-meta">
                      <div>
                        <span><strong>Order No:</strong> {selectedHotel.order_id}</span>
                        <span><strong>Date:</strong> {data?.date}</span>
                      </div>
                      <div>
                        <span><strong>Day:</strong> {data?.day}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Item Description</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHotel?.items || []).map((item, index) => (
                          <tr key={`${selectedHotel.order_id}-${index}`}>
                            <td>{index + 1}</td>
                            <td className="item-name">{item.product_name}</td>
                            <td>{parseFloat(item.quantity).toFixed(2)}</td>
                            <td>{item.unit_type}</td>
                            <td>__________</td>
                            <td>__________</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="totals">
                      <div className="totals-box">
                        <div className="total-row">
                          <span>Subtotal:</span>
                          <span>__________</span>
                        </div>
                        <div className="total-row grand-total">
                          <span>TOTAL:</span>
                          <span>__________</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="footer">
                    <div>
                      <h4>Payment Terms</h4>
                      <p>Payment is due within 10 days from the invoice date. We accept cash, bank transfer, and UPI payments.</p>
                      {selectedHotel.special_instructions && (
                        <p><strong>Special Instructions:</strong> {selectedHotel.special_instructions}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="thank-you">
                    Thank you for your business! For any queries, contact 9881325644.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TodaysHotelsOrders;
