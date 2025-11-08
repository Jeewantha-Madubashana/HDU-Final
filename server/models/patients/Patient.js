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
        allowNull: true,
      },
      nicPassport: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM("Male", "Female", "Other"),
        allowNull: true,
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
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isUrgentAdmission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isIncomplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      tableName: "patients",
    }
  );

  return Patient;
};

export default definePatient;
