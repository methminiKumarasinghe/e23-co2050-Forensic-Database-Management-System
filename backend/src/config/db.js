const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30 seconds to allow Neon compute endpoint to wake up
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL pool: new client connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Test DB connectivity with retries — called at server startup
 */
const testConnection = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT NOW() AS server_time');
        console.log(`✅ Database connected — server time: ${result.rows[0].server_time}`);
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`⚠️  Database connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Thin query helper — wraps pool.query for convenience
 */
const query = (text, params) => pool.query(text, params);

/**
 * Transaction helper — runs a callback with a dedicated client
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction, testConnection };
