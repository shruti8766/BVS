// src/hotel_dashboard/components/pages/notifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';

export default function HotelNotifications() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unpaid', 'read'

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Calculate if a bill is overdue (unpaid and older than 1 month)
  const isOverdue = (bill) => {
    if (bill.paid) return false;
    
    const billDate = new Date(bill.created_at || bill.date);
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return billDate < oneMonthAgo;
  };

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('hotelToken');

        // Fetch notifications from new API endpoint
        const notifRes = await fetch(`${BASE_URL}/api/hotel/notifications`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!notifRes.ok) {
          if (notifRes.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch notifications');
        }

        const notifData = await notifRes.json();
        const notificationsArray = notifData.notifications || [];

        setNotifications(notificationsArray);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, logout, navigate]);

  // Handle notification click - navigate to bill in bills page
  const handleNotificationClick = (billId) => {
    navigate(`/hotel/bills?billId=${billId}`);
  };

  // Mark notification as read
  const handleMarkAsRead = (notifId) => {
    setNotifications(
      notifications.map(notif =>
        notif.id === notifId ? { ...notif, read: true } : notif
      )
    );
  };

  // Delete notification
  const handleDeleteNotification = (notifId) => {
    setNotifications(notifications.filter(notif => notif.id !== notifId));
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unpaid') return notif.status === 'unpaid';
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6 transition-colors duration-200">
          <div className="text-center">
            <img
              src="/broc.jpg"
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg transition-colors duration-200">
              Loading notifications...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-8 w-full transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 mb-2 transition-colors duration-200">
                  🔔 Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-200">
              <p className="text-red-700 dark:text-red-300 transition-colors duration-200">{error}</p>
            </div>
          )}

          {/* Filter Tabs with Divider */}
          <div className="mb-6 flex items-center gap-0 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 p-1 transition-colors duration-200">
            {[
              { id: 'all', label: 'All', icon: '📋' },
              { id: 'unpaid', label: 'Unpaid Bills', icon: '💰' },
            ].map((tab, index) => (
              <div key={tab.id} className="flex items-center flex-1">
                <button
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 ${
                    filter === tab.id
                      ? 'bg-green-600 dark:bg-green-700 text-white shadow-md'
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
                {index < 1 && (
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border-l-4 transition-all duration-200 ${
                    notif.read
                      ? 'border-l-gray-400 dark:border-l-gray-600'
                      : 'border-l-red-500 dark:border-l-red-600'
                  }`}
                >
                  <div className="p-4 sm:p-6 flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notif.billId)}>
                      <div className="flex items-center gap-3">
                        {!notif.read && (
                          <div className="w-2.5 h-2.5 bg-red-500 dark:bg-red-400 rounded-full flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              ⚠️ Bill #{notif.billId} Overdue
                            </h3>
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full font-medium">
                              UNPAID
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {notif.message}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 dark:text-gray-500 font-medium">Amount Due</p>
                              <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                                ₹{notif.amount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-500 font-medium">Due Date</p>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {notif.dueDate
                                  ? new Date(notif.dueDate).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-500 font-medium">Created Date</p>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {notif.createdDate
                                  ? new Date(notif.createdDate).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleNotificationClick(notif.billId)}
                        className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium text-sm"
                      >
                        View Bill
                      </button>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors duration-200">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all'
                    ? "You don't have any overdue bills at the moment."
                    : `No ${filter} notifications found.`}
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors duration-200">
            <p className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-200">
              💡 <span className="font-semibold">Note:</span> Notifications are sent for bills that are unpaid and more than 1 month old. 
              Click on a notification to view the bill details and make a payment.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
}
