const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // If it's a known application error with a specific status
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Handle unique constraint violations from Postgres (code 23505)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A duplicate record already exists' });
  }

  // Handle foreign key constraint violations from Postgres (code 23503)
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist or cannot be deleted' });
  }

  // Default fallback for unhandled exceptions
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorHandler };
