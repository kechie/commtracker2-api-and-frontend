// file: src/routes/v2/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/v2/authController');
const { body, validationResult } = require('express-validator');

router.post('/login', authController.login);
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/register',
    [
      body('username').isLength({ min: 3 }).trim().escape(),
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 6 })
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
    authController.register);
}

module.exports = router;

//if (process.env.NODE_ENV !== 'production') {
//  router.post('/register', authController.register);
//}