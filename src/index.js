// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Conditionally load environment variables
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

const app = express();

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(origin => origin.trim());
//console.log('Allowed Origins:', allowedOrigins);
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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
const recipientRoutesV2 = require('./routes/v2/recipients'); // Import recipient routes
const trackerRecipientRoutesV2 = require('./routes/v2/trackerRecipients'); // Import tracker-recipient routes
const recipientTrackerRoutesV2 = require('./routes/v2/recipientTrackers');
const activityLogRoutesV2 = require('./routes/v2/activityLogs');
const analyticsRoutesV2 = require('./routes/v2/analytics');
const publicRoutesV2 = require('./routes/v2/public');
const v2RootRoutes = require('./routes/v2/v2RootRoutes');
const path = require('path');
const { createActivityLoggerMiddleware } = require('./utils/activityLogger');

//app.use('/v1/auth', addDeprecationHeaders('v1', true, '2025-12-31'), authRoutesV1);
//app.use('/v1/users', addDeprecationHeaders('v1', true, '2025-12-31'), userRoutesV1);
app.use('/v2/auth', addDeprecationHeaders('v2', false), authRoutesV2);
app.use('/v2/users', addDeprecationHeaders('v2', false), userRoutesV2);
app.use('/v2/trackers', addDeprecationHeaders('v2', false), trackerRoutesV2);
app.use('/v2/recipients', addDeprecationHeaders('v2', false), recipientRoutesV2); // Use recipient routes
app.use('/v2/tracker-recipients', addDeprecationHeaders('v2', false), trackerRecipientRoutesV2); // Use tracker-recipient routes
app.use('/v2/activity-logs', addDeprecationHeaders('v2', false), activityLogRoutesV2);
app.use('/v2/analytics', addDeprecationHeaders('v2', false), analyticsRoutesV2);
app.use('/v2/recipient-trackers', addDeprecationHeaders('v2', false), recipientTrackerRoutesV2);
app.use('/v2/public', addDeprecationHeaders('v2', false), publicRoutesV2);
app.use('/v2', addDeprecationHeaders('v2', false), v2RootRoutes);
//app.use('/v2', addDeprecationHeaders('v2', false));
// Activity logging middleware
app.use(createActivityLoggerMiddleware());
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
const SEQUELIZE_SYNC_FORCE = process.env.SEQUELIZE_SYNC_FORCE === 'true';
const SEQUELIZE_SYNC_ALTER = process.env.SEQUELIZE_SYNC_ALTER === 'true';
// Import the shared, initialized db
const db = require('./db');

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    if (['development', 'test'].includes(process.env.NODE_ENV)) {
      await db.sequelize.sync({ alter: SEQUELIZE_SYNC_ALTER, force: SEQUELIZE_SYNC_FORCE });
      console.log('Database synchronized successfully.', { alter: SEQUELIZE_SYNC_ALTER, force: SEQUELIZE_SYNC_FORCE });
    } else {
      //await db.sequelize.sync({ alter: true});
      console.log('Skipping database sync/alter in production.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  // console.log('Starting server...');
  // console.log(`Environment: ${process.env.NODE_ENV}`);
  // console.log(`API Port: ${PORT}`);
  // console.log(`Database URL: ${process.env.DATABASE_URL}`);
  // console.log(`Sequelize Sync Force: ${SEQUELIZE_SYNC_FORCE}`);
  // console.log(`Sequelize Sync Alter: ${SEQUELIZE_SYNC_ALTER}`);
  startServer();
}

module.exports = app;