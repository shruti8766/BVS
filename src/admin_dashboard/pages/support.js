// // src/admin_dashboard/pages/support.js
// import React, { useState, useEffect, useMemo } from 'react';
// import Layout from '../components/layout/Layout';
// import { supportApi } from '../utils/api';

// const STATUS_COLOR = {
//   open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
//   closed: 'bg-green-100 text-green-800 border-green-200',
// };

// const Support = () => {
//   // ───── Auth ─────
//   const [token] = useState(localStorage.getItem('adminToken') || '');
//   const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
//   const [loggingIn, setLoggingIn] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // ───── Data ─────
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   // ───── Modals ─────
//   const [showCreate, setShowCreate] = useState(false);
//   const [showDetail, setShowDetail] = useState(null);   // ticket object
//   const [replyText, setReplyText] = useState('');

//   // ───── Helpers ─────
//   const safe = (v, fb = '') => (v !== undefined && v !== null ? v : fb);
//   const formatDate = d => d ? new Date(d).toLocaleString('en-IN') : '—';

//   // ───── Login (same as other pages) ─────
//   const handleLogin = async e => {
//     e.preventDefault();
//     setLoggingIn(true);
//     setLoginError('');
//     try {
//       const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginForm),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || 'Login failed');
//       localStorage.setItem('adminToken', data.token);
//       window.location.reload();
//     } catch (err) {
//       setLoginError(err.message);
//     } finally {
//       setLoggingIn(false);
//     }
//   };

//   // ───── Fetch tickets ─────
//   const fetchTickets = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await supportApi.getAll();
//       setTickets(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { if (token) fetchTickets(); }, [token]);

//   // ───── Create ticket ─────
//   const createTicket = async e => {
//     e.preventDefault();
//     const form = new FormData(e.target);
//     const payload = {
//       subject: form.get('subject'),
//       message: form.get('message'),
//     };
//     try {
//       await supportApi.create(payload);
//       setShowCreate(false);
//       fetchTickets();
//     } catch (e) { setError(e.message); }
//   };

//   // ───── Reply ─────
//   const sendReply = async () => {
//     if (!replyText.trim()) return;
//     try {
//       await supportApi.reply(showDetail.id, replyText);
//       setReplyText('');
//       const fresh = await supportApi.getOne(showDetail.id);
//       setShowDetail(fresh);
//     } catch (e) { setError(e.message); }
//   };

//   // ───── Close ticket ─────
//   const closeTicket = async id => {
//     if (!window.confirm('Close this ticket?')) return;
//     try {
//       await supportApi.close(id);
//       fetchTickets();
//       if (showDetail?.id === id) setShowDetail({ ...showDetail, status: 'closed' });
//     } catch (e) { setError(e.message); }
//   };

//   // ───── Search & filter ─────
//   const filtered = useMemo(() => {
//     let list = tickets;
//     if (search) {
//       const term = search.toLowerCase();
//       list = list.filter(t =>
//         t.subject.toLowerCase().includes(term) ||
//         t.id.toString().includes(term)
//       );
//     }
//     if (filterStatus !== 'all') {
//       list = list.filter(t => t.status === filterStatus);
//     }
//     return list;
//   }, [tickets, search, filterStatus]);

//   // ───── Export CSV ─────
//   const exportCSV = () => {
//     const headers = ['ID', 'Subject', 'Status', 'Created', 'Replies'];
//     const rows = filtered.map(t => [
//       t.id,
//       `"${t.subject.replace(/"/g, '""')}"`,
//       t.status,
//       new Date(t.created_at).toLocaleString(),
//       t.replies?.length || 0,
//     ]);
//     const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `support_tickets_${new Date().toISOString().slice(0,10)}.csv`;
//     a.click();
//   };

//   // ───── Render ─────
//   if (!token) {
//     return (
//       <Layout>
//         <div className="p-6 max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h2 className="text-xl font-bold mb-4">Admin Login</h2>
//             {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
//             <form onSubmit={handleLogin} className="space-y-4">
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={loginForm.username}
//                 onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={loginForm.password}
//                 onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <button
//                 type="submit"
//                 disabled={loggingIn}
//                 className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {loggingIn ? 'Logging in…' : 'Login'}
//               </button>
//             </form>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   if (loading) {
//     return (
//       <Layout>
//         <div className="p-6 flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
//           <span className="text-gray-600">Loading support tickets…</span>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="p-6">

//         {/* ---------- Header ---------- */}
//         <div className="mb-8 flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
//             <p className="text-gray-600 mt-2">Manage tickets, chat with customers, view FAQs</p>
//           </div>
//           <button
//             onClick={() => setShowCreate(true)}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
//           >
//             + New Ticket
//           </button>
//         </div>

//         {/* ---------- Stats ---------- */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//           {[
//             { label: 'Total', value: tickets.length, color: 'text-gray-900' },
//             { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-yellow-600' },
//             { label: 'Closed', value: tickets.filter(t => t.status === 'closed').length, color: 'text-green-600' },
//             { label: 'Avg. Replies', value: (tickets.reduce((s, t) => s + (t.replies?.length || 0), 0) / tickets.length || 0).toFixed(1), color: 'text-blue-600' },
//           ].map((s, i) => (
//             <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
//               <p className="text-sm text-gray-600">{s.label}</p>
//               <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
//             </div>
//           ))}
//         </div>

//         {/* ---------- Error ---------- */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
//             <span className="text-red-600 text-lg mr-3">Warning</span>
//             <div>
//               <p className="text-red-800 font-medium">Error</p>
//               <p className="text-red-700 text-sm">{error}</p>
//               <button onClick={fetchTickets} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ---------- Toolbar ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center space-x-4">
//             <input
//               type="text"
//               placeholder="Search tickets…"
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               className="px-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <select
//               value={filterStatus}
//               onChange={e => setFilterStatus(e.target.value)}
//               className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All</option>
//               <option value="open">Open</option>
//               <option value="closed">Closed</option>
//             </select>
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={fetchTickets}
//               className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
//             >
//               Refresh
//             </button>
//             <button
//               onClick={exportCSV}
//               className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
//             >
//               Export CSV
//             </button>
//           </div>
//         </div>

//         {/* ---------- Tickets Table ---------- */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {['ID', 'Subject', 'Status', 'Created', 'Replies', 'Actions'].map(h => (
//                     <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
//                       <p className="text-lg">No tickets found</p>
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map(t => (
//                     <tr key={t.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{t.id}</td>
//                       <td className="px-6 py-4 text-sm text-gray-900">{safe(t.subject)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[t.status] || ''}`}>
//                           {t.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(t.created_at)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.replies?.length || 0}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <button
//                             onClick={async () => {
//                                 try {
//                                 const full = await supportApi.getOne(t.id);
//                                 setShowDetail(full);
//                                 } catch (e) {
//                                 setError(`Could not load ticket #${t.id}: ${e.message}`);
//                                 }
//                             }}
//                             className="text-blue-600 hover:text-blue-900 mr-3"
//                             >
//                             View
//                         </button>
//                         {t.status === 'open' && (
//                           <button onClick={() => closeTicket(t.id)} className="text-red-600 hover:text-red-900">Close</button>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* ---------- CREATE TICKET MODAL ---------- */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-bold text-gray-900">New Support Ticket</h3>
//                 <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//               </div>
//               <form onSubmit={createTicket} className="space-y-4">
//                 <input name="subject" placeholder="Subject" required className="w-full px-3 py-2 border rounded-lg" />
//                 <textarea name="message" rows={4} placeholder="Describe the issue…" required className="w-full px-3 py-2 border rounded-lg" />
//                 <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
//                   Submit Ticket
//                 </button>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* ---------- DETAIL / REPLY MODAL ---------- */}
//         {showDetail && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-bold text-gray-900">Ticket #{showDetail.id}</h3>
//                 <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
//               </div>

//               <div className="mb-4">
//                 <p className="font-medium">{showDetail.subject}</p>
//                 <p className="text-sm text-gray-600">Created: {formatDate(showDetail.created_at)}</p>
//                 <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[showDetail.status]}`}>
//                   {showDetail.status}
//                 </span>
//               </div>

//               <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
//                 {showDetail.replies?.map((r, i) => (
//                   <div key={i} className={`p-3 rounded-lg ${r.is_admin ? 'bg-blue-50' : 'bg-gray-50'}`}>
//                     <p className="text-sm font-medium">{r.is_admin ? 'Admin' : 'Customer'}</p>
//                     <p className="text-sm">{r.message}</p>
//                     <p className="text-xs text-gray-500 mt-1">{formatDate(r.created_at)}</p>
//                   </div>
//                 ))}
//               </div>

//               {showDetail.status === 'open' && (
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     placeholder="Type your reply…"
//                     value={replyText}
//                     onChange={e => setReplyText(e.target.value)}
//                     onKeyDown={e => e.key === 'Enter' && sendReply()}
//                     className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <button onClick={sendReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                     Send
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ---------- Footer ---------- */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
//           <span className="text-blue-600 text-lg mr-3">API</span>
//           <div>
//             <p className="text-blue-800 font-medium">Connected to live backend</p>
//             <p className="text-blue-700 text-sm">Support module ready | http://127.0.0.1:5000</p>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Support;
// src/admin_dashboard/pages/support.js
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { supportApi } from '../utils/api';

// ──────────────────────────────────────────────────────
// 1. Date Formatter (from dashboard)
// ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN');
};

// ──────────────────────────────────────────────────────
// 2. Reusable UI Components (Adapted from dashboard)
// ──────────────────────────────────────────────────────
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-xl hover:border-green-300 hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, color = 'text-green-700' }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
    <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
    <div className={`text-2xl font-semibold ${color}`}>{value}</div>
  </div>
);

const QuickAction = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm ${className} ${disabled ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
  >
    {children}
  </button>
);

const STATUS_COLOR = {
  open: 'bg-orange-100 text-orange-800 border-orange-200',
  closed: 'bg-green-100 text-green-800 border-green-200',
};

const MiniTable = ({ headers, rows, emptyMsg = 'No data', onView, onClose }) => (
  <Card>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-green-50/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-lg">No tickets found</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const ticket = r.slice(-1)[0];  // Last element is the ticket object
              return (
                <tr key={i} className="hover:bg-green-50/30 transition-colors">
                  {r.slice(0, -1).map((cell, j) => (  // All but actions/ticket
                    <td key={j} className="px-6 py-4 text-sm font-medium text-gray-700">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onView(ticket)}
                        className="text-green-600 hover:text-green-900 text-xs font-medium transition-colors"
                      >
                        View
                      </button>
                      {ticket.status === 'open' && (
                        <button onClick={() => onClose(ticket.id)} className="text-red-600 hover:text-red-900 text-xs font-medium transition-colors">
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </Card>
);

// ──────────────────────────────────────────────────────
// 3. Main Support Component
// ──────────────────────────────────────────────────────
const Support = () => {
  // ───── Auth ─────
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ───── Data ─────
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ───── Modals ─────
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);   // ticket object
  const [replyText, setReplyText] = useState('');

  // ───── Helpers ─────
  const safe = (v, fb = '') => (v !== undefined && v !== null ? v : fb);

  // ───── Login (same as other pages) ─────
  const handleLogin = async e => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('adminToken', data.token);
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // ───── Fetch tickets ─────
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supportApi.getAll();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchTickets(); }, [token]);

  // ───── Create ticket ─────
  const createTicket = async e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      subject: form.get('subject'),
      message: form.get('message'),
    };
    try {
      await supportApi.create(payload);
      setShowCreate(false);
      fetchTickets();
    } catch (e) { setError(e.message); }
  };

  // ───── Reply ─────
  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await supportApi.reply(showDetail.id, replyText);
      setReplyText('');
      const fresh = await supportApi.getOne(showDetail.id);
      setShowDetail(fresh);
    } catch (e) { setError(e.message); }
  };

  // ───── Close ticket ─────
  const closeTicket = async id => {
    if (!window.confirm('Close this ticket?')) return;
    try {
      await supportApi.close(id);
      fetchTickets();
      if (showDetail?.id === id) setShowDetail({ ...showDetail, status: 'closed' });
    } catch (e) { setError(e.message); }
  };

  // ───── View handler ─────
  const handleView = async (t) => {
    try {
      const full = await supportApi.getOne(t.id);
      setShowDetail(full);
    } catch (e) {
      setError(`Could not load ticket #${t.id}: ${e.message}`);
    }
  };

  // ───── Search & filter ─────
  const filtered = useMemo(() => {
    let list = tickets;
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(t =>
        t.subject.toLowerCase().includes(term) ||
        t.id.toString().includes(term)
      );
    }
    if (filterStatus !== 'all') {
      list = list.filter(t => t.status === filterStatus);
    }
    return list;
  }, [tickets, search, filterStatus]);

  // ───── Export CSV ─────
  const exportCSV = () => {
    const headers = ['ID', 'Subject', 'Status', 'Created', 'Replies'];
    const rows = filtered.map(t => [
      t.id,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.status,
      new Date(t.created_at).toLocaleString(),
      t.replies?.length || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support_tickets_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const tableRows = filtered.map(t => [
    `#${t.id}`,
    safe(t.subject),
    <span key="status" className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[t.status] || ''}`}>
      {t.status}
    </span>,
    formatDate(t.created_at),
    t.replies?.length || 0,
    t  // Ticket object for actions
  ]);

  // ───── Render ─────
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Admin Login</h2>
            {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <img
              src="/broc.jpg" // Replace with the actual path to your broccoli image (e.g., public/images/broccoli-loading.png)
              alt="Loading"
              className="h-32 w-32 mx-auto mb-4 animate-[run_1s_ease-in-out_infinite]"
            />
            <p className="text-gray-600 font-medium text-lg">Broccoli is crunching your supports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 w-full">
        {/* ---------- Header ---------- */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-1">
              Support Center
            </h1>
            <p className="text-gray-600 text-sm">Manage tickets, chat with customers, view FAQs</p>
          </div>
          <QuickAction onClick={() => setShowCreate(true)}>
            + New Ticket
          </QuickAction>
        </div>

        {/* ---------- Stats ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Stat label="Total" value={tickets.length} color="text-green-700" />
          <Stat label="Open" value={tickets.filter(t => t.status === 'open').length} color="text-orange-600" />
          <Stat label="Closed" value={tickets.filter(t => t.status === 'closed').length} color="text-emerald-700" />
          <Stat label="Avg. Replies" value={(tickets.reduce((s, t) => s + (t.replies?.length || 0), 0) / tickets.length || 0).toFixed(1)} color="text-teal-700" />
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-lg">Warning</span>
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
                <button onClick={fetchTickets} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ---------- Tickets Table with Toolbar ---------- */}
        <Card>
          <div className="px-6 py-5 bg-green-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search tickets…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={fetchTickets} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors">
                Refresh
              </button>
              <button onClick={exportCSV} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors">
                Export CSV
              </button>
            </div>
          </div>
          <div>
            <MiniTable
              headers={['ID', 'Subject', 'Status', 'Created', 'Replies', 'Actions']}
              rows={tableRows}
              emptyMsg="No tickets found"
              onView={handleView}
              onClose={closeTicket}
            />
          </div>
        </Card>

        {/* ---------- CREATE TICKET MODAL ---------- */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-800">New Support Ticket</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
              </div>
              <form onSubmit={createTicket} className="space-y-4">
                <input name="subject" placeholder="Subject" required className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <textarea name="message" rows={4} placeholder="Describe the issue…" required className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all" />
                <QuickAction type="submit" className="!w-full !text-sm">
                  Submit Ticket
                </QuickAction>
              </form>
            </Card>
          </div>
        )}

        {/* ---------- DETAIL / REPLY MODAL ---------- */}
        {showDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-800">Ticket #{showDetail.id}</h3>
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">{showDetail.subject}</p>
                <p className="text-sm text-gray-600">Created: {formatDate(showDetail.created_at)}</p>
                <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[showDetail.status]}`}>
                  {showDetail.status}
                </span>
              </div>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {showDetail.replies?.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl ${r.is_admin ? 'bg-emerald-50 border border-emerald-200' : 'bg-green-50 border border-green-200'}`}>
                    <p className="text-sm font-medium text-gray-700">{r.is_admin ? 'Admin' : 'Customer'}</p>
                    <p className="text-sm text-gray-700">{r.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>

              {showDetail.status === 'open' && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your reply…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                    className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                  <QuickAction onClick={sendReply} className="!px-4 !py-3 !text-sm">
                    Send
                  </QuickAction>
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Support;