// models/index.js
const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const db = {};

  fs.readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&                  // Not hidden
        file !== path.basename(__filename) &&       // Not this file (index.js)
        file.slice(-3) === '.js' &&                 // Is .js
        file !== 'db.js'                            // ← Exclude db.js (and any other non-models)
      );
    })
    .forEach(file => {
      console.log('Loading model file:', file);  // Optional: keep for debugging, remove later
      const modelDef = require(path.join(__dirname, file));

      if (typeof modelDef !== 'function') {
        throw new Error(`Model file ${file} does not export a function!`);
      }

      const model = modelDef(sequelize, DataTypes);
      db[model.name] = model;
    });

  // Run associations
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = require('sequelize');

  return db;
};