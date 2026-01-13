// file: src/controllers/v2/userController.js
const { User } = require('../../db');

// Get the authenticated user's profile
exports.getProfile = async (req, res) => {
  try {
    // req.user is populated by the verifyToken middleware
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'fullname', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('v2 Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update the authenticated user's profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { fullname, email, password } = req.body;

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;

    // The 'beforeUpdate' hook in the User model will hash the password if it's changed
    if (password) {
      user.password = password;
    }

    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });
  } catch (error) {
    console.error('v2 Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'fullname', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'v2 User retrieved', user, version: 'v2' });
  } catch (error) {
    console.error('v2 Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Only superadmin and admin can get all users
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You do not have sufficient permissions.' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullname', 'role', 'created_at']
    });
    res.json({ message: 'v2 Users retrieved', users, version: 'v2' });
  } catch (error) {
    console.error('v2 Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Only superadmin and admin can delete users
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You do not have sufficient permissions.' });
    }

    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'v2 User deleted successfully', userId: id, version: 'v2' });
  } catch (error) {
    console.error('v2 Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullname, role } = req.body;

    // Only superadmin and admin can update other users or change roles
    // A user can update their own profile via /profile route, not this route.
    // This route is for admin/superadmin to manage other users.
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You do not have sufficient permissions to update users.' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role if provided
    if (role && !['user', 'superadmin', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await user.update({ email, fullname, role });
    res.json({ message: 'v2 User updated', userId: user.id, version: 'v2' });
  } catch (error) {
    console.error('v2 Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};