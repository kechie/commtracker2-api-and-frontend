// tests/unit/controllers/authController.test.js

// Set environment variables BEFORE requiring modules
process.env.JWT_SECRET = 'test-secret-very-secure';
process.env.JWT_EXPIRATION = '1h';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../db'); // adjust path to your actual db export

// Mock dependencies before requiring the controller
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../db', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const authController = require('../../../controllers/v2/authController');

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_EXPIRATION;
});

describe('Auth Controller (v2)', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Default env
    process.env.JWT_SECRET = 'test-secret-very-secure';
    process.env.JWT_EXPIRATION = '1h';

    // Set default mock implementations
    bcrypt.hash.mockResolvedValue('hashed_password');
    bcrypt.compare.mockResolvedValue(false);
    jwt.sign.mockReturnValue('jwt-token');
  });

  describe('POST /login', () => {
    it('should return 400 when username or password is missing', async () => {
      mockReq.body = { username: 'testuser' }; // password missing

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Username and password are required',
      });
    });

    it('should return 401 when user not found', async () => {
      mockReq.body = { username: 'nonexistent', password: '123456' };

      User.findOne.mockResolvedValue(null);

      await authController.login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'nonexistent' } });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 401 when password is incorrect', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpass' };

      const fakeUser = {
        id: 42,
        username: 'testuser',
        password: '$2b$10$fakehashedpassword',
        role: 'user',
      };

      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(mockReq, mockRes);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpass', fakeUser.password);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should login successfully and return token', async () => {
      mockReq.body = { username: 'testuser', password: 'correctpass' };

      const fakeUser = {
        id: 42,
        username: 'testuser',
        password: '$2b$10$correcthashedpassword',
        role: 'admin',
      };

      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token-123456');

      await authController.login(mockReq, mockRes);

      expect(bcrypt.compare).toHaveBeenCalledWith('correctpass', fakeUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 42, role: 'admin' },
        'test-secret-very-secure',
        { expiresIn: '1h' }
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'v2 Login successful',
        token: 'fake-jwt-token-123456',
        userId: 42,
      });
    });

    it('should return 500 on unexpected database error', async () => {
      mockReq.body = { username: 'testuser', password: '123456' };

      User.findOne.mockRejectedValue(new Error('Database connection lost'));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('POST /register', () => {
    it('should return 400 when required fields are missing', async () => {
      mockReq.body = { username: 'newuser', password: '123456' }; // email missing

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Username, password, and email are required',
      });
    });

    it('should return 409 when username already exists', async () => {
      mockReq.body = {
        username: 'existing',
        password: '123456',
        email: 'new@email.com',
        fullname: 'Test User',
      };

      User.findOne
        .mockResolvedValueOnce({ username: 'existing' }) // username check
        .mockResolvedValueOnce(null); // email check (not reached)

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Username already exists' });
    });

    it('should return 409 when email already exists', async () => {
      mockReq.body = {
        username: 'newuser',
        password: '123456',
        email: 'taken@email.com',
        fullname: 'Test User',
      };

      // Create a custom mock that returns different values based on parameters
      User.findOne.mockImplementation((query) => {
        if (query.where && query.where.username) {
          return Promise.resolve(null); // username not found
        } else if (query.where && query.where.email) {
          return Promise.resolve({ email: 'taken@email.com' }); // email found
        }
        return Promise.resolve(null);
      });

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });

    it('should register new user successfully', async () => {
      mockReq.body = {
        username: 'newuser123',
        password: 'strongpass123',
        email: 'newuser@example.com',
        fullname: 'New User',
      };

      // First call returns null (username check), second call returns null (email check)
      User.findOne.mockResolvedValue(null);

      const createdUser = {
        id: 100,
        username: 'newuser123',
        email: 'newuser@example.com',
        role: 'user',
      };

      User.create.mockResolvedValue(createdUser);
      bcrypt.hash.mockResolvedValue('hashed_password_123');
      jwt.sign.mockReturnValue('brand-new-jwt-token');

      await authController.register(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser123',
          password: 'strongpass123', // the hash result
          email: 'newuser@example.com',
          fullname: 'New User',
        })
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 100, role: 'user' },
        'test-secret-very-secure',
        { expiresIn: '1h' }
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'v2 Registration successful',
        token: 'brand-new-jwt-token',
        userId: 100,
      });
    });

    it('should handle SequelizeUniqueConstraintError gracefully', async () => {
      mockReq.body = {
        username: 'duplicate',
        password: '123456',
        email: 'dup@email.com',
      };

      const uniqueError = new Error('Validation error');
      uniqueError.name = 'SequelizeUniqueConstraintError';

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(uniqueError);

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Username or email already exists',
      });
    });
  });
});