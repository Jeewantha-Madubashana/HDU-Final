import { Sequelize } from "sequelize";
import { sequelize, testConnection } from "./database.js";
import defineBed from "../models/BedMySQL.js";
import definePatient from "../models/patients/Patient.js";
import defineEmergencyContact from "../models/patients/EmergencyContact.js";
import defineMedicalRecord from "../models/patients/MedicalRecord.js";
import defineAdmission from "../models/patients/Admission.js";
import definePatientDocument from "../models/patients/PatientDocument.js";
import defineUser from "../models/UserMySQL.js";
import defineCriticalFactor from "../models/patients/CriticalFactor.js";
import defineAuditLog from "../models/AuditLog.js";

const BedMySQL = defineBed(sequelize);
const Patient = definePatient(sequelize);
const EmergencyContact = defineEmergencyContact(sequelize);
const MedicalRecord = defineMedicalRecord(sequelize);
const Admission = defineAdmission(sequelize);
const PatientDocument = definePatientDocument(sequelize);
const UserMySQLModel = defineUser(sequelize);
const CriticalFactor = defineCriticalFactor(sequelize);
const AuditLog = defineAuditLog(sequelize);

const defineAssociations = () => {
  Patient.hasMany(Admission, { foreignKey: "patientId", as: "admissions" });
  Admission.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  Patient.hasMany(EmergencyContact, {
    foreignKey: "patientId",
    as: "emergencyContacts",
  });
  EmergencyContact.belongsTo(Patient, {
    foreignKey: "patientId",
    as: "patient",
  });

  Patient.hasMany(MedicalRecord, {
    foreignKey: "patientId",
    as: "medicalRecords",
  });
  MedicalRecord.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  Patient.hasMany(PatientDocument, {
    foreignKey: "patientId",
    as: "documents",
  });
  PatientDocument.belongsTo(Patient, {
    foreignKey: "patientId",
    as: "patient",
  });

  Patient.hasMany(CriticalFactor, {
    foreignKey: "patientId",
    as: "criticalFactors",
  });
  CriticalFactor.belongsTo(Patient, {
    foreignKey: "patientId",
    as: "patient",
  });

  UserMySQLModel.hasMany(CriticalFactor, {
    foreignKey: "recordedBy",
    as: "recordedCriticalFactors",
  });
  CriticalFactor.belongsTo(UserMySQLModel, {
    foreignKey: "recordedBy",
    as: "recorder",
  });

  UserMySQLModel.hasMany(CriticalFactor, {
    foreignKey: "amendedBy",
    as: "amendedCriticalFactors",
  });
  CriticalFactor.belongsTo(UserMySQLModel, {
    foreignKey: "amendedBy",
    as: "amender",
  });

  UserMySQLModel.hasMany(PatientDocument, {
    foreignKey: "uploadedBy",
    as: "uploadedDocuments",
    constraints: false,
  });
  PatientDocument.belongsTo(UserMySQLModel, {
    foreignKey: "uploadedBy",
    as: "uploader",
    constraints: false,
  });

  UserMySQLModel.hasMany(AuditLog, {
    foreignKey: "userId",
    as: "auditLogs",
    constraints: false,
  });
  AuditLog.belongsTo(UserMySQLModel, {
    foreignKey: "userId",
    as: "user",
    constraints: false,
  });

  Patient.hasOne(BedMySQL, { foreignKey: "patientId", as: "bed" });
  BedMySQL.belongsTo(Patient, { foreignKey: "patientId", as: "Patient" });
};

defineAssociations();

const createSuperAdmin = async () => {
  try {
    const { genSalt, hash } = await import("bcryptjs");
    const superAdminUsername = "SUPER_ADMIN";
    const superAdminPassword = 'zV38~6m{~3"';
    
    // Check if super admin already exists
    const existingSuperAdmin = await UserMySQLModel.findOne({
      where: { username: superAdminUsername },
    });

    if (!existingSuperAdmin) {
      const salt = await genSalt(10);
      const hashedPassword = await hash(superAdminPassword, salt);

      await UserMySQLModel.create({
        username: superAdminUsername,
        password: hashedPassword,
        email: "superadmin@hospital.lk",
        registrationNumber: "SA001",
        ward: "System",
        mobileNumber: "+94 11 000 0000",
        sex: "Other",
        role: "Super Admin",
        status: "approved",
        nameWithInitials: "Super Admin",
      });

      console.log("✅ Super Admin created successfully");
      console.log(`   Username: ${superAdminUsername}`);
      console.log(`   Password: ${superAdminPassword}`);
    } else {
      console.log("ℹ️  Super Admin already exists");
    }
  } catch (error) {
    console.error("Error creating Super Admin:", error);
  }
};

const connectMySql = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection has been established successfully.");

    // Temporarily disable sync to avoid "too many keys" error
    // The tables already exist and have the correct structure
    console.log("Skipping model sync - using existing database structure");
    console.log("All models ready");

    // Create Super Admin
    await createSuperAdmin();

    const bedCount = await BedMySQL.count();
    if (bedCount === 0) {
      const initialBeds = Array.from({ length: 10 }, (_, i) => ({
        bedNumber: `B${i + 1}`,
        patientId: null,
      }));
      await BedMySQL.bulkCreate(initialBeds);
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

export {
  sequelize,
  connectMySql,
  BedMySQL,
  Patient,
  EmergencyContact,
  MedicalRecord,
  Admission,
  PatientDocument,
  UserMySQLModel,
  CriticalFactor,
  AuditLog,
};
