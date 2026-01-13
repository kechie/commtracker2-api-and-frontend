// src/routes/v2/recipients.js
const express = require('express');
const router = express.Router();
const { getRecipients } = require('../../controllers/v2/recipientController');
const { verifyToken } = require('../../middleware/authMiddleware');

router.get('/', verifyToken, getRecipients);

module.exports = router;
