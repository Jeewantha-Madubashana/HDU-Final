import { sequelize } from "../config/mysqlDB.js";

const addStatusColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Check if status column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'status'
    `);

    if (results.length === 0) {
      // Add status column
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN status ENUM('pending', 'approved', 'rejected') 
        NOT NULL DEFAULT 'pending' 
        AFTER role
      `);
      console.log("✅ Status column added successfully");
    } else {
      console.log("ℹ️  Status column already exists");
    }

    // Update role enum to include 'Super Admin'
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('Super Admin', 'House Officer', 'Medical Officer', 'Nurse', 'Consultant') 
      NOT NULL
    `);
    console.log("✅ Role enum updated to include 'Super Admin'");

    // Set existing users to 'approved' if status is null (shouldn't happen but just in case)
    await sequelize.query(`
      UPDATE users 
      SET status = 'approved' 
      WHERE status IS NULL OR status = ''
    `);

    console.log("✅ Database migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error migrating database:", error);
    process.exit(1);
  }
};

addStatusColumn();

