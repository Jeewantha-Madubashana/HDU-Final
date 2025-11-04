import { DataTypes } from "sequelize";

const defineAuditLog = (sequelize) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
        references: {
          model: "users", 
          key: "id",
        },
        onDelete: "SET NULL",
      },
      action: {
        type: DataTypes.STRING, 
        allowNull: false,
      },
      tableName: {
        type: DataTypes.STRING, 
        allowNull: true,
      },
      recordId: {
        type: DataTypes.STRING, 
        allowNull: true,
      },
      oldValues: {
        type: DataTypes.JSON, 
        allowNull: true,
      },
      newValues: {
        type: DataTypes.JSON, 
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT, 
        allowNull: true,
      },
    },
    {
      timestamps: false, 
      tableName: "audit_logs",
    }
  );

  return AuditLog;
};

export default defineAuditLog;
