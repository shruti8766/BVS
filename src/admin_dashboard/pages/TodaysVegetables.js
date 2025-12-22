// src/admin_dashboard/pages/TodaysVegetables.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';

// Print styles
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  #printable-table, #printable-table * {
    visibility: visible;
  }
  #printable-table {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f0f0f0;
  }
}
`;

const TodaysVegetables = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Fetch today's vegetables
  const fetchTodaysVegetables = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null); // Clear old data first!
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(`${BASE_URL}/api/admin/orders/todays-vegetables`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch today\'s vegetables');
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vegetables history for a specific date
  const fetchHistoryVegetables = async (date) => {
    try {
      setLoading(true);
      setError(null);
      setData(null); // Clear old data first!
      const token = localStorage.getItem('adminToken');
      
      const url = `${BASE_URL}/api/admin/orders/vegetables-history?date=${date}`;
      console.log('[TODAYS_VEG_HISTORY] Fetching vegetables for date:', date);
      console.log('[TODAYS_VEG_HISTORY] URL:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Vegetables history API error:', res.status, errorBody);
        throw new Error(`API Error ${res.status}: ${errorBody}`);
      }

      const result = await res.json();
      console.log('[TODAYS_VEG_HISTORY] Received data:', result);
      setData(result);
    } catch (e) {
      console.error('Vegetables history fetch error:', e);
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
      fetchHistoryVegetables(date);
    } else {
      fetchTodaysVegetables();
    }
  };

  useEffect(() => {
    // Only fetch today's data if no date is selected
    if (!selectedHistoryDate) {
      fetchTodaysVegetables();
    }
    // Refresh every 5 minutes (only when no date selected)
    const interval = setInterval(() => {
      if (!selectedHistoryDate) {
        fetchTodaysVegetables();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedHistoryDate]);

  // Show loading state immediately when data is null
  if (loading || data === null) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading today's vegetables...</p>
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
                onClick={fetchTodaysVegetables}
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
          {/* Header with Date */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-300">Today's Vegetables</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>🖨️</span>
                  Print
                </button>
                <button
                  onClick={selectedHistoryDate ? () => fetchHistoryVegetables(selectedHistoryDate) : fetchTodaysVegetables}
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
              {selectedHistoryDate 
                ? '📜 Historical view of vegetables for selected date'
                : (
                  <span>
                    <strong>📋 Vegetables for Today's Delivery</strong><br/>
                    Showing vegetables from orders placed <strong>yesterday</strong>.<br/>
                    Orders placed today will appear here tomorrow after 1:00 AM.
                  </span>
                )}
            </p>
            {data?.target_date && (
              <p className="text-green-600 dark:text-green-300 text-xs mt-1 font-medium">
                📅 Order Date: {data.target_date} → Delivery Date: {data?.date || data?.selected_date}
                {selectedHistoryDate && <span className="ml-2 text-blue-600">(History View)</span>}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🥬</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold text-green-700">{data?.total_items || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-700">{data?.total_orders || 0}</p>
                </div>
              </div>
            </div>

            {Object.entries(data?.category_totals || {}).slice(0, 2).map(([category, totals]) => (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {category === 'Vegetables' ? '🥕' : category === 'Fruits' ? '🍎' : '🌱'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{category}</p>
                    <p className="text-2xl font-bold text-emerald-700">{totals.count} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Date Picker */}
          <div className="mb-6 flex items-center gap-2 flex-wrap no-print">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Date:</span>
            <input
              type="date"
              value={selectedHistoryDate}
              onChange={handleHistoryDateChange}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Leave empty for today"
            />
            {selectedHistoryDate && (
              <button
                onClick={() => {
                  setSelectedHistoryDate('');
                  fetchTodaysVegetables();
                }}
                className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-800"
              >
                Clear (Show Today)
              </button>
            )}
            {!selectedHistoryDate && (
              <span className="text-sm text-green-600 dark:text-green-300 font-medium italic">📦 Showing today's delivery (from yesterday's orders)</span>
            )}
          </div>

          {/* Printable Table */}
          <div id="printable-table" key={`table-${data?.target_date || data?.selected_date || 'today'}`}>
            <div style={{ padding: '20px' }}>
              {/* Invoice Header */}
              <div style={{ marginBottom: '30px', borderBottom: '2px solid #16a34a', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <img src="/logo1.png" alt="BVS Logo" style={{ width: '100px', height: '80px', marginRight: '20px' }} />
                  <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0b682dff', margin: '0 0 5px 0' }}>Bhairavnath Vegetables Supplier</h1>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Fresh Vegetables • Fruits • Pulses & More</p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>Owner: Maruti Bajirao Gaikwad</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                  <div>
                    <p style={{ margin: '2px 0' }}>📧 Email: surajgaikwad9812@gmail.com</p>
                    <p style={{ margin: '2px 0' }}>📞 Phone: +91 9881325644</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#085c27ff', margin: '0 0 5px 0' }}>Today's Vegetables</h2>
                    <p style={{ margin: '2px 0' }}>{data?.date} ({data?.day})</p>
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }} key={`inner-table-${data?.target_date || 'today'}`}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Sr.No</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Qty</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.vegetables || []).map((veg, index) => (
                    <tr key={`${veg.product_id}-${index}`}>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{veg.product_name}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{parseFloat(veg.total_quantity).toFixed(2)}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{veg.unit_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>



          {/* Category Summary */}
          {data?.category_totals && Object.keys(data.category_totals).length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 p-6 no-print">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Category Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(data.category_totals).map(([category, totals]) => (
                  <div key={category} className="border border-green-100 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{category}</span>
                      <span className="text-2xl">
                        {category === 'Vegetables' ? '' : category === 'Fruits' ? '' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>{totals.count} different items</p>
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        Total: {totals.total_quantity.toFixed(2)} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TodaysVegetables;
