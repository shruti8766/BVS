// src/hotel_dashboard/components/pages/support.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layout/Layout'; // Assuming you have a Layout component
import { useAuth } from '../hooks/useAuth'; // For user context

export default function SupportHotel() {
  const { user, logout } = useAuth(); // Get user for hotel_name, etc.
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'closed', 'new'
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    category: 'General',
    attachments: null,
  });
  const [replyId, setReplyId] = useState(null); // For inline replies
  const [replyMessage, setReplyMessage] = useState('');

  const BASE_URL = 'https://api-aso3bjldka-uc.a.run.app';

  // Categories for dropdown
  const categories = [
    'General Inquiry',
    'Order Issue',
    'Delivery Problem',
    'Billing Question',
    'Product Quality',
    'Account Access',
    'Technical Support',
    'Feedback/Suggestions',
  ];

  // Fetch tickets (GET /api/hotel/support-tickets)
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/support-tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch tickets');
      }

      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'new') {
      fetchTickets();
    }
  }, [activeTab, navigate, logout]);

  // Submit new ticket (POST /api/hotel/support-tickets)
  // Submit new ticket (POST /api/hotel/support-tickets)
  const submitNewTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) {
      setError('Subject and message are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          message: newTicket.message,
          category: newTicket.category,
          // attachments: newTicket.attachments, // TODO: Handle files later
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit ticket');
      }

      const data = await res.json();
      alert(`Ticket submitted! ID: ${data.id}`);
      setNewTicket({ subject: '', message: '', category: 'General', attachments: null });
      setActiveTab('open'); // Switch to open tickets
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  // Submit reply (POST /api/hotel/support-tickets/:id/reply)
  const submitReply = async (ticketId) => {
    if (!replyMessage.trim()) return;

    try {
      setError('');
      const token = localStorage.getItem('hotelToken');
      const res = await fetch(`${BASE_URL}/api/hotel/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to submit reply');
      }

      // Refresh tickets
      await fetchTickets();

      setReplyMessage('');
      setReplyId(null);
      alert('Reply sent!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter tickets by status
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const filteredTickets = safeTickets.filter(ticket => {
    if (activeTab === 'open') return ticket.status === 'open';
    if (activeTab === 'closed') return ticket.status === 'closed';
    return true;
  });

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
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg transition-colors duration-200">Broccoli is crunching your support...</p>
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
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 mb-2 flex items-center transition-colors duration-200">
              <span className="mr-3">🛠️</span> Support Center
            </h1>
            <p className="text-green-700 dark:text-green-300 transition-colors duration-200">
              We're here to help, {user?.hotel_name || 'Hotel User'}. Get assistance with orders, deliveries, and more.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-200">
              <p className="text-red-700 dark:text-red-300 transition-colors duration-200">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-green-200 dark:border-green-800 mb-6 transition-colors duration-200">
            {['open', 'closed', 'new'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
                  activeTab === tab
                    ? 'border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 border-b-2'
                    : 'text-green-500 dark:text-green-500 hover:text-green-700 dark:hover:text-green-300'
                }`}
              >
                {tab === 'open' ? 'Open Tickets' : tab === 'closed' ? 'Closed Tickets' : 'New Ticket'}
              </button>
            ))}
          </div>

          {/* New Ticket Form */}
          {activeTab === 'new' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 p-6 mb-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-4 transition-colors duration-200">Create New Ticket</h2>
              <form onSubmit={submitNewTicket}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Subject</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="e.g., Delayed Delivery on Order #123"
                    className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Message</label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 resize-none transition-colors duration-200"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">Attachments (Optional)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setNewTicket({ ...newTicket, attachments: e.target.files[0] })}
                    className="w-full px-4 py-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 dark:bg-green-700 text-white py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
          )}

          {/* Tickets List */}
          {activeTab !== 'new' && (
            <div className="space-y-6">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
                    <svg className="w-12 h-12 text-green-500 dark:text-green-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2 transition-colors duration-200">
                    {activeTab === 'open' ? 'No open tickets' : 'No closed tickets'}
                  </h3>
                  <p className="text-green-600 dark:text-green-400 mb-4 transition-colors duration-200">Start a new conversation to get help.</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                  >
                    Create Ticket
                  </button>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="p-6 border-b border-green-100 dark:border-green-900 flex justify-between items-start transition-colors duration-200">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 transition-colors duration-200">{ticket.subject}</h3>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                            ticket.status === 'open'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          }`}>
                            {ticket.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400 mb-2 transition-colors duration-200">{ticket.category}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-200">ID: #{ticket.id} • Last Updated: {new Date(ticket.updated_at).toLocaleDateString()}</p>
                        {ticket.messages && ticket.messages.length > 1 && (
                          <p className="text-xs text-green-600 dark:text-green-500 transition-colors duration-200">Replies: {ticket.messages.length - 1}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-800 dark:text-green-400 transition-colors duration-200">Priority: {ticket.priority || 'Medium'}</p>
                      </div>
                    </div>
                    <div className="p-6 bg-green-50 dark:bg-gray-700 transition-colors duration-200">
                      <div className="space-y-3">
                        {ticket.messages?.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs p-3 rounded-lg transition-colors duration-200 ${
                              msg.is_admin
                                ? 'bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700'
                                : 'bg-green-600 dark:bg-green-700 text-white'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs mt-1 opacity-75">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {replyId === ticket.id ? (
                          <div className="flex justify-end">
                            <div className="max-w-xs">
                              <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your reply..."
                                rows={3}
                                className="w-full p-3 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                              />
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => { setReplyId(null); setReplyMessage(''); }}
                                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => submitReply(ticket.id)}
                                  disabled={!replyMessage.trim()}
                                  className="px-4 py-1 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  Send Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyId(ticket.id)}
                            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline transition-colors duration-200"
                          >
                            Add Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FAQ Section (Creative: Quick self-help) */}
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-gray-700 p-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-4 flex items-center transition-colors duration-200">
              <span className="mr-2">💡</span> Quick Help
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { q: 'How do I track my order?', a: 'Check your dashboard or contact us with order ID.' },
                { q: 'What is your delivery policy?', a: 'Same-day in Pune; 1-2 days outside. Free over ₹2000.' },
                { q: 'Can I cancel an order?', a: 'Yes, within 2 hours of placement. Email us.' },
                { q: 'How to return faulty products?', a: 'Contact support within 24 hours with photos.' },
              ].map((faq, idx) => (
                <div key={idx} className="border-l-4 border-green-400 dark:border-green-600 pl-4 transition-colors duration-200">
                  <h4 className="font-medium text-green-800 dark:text-green-400 mb-1 transition-colors duration-200">{faq.q}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Creative: Satisfaction Rating */}
          {safeTickets.filter(t => t.status === 'closed').length > 0 && (
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2 transition-colors duration-200">How was your last experience?</h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} className="text-2xl text-yellow-400 dark:text-yellow-500 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors duration-200">⭐</button>
                ))}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 transition-colors duration-200">Rate us to help improve service!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}