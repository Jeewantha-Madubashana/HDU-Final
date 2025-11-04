import { DataTypes } from "sequelize";

const defineAdmission = (sequelize) => {
  const Admission = sequelize.define(
    "Admission",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      admissionDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      department: {
        type: DataTypes.ENUM("ICU", "Surgery", "Medical"),
        allowNull: false,
      },
      consultantInCharge: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dischargeDateTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Active", "Discharged", "Transferred"),
        defaultValue: "Active",
      },
    },
    {
      timestamps: true,
      tableName: "admissions",
    }
  );

  return Admission;
};

export default defineAdmission;
