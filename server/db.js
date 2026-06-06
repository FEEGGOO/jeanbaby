const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: async (text, params) => {
    const res = await pool.query(text, params);
    return [res.rows, res.fields];
  },
  getConnection: async () => {
    const client = await pool.connect();
    return {
      query: async (text, params) => {
        const res = await client.query(text, params);
        return [res.rows, res.fields];
      },
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release()
    };
  }
};
