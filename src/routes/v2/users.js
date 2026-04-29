// file: src/routes/v2/users.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v2/userController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Role groups
const readRoles = ['admin', 'superadmin', 'monitor'];
const adminRoles = ['admin', 'superadmin'];

// Profile routes (for the authenticated user) - Accessible by all roles
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Admin/general user routes
router.get('/', verifyToken, requireRole(readRoles), userController.getAllUsers);
router.post('/', verifyToken, requireRole(adminRoles), userController.createUser);
router.get('/:id', verifyToken, requireRole(readRoles), userController.getUser);
router.put('/:id', verifyToken, requireRole(adminRoles), userController.updateUser);
router.delete('/:id', verifyToken, requireRole(adminRoles), userController.deleteUser);

router.put('/:id/reset-password', verifyToken, requireRole(adminRoles), userController.resetUserPassword);

module.exports = router;