const bcrypt = require('bcryptjs');
const usersRepository = require('../../repositories/admin/users.repository');

class UsersService {
  async getAllUsers() {
    return await usersRepository.findAll();
  }

  async getUserById(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return user;
  }

  async createUser(data) {
    const { username, password, email, phone, roles } = data;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userData = { username, password_hash, email, phone };
    return await usersRepository.create(userData, roles);
  }

  async updateUser(id, data) {
    // Check if user exists
    await this.getUserById(id);

    const { roles, password, ...updates } = data;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    return await usersRepository.update(id, updates, roles);
  }

  async deleteUser(id) {
    // Check if user exists
    await this.getUserById(id);
    const success = await usersRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete user');
    }
  }
}

module.exports = new UsersService();
