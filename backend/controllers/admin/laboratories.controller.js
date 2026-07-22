const laboratoriesService = require('../../services/admin/laboratories.service');

class LaboratoriesController {
  async getAllLaboratories(req, res, next) {
    try {
      const labs = await laboratoriesService.getAllLaboratories();
      res.status(200).json(labs);
    } catch (error) {
      next(error);
    }
  }

  async getLaboratoryById(req, res, next) {
    try {
      const lab = await laboratoriesService.getLaboratoryById(req.params.id);
      res.status(200).json(lab);
    } catch (error) {
      next(error);
    }
  }

  async createLaboratory(req, res, next) {
    try {
      const lab = await laboratoriesService.createLaboratory(req.body);
      res.status(201).json({ message: 'Laboratory created successfully', lab });
    } catch (error) {
      next(error);
    }
  }

  async updateLaboratory(req, res, next) {
    try {
      const lab = await laboratoriesService.updateLaboratory(req.params.id, req.body);
      res.status(200).json({ message: 'Laboratory updated successfully', lab });
    } catch (error) {
      next(error);
    }
  }

  async deleteLaboratory(req, res, next) {
    try {
      await laboratoriesService.deleteLaboratory(req.params.id);
      res.status(200).json({ message: 'Laboratory deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LaboratoriesController();
