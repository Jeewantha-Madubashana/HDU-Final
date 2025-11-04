import { DataTypes } from "sequelize";

const definePatientDocument = (sequelize) => {
  const PatientDocument = sequelize.define(
    "PatientDocument",
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
      documentType: {
        type: DataTypes.ENUM(
          "MedicalReport",
          "IdProof",
          "ConsentForm",
          "Other"
        ),
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "patient_documents",
    }
  );

  return PatientDocument;
};

export default definePatientDocument;
