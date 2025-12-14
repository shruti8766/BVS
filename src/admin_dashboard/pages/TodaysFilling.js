// src/admin_dashboard/pages/TodaysFilling.js
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
    text-align: center;
  }
  th {
    background-color: #2d5016;
    color: white;
  }
  .product-name {
    text-align: left !important;
    font-weight: bold;
  }
}
`;

const TodaysFilling = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');

  const BASE_URL = 'http://localhost:5000';

  // Fetch today's filling orders
  const fetchTodaysFilling = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(`${BASE_URL}/api/admin/orders/todays-filling`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch today\'s filling');
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filling history for a specific date
  const fetchFillingHistory = async (date) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const token = localStorage.getItem('adminToken');
      
      const url = `${BASE_URL}/api/admin/orders/filling-history?date=${date}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch filling history');
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
      fetchFillingHistory(date);
    } else {
      fetchTodaysFilling();
    }
  };

  useEffect(() => {
    // Only fetch today's data if no date is selected
    if (!selectedHistoryDate) {
      fetchTodaysFilling();
    }
    // Refresh every 5 minutes (only when no date selected)
    const interval = setInterval(() => {
      if (!selectedHistoryDate) {
        fetchTodaysFilling();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedHistoryDate]);

  const printTable = () => {
    window.print();
  };

  // Show loading state immediately when data is null
  if (loading || data === null) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading today's filling...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchTodaysFilling}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 no-print">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-green-800">Today's Filling</h1>
              <div className="flex gap-3">
                {data?.products?.length > 0 && (
                  <button
                    onClick={printTable}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    Print
                  </button>
                )}
                <button
                  onClick={selectedHistoryDate ? () => fetchFillingHistory(selectedHistoryDate) : fetchTodaysFilling}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <span>🔄</span>
                  Refresh
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <span className="font-medium">{data?.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📆</span>
                <span className="font-medium">{data?.day}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-2">
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
                📅 View Filling History
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
                    fetchTodaysFilling();
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏨</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Hotels</p>
                    <p className="text-2xl font-bold text-green-700">{data?.hotels?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🥬</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold text-blue-700">{data?.products?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filling Table */}
          {!data?.products || data?.products?.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-12 text-center no-print">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders to Fill</h3>
              <p className="text-gray-600">No orders for today's filling</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden" key={`filling-${data?.target_date || 'today'}`}>
              <div className="overflow-x-auto">
                <div id="printable-table">
                  {/* Invoice Header */}
                  <div style={{ padding: '20px', marginBottom: '20px', borderBottom: '2px solid #16a34a', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <img src="/logo1.png" alt="BVS Logo" style={{ width: '100px', height: '80px', marginRight: '20px' }} />
                      <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#095324ff', margin: '0 0 5px 0' }}>Bhairavnath Vegetables Supplier</h1>
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
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0c682eff', margin: '0 0 5px 0' }}>Today's Filling</h2>
                        <p style={{ margin: '2px 0' }}>{data?.date} ({data?.day})</p>
                      </div>
                    </div>
                  </div>

                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Sr.No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Products</th>
                      {data?.hotels?.map((hotel) => (
                        <th key={hotel.hotel_id} className="px-4 py-3 text-center text-sm font-semibold">
                          {hotel.hotel_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products?.map((product, index) => (
                      <tr key={`${product.product_id}-${data?.target_date}-${index}`} className="border-b border-gray-200 hover:bg-green-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.product_name}</td>
                        {data?.hotels?.map((hotel) => {
                          const quantity = product.quantities[hotel.hotel_id];
                          return (
                            <td key={hotel.hotel_id} className="px-4 py-3 text-center text-sm">
                              {quantity ? (
                                <span className="font-bold text-green-700">
                                  {parseFloat(quantity).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TodaysFilling;
