import dotenv from "dotenv";
import { connectMySql } from "../config/mysqlDB.js";
import { DataTypes } from "sequelize";

dotenv.config();

/**
 * Migration script to add isUrgentAdmission and isIncomplete columns to patients table
 * Run this script to update the database schema for urgent admission feature
 */
const addUrgentAdmissionColumns = async () => {
  try {
    await connectMySql();
    
    const { sequelize } = await import("../config/mysqlDB.js");
    
    if (!sequelize) {
      console.error("Database connection not available");
      process.exit(1);
    }

    console.log("Adding isUrgentAdmission and isIncomplete columns to patients table...");

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.addColumn("patients", "isUrgentAdmission", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log("✅ Added isUrgentAdmission column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("⚠️  isUrgentAdmission column already exists. Skipping.");
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn("patients", "isIncomplete", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log("✅ Added isIncomplete column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("⚠️  isIncomplete column already exists. Skipping.");
      } else {
        throw error;
      }
    }

    console.log("Making patient fields nullable for urgent admissions...");

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN nicPassport VARCHAR(255) NULL
      `);
      console.log("✅ Made nicPassport nullable");
    } catch (error) {
      console.log("⚠️  Error modifying nicPassport:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN dateOfBirth DATE NULL
      `);
      console.log("✅ Made dateOfBirth nullable");
    } catch (error) {
      console.log("⚠️  Error modifying dateOfBirth:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN age INT NULL
      `);
      console.log("✅ Made age nullable");
    } catch (error) {
      console.log("⚠️  Error modifying age:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN gender ENUM('Male', 'Female', 'Other') NULL
      `);
      console.log("✅ Made gender nullable");
    } catch (error) {
      console.log("⚠️  Error modifying gender:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN contactNumber VARCHAR(255) NULL
      `);
      console.log("✅ Made contactNumber nullable");
    } catch (error) {
      console.log("⚠️  Error modifying contactNumber:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE patients 
        MODIFY COLUMN address TEXT NULL
      `);
      console.log("✅ Made address nullable");
    } catch (error) {
      console.log("⚠️  Error modifying address:", error.message);
    }

    console.log("Making medical record fields nullable for urgent admissions...");

    try {
      await sequelize.query(`
        ALTER TABLE medical_records 
        MODIFY COLUMN initialDiagnosis TEXT NULL
      `);
      console.log("✅ Made initialDiagnosis nullable");
    } catch (error) {
      console.log("⚠️  Error modifying initialDiagnosis:", error.message);
    }

    console.log("Making admission fields nullable for urgent admissions...");

    try {
      await sequelize.query(`
        ALTER TABLE admissions 
        MODIFY COLUMN consultantInCharge VARCHAR(255) NULL
      `);
      console.log("✅ Made consultantInCharge nullable");
    } catch (error) {
      console.log("⚠️  Error modifying consultantInCharge:", error.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE admissions 
        MODIFY COLUMN department ENUM('ICU', 'Surgery', 'Medical', 'HDU') DEFAULT 'HDU'
      `);
      console.log("✅ Updated department enum to include HDU");
    } catch (error) {
      console.log("⚠️  Error modifying department:", error.message);
    }

    console.log("✅ Successfully updated patient table for urgent admissions");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding columns:", error);
    process.exit(1);
  }
};

addUrgentAdmissionColumns();

