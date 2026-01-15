// src/routes/v2/recipients.js
const express = require('express');
const router = express.Router();
const {
  getRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
} = require('../../controllers/v2/recipientController');
const { verifyToken } = require('../../middleware/authMiddleware');

router.route('/').get(verifyToken, getRecipients).post(verifyToken, createRecipient);
router
  .route('/:id')
  .put(verifyToken, updateRecipient)
  .delete(verifyToken, deleteRecipient);

module.exports = router;
