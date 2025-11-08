import { sequelize } from "../config/mysqlDB.js";
import { QueryTypes } from "sequelize";

const createVitalSignsConfigTable = async () => {
  try {
    console.log("Creating vital_signs_config table...");

    // Check if table already exists
    const [results] = await sequelize.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_name = 'vital_signs_config'`,
      { type: QueryTypes.SELECT }
    );

    if (results && results.count > 0) {
      console.log("ℹ️  Table 'vital_signs_config' already exists");
      return;
    }

    // Create the table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vital_signs_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Field name (e.g., heartRate, bloodPressureSystolic)',
        label VARCHAR(200) NOT NULL COMMENT 'Display label (e.g., Heart Rate, Blood Pressure (Systolic))',
        unit VARCHAR(50) DEFAULT NULL COMMENT 'Unit of measurement (e.g., bpm, mmHg, °C, %)',
        normalRangeMin DECIMAL(10, 2) DEFAULT NULL COMMENT 'Minimum normal value',
        normalRangeMax DECIMAL(10, 2) DEFAULT NULL COMMENT 'Maximum normal value',
        dataType ENUM('integer', 'decimal', 'text') NOT NULL DEFAULT 'integer' COMMENT 'Data type for the field',
        isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this vital sign is active and should be displayed',
        displayOrder INT NOT NULL DEFAULT 0 COMMENT 'Order in which to display the field',
        description TEXT DEFAULT NULL COMMENT 'Description or notes about this vital sign',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive),
        INDEX idx_displayOrder (displayOrder)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Table 'vital_signs_config' created successfully");

    // Now initialize default vital signs
    const { default: initializeVitalSigns } = await import("./initializeVitalSignsConfig.js");
    await initializeVitalSigns();
  } catch (error) {
    console.error("❌ Error creating vital_signs_config table:", error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('createVitalSignsConfigTable')) {
  createVitalSignsConfigTable()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export default createVitalSignsConfigTable;

