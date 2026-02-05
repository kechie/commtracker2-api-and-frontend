// file: src/controllers/v2/userController.js
const { User, sequelize } = require('../../db');
const { Op } = require('sequelize');
const { logUserActivity } = require('../../utils/activityLogger');

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
    const oldValues = { fullname: user.fullname, email: user.email };

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;

    // The 'beforeUpdate' hook in the User model will hash the password if it's changed
    if (password) {
      user.password = password;
    }

    await user.save();

    // Log profile update
    await logUserActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityId: user.id,
      description: `Updated user profile: ${user.username}`,
      details: { oldValues, newValues: { fullname: user.fullname, email: user.email, passwordChanged: !!password } },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });
  } catch (error) {
    console.error('v2 Update profile error:', error);
    await logUserActivity({
      userId: req.user?.id,
      action: 'UPDATE',
      description: `Failed to update user profile: ${error.message}`,
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'failure'
    });
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

/* exports.getAllUsers = async (req, res) => {
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
}; */

exports.getAllUsers = async (req, res) => {
  try {
    // Only superadmin and admin can get all users
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. insufficient permissions.' });
    }

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    // WHERE conditions
    const where = {};
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { username: { [Op.iLike]: searchTerm } },
        { fullname: { [Op.iLike]: searchTerm } },
        { email: { [Op.iLike]: searchTerm } }
      ];
    }

    // Fetch users with pagination and include related recipient data
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'fullname', 'role', 'recipientId', 'created_at'],
      include: [
        {
          association: 'recipient',
          attributes: ['id', 'recipientCode', 'recipientName', 'initial']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'v2 Users retrieved',
      users: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      },
      version: 'v2'
    });
  } catch (error) {
    console.error('v2 Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Only superadmin and admin can delete users
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
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
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // ──────────────────────────────────────────────
    //           Very important security check!!!
    // ──────────────────────────────────────────────
    if (req.user.role !== 'superadmin') {
      // Normal admin cannot change role or upgrade privileges
      if (role && role !== user.role) {
        return res.status(403).json({
          error: 'Only superadmin can change user roles'
        });
      }

      // Optional: prevent admin from modifying superadmin
      if (user.role === 'superadmin') {
        return res.status(403).json({
          error: 'Superadmin accounts can only be modified by another superadmin'
        });
      }
    }

    // Update allowed fields
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json({
      message: 'v2 User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role
      },
      version: 'v2'
    });
  } catch (error) {
    console.error('v2 Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Only superadmin and admin can reset user passwords
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword; // The 'beforeUpdate' hook will hash this password
    await user.save();

    res.json({ message: 'v2 Password reset successfully', userId: id, version: 'v2' });
  } catch (error) {
    console.error('v2 Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    // Only superadmin and admin can create users
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { username, password, email, fullname, role, recipientId } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    // Role-based security check (similar to updateUser)
    if (req.user.role !== 'superadmin') {
      if (role && role === 'superadmin') {
        return res.status(403).json({ error: 'Only superadmin can create superadmin accounts' });
      }
    }

    const user = await User.create({
      username,
      password,
      email,
      fullname,
      role: role || 'recipient',
      recipientId: recipientId || null
    });

    // Log user creation
    await logUserActivity({
      userId: req.user.id,
      action: 'CREATE',
      entityId: user.id,
      description: `Created user: ${user.username}`,
      details: { role: user.role, recipientId: user.recipientId },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        recipientId: user.recipientId
      }
    });
  } catch (error) {
    console.error('v2 Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};