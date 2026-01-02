require('dotenv').config();

module.exports = {
  development: {
    username: 'dtsdbadmin',
    password: 'dtsadmin',
    database: 'dts_dev',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
  },
  test: {
    username: 'scaffolddbadmin',
    password: 'scaffolddb@dmin',
    database: 'scaffold_db_test',
    host: '192.168.88.23',
    port: 5432,
    dialect: 'postgres',
  },
  production: {
    username: 'scaffolddbadmin',
    password: 'scaffolddb@dmin',
    database: 'scaffold_db_prod',
    host: '192.168.88.23',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false,
      },
    },
  },
};