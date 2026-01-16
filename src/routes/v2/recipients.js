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
const { verifyToken } = require('../../middleware/authMiddleware');

router.route('/').get(verifyToken, getRecipients).post(verifyToken, createRecipient);
router
  .route('/:id')
  .put(verifyToken, updateRecipient)
  .delete(verifyToken, deleteRecipient);
router.route('/all').get(verifyToken, getAllRecipients);
module.exports = router;
