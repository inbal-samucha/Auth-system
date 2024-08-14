import * as dotenv from 'dotenv';
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
    dialect: 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'default_username',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_NAME || 'default_database',
    host: "127.0.0.1",
    dialect: 'postgres'
  },
  production: {
    // use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    host: process.env.PROD_DB_HOST || 'production_host',
    database: process.env.PROD_DB_NAME || 'production_database', // Provide default or placeholder value
    username: process.env.PROD_DB_USER || 'production_username', // Provide default or placeholder value
    password: process.env.PROD_DB_PASS || 'production_password', // Provide default or placeholder value
  }
};

console.log('Sequelize config:', config);


export default config ;

