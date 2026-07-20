const authService = require('../services/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const result = await authService.login(username, password);
      
      // Usually token can be returned in response body or set as HttpOnly cookie.
      // Returning in response body as requested.
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Invalid username or password' || error.message.includes('account is')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res) {
    try {
      // In JWT, logout is usually handled client-side by discarding the token.
      // If we had a token blacklist or refresh tokens, we would invalidate it here.
      res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMe(req, res) {
    try {
      // userId is set in authenticateToken middleware
      const userId = req.user.userId;
      
      const result = await authService.getMe(userId);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
