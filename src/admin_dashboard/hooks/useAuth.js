// // src/admin_dashboard/hooks/useAuth.js
// import { createContext, useContext, useState, useEffect } from 'react';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(localStorage.getItem('adminToken'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check for token on mount
//     const storedToken = localStorage.getItem('adminToken');
//     if (storedToken) {
//       setToken(storedToken);
//     }
//     setLoading(false);
//   }, []);

//   const login = (newToken) => {
//     localStorage.setItem('adminToken', newToken);
//     setToken(newToken);
//   };

//   const logout = () => {
//     localStorage.removeItem('adminToken');
//     setToken(null);
//   };

//   return (
//     <AuthContext.Provider value={{ token, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
// final_web/src/admin_dashboard/hooks/useAuth.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid
    const checkAuth = async () => {
      if (token) {
        try {
          // You can add a token validation API call here
          setUser({ username: 'admin', role: 'admin' });
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('adminToken', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};