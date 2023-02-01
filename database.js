const env = require('dotenv')
const knex = require('knex')
env.config();

const database = knex({
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    },
    useNullAsDefault: true,
  });
  
  module.exports = database;