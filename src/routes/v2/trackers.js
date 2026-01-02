const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const trackerController = require('../../controllers/v2/trackerController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Configure multer storage to ./uploads
const { randomUUID } = require('crypto');

const storage = multer.diskStorage({
  // save uploads to project-root/uploads so static server/nginx can serve them
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Roles
const WRITE_ROLES = ['superadmin', 'admin', 'receiving', 'recipient'];
const READ_ROLES = ['superadmin', 'admin', 'receiving', 'viewer', 'monitor', 'staff'];
const ADMIN_ROLES = ['superadmin', 'admin'];

router.post('/', verifyToken, requireRole(WRITE_ROLES), upload.single('attachment'), trackerController.createTracker);
router.get('/', verifyToken, requireRole(READ_ROLES), trackerController.listTrackers);
router.get('/:id', verifyToken, requireRole(READ_ROLES), trackerController.getTracker);
router.put('/:id', verifyToken, requireRole(WRITE_ROLES), upload.single('attachment'), trackerController.updateTracker);
router.delete('/:id', verifyToken, requireRole(ADMIN_ROLES), trackerController.deleteTracker);

module.exports = router;
