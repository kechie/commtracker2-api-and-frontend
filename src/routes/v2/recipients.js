// src/routes/v2/recipients.js
const express = require('express');
const router = express.Router();
const {
  getRecipients,
  getAllRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
} = require('../../controllers/v2/recipientController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Role groups
const readRoles = ['admin', 'superadmin', 'receiving', 'monitor', 'lcestaff', 'lce'];
const writeRoles = ['admin', 'superadmin', 'receiving'];

router.route('/')
  .get(verifyToken, requireRole(readRoles), getRecipients)
  .post(verifyToken, requireRole(writeRoles), createRecipient);

router.route('/:id')
  .put(verifyToken, requireRole(writeRoles), updateRecipient)
  .delete(verifyToken, requireRole(writeRoles), deleteRecipient);

router.route('/all').get(verifyToken, requireRole(readRoles), getAllRecipients);

module.exports = router;
