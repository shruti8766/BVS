// src/admin_dashboard/pages/analytics_new.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://localhost:5000';

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-lg">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
            <p className="text-red-800 font-medium">Error loading analytics</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-sm">Comprehensive financial insights and revenue tracking</p>
        </div>

        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Yesterday's Revenue</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {formatCurrency(analytics.revenue.yesterday)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">This Month's Revenue</h3>
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-emerald-700">
              {formatCurrency(analytics.revenue.month)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">This Year's Revenue</h3>
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-teal-700">
              {formatCurrency(analytics.revenue.year)}
            </div>
          </div>
        </div>

        {/* Hotel Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Hotels</h3>
            <div className="text-2xl font-semibold text-gray-900">{analytics.hotels.total_hotels}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Hotels with Unpaid Bills</h3>
            <div className="text-2xl font-semibold text-orange-600">{analytics.hotels.unpaid_hotels_count}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Unpaid Amount</h3>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(analytics.hotels.unpaid_hotels.reduce((sum, h) => sum + parseFloat(h.unpaid_total || 0), 0))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-bold text-green-800 mb-4">Daily Revenue Trend (Last 30 Days)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-bold text-emerald-800 mb-4">Monthly Revenue Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.trends.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#34d399" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Hotel Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h4 className="text-lg font-bold text-green-800">Revenue by Hotel (Top 10)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Hotel Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Total Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Unpaid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {analytics.hotels.revenue_by_hotel.map((hotel, index) => (
                  <tr key={index} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{hotel.hotel_name}</td>
                    <td className="px-4 py-3 text-gray-700">{hotel.total_orders}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(hotel.total_revenue)}</td>
                    <td className="px-4 py-3 text-green-600">{formatCurrency(hotel.paid_amount)}</td>
                    <td className="px-4 py-3 text-orange-600">{formatCurrency(hotel.unpaid_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hotels with Unpaid Bills */}
        {analytics.hotels.unpaid_hotels.length > 0 && (
          <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 mb-8 overflow-hidden">
            <div className="px-6 py-4 bg-orange-100 border-b border-orange-200">
              <h4 className="text-lg font-bold text-orange-800">Hotels with Unpaid Bills</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase">Hotel Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase">Unpaid Bills</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase">Total Unpaid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 bg-white">
                  {analytics.hotels.unpaid_hotels.map((hotel, index) => (
                    <tr key={index} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{hotel.hotel_name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{hotel.email}</div>
                        <div className="text-xs text-gray-500">{hotel.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-orange-700 font-semibold">{hotel.unpaid_bills_count}</td>
                      <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(hotel.unpaid_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h4 className="text-lg font-bold text-green-800">Top Products by Revenue</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Quantity Sold</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {analytics.products.top_products.map((product, index) => (
                  <tr key={index} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-4 py-3 text-gray-700">{product.category}</td>
                    <td className="px-4 py-3 text-gray-700">{parseFloat(product.total_quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(product.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
