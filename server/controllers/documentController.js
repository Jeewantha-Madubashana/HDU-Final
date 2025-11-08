import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { PatientDocument, sequelize } from "../config/mysqlDB.js";

/**
 * Creates upload directories for patient documents if they don't exist
 * Creates base directory and subdirectories for different document types
 */
const createUploadDirectories = () => {
  const baseDir = path.join(process.cwd(), "uploads", "patient-documents");
  const subDirs = ["medical-reports", "id-proof", "consent-forms", "other"];
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  subDirs.forEach(subDir => {
    const fullPath = path.join(baseDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirectories();

/**
 * Multer storage configuration for patient document uploads
 * Routes files to appropriate subdirectories based on document type
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { fieldName } = file;
    let folder = "other";
    
    switch (fieldName) {
      case "medicalReports":
        folder = "medical-reports";
        break;
      case "idProof":
        folder = "id-proof";
        break;
      case "consentForm":
        folder = "consent-forms";
        break;
      default:
        folder = "other";
    }
    
    const uploadPath = path.join(process.cwd(), "uploads", "patient-documents", folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/ogg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Supported formats: Images (JPEG, PNG, GIF, WebP, BMP, TIFF), Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV), Audio (MP3, WAV, OGG, AAC, M4A), Video (MP4, MPEG, MOV, AVI, WebM, OGV)"
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 100 * 1024 * 1024,
    files: 10
  },
});

/**
 * Uploads patient documents to the server
 * Supports multiple document types and validates patient existence
 * @route POST /api/documents/:patientId/upload
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object} req.files - Uploaded files from multer
 * @param {Object} res - Express response object
 */
export const uploadPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const patientExists = await sequelize.query(
      "SELECT id FROM patients WHERE id = ?",
      {
        replacements: [patientId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!patientExists || patientExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} not found. Please ensure the patient exists before uploading documents.`,
      });
    }

    const documentResults = [];

    for (const [fieldName, files] of Object.entries(req.files)) {
      const documentType =
        fieldName === "medicalReports"
          ? "MedicalReport"
          : fieldName === "idProof"
          ? "IdProof"
          : fieldName === "consentForm"
          ? "ConsentForm"
          : "Other";

      const fileList = Array.isArray(files) ? files : [files];

      for (const file of fileList) {
        try {
          const relativePath = path.relative(
            path.join(process.cwd()),
            file.path
          );
          const fileUrl = `/${relativePath.replace(/\\/g, "/")}`;

          const document = await PatientDocument.create({
            patientId,
            documentType,
            fileUrl,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.user?.id || null,
          });

          // Log document upload in audit log
          const { AuditLog } = await import("../config/mysqlDB.js");
          try {
            await AuditLog.create({
              userId: req.user?.id || null,
              action: "CREATE",
              tableName: "patient_documents",
              recordId: document.id,
              oldValues: null,
              newValues: JSON.stringify({
                fileName: document.fileName,
                documentType: document.documentType,
                fileUrl: document.fileUrl,
              }),
              description: `Document uploaded: ${document.fileName} (${documentType})`,
            });
          } catch (auditError) {
            console.error("Error logging document upload:", auditError);
          }

          documentResults.push({
            id: document.id,
            documentType,
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
            fileType: file.mimetype,
            uploadedAt: document.createdAt,
          });
        } catch (error) {
          console.error(
            `Error saving file ${file.originalname} to database: ${error.message}`
          );
          
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          
          return res.status(500).json({
            success: false,
            message: `Failed to save file ${file.originalname}`,
            error: error.message,
          });
        }
      }
    }

    if (documentResults.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload any documents",
      });
    }

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: documentResults,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload documents",
      error: error.message,
    });
  }
};

/**
 * Retrieves all documents for a specific patient
 * @route GET /api/documents/:patientId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object} res - Express response object
 */
export const getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const documents = await PatientDocument.findAll({
      where: { patientId },
      order: [["createdAt", "DESC"]],
    });

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No documents found for this patient",
      });
    }

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      patientId: doc.patientId,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.createdAt,
      isImage: doc.fileType?.startsWith('image/'),
      isVideo: doc.fileType?.startsWith('video/'),
      isAudio: doc.fileType?.startsWith('audio/'),
      isPDF: doc.fileType === 'application/pdf',
      isDocument: doc.fileType?.includes('document') || doc.fileType?.includes('sheet') || doc.fileType?.includes('presentation'),
    }));

    res.status(200).json({
      success: true,
      count: documents.length,
      documents: formattedDocuments,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient documents",
      error: error.message,
    });
  }
};

/**
 * Downloads/serves a patient document file
 * @route GET /api/documents/:documentId/download
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.documentId - ID of the document
 * @param {Object} res - Express response object
 */
export const downloadPatientDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await PatientDocument.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }
    
    let cleanPath = document.fileUrl;
    if (cleanPath.startsWith('/uploads/uploads/')) {
      cleanPath = cleanPath.replace('/uploads/uploads/', '/uploads/');
    }
    if (cleanPath.startsWith('/uploads/')) {
      cleanPath = cleanPath.replace('/uploads/', 'uploads/');
    }
    const filePath = path.join(process.cwd(), cleanPath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.fileType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download document",
      error: error.message,
    });
  }
};

/**
 * Deletes a patient document from both database and file system
 * @route DELETE /api/documents/:documentId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.documentId - ID of the document to delete
 * @param {Object} res - Express response object
 */
export const deletePatientDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;
    
    const document = await PatientDocument.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Log deletion in audit log
    const { AuditLog } = await import("../config/mysqlDB.js");
    try {
      await AuditLog.create({
        userId: userId || null,
        action: "DELETE",
        tableName: "patient_documents",
        recordId: documentId,
        oldValues: JSON.stringify({
          fileName: document.fileName,
          documentType: document.documentType,
          fileUrl: document.fileUrl,
        }),
        newValues: null,
        description: `Document deleted: ${document.fileName}`,
      });
    } catch (auditError) {
      console.error("Error logging document deletion:", auditError);
    }
    
    const filePath = path.join(process.cwd(), document.fileUrl.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await document.destroy();
    
    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

/**
 * Updates document metadata (e.g., fileName)
 * @route PUT /api/documents/:documentId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.documentId - ID of the document to update
 * @param {Object} req.body - Update data (e.g., { fileName: "new name" })
 * @param {Object} res - Express response object
 */
export const updatePatientDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;
    const { fileName } = req.body;
    
    const document = await PatientDocument.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const oldValues = {
      fileName: document.fileName,
      documentType: document.documentType,
    };

    // Update document
    if (fileName) {
      document.fileName = fileName;
    }
    
    await document.save();

    // Log update in audit log
    const { AuditLog } = await import("../config/mysqlDB.js");
    try {
      await AuditLog.create({
        userId: userId || null,
        action: "UPDATE",
        tableName: "patient_documents",
        recordId: documentId,
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify({
          fileName: document.fileName,
          documentType: document.documentType,
        }),
        description: `Document updated: ${document.fileName}`,
      });
    } catch (auditError) {
      console.error("Error logging document update:", auditError);
    }
    
    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        fileType: document.fileType,
        uploadedAt: document.createdAt,
      }
    });
    
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update document",
      error: error.message,
    });
  }
};
