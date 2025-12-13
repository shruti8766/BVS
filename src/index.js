// final_web/src/admin_dashboard/index.jsx
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './index.css';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
// import './hotel_dashboard/styles.css';
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';   // <-- global CSS

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
// src/index.js (example - adjust if yours is different)
//___________________________________________________________________________________________
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';
// // Add this import
// import { AuthProvider } from './admin_dashboard/hooks/useAuth';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     {/* Add the wrapper here */}
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//   </React.StrictMode>
// );


// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './admin_dashboard/hooks/useAuth';
// Remove this import
// import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);