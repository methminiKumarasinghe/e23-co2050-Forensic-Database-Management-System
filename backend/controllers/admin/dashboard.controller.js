const dashboardService = require('../../services/admin/dashboard.service');

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const stats = await dashboardService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
