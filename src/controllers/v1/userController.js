// file: src/controllers/v1/userController.js
const { User } = require('../../models');

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'fullname', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'v1 User retrieved', user });
  } catch (error) {
    console.error('v1 Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullname } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ email, fullname });
    res.json({ message: 'v1 User updated', userId: user.id });
  } catch (error) {
    console.error('v1 Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};