import express from "express";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";
import {
  getPatientAnalytics,
  getPatientById,
  getAllPatients,
  dischargePatient,
  getAverageLengthOfStay,
} from "../controllers/patientController.js";

const router = express.Router();

// Patient analytics
router.get("/analytics", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getPatientAnalytics);

// Average Length of Stay analytics
router.get("/analytics/length-of-stay", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getAverageLengthOfStay);

// Get all patients
router.get("/", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getAllPatients);

// Get patient by ID
router.get("/:patientId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getPatientById);

// Discharge patient
router.post("/:patientId/discharge", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), dischargePatient);

export default router; 