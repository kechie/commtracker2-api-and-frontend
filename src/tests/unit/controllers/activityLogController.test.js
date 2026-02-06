// tests/unit/controllers/activityLogController.test.js

const { ActivityLog, User, Sequelize } = require('../../../db');
const activityLogController = require('../../../controllers/v2/activityLogController');

// Mock dependencies
jest.mock('../../../db', () => {
  const SequelizeMock = {
    Op: {
      or: Symbol('or'),
      iLike: Symbol('iLike'),
    },
    fn: jest.fn(),
    col: jest.fn(),
  };
  return {
    ActivityLog: {
      findAndCountAll: jest.fn(),
    },
    User: {},
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
    },
    Sequelize: SequelizeMock,
  };
});

describe('ActivityLog Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      query: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getAllActivityLogs', () => {
    it('should include search filters when search query is provided', async () => {
      const searchTerm = 'test-search';
      mockReq.query = { search: searchTerm };

      ActivityLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: '1', description: 'test-search log' }],
      });

      await activityLogController.getAllActivityLogs(mockReq, mockRes);

      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Sequelize.Op.or]: [
              { description: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
              { entityId: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
              { entityType: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
              { action: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
              { '$user.username$': { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
              { '$user.fullname$': { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
            ],
          }),
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            total: 1,
          }),
        })
      );
    });

    it('should work without search query', async () => {
      mockReq.query = {};

      ActivityLog.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: [],
      });

      await activityLogController.getAllActivityLogs(mockReq, mockRes);

      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });
});
