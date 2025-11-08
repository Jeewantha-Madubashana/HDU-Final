import express from "express";
import {
  getBeds,
  assignBed,
  deAssignBed,
  getBedById,
  getBedsByStatus,
  debugPatients,
  generateUniquePatientId,
} from "../controllers/bedController.js";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";
import { PatientDocument } from "../config/mysqlDB.js";

const router = express.Router();

router.get("/debug/documents", async (req, res) => {
  try {
    const documents = await PatientDocument.findAll({
      attributes: ["id", "patientId", "documentType", "fileName", "fileUrl", "createdAt"],
      order: [["createdAt", "DESC"]]
    });
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/debug", debugPatients);

router.get("/generate-patient-id", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), generateUniquePatientId);

router.get("/status", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBedsByStatus);

router.get("/", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBeds);

router.get("/:bedId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBedById);

router.post("/assign", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), assignBed);

router.delete("/:bedId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), deAssignBed);

export default router;
