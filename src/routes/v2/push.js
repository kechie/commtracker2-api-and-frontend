const express = require('express');
const router = express.Router();
const pushController = require('../../controllers/v2/pushController');
const { verifyToken } = require('../../middleware/authMiddleware');

router.get('/vapid-key', verifyToken, pushController.getVapidKey);
router.post('/subscribe', verifyToken, pushController.subscribe);
router.post('/test', verifyToken, pushController.sendTestNotification);

module.exports = router;
