import { DataTypes } from "sequelize";

const defineMedicalRecord = (sequelize) => {
  const MedicalRecord = sequelize.define(
    "MedicalRecord",
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
      knownAllergies: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medicalHistory: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currentMedications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pregnancyStatus: {
        type: DataTypes.ENUM("Not Applicable", "Pregnant", "Not Pregnant"),
        defaultValue: "Not Applicable",
      },
      bloodType: {
        type: DataTypes.ENUM(
          "A+",
          "A-",
          "B+",
          "B-",
          "O+",
          "O-",
          "AB+",
          "AB-",
          "Unknown"
        ),
        defaultValue: "Unknown",
      },
      initialDiagnosis: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "medical_records",
    }
  );

  return MedicalRecord;
};

export default defineMedicalRecord;
