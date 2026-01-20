// file: src/controllers/v2/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');  // This now returns the full db object with all models

const { User, Recipient } = db;  // Destructure models used here


// Require a JWT secret in environment for security; avoid embedding secrets in code
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

exports.login = async (req, res) => {
  // Minimal logging: do not log secrets, passwords, or other sensitive info
  console.log('v2 Login attempt');
  if (!JWT_SECRET) console.error('JWT_SECRET is not set. Authentication is not secure.');
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Don't log plaintext or hashed passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      message: 'v2 Login successful',
      token,
      user: {
        userId: user.id,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        email: user.email,
        recipientId: user.recipientId  // Include recipientId in response
      }
    });
  } catch (error) {
    console.error('v2 Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
  //  try {

  //   const { username, password } = req.body;
  //   if (!username || !password) {
  //     return res.status(400).json({ error: 'Username and password are required' });
  //   }

  //   const user = await User.findOne({ where: { username } });
  //   if (!user) {
  //     return res.status(401).json({ error: 'Invalid credentials' });
  //   }

  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     return res.status(401).json({ error: 'Invalid credentials' });
  //   }

  //   // Generate JWT for v2
  //   const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
  //     expiresIn: JWT_EXPIRATION
  //   });

  //   res.json({ message: 'v2 Login successful', token, userId: user.id });
  // } catch (error) {
  //   console.error('v2 Login error:', error);
  //   res.status(500).json({ error: 'Internal server error' });
  // }
};

exports.register = async (req, res) => {
  try {
    const { username, password, email, fullname, userrole, deptId } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    // The User model has beforeCreate hook which hashes the password.
    // Don't hash here to avoid double-hashing — pass plaintext and let the model hook handle it.
    const createPayload = {
      username,
      password,
      email,
      fullname
    };
    // map optional role from the request
    if (userrole) createPayload.role = userrole;

    // Handle deptId: API may send a mongo-style id (24 hex) — our Recipient primary key is UUID.
    // if (deptId) {
    //   const isUUID = (s) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);
    //   if (isUUID(deptId)) {
    //     createPayload.recipientId = deptId;
    //   } else {
    //     // Try to resolve by Recipient.mongo_id
    //     const recipient = await Recipient.findOne({ where: { mongo_id: deptId } });
    //     if (!recipient) {
    //       return res.status(400).json({ error: 'Invalid deptId: no matching recipient found' });
    //     }
    //     createPayload.recipientId = recipient.id;
    //   }
    // }

    const user = await User.create(createPayload);
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set. Registration completed but token is not secure.');
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET || 'insecure-placeholder', {
      expiresIn: JWT_EXPIRATION
    });

    res.status(201).json({ message: 'v2 Registration successful', token, user: { userId: user.id, username: user.username, role: user.role, fullname: user.fullname, email: user.email, recipientId: user.recipientId } });
  } catch (error) {
    console.error('v2 Register error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};