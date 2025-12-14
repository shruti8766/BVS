// import React from 'react';
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
// } from 'react-router-dom';

// // ----- Pages -----

// import Login from './frontend/login';
// import Admindash from './admin_dashboard/pages/admindash';
// import Orders from './admin_dashboard/pages/orders';
// import Hotels from './admin_dashboard/pages/hotels';
// import Products from './admin_dashboard/pages/products';
// import Suppliers from './admin_dashboard/pages/suppliers';
// import Inventory from './admin_dashboard/pages/inventory';
// import Billing from './admin_dashboard/pages/billing';
// import Analytics from './admin_dashboard/pages/analytics';
// import Users from './admin_dashboard/pages/users';
// import Settings from './admin_dashboard/pages/settings';
// import Support from './admin_dashboard/pages/support';
// import Profile from './admin_dashboard/pages/profile';
// import Home from './frontend/home';
// import Vegetables from './frontend/vegetables';
// import Fruits from './frontend/fruits';
// import More from './frontend/more';
// import About from './frontend/about';

// // -------------------------------------------------
// // 1. Helper – is the admin token present?
// // -------------------------------------------------
// const isAuthenticated = () => {
//   return !!localStorage.getItem('adminToken');
// };

// // -------------------------------------------------
// // 2. Protected layout (wraps all /admin/* routes)
// // -------------------------------------------------
// const ProtectedLayout = () => {
//   return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
// };

// // -------------------------------------------------
// // 3. Main App
// // -------------------------------------------------
// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* ---------- PUBLIC ---------- */}
//         <Route path="/" element={<Home />} />
//         <Route path="/vegetables" element={<Vegetables />} />
//         <Route path="/fruits" element={<Fruits />} />
//         <Route path="/more" element={<More />} />
//         <Route path="/about" element={<About />} />
//         <Route path="/login" element={<Login />} />


//         {/* ---------- ROOT REDIRECT ---------- */}
//         {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

//         {/* ---------- PROTECTED ADMIN AREA ---------- */}
//         <Route element={<ProtectedLayout />}>
//           <Route path="/admin/dashboard" element={<Admindash />} />
//           <Route path="/admin/orders" element={<Orders />} />
//           <Route path="/admin/hotels" element={<Hotels />} />
//           <Route path="/admin/products" element={<Products />} />
//           <Route path="/admin/suppliers" element={<Suppliers />} />
//           <Route path="/admin/inventory" element={<Inventory />} />
//           <Route path="/admin/billing" element={<Billing />} />
//           <Route path="/admin/analytics" element={<Analytics />} />
//           <Route path="/admin/users" element={<Users />} />
//           <Route path="/admin/settings" element={<Settings />} />
//           <Route path="/admin/support" element={<Support />} />
//           <Route path="/admin/profile" element={<Profile />} />
//           {/* fallback inside admin area */}
//           <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
//         </Route>

//         {/* ---------- ANYTHING ELSE ---------- */}
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

//----------------------------------------------------------------------------

// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';

// ----- Public Pages -----
import Home from './frontend/home';
import Vegetables from './frontend/vegetables';
import Fruits from './frontend/fruits';
import More from './frontend/more';
import About from './frontend/about';
import Features from './frontend/features';
import Login from './frontend/login';

// ----- Admin Pages -----
import Admindash from './admin_dashboard/pages/admindash';
import PendingOrders from './admin_dashboard/pages/pendingOrders';
import TodaysVegetables from './admin_dashboard/pages/TodaysVegetables';
import TodaysHotelsOrders from './admin_dashboard/pages/TodaysHotelsOrders';
import TodaysFilling from './admin_dashboard/pages/TodaysFilling';
import Orders from './admin_dashboard/pages/orders';
import Hotels from './admin_dashboard/pages/hotels';
import HotelDetail from './admin_dashboard/pages/HotelDetail';
import Products from './admin_dashboard/pages/products';
import Suppliers from './admin_dashboard/pages/suppliers';
import Inventory from './admin_dashboard/pages/inventory';
import Billing from './admin_dashboard/pages/billing';
import Analytics from './admin_dashboard/pages/analytics_new';
import Users from './admin_dashboard/pages/users';
import Settings from './admin_dashboard/pages/settings';
import Support from './admin_dashboard/pages/support';
import Profile from './admin_dashboard/pages/profile';

// ----- Hotel Pages -----
import HotelDashboard from './hotel_dashboard/components/pages/dashbaord';
import { AuthProvider } from './hotel_dashboard/components/hooks/useAuth'; 
import Product from './hotel_dashboard/components/pages/products';
import Cart from './hotel_dashboard/components/pages/cart';
import SupportHotel from './hotel_dashboard/components/pages/support';
import HotelSettings from './hotel_dashboard/components/pages/settings';
import HotelProfile from './hotel_dashboard/components/pages/profile';
import HotelBills from './hotel_dashboard/components/pages/bills';
import HotelOrders from './hotel_dashboard/components/pages/orders';
import OrderHistory from './hotel_dashboard/components/pages/history';
// -------------------------------------------------
// 1. Auth Helpers – Check tokens based on role
// -------------------------------------------------
const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');
const isHotelAuthenticated = () => !!localStorage.getItem('hotelToken');

// -------------------------------------------------
// 2. Protected Layouts (UPDATED: Wrap Hotel with AuthProvider)
// -------------------------------------------------
const AdminProtectedLayout = () => {
  return isAdminAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

const HotelProtectedLayout = () => {
  return isHotelAuthenticated() ? (
    <AuthProvider>  
      <Outlet />
    </AuthProvider>
  ) : <Navigate to="/login" replace />;
};

// -------------------------------------------------
// 3. Main App
// -------------------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/vegetables" element={<Vegetables />} />
        <Route path="/fruits" element={<Fruits />} />
        <Route path="/more" element={<More />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/login" element={<Login />} />

        {/* ---------- PROTECTED ADMIN AREA ---------- */}
        <Route element={<AdminProtectedLayout />}>
          <Route path="/admin/dashboard" element={<Admindash />} />
          <Route path="/admin/pending-orders" element={<PendingOrders />} />
          <Route path="/admin/todays-vegetables" element={<TodaysVegetables />} />
          <Route path="/admin/todays-hotels-orders" element={<TodaysHotelsOrders />} />
          <Route path="/admin/todays-filling" element={<TodaysFilling />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/hotels" element={<Hotels />} />
          <Route path="/admin/hotels/:id" element={<HotelDetail />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/suppliers" element={<Suppliers />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/support" element={<Support />} />
          <Route path="/admin/profile" element={<Profile />} />
          {/* Fallback inside admin area */}
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* ---------- PROTECTED HOTEL AREA (UPDATED: AuthProvider wraps Outlet) ---------- */}
        <Route element={<HotelProtectedLayout />}>
          <Route path="/hotel/dashboard" element={<HotelDashboard />} />
          <Route path="/hotel/products" element={<Product />} />
          <Route path="/hotel/cart" element={<Cart />} />
          <Route path="/hotel/support" element={<SupportHotel />} />
          <Route path="/hotel/settings" element={<HotelSettings />} />
          <Route path="/hotel/profile" element={<HotelProfile />} />
          <Route path="/hotel/bills" element={<HotelBills />} />
          <Route path="/hotel/orders" element={<HotelOrders />} />
          <Route path="/hotel/history" element={<OrderHistory />} />
          <Route path="/hotel/*" element={<Navigate to="/hotel/dashboard" replace />} />
        </Route>

        {/* ---------- ROOT REDIRECT (to login if unauth, or dashboard based on token) ---------- */}
        <Route
          path="/"
          element={
            isAdminAuthenticated() ? (
              <Navigate to="/admin/dashboard" replace />
            ) : isHotelAuthenticated() ? (
              <Navigate to="/hotel/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ---------- ANYTHING ELSE ---------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


//---------------------------------------------------------------

// import React from 'react';
// import ChatBot from './chatbot/ChatbotWidget';

// function App() {
//     return (
//         <div>
//             <ChatBot />
//         </div>
//     );
// }

// export default App;