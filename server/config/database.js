import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  "hdu_kegalle",
  "root",
  "ptutrandecesten",
  {
    host: "localhost",
    port: "3306",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      match: [/Deadlock/i, /ER_LOCK_DEADLOCK/, /could not serialize access/i],
      max: 5,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export { sequelize, testConnection };
