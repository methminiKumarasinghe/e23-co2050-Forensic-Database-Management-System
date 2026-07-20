const hospitalsRepository = require('../../repositories/admin/hospitals.repository');

class HospitalsService {
  async getAllHospitals() {
    return await hospitalsRepository.findAll();
  }

  async getHospitalById(id) {
    const hospital = await hospitalsRepository.findById(id);
    if (!hospital) {
      const error = new Error('Hospital not found');
      error.status = 404;
      throw error;
    }
    return hospital;
  }

  async createHospital(data) {
    return await hospitalsRepository.create(data);
  }

  async updateHospital(id, data) {
    await this.getHospitalById(id);
    return await hospitalsRepository.update(id, data);
  }

  async deleteHospital(id) {
    await this.getHospitalById(id);
    const success = await hospitalsRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete hospital');
    }
  }
}

module.exports = new HospitalsService();
