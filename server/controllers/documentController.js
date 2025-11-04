import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { PatientDocument, sequelize } from "../config/mysqlDB.js";

// Create uploads directory if it doesn't exist
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

// Initialize upload directories
createUploadDirectories();

// Configure multer for local file storage
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
    // Generate unique filename with timestamp and UUID
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
    
    // Video
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
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos and large documents
    files: 10 // Maximum 10 files per upload
  },
});

export const uploadPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    // Check if patient exists
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
          // Generate the file URL for local access
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
          
          // Clean up the uploaded file if database save fails
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

    // Format documents with additional metadata
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

// New endpoint to download/serve files
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
    
    // Convert URL back to file path
    // Handle both old format (/uploads/uploads/...) and new format (/uploads/...)
    let cleanPath = document.fileUrl;
    if (cleanPath.startsWith('/uploads/uploads/')) {
      // Fix double uploads path from old format
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
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.fileType);
    
    // Stream the file
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

// New endpoint to delete documents
export const deletePatientDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await PatientDocument.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }
    
    // Delete the physical file
    const filePath = path.join(process.cwd(), document.fileUrl.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the database record
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
