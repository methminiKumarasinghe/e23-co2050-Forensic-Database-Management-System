const rolesRepository = require('../../repositories/admin/roles.repository');

class RolesService {
  async getAllRoles() {
    return await rolesRepository.findAll();
  }

  async getRoleById(id) {
    const role = await rolesRepository.findById(id);
    if (!role) {
      const error = new Error('Role not found');
      error.status = 404;
      throw error;
    }
    return role;
  }

  async createRole(data) {
    return await rolesRepository.create(data);
  }

  async updateRole(id, data) {
    // Verify existence
    await this.getRoleById(id);
    return await rolesRepository.update(id, data);
  }
}

module.exports = new RolesService();
