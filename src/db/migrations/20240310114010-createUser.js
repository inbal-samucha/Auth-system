'use strict';

// npx sequelize-cli db:migrate --url $DATABASE_URL


module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      first_name: { // TODO: allowNull: false
        type: Sequelize.DataTypes.STRING,
      },
      last_name: {
        type: Sequelize.DataTypes.STRING,
      },
      email: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      password: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      phone: {
        type: Sequelize.DataTypes.STRING,
      },
      role: {
        allowNull: false,
        type: Sequelize.DataTypes.ENUM,
        values: ['admin', 'user'],
        defaultValue: 'user'
      },
      reset_token: {
        type: Sequelize.DataTypes.STRING,
      },
      reset_token_expiration: {
        type: Sequelize.DataTypes.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
