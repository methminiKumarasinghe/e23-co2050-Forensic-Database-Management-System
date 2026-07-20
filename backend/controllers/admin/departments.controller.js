const departmentsService = require('../../services/admin/departments.service');

class DepartmentsController {
  async getAllDepartments(req, res, next) {
    try {
      const departments = await departmentsService.getAllDepartments();
      res.status(200).json(departments);
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req, res, next) {
    try {
      const department = await departmentsService.getDepartmentById(req.params.id);
      res.status(200).json(department);
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const department = await departmentsService.createDepartment(req.body);
      res.status(201).json({ message: 'Department created successfully', department });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const department = await departmentsService.updateDepartment(req.params.id, req.body);
      res.status(200).json({ message: 'Department updated successfully', department });
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      await departmentsService.deleteDepartment(req.params.id);
      res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentsController();
