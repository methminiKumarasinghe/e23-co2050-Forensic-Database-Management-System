const laboratoriesRepository = require('../../repositories/admin/laboratories.repository');

class LaboratoriesService {
  async getAllLaboratories() {
    return await laboratoriesRepository.findAll();
  }

  async getLaboratoryById(id) {
    const lab = await laboratoriesRepository.findById(id);
    if (!lab) {
      const error = new Error('Laboratory not found');
      error.status = 404;
      throw error;
    }
    return lab;
  }

  async createLaboratory(data) {
    return await laboratoriesRepository.create(data);
  }

  async updateLaboratory(id, data) {
    await this.getLaboratoryById(id);
    return await laboratoriesRepository.update(id, data);
  }

  async deleteLaboratory(id) {
    await this.getLaboratoryById(id);
    const success = await laboratoriesRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete laboratory');
    }
  }
}

module.exports = new LaboratoriesService();
