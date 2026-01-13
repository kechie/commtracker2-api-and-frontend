// src/models/db.js
// This file initializes and exports the fully loaded models

const { Sequelize } = require('sequelize');
require('dotenv').config();


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Load all models and associations
const modelLoader = require('./models/index'); // your existing models/index.js function
const db = modelLoader(sequelize);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;