const usersService = require('../../services/admin/users.service');

class UsersController {
  async getAllUsers(req, res, next) {
    try {
      const users = await usersService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const newUser = await usersService.createUser(req.body);
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const updatedUser = await usersService.updateUser(req.params.id, req.body);
      res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await usersService.deleteUser(req.params.id);
      res.status(200).json({ message: 'User deleted successfully (soft delete)' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
