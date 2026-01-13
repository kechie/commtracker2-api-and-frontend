import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    // Optionally render a loading spinner or skeleton screen
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User is authenticated but does not have the required role
    // You might want to redirect to an unauthorized page or display an error
    return <Navigate to="/" replace />; // Redirect to home or a forbidden page
  }

  // User is authenticated and has the required role (if specified)
  return children;
};

export default ProtectedRoute;