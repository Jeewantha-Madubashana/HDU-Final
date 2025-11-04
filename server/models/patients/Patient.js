import { DataTypes } from "sequelize";

const definePatient = (sequelize) => {
  const Patient = sequelize.define(
    "Patient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patientNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nicPassport: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM("Male", "Female", "Other"),
        allowNull: false,
      },
      maritalStatus: {
        type: DataTypes.ENUM(
          "Single",
          "Married",
          "Divorced",
          "Widowed",
          "Unknown"
        ),
        defaultValue: "Unknown",
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "patients",
      // Removed duplicate indexes - unique constraints are already defined in field definitions
    }
  );

  return Patient;
};

export default definePatient;
