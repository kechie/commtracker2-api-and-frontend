import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return; // Wait for authentication to load
    }

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      navigate('/', { replace: true }); // Or to a '/unauthorized' page
    }
  }, [isAuthenticated, loading, role, navigate, allowedRoles]);

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // Render children only if authenticated and authorized
  if (isAuthenticated && (!allowedRoles || allowedRoles.includes(role))) {
    return children;
  }

  // Otherwise, render null or a loading indicator while redirecting
  return null;
};

export default ProtectedRoute;