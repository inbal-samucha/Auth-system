'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'reset_token', {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'refresh_token', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    });
  }
};
