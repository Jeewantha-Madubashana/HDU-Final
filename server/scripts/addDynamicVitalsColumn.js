import { sequelize, testConnection } from "../config/database.js";
import { CriticalFactor } from "../config/mysqlDB.js";

async function addDynamicVitalsColumn() {
  try {
    console.log("🚀 Starting migration to add dynamicVitals column...");
    
    const connectionSuccessful = await testConnection();
    if (!connectionSuccessful) {
      throw new Error("Database connection failed");
    }

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'critical_factors' 
      AND COLUMN_NAME = 'dynamicVitals'
    `);

    if (results.length > 0) {
      console.log("✅ Column 'dynamicVitals' already exists. Skipping migration.");
      return;
    }

    // Add the dynamicVitals column
    console.log("📝 Adding dynamicVitals column to critical_factors table...");
    await sequelize.query(`
      ALTER TABLE critical_factors 
      ADD COLUMN dynamicVitals JSON NULL 
      COMMENT 'Stores dynamic vital signs that are not standard columns (e.g., capillaryRefillTime, respiratoryEffort)' 
      AFTER amendmentReason
    `);

    console.log("✅ Successfully added dynamicVitals column!");
    console.log("");
    console.log("📊 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error adding dynamicVitals column:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('addDynamicVitalsColumn')) {
  addDynamicVitalsColumn()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default addDynamicVitalsColumn;

