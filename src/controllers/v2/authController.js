// file: src/controllers/v2/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');  // This now returns the full db object with all models

const { User } = db;  // Destructure User from the loaded models


const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret'; // Store in .env
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h'; // Store in .env

exports.login = async (req, res) => {
  console.log('v2 Login attempt:', req.body);
  console.log('Using JWT_SECRET:', JWT_SECRET);
  console.log('Using JWT_EXPIRATION:', JWT_EXPIRATION);
  console.log('Database URL:', process.env.DATABASE_URL);
  console.log('Node Environment:', process.env.NODE_ENV);
  console.log('API Port:', process.env.API_PORT);
  console.log('User Model:', User ? 'Loaded' : 'Not Loaded');
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    console.log('User found in DB:', user ? user.username : 'None');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Plaintext password from request:', password);
    console.log('Hashed password from DB:', user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare result:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({ message: 'v2 Login successful', token, userId: user.id });
  } catch (error) {
    console.error('v2 Login error:', error);
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
    const { username, password, email, fullname } = req.body;
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, email, fullname });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1h'
    });

    res.status(201).json({ message: 'v2 Registration successful', token, userId: user.id });
  } catch (error) {
    console.error('v2 Register error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};