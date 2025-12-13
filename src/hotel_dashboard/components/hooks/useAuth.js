// Create this file: src/hotel_dashboard/components/hooks/useAuth.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hotelToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          token, 
          role: payload.role || 'hotel',
          hotel_name: payload.hotel_name || payload.username
        });
      } catch (e) {
        localStorage.removeItem('hotelToken');
      }
    }
    setLoading(false);
  }, []);
  const login = (token, userData) => {
    localStorage.setItem('hotelToken', token);
    setUser({ token, ...userData });
  };

  const logout = () => {
    localStorage.removeItem('hotelToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};