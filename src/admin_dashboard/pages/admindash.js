// src/admin_dashboard/pages/admindash.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Admindash = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Configuration
  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';
  // const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app'; // Uncomment for local testing

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
        
        const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          // Try to get detailed error from server
          let errorMsg = 'Failed to fetch analytics';
          try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = `Server error: ${res.status} ${res.statusText}`;
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        console.log('✅ Analytics data fetched:', data);
        setAnalytics(data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [BASE_URL]);

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Handle refresh analytics
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');
      
      const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        let errorMsg = 'Failed to fetch analytics';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log('✅ Analytics refreshed:', data);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 dark:border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md w-full">
            <p className="text-red-800 dark:text-red-300 font-medium mb-2">Error loading analytics</p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Ensure all nested structures exist with defaults (lenient validation)
  const safeAnalytics = {
    revenue: {
      yesterday: analytics?.revenue?.yesterday || 0,
      month: analytics?.revenue?.month || 0,
      year: analytics?.revenue?.year || 0
    },
    hotels: {
      total_hotels: analytics?.hotels?.total_hotels || 0,
      unpaid_hotels_count: analytics?.hotels?.unpaid_hotels_count || 0,
      unpaid_hotels: Array.isArray(analytics?.hotels?.unpaid_hotels) ? analytics.hotels.unpaid_hotels : [],
      revenue_by_hotel: Array.isArray(analytics?.hotels?.revenue_by_hotel) ? analytics.hotels.revenue_by_hotel : []
    },
    trends: {
      daily: Array.isArray(analytics?.trends?.daily) ? analytics.trends.daily : [],
      monthly: Array.isArray(analytics?.trends?.monthly) ? analytics.trends.monthly : []
    },
    products: {
      top_products: Array.isArray(analytics?.top_products) ? analytics.top_products : []
    }
  };

  // Log safe analytics for debugging
  if (analytics) {
    console.log('📊 Safe Analytics:', safeAnalytics);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 p-6 transition-colors duration-200">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-1">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Comprehensive financial insights and revenue tracking</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Yesterday's Revenue</h3>
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(safeAnalytics.revenue.yesterday)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month's Revenue</h3>
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(safeAnalytics.revenue.month)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Year's Revenue</h3>
              <svg className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
              {formatCurrency(safeAnalytics.revenue.year)}
            </div>
          </div>
        </div>

        {/* Hotel Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Hotels</h3>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{safeAnalytics.hotels.total_hotels}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Hotels with Unpaid Bills</h3>
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{safeAnalytics.hotels.unpaid_hotels_count}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Unpaid Amount</h3>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(safeAnalytics.hotels.unpaid_hotels.reduce((sum, h) => sum + parseFloat(h.unpaid_total || 0), 0))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h4 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4">Daily Revenue Trend (Last 30 Days)</h4>
            {safeAnalytics.trends.daily && safeAnalytics.trends.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={safeAnalytics.trends.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                <p>No daily trend data available</p>
              </div>
            )}
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-4">Monthly Revenue Trend</h4>
            {safeAnalytics.trends.monthly && safeAnalytics.trends.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeAnalytics.trends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#34d399" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                <p>No monthly trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Hotel Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden transition-colors duration-200">
          <div className="px-6 py-4 bg-green-50 dark:bg-green-900 border-b border-green-100 dark:border-green-800">
            <h4 className="text-lg font-bold text-green-800 dark:text-green-300">Revenue by Hotel (Top 10)</h4>
          </div>
          {safeAnalytics.hotels.revenue_by_hotel.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-green-50/50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Hotel Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Total Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Unpaid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50 dark:divide-gray-700">
                  {safeAnalytics.hotels.revenue_by_hotel.map((hotel, index) => (
                    <tr key={index} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{hotel.hotel_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{hotel.total_orders || 0}</td>
                      <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-300">{formatCurrency(hotel.total_revenue || 0)}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">{formatCurrency(hotel.paid_amount || 0)}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{formatCurrency(hotel.unpaid_amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No hotel revenue data available yet</p>
            </div>
          )}
        </div>

        {/* Hotels with Unpaid Bills */}
        {safeAnalytics.hotels.unpaid_hotels.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg shadow-sm border-2 border-orange-200 dark:border-orange-800 mb-8 overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 bg-orange-100 dark:bg-orange-900 border-b border-orange-200 dark:border-orange-800">
              <h4 className="text-lg font-bold text-orange-800 dark:text-orange-300">Hotels with Unpaid Bills</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-orange-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Hotel Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Unpaid Bills</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Total Unpaid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {safeAnalytics.hotels.unpaid_hotels.map((hotel, index) => (
                    <tr key={index} className="hover:bg-orange-50/30 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{hotel.hotel_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div>{hotel.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{hotel.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-orange-700 dark:text-orange-300 font-semibold">{hotel.unpaid_bills_count}</td>
                      <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{formatCurrency(hotel.unpaid_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="px-6 py-4 bg-green-50 dark:bg-green-900 border-b border-green-100 dark:border-green-800">
            <h4 className="text-lg font-bold text-green-800 dark:text-green-300">Top Products by Revenue</h4>
          </div>
          {safeAnalytics.products.top_products && safeAnalytics.products.top_products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-green-50/50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Quantity Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-300 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50 dark:divide-gray-700">
                  {safeAnalytics.products.top_products.map((product, index) => (
                    <tr key={index} className="hover:bg-green-50/30 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{product.product_name || product.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{product.category || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{parseFloat(product.total_quantity || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-300">{formatCurrency(product.total_revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No product revenue data available yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admindash;