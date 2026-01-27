// file: src/routes/v2/v2RootRoutes.js
const express = require('express');
const router = express.Router();
const v2RootController = require('../../controllers/v2/v2RootRoutes');

router.get('/', v2RootController.getRoot);
/**
 * @desc    API Root for v2
 * @route   GET /v2/health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date(),
  });
});

module.exports = router;