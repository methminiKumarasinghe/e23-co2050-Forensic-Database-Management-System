const reportsRepository = require('../../repositories/admin/reports.repository');

class ReportsController {
  async getSummaryStats(req, res, next) {
    try {
      const stats = await reportsRepository.getSummaryStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();
