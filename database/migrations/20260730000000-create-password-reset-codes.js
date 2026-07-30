"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("password_reset_codes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      code: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("password_reset_codes", ["user_id"]);
    await queryInterface.addIndex("password_reset_codes", ["code"]);
    await queryInterface.addIndex("password_reset_codes", ["reset_token"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("password_reset_codes");
  },
};
