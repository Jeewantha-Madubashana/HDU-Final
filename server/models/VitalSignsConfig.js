import { DataTypes } from "sequelize";

const defineVitalSignsConfig = (sequelize) => {
  const VitalSignsConfig = sequelize.define(
    "VitalSignsConfig",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Field name (e.g., 'heartRate', 'bloodPressureSystolic')",
      },
      label: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "Display label (e.g., 'Heart Rate', 'Blood Pressure (Systolic)')",
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Unit of measurement (e.g., 'bpm', 'mmHg', '°C', '%')",
      },
      normalRangeMin: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Minimum normal value",
      },
      normalRangeMax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Maximum normal value",
      },
      dataType: {
        type: DataTypes.ENUM("integer", "decimal", "text"),
        allowNull: false,
        defaultValue: "integer",
        comment: "Data type for the field",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Whether this vital sign is active and should be displayed",
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Order in which to display the field",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Description or notes about this vital sign",
      },
    },
    {
      timestamps: true,
      tableName: "vital_signs_config",
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
        {
          fields: ["isActive"],
        },
        {
          fields: ["displayOrder"],
        },
      ],
    }
  );

  return VitalSignsConfig;
};

export default defineVitalSignsConfig;

