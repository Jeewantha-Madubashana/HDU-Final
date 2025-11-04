import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import authRoutes from "./routes/authRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import criticalFactorRoutes from "./routes/criticalFactorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import { connectMySql, sequelize } from "./config/mysqlDB.js";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/critical-factors", criticalFactorRoutes);
app.use("/api/patients", patientRoutes);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await connectMySql();
    console.log("Database is connected and models are synchronized");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
});
