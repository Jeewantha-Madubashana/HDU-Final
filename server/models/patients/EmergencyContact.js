import { DataTypes } from "sequelize";

const defineEmergencyContact = (sequelize) => {
  const EmergencyContact = sequelize.define(
    "EmergencyContact",
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      relationship: {
        type: DataTypes.ENUM("Spouse", "Parent", "Child", "Friend", "Other"),
        allowNull: false,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      tableName: "emergency_contacts",
    }
  );

  return EmergencyContact;
};

export default defineEmergencyContact;
