import React, { createContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return { email: decodedToken.email, name: decodedToken.name };
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
    return null;
  });

  const updateUser = useCallback((newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    setUser(newUser);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = React.useMemo(() => ({
    user,
    login,
    logout,
    updateUser
  }), [user, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};