const pool = require('./connection');


module.exports = {
  query: (text, params) => pool.query(text, params),
  
  // Method to get a client for transactions
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Optional: monkey patch the query method to keep track of the last query executed
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release.apply(client);
    };

    return client;
  }
};
