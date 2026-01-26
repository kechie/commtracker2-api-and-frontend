// controllers/v2/v2RootRoutes.js
//const express = require('express'); // actually not needed here

// You can remove express require — not used

exports.getHealth = async (req, res) => {
  res.json({
    status: 'OK',
    version: 'v2',
    timestamp: new Date().toISOString(), // more standard
    uptime: process.uptime()             // optional but nice
  });
};

exports.getRoot = async (req, res) => {   // ← renamed to getRoot (more conventional)
  res.json({
    message: 'Welcome to CommTracker API v2',
    version: 'v2',
    docs: '/v2/docs',                   // optional
    health: '/v2/health'
  });
};

// Alternative modern style (many people prefer this):
/*
module.exports = {
  getHealth,
  getRoot,
};
*/