import React, { useState, useEffect, useContext } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    userrole: 'user', // Default role
  });

  const { userInfo } = useContext(AuthContext);
  const isAdminOrSuperAdmin = userInfo && (userInfo.role === 'admin' || userInfo.role === 'superadmin');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    console.log('Fetching users...');
    console.log('Current user info:', userInfo);
    setLoading(true);
    setError(null);
    try {
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createUser(newUser);
      setNewUser({ name: '', username: '', email: '', password: '', userrole: 'user' });
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to create user.');
      console.error('Create user error:', err);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        fullname: editingUser.fullname,
        email: editingUser.email,
        role: editingUser.role,
      });
      setEditingUser(null); // Exit editing mode
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to update user.');
      console.error('Update user error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    try {
      await deleteUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      console.error('Delete user error:', err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  if (!isAdminOrSuperAdmin) {
    console.log('Access denied: insufficient permissions for user', userInfo);
    return (
      <div className="container mt-5">
        <h2 className="text-center text-danger">Access Denied</h2>
        <p className="text-center">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">User Management</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center">Loading users...</div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <h3>Create New User</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Full Name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <select
                    className="form-select"
                    name="userrole"
                    value={newUser.userrole}
                    onChange={handleNewUserChange}
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Create User</button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Existing Users</h3>
            </div>
            <ul className="list-group list-group-flush">
              {users.map((user) => (
                <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {editingUser && editingUser.id === user.id ? (
                    <form onSubmit={handleUpdateUser} className="flex-grow-1 me-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        name="fullname"
                        value={editingUser.fullname}
                        onChange={handleEditChange}
                      />
                      <input
                        type="email"
                        className="form-control mb-2"
                        name="email"
                        value={editingUser.email}
                        onChange={handleEditChange}
                      />
                      <select
                        className="form-select mb-2"
                        name="role"
                        value={editingUser.role}
                        onChange={handleEditChange}
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                      <button type="submit" className="btn btn-success btn-sm me-2">Save</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
                    </form>
                  ) : (
                    <div className="flex-grow-1">
                      <h5>{user.fullname} ({user.username})</h5>
                      <p className="mb-1">Email: {user.email}</p>
                      <p className="mb-1">Role: {user.role}</p>
                    </div>
                  )}
                  <div>
                    {!editingUser && (
                      <>
                        <button className="btn btn-info btn-sm me-2" onClick={() => setEditingUser(user)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagementScreen;
