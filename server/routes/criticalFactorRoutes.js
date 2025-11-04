import express from "express";
import {
  addCriticalFactors,
  getCriticalFactorsByPatientId,
  updateCriticalFactors,
  getCriticalFactorAuditHistory,
  getCriticalPatients,
  acknowledgeAlert,
} from "../controllers/criticalFactorController.js";
import { getAlertAnalytics } from "../controllers/auditController.js";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/patients/:patientId/critical-factors",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  addCriticalFactors
);

router.get(
  "/patients/:patientId/critical-factors",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  getCriticalFactorsByPatientId
);

router.put(
  "/:criticalFactorId",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  updateCriticalFactors
);

router.get(
  "/:criticalFactorId/audit",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  getCriticalFactorAuditHistory
);

// Get critical patients
router.get(
  "/critical-patients",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  getCriticalPatients
);

// Acknowledge alert
router.post(
  "/acknowledge-alert",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  acknowledgeAlert
);

// Get alert analytics
router.get(
  "/analytics/alerts",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]),
  getAlertAnalytics
);

export default router;
