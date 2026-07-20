const auditLogsService = require('../../services/admin/auditlogs.service');

class AuditLogsController {
  async getAuditLogs(req, res, next) {
    try {
      const logs = await auditLogsService.getAuditLogs(req.query);
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditLogsController();
