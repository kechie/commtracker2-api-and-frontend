import React from 'react';
import { useAuth } from '../context/AuthContext';

const ReceivingDashboardScreen = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1>Receiving Dashboard</h1>
      {user && (
        <p>Welcome, {user.username}! Your role is: {role}</p>
      )}
      <p>This is a dashboard specifically for users with the 'receiving' role.</p>
      {/* Add receiving-specific content here */}
    </div>
  );
};

export default ReceivingDashboardScreen;