const accessLogsRepository = require('../../repositories/admin/accesslogs.repository');

class AccessLogsController {
  async getAllAccessLogs(req, res, next) {
    try {
      const filters = {
        username: req.query.username,
        action: req.query.action
      };
      const logs = await accessLogsRepository.findAll(filters);
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccessLogsController();
