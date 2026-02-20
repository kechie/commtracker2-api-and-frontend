// file: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No Authorization header' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    return res.status(401).json({ error: 'Invalid Authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // If User model is available, fetch canonical user record (optional but useful)
    try {
      if (db && db.User && decoded && decoded.userId) {
        const user = await db.User.findByPk(decoded.userId);
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = { 
          id: user.id, 
          role: user.role, 
          username: user.username,
          recipientId: user.recipientId
        };
        return next();
      }
    } catch (fetchErr) {
      console.warn('Failed to fetch user during token verification', fetchErr);
      // fall through and attach decoded token
    }

    req.user = decoded;
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// role-based authorization middleware
// allowedRoles: array of allowed role strings or a single role string
exports.requireRole = (allowedRoles) => {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(403).json({ error: 'Forbidden' });
    if (allowed.includes(role)) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
};