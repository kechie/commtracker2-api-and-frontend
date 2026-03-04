// tests/unit/controllers/trackerController.test.js

const { Tracker, sequelize } = require('../../../db');
const trackerController = require('../../../controllers/v2/trackerController');

// Mock dependencies
jest.mock('../../../db', () => {
  const SequelizeMock = {
    Op: {
      or: Symbol('or'),
      in: Symbol('in'),
      iLike: Symbol('iLike'),
    },
    literal: jest.fn(val => val),
  };
  return {
    Tracker: {
      findAndCountAll: jest.fn(),
    },
    sequelize: SequelizeMock,
    Sequelize: SequelizeMock,
    Op: SequelizeMock.Op,
  };
});

describe('Tracker Controller (v2)', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getTrackers', () => {
    it('should sort by dateReceived by default', async () => {
      Tracker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await trackerController.getTrackers(mockReq, mockRes);

      expect(Tracker.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['dateReceived', 'DESC']],
        })
      );
    });

    it('should sort by latestRecipientUpdate using a literal subquery', async () => {
      mockReq.query.sortBy = 'latestRecipientUpdate';
      Tracker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await trackerController.getTrackers(mockReq, mockRes);

      expect(Tracker.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [[expect.stringContaining('SELECT MAX(updated_at)'), 'DESC']],
        })
      );
    });

    it('should validate sortOrder', async () => {
      mockReq.query.sortOrder = 'INVALID';

      await trackerController.getTrackers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid sortOrder. Must be ASC or DESC',
      });
    });

    it('should validate sortBy and fallback to dateReceived', async () => {
      mockReq.query.sortBy = 'invalidField';
      Tracker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await trackerController.getTrackers(mockReq, mockRes);

      expect(Tracker.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['dateReceived', 'DESC']],
        })
      );
    });

    it('should use provided limit and page', async () => {
      mockReq.query.page = '2';
      mockReq.query.limit = '25';
      Tracker.findAndCountAll.mockResolvedValue({ count: 50, rows: [] });

      await trackerController.getTrackers(mockReq, mockRes);

      expect(Tracker.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
          offset: 25,
        })
      );
    });
  });
});
