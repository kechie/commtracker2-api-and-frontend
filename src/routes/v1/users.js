// file: src/routes/v1/users.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/userController');

router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);

module.exports = router;