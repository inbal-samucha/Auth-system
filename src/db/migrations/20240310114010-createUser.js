
'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    createdAt: {
      allowNull: false,
      type: Sequelize.DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DataTypes.DATE,
    }
  });
}
export function down(queryInterface, Sequelize) {
  return queryInterface.dropTable('users');
}