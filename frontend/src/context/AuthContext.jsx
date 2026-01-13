import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin } from '../utils/api'; // Import the login function from api.js

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          setUser(parsedUserInfo);
          // Assuming role is directly available in parsedUserInfo or can be decoded from token
          // For now, let's assume the backend login response directly includes the role.
          // If not, we might need to decode the JWT token here to get the role.
          setRole(parsedUserInfo.role || (parsedUserInfo.token ? JSON.parse(atob(parsedUserInfo.token.split('.')[1])).role : null));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        localStorage.removeItem('userInfo'); // Clear invalid data
      } finally {
        setLoading(false);
      }
    };

    loadUserFromLocalStorage();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await apiLogin(username, password);
      localStorage.setItem('userInfo', JSON.stringify(response));
      setUser(response);
      setRole(response.role || (response.token ? JSON.parse(atob(response.token.split('.')[1])).role : null));
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login failed in AuthProvider:', error);
      logout(); // Ensure state is cleared on login failure
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
