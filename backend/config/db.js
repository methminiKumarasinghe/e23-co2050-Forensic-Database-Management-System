const pool = require('../database/connection');

module.exports = {
  query: (text, params) => pool.query(text, params),
};

