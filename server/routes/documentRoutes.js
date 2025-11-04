import express from "express";
import {
  upload,
  uploadPatientDocuments,
  getPatientDocuments,
  downloadPatientDocument,
  deletePatientDocument,
} from "../controllers/documentController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();



router.use(authenticateJWT);

// Upload documents for a patient
router.post(
  "/patients/:patientId/documents",
  upload.fields([
    { name: "medicalReports" }, // Multiple files allowed (default maxCount is unlimited)
    { name: "idProof" }, // Multiple files allowed
    { name: "consentForm" }, // Multiple files allowed  
    { name: "other" }, // Multiple files allowed
  ]),
  uploadPatientDocuments
);

// Get all documents for a patient
router.get("/patients/:patientId/documents", getPatientDocuments);

// Download a specific document
router.get("/documents/:documentId/download", downloadPatientDocument);

// Delete a specific document
router.delete("/documents/:documentId", deletePatientDocument);

export default router;
