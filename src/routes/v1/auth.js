// file: src/routes/v1/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/v1/authController');

router.post('/login', authController.login);
//router.post('/register', authController.register);
if (process.env.NODE_ENV !== 'production') {
  router.post('/register', authController.register);
}

module.exports = router;
