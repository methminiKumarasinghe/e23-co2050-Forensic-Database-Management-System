const dashboardRepository = require('../../repositories/admin/dashboard.repository');

class DashboardService {
  async getStatistics() {
    return await dashboardRepository.getDashboardStats();
  }
}

module.exports = new DashboardService();
