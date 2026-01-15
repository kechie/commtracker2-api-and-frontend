//import React from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
const AdminScreen = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/*console.log(user)
      user && (
        <p>Welcome, {user.username}! Your role is: {role}</p>
      ) 
      <p>This page is only accessible to users with 'admin' or 'superadmin' roles.</p>*/}
      {/* Add admin-specific content here 
      <p>{user.userId}, {role}</p>*/}
      <Link to="/users-management">User Accounts Management</Link>
      <Link to="/recipients-management" className="ms-3">Department/Office/Agency Management</Link>
    </div>
  );
};

export default AdminScreen;