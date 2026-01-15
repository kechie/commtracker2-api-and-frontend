//frontend/src/screens/ReceivingDashboardScreen.jsx
//import React from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

const ReceivingDashboardScreen = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1>Receiving Dashboard</h1>
      {user && (
        <p>Welcome, {user.username}! Your role is: {role}</p>
      )}
      {/*<p>This is a dashboard specifically for users with the 'receiving' role.</p>
       Add receiving-specific content here
      Analytics, recent activities, quick actions, etc.
      */}
      <Link to="/trackers">Manage Document Trackers</Link>
    </div>
  );
};

export default ReceivingDashboardScreen;