import { DataTypes } from "sequelize";

const defineCriticalFactor = (sequelize) => {
  const CriticalFactor = sequelize.define(
    "CriticalFactor",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "patients",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      heartRate: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      respiratoryRate: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bloodPressureSystolic: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bloodPressureDiastolic: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      spO2: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      temperature: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true,
      },
      glasgowComaScale: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      painScale: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bloodGlucose: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      urineOutput: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      recordedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      isAmended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      amendedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      amendedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      amendmentReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason for amending this critical factor record",
      },
    },
    {
      timestamps: true,
      tableName: "critical_factors",
    }
  );

  return CriticalFactor;
};

export default defineCriticalFactor;
