// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(bodyParser.json({
  type: ['application/json', 'application/json; charset=UTF-8', 'application/json; charset=utf-8']
}));

// Middleware for headers
const addDeprecationHeaders = (version, isDeprecated, deprecationDate) => {
  return (req, res, next) => {
    if (isDeprecated) {
      res.set({
        'X-API-Version-Deprecated': 'true',
        'X-API-Deprecation-Date': deprecationDate || 'TBD',
        'X-API-Version': version
      });
    } else {
      res.set({ 'X-API-Version': version });
    }
    next();
  };
};

// Import routes
//const authRoutesV1 = require('./routes/v1/auth');
//const userRoutesV1 = require('./routes/v1/users');
const authRoutesV2 = require('./routes/v2/auth');
const userRoutesV2 = require('./routes/v2/users');
const trackerRoutesV2 = require('./routes/v2/trackers');
const path = require('path');

//app.use('/v1/auth', addDeprecationHeaders('v1', true, '2025-12-31'), authRoutesV1);
//app.use('/v1/users', addDeprecationHeaders('v1', true, '2025-12-31'), userRoutesV1);
app.use('/v2/auth', addDeprecationHeaders('v2', false), authRoutesV2);
app.use('/v2/users', addDeprecationHeaders('v2', false), userRoutesV2);
app.use('/v2/trackers', addDeprecationHeaders('v2', false), trackerRoutesV2);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    versions: {
      v1: { status: 'deprecated', deprecationDate: '2025-12-31' },
      v2: { status: 'active' }
    }
  });
});

const PORT = process.env.API_PORT || 5007;
const SEQUELIZE_SYNC_FORCE = process.env.SEQUELIZE_SYNC_FORCE || 'false';
// Import the shared, initialized db
const db = require('./db');

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    if (['development', 'test'].includes(process.env.NODE_ENV)) {
      await db.sequelize.sync({ alter: true, force: SEQUELIZE_SYNC_FORCE });
      console.log('Database synchronized (alter mode).');
    } else {
      //await db.sequelize.sync({ alter: true});
      console.log('Skipping database sync in production.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();