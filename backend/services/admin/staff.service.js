const staffRepository = require('../../repositories/admin/staff.repository');

class StaffService {
  async getAllStaff() {
    return await staffRepository.findAll();
  }

  async getStaffById(id) {
    const staff = await staffRepository.findById(id);
    if (!staff) {
      const error = new Error('Staff record not found');
      error.status = 404;
      throw error;
    }
    return staff;
  }

  async createStaff(data) {
    return await staffRepository.create(data);
  }

  async updateStaff(id, data) {
    await this.getStaffById(id);
    return await staffRepository.update(id, data);
  }

  async deleteStaff(id) {
    await this.getStaffById(id);
    const success = await staffRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete staff record');
    }
  }
}

module.exports = new StaffService();
