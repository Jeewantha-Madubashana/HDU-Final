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

router.get("/analytics", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getPatientAnalytics);

router.get("/analytics/length-of-stay", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getAverageLengthOfStay);

router.get("/", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getAllPatients);

router.get("/:patientId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getPatientById);

router.post("/:patientId/discharge", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), dischargePatient);

export default router; 