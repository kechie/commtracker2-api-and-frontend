import React from 'react';
import { useAuth } from '../context/useAuth';

const AdminScreen = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {user && (
        <p>Welcome, {user.username}! Your role is: {role}</p>
      )}
      <p>This page is only accessible to users with 'admin' or 'superadmin' roles.</p>
      {/* Add admin-specific content here */}
    </div>
  );
};

export default AdminScreen;