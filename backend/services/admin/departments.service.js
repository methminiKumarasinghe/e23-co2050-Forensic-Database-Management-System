const departmentsRepository = require('../../repositories/admin/departments.repository');

class DepartmentsService {
  async getAllDepartments() {
    return await departmentsRepository.findAll();
  }

  async getDepartmentById(id) {
    const department = await departmentsRepository.findById(id);
    if (!department) {
      const error = new Error('Department not found');
      error.status = 404;
      throw error;
    }
    return department;
  }

  async createDepartment(data) {
    return await departmentsRepository.create(data);
  }

  async updateDepartment(id, data) {
    await this.getDepartmentById(id);
    return await departmentsRepository.update(id, data);
  }

  async deleteDepartment(id) {
    await this.getDepartmentById(id);
    const success = await departmentsRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete department');
    }
  }
}

module.exports = new DepartmentsService();
