import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import {
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ──────────────────────────────────────────────────────
// Helper Components
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-green-900/20 border-2 border-green-100 dark:border-green-900 overflow-hidden transition-all duration-300 ${
      hover
        ? 'hover:shadow-xl dark:hover:shadow-green-800/30 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1'
        : ''
    } ${className}`}
  >
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700', icon: Icon }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-green-900/20 border border-gray-200 dark:border-green-900 p-4 lg:p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </h3>
        <div
          className={`text-2xl lg:text-3xl font-semibold ${color} ${
            color === 'text-green-700'
              ? 'dark:text-green-400'
              : color === 'text-red-700'
              ? 'dark:text-red-400'
              : color === 'text-orange-700'
              ? 'dark:text-orange-400'
              : 'dark:text-blue-400'
          }`}
        >
          {value}
        </div>
      </div>
      {Icon && (
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      )}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
  </div>
);

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────
const UnpaidBills = () => {
  const { isDarkMode } = useTheme();
  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // State
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [hotelBreakdown, setHotelBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUnpaidAmount: 0,
    totalUnpaidBills: 0,
    oldestBill: null,
    averageBillAmount: 0,
  });

  const COLORS = [
    '#059669',
    '#10b981',
    '#34d399',
    '#6ee7b7',
    '#a7f3d0',
    '#d1fae5',
    '#f0fdf4',
  ];

  // ──────────────────────────────────────────────────────
  // Fetch unpaid bills data
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  const fetchUnpaidBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Fetch unpaid bills from new endpoint
      const res = await fetch(`${BASE_URL}/api/admin/unpaid-bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch unpaid bills');
      }

      const data = await res.json();
      console.log('Unpaid Bills Data:', data);

      // Process data
      processUnpaidBills(data);
    } catch (err) {
      console.error('Error fetching unpaid bills:', err);
      setError(err.message || 'Failed to load unpaid bills');
    } finally {
      setLoading(false);
    }
  };

  const processUnpaidBills = (data) => {
    const unpaid = data.unpaidBills || [];
    const hotelData = data.hotelBreakdown || [];

    // Sort by date
    const sorted = [...unpaid].sort(
      (a, b) => new Date(a.bill_date) - new Date(b.bill_date)
    );

    setUnpaidBills(sorted);
    setHotelBreakdown(hotelData);

    // Calculate stats
    const totalAmount = data.totalUnpaidAmount || 0;
    let oldestDate = null;

    if (unpaid.length > 0) {
      const dates = unpaid
        .map((b) => new Date(b.bill_date))
        .filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      }
    }

    const avgAmount = unpaid.length > 0 ? totalAmount / unpaid.length : 0;

    setStats({
      totalUnpaidAmount: totalAmount,
      totalUnpaidBills: unpaid.length,
      oldestBill: oldestDate ? formatDate(oldestDate) : 'N/A',
      averageBillAmount: avgAmount,
    });
  };

  // ──────────────────────────────────────────────────────
  // Helper functions
  // ──────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-green-950 p-6 transition-colors duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Unpaid Bills
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Track and manage all outstanding payments
            </p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            <button
              onClick={fetchUnpaidBills}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                label="Total Unpaid Amount"
                value={formatCurrency(stats.totalUnpaidAmount)}
                color="text-red-700"
                icon={CurrencyRupeeIcon}
              />
              <Stat
                label="Total Unpaid Bills"
                value={stats.totalUnpaidBills}
                color="text-orange-700"
                icon={ExclamationTriangleIcon}
              />
              <Stat
                label="Average Bill Amount"
                value={formatCurrency(stats.averageBillAmount)}
                color="text-blue-700"
                icon={CurrencyRupeeIcon}
              />
              <Stat
                label="Oldest Bill From"
                value={stats.oldestBill}
                color="text-gray-700"
                icon={CheckCircleIcon}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Unpaid Amount by Hotel */}
              {hotelBreakdown.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Unpaid Bills by Hotel
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={hotelBreakdown}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                      />
                      <XAxis
                        dataKey="hotelName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{
                          fill: isDarkMode ? '#9ca3af' : '#6b7280',
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: isDarkMode ? '#9ca3af' : '#6b7280',
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f3f4f6' : '#111827',
                        }}
                      />
                      <Bar
                        dataKey="totalAmount"
                        fill="#ef4444"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Pie Chart - Unpaid Distribution */}
              {hotelBreakdown.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Unpaid Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={hotelBreakdown}
                        dataKey="totalAmount"
                        nameKey="hotelName"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ hotelName, percent }) =>
                          `${hotelName}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {hotelBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f3f4f6' : '#111827',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Timeline Chart - Unpaid Bills Over Time */}
            {unpaidBills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Unpaid Bills Timeline
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Cumulative unpaid amount over time
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={unpaidBills.map((bill, idx) => ({
                      date: formatDate(bill.bill_date),
                      amount: bill.total_amount,
                      hotelName: bill.hotelName,
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                    />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{
                        fill: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      tick={{
                        fill: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '20px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#ef4444"
                      dot={false}
                      strokeWidth={2}
                      name="Bill Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Hotel-wise Details Table */}
            {hotelBreakdown.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                  Hotel-wise Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Hotel Name
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          Number of Bills
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotelBreakdown.map((hotel, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                            {hotel.hotelName}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {hotel.billCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(hotel.totalAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {(
                              (hotel.totalAmount / stats.totalUnpaidAmount) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Unpaid Bills List */}
            {unpaidBills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  All Unpaid Bills
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Bill ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Hotel Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidBills.map((bill, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                            {bill._id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                            {bill.hotelName || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {formatDate(bill.bill_date)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(bill.total_amount || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              Unpaid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* No Data State */}
            {!loading && unpaidBills.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    All Bills Paid!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Great news! There are no unpaid bills at the moment.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default UnpaidBills;
