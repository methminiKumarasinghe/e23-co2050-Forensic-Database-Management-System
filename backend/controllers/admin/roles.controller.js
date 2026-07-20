const rolesService = require('../../services/admin/roles.service');

class RolesController {
  async getAllRoles(req, res, next) {
    try {
      const roles = await rolesService.getAllRoles();
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req, res, next) {
    try {
      const newRole = await rolesService.createRole(req.body);
      res.status(201).json({ message: 'Role created successfully', role: newRole });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const updatedRole = await rolesService.updateRole(req.params.id, req.body);
      res.status(200).json({ message: 'Role updated successfully', role: updatedRole });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
