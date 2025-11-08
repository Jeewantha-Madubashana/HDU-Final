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

router.post(
  "/patients/:patientId/documents",
  upload.fields([
    { name: "medicalReports" },
    { name: "idProof" },
    { name: "consentForm" },
    { name: "other" },
  ]),
  uploadPatientDocuments
);

router.get("/patients/:patientId/documents", getPatientDocuments);

router.get("/documents/:documentId/download", downloadPatientDocument);

router.delete("/documents/:documentId", deletePatientDocument);

export default router;
