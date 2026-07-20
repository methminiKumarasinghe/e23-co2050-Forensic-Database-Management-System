const auditLogsRepository = require('../../repositories/admin/auditlogs.repository');

class AuditLogsService {
  async getAuditLogs(filters) {
    return await auditLogsRepository.findAll(filters);
  }

  async logAction(data) {
    return await auditLogsRepository.create(data);
  }
}

module.exports = new AuditLogsService();
