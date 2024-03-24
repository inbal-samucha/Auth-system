// import { SequelizeOptions } from 'sequelize-typescript';
// import * as dotenv from 'dotenv';
// import { User } from '../models/User';
// dotenv.config();

// const config: Record<string, SequelizeOptions> = {
//   "development": {
//     "username": process.env.DB_USER,
//     "password": process.env.DB_PASSWORD,
//     "database": process.env.DB_NAME,
//     "host": "127.0.0.1",
//     "dialect": "postgres",
//     models: [User]
//   },
//   "test": {
//     "username": process.env.DB_USER,
//     "password": process.env.DB_PASSWORD,
//     "database": process.env.DB_NAME,
//     "host": "127.0.0.1",
//     "dialect": "postgres"
//   },
//   "production": {
//     "username": process.env.DB_USER,
//     "password": process.env.DB_PASSWORD,
//     "database": process.env.DB_NAME,
//     "host": "127.0.0.1",
//     "dialect": "postgres"
//   }
// };

import * as dotenv from 'dotenv';
import { User } from '../models/User';
dotenv.config();

interface CustomSequelizeOptions {
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mssql';
  database: string;
  username: string;
  password: string;
  host?: string;
  port?: number;
  use_env_variable?: string;
  models?: any[];
}

const config: Record<string, CustomSequelizeOptions> = {
  development: {
    username: process.env.DB_USER || 'default_username',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_NAME || 'default_database',
    host: "127.0.0.1",
    dialect: "postgres",
    models: [User]
  },
  test: {
    username: process.env.DB_USER || 'default_username',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_NAME || 'default_database',
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: "postgres",
    database: process.env.PROD_DB_NAME || 'production_database', // Provide default or placeholder value
    username: process.env.PROD_DB_USER || 'production_username', // Provide default or placeholder value
    password: process.env.PROD_DB_PASS || 'production_password', // Provide default or placeholder value
  }
};

export default config;
