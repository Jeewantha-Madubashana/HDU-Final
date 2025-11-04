import { sequelize } from "../config/mysqlDB.js";
import {
  AuditLog,
  CriticalFactor,
  PatientDocument,
  Admission,
  MedicalRecord,
  EmergencyContact,
  Patient,
  BedMySQL,
  UserMySQLModel,
} from "../config/mysqlDB.js";

/**
 * Flush all data from all tables
 * This script deletes all records from all tables while preserving table structure
 * Tables are deleted in order to respect foreign key constraints
 */
async function flushAllTables() {
  try {
    console.log("🚀 Starting to flush all database tables...");
    console.log("");

    // Disable foreign key checks temporarily
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Delete in order to respect foreign key constraints (children first, then parents)

    console.log("🗑️  Deleting audit logs...");
    const auditLogCount = await AuditLog.count();
    await AuditLog.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${auditLogCount} audit log records`);

    console.log("🗑️  Deleting critical factors...");
    const criticalFactorCount = await CriticalFactor.count();
    await CriticalFactor.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${criticalFactorCount} critical factor records`);

    console.log("🗑️  Deleting patient documents...");
    const documentCount = await PatientDocument.count();
    await PatientDocument.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${documentCount} patient document records`);

    console.log("🗑️  Deleting admissions...");
    const admissionCount = await Admission.count();
    await Admission.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${admissionCount} admission records`);

    console.log("🗑️  Deleting medical records...");
    const medicalRecordCount = await MedicalRecord.count();
    await MedicalRecord.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${medicalRecordCount} medical record records`);

    console.log("🗑️  Deleting emergency contacts...");
    const emergencyContactCount = await EmergencyContact.count();
    await EmergencyContact.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${emergencyContactCount} emergency contact records`);

    console.log("🗑️  Deleting patients...");
    const patientCount = await Patient.count();
    await Patient.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${patientCount} patient records`);

    console.log("🗑️  Clearing bed assignments...");
    await BedMySQL.update({ patientId: null }, { where: {} });
    const bedCount = await BedMySQL.count();
    console.log(`   ✅ Cleared patient assignments from ${bedCount} beds`);

    console.log("🗑️  Deleting users...");
    const userCount = await UserMySQLModel.count();
    await UserMySQLModel.destroy({ where: {}, truncate: true });
    console.log(`   ✅ Deleted ${userCount} user records`);

    // Re-enable foreign key checks
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("");
    console.log("✅ All tables flushed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`   • Audit Logs: ${auditLogCount} records deleted`);
    console.log(`   • Critical Factors: ${criticalFactorCount} records deleted`);
    console.log(`   • Patient Documents: ${documentCount} records deleted`);
    console.log(`   • Admissions: ${admissionCount} records deleted`);
    console.log(`   • Medical Records: ${medicalRecordCount} records deleted`);
    console.log(`   • Emergency Contacts: ${emergencyContactCount} records deleted`);
    console.log(`   • Patients: ${patientCount} records deleted`);
    console.log(`   • Beds: ${bedCount} beds cleared (structure preserved)`);
    console.log(`   • Users: ${userCount} records deleted`);
    console.log("");
    console.log("⚠️  Note: All data has been deleted. Table structures remain intact.");
    console.log("   Run 'npm run init-db' to populate with sample data if needed.");

  } catch (error) {
    console.error("❌ Error flushing tables:", error);
    throw error;
  } finally {
    // Re-enable foreign key checks in case of error
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

// Run the flush if this script is executed directly
// Check if this is the main module
if (process.argv[1] && process.argv[1].includes("flushAllTables.js")) {
  flushAllTables()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export default flushAllTables;

