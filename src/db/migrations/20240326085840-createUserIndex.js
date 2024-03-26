'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('users', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('users', ['email']);
  }
};
