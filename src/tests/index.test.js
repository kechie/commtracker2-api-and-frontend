const request = require('supertest');
const express = require('express');
const { connectToDatabase, syncDatabase } = require('../models');
//const { addDeprecationHeaders } = require('../index'); // Import the middleware
const { addDeprecationHeaders } = require('../index'); // Import the middleware
let app;

// Mock dependencies
jest.mock('express', () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn()
  }));
  mockExpress.json = jest.fn();
  return mockExpress;
});

jest.mock('../models', () => ({
  connectToDatabase: jest.fn(),
  syncDatabase: jest.fn()
}));

jest.mock('../routes/v1/auth', () => jest.fn());
jest.mock('../routes/v1/users', () => jest.fn());
jest.mock('../routes/v2/auth', () => jest.fn());
jest.mock('../routes/v2/users', () => jest.fn());

describe('API Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    app = require('../index');
  });

  describe('Middleware - addDeprecationHeaders', () => {
    it('should add deprecation headers for deprecated versions', () => {
      const req = {};
      const res = { set: jest.fn() };
      const next = jest.fn();

      const middleware = addDeprecationHeaders('v1', true, '2025-12-31');
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-API-Version-Deprecated': 'true',
        'X-API-Deprecation-Date': '2025-12-31',
        'X-API-Version': 'v1'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should add only version header for non-deprecated versions', () => {
      const req = {};
      const res = { set: jest.fn() };
      const next = jest.fn();

      const middleware = addDeprecationHeaders('v2', false);
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({ 'X-API-Version': 'v2' });
      expect(next).toHaveBeenCalled();
    });

    it('should use TBD as default deprecation date', () => {
      const req = {};
      const res = { set: jest.fn() };
      const next = jest.fn();

      const middleware = addDeprecationHeaders('v1', true);
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-API-Version-Deprecated': 'true',
        'X-API-Deprecation-Date': 'TBD',
        'X-API-Version': 'v1'
      });
    });
  });

  describe('Route Configuration', () => {
    it('should mount v1 routes with deprecation headers', () => {
      const app = require('../index');
      expect(app.use).toHaveBeenCalledWith(
        '/v1/auth',
        expect.any(Function),
        expect.any(Function)
      );
      expect(app.use).toHaveBeenCalledWith(
        '/v1/users',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should mount v2 routes without deprecation', () => {
      const app = require('../index');
      expect(app.use).toHaveBeenCalledWith(
        '/v2/auth',
        expect.any(Function),
        expect.any(Function)
      );
      expect(app.use).toHaveBeenCalledWith(
        '/v2/users',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('Body Parser Configuration', () => {
    it('should configure body-parser with correct content types', () => {
      const app = require('../index');
      expect(express.json).toHaveBeenCalledWith({
        type: [
          'application/json',
          'application/json; charset=UTF-8',
          'application/json; charset=utf-8'
        ]
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      connectToDatabase.mockRejectedValue(timeoutError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

      await require('../index');

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start server:', timeoutError);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should handle database sync errors', async () => {
      process.env.NODE_ENV = 'development';
      const syncError = new Error('Sync failed');
      connectToDatabase.mockResolvedValue();
      syncDatabase.mockRejectedValue(syncError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

      await require('../index');

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start server:', syncError);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});

jest.mock('../routes/v1/auth', () => jest.fn());
jest.mock('../routes/v1/users', () => jest.fn());
jest.mock('../routes/v2/auth', () => jest.fn());
jest.mock('../routes/v2/users', () => jest.fn());

describe('API Server', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Middleware - addDeprecationHeaders', () => {
    it('should add deprecation headers for deprecated versions', () => {
      const req = {};
      const res = { set: jest.fn() };
      const next = jest.fn();

      const middleware = addDeprecationHeaders('v1', true, '2025-12-31');
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-API-Version-Deprecated': 'true',
        'X-API-Deprecation-Date': '2025-12-31',
        'X-API-Version': 'v1'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should add only version header for non-deprecated versions', () => {
      const req = {};
      const res = { set: jest.fn() };
      const next = jest.fn();

      const middleware = addDeprecationHeaders('v2', false);
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({ 'X-API-Version': 'v2' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Root Endpoint', () => {
    it('should return API status information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'API is running',
        versions: {
          v1: { status: 'deprecated', deprecationDate: '2025-12-31' },
          v2: { status: 'active' }
        }
      });
    });
  });

  describe('Server Startup', () => {
    it('should start server successfully in development environment', async () => {
      process.env.NODE_ENV = 'development';

      connectToDatabase.mockResolvedValue();
      syncDatabase.mockResolvedValue();

      await require('./index');

      expect(connectToDatabase).toHaveBeenCalled();
      expect(syncDatabase).toHaveBeenCalled();
    });

    it('should skip database sync in production environment', async () => {
      process.env.NODE_ENV = 'production';

      connectToDatabase.mockResolvedValue();

      await require('./index');

      expect(connectToDatabase).toHaveBeenCalled();
      expect(syncDatabase).not.toHaveBeenCalled();
    });

    it('should handle startup errors', async () => {
      const mockError = new Error('Database connection failed');
      connectToDatabase.mockRejectedValue(mockError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

      await require('./index');

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start server:', mockError);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});