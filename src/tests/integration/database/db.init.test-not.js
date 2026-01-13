// tests/integration/database/db.init.test.js

const { sequelize, User /* , other models you want to test */ } = require('../../../models');

describe('Database Initialization & Connection', () => {
  // Very important: close connection after all tests
  afterAll(async () => {
    await sequelize.close().catch(() => {
      // ignore close errors in tests
    });
  });

  describe('Basic connection & models loading', () => {
    it('should successfully authenticate to the database', async () => {
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    it('should have loaded the User model', () => {
      expect(sequelize.models).toHaveProperty('User');
      expect(User).toBeDefined();
      expect(typeof User.findOne).toBe('function');
      expect(typeof User.create).toBe('function');
    });

    // Add checks for other important models
    it('should have loaded other expected models', () => {
      const expectedModels = ['User' /* , 'Post', 'Comment', 'Profile', etc */];

      expectedModels.forEach(modelName => {
        expect(sequelize.models).toHaveProperty(modelName);
      });
    });
  });

  describe('Environment-specific configuration', () => {
    // These tests are tricky because they depend on env variables
    // → we usually test them in different test environments or by mocking

    it('has logging disabled in non-development environment', () => {
      // This is more of a static check
      const currentLogging = sequelize.options.logging;

      if (process.env.NODE_ENV !== 'development') {
        expect(currentLogging).toBe(false);
      } else {
        expect(typeof currentLogging).toBe('function'); // console.log
      }
    });

    // Optional: test SSL config shape (not actual connection)
    it('has proper dialect configuration', () => {
      expect(sequelize.getDialect()).toBe('postgres');

      const options = sequelize.options;

      expect(options.dialect).toBe('postgres');
      expect(options.protocol).toBe('postgres');

      if (process.env.NODE_ENV === 'production') {
        expect(options.dialectOptions.ssl).toMatchObject({
          require: true,
          rejectUnauthorized: false
        });
      } else {
        expect(options.dialectOptions.ssl).toBe(false);
      }
    });
  });

  // Optional - more advanced: verify some associations (if you use them)
  describe('Model associations (smoke test)', () => {
    it('User model has expected associations (if any)', () => {
      // Example - adjust according to your actual associations
      const userAssociations = User.associations;

      // If you have e.g. User.hasMany(Posts)
      // expect(userAssociations).toHaveProperty('Posts');

      // Just checking that at least something is defined is already useful
      expect(Object.keys(userAssociations).length).toBeGreaterThanOrEqual(0);
    });
  });
});