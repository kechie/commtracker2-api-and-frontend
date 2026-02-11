const express = require('express');
const router = express.Router();
const publicTrackerController = require('../../controllers/v2/publicTrackerController');

/**
 * @route   GET /v2/public/:serialNumber/routing-slip
 * @access  Public
 */
router.get('/:serialNumber/routing-slip', publicTrackerController.getRoutingSlip);

module.exports = router;
