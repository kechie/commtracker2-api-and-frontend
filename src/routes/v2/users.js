// file: src/routes/v2/users.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v2/userController');
const { verifyToken } = require('../../middleware/authMiddleware');

// Profile routes (for the authenticated user)
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Admin/general user routes
router.get('/', verifyToken, userController.getAllUsers); // New route to get all users
router.post('/', verifyToken, userController.createUser); // New route to create a user
router.get('/:id', verifyToken, userController.getUser);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, userController.deleteUser); // New route to delete a user

router.put('/:id/reset-password', verifyToken, userController.resetUserPassword); // New route to reset user password

module.exports = router;