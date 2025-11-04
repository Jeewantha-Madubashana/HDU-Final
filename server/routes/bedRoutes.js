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

// Debug endpoint - check patient documents (no auth for testing)
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

// Debug endpoint (remove in production)
router.get("/debug", debugPatients);

// Generate unique patient ID (must be before /:bedId route)
router.get("/generate-patient-id", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), generateUniquePatientId);

// Get beds by status (occupied/available) (must be before /:bedId route)
router.get("/status", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBedsByStatus);

// Get all beds
router.get("/", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBeds);

// Get specific bed by ID (parameterized routes should come last)
router.get("/:bedId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getBedById);



// Assign patient to bed
router.post("/assign", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), assignBed);

// Deassign patient from bed
router.delete("/:bedId", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), deAssignBed);

export default router;
