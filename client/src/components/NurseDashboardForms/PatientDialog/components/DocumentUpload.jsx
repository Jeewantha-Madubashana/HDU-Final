import React, { useState, useEffect } from "react";
import { 
  Box, 
  Alert, 
  Typography, 
  Grid, 
  Paper, 
  IconButton, 
  Chip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { 
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import FormField from "../FormField";
import { documentUploadFields } from "../config/formFields";
import { getPatientDocuments, deletePatientDocument, downloadPatientDocument } from "../../../../api/documentApi";
import { useDispatch } from "react-redux";
import { showToast } from "../../../../features/ui/uiSlice";

/**
 * Maps form field names to document types
 */
const fieldNameToDocumentType = {
  medicalReports: "MedicalReport",
  idProof: "IdProof",
  consentForm: "ConsentForm",
  other: "Other",
};

/**
 * Component for uploading and previewing patient documents
 * Supports multiple files per category with image previews
 * Displays existing uploaded documents under each category
 * @param {Object} formProps - Formik form props
 * @param {string} uploadStatus - Upload status ('idle', 'uploading', 'success', 'error')
 * @param {number} patientId - Patient ID to fetch existing documents
 * @param {Function} onUpdate - Callback after document changes
 */
const DocumentUpload = ({ formProps, uploadStatus, patientId, onUpdate }) => {
  const { values } = formProps;
  const dispatch = useDispatch();
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  /**
   * Checks if a file is an image
   */
  const isImageFile = (file) => {
    return file && file.type && file.type.startsWith('image/');
  };

  /**
   * Creates a preview URL for image files
   */
  const getImagePreview = (file) => {
    if (isImageFile(file)) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  /**
   * Gets icon for file type
   */
  const getFileIcon = (file) => {
    if (!file || !file.type) return <DocIcon />;
    if (file.type === 'application/pdf') return <PdfIcon />;
    if (file.type.startsWith('image/')) return <ImageIcon />;
    return <DocIcon />;
  };

  /**
   * Formats file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Fetches existing documents for the patient
   */
  useEffect(() => {
    if (patientId) {
      fetchExistingDocuments();
    }
  }, [patientId]);

  const fetchExistingDocuments = async () => {
    if (!patientId) return;
    setLoadingDocuments(true);
    try {
      const response = await getPatientDocuments(patientId);
      if (response.success && response.documents) {
        setExistingDocuments(response.documents);
      } else {
        setExistingDocuments([]);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setExistingDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  /**
   * Gets existing documents for a specific category
   */
  const getExistingDocumentsForCategory = (fieldName) => {
    const documentType = fieldNameToDocumentType[fieldName];
    if (!documentType) return [];
    return existingDocuments.filter(doc => doc.documentType === documentType);
  };

  /**
   * Removes a file from the selected files
   */
  const removeFile = (fieldName, index) => {
    const currentFiles = values[fieldName] || [];
    if (Array.isArray(currentFiles)) {
      const newFiles = currentFiles.filter((_, i) => i !== index);
      formProps.setFieldValue(fieldName, newFiles.length > 0 ? newFiles : null);
    } else {
      formProps.setFieldValue(fieldName, null);
    }
  };

  /**
   * Handles deletion of an existing document
   */
  const handleDeleteExistingDocument = async (documentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }
    try {
      await deletePatientDocument(documentId);
      dispatch(showToast({ message: "Document deleted successfully", type: "success" }));
      await fetchExistingDocuments();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      dispatch(showToast({ message: err.message || "Failed to delete document", type: "error" }));
    }
  };

  /**
   * Handles download of an existing document
   */
  const handleDownloadExistingDocument = async (doc) => {
    try {
      const response = await downloadPatientDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(showToast({ message: "Document downloaded successfully", type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err.message || "Failed to download document", type: "error" }));
    }
  };

  /**
   * Renders file previews for a specific field
   */
  const renderFilePreviews = (fieldName, label) => {
    const files = values[fieldName];
    if (!files || (Array.isArray(files) && files.length === 0)) {
      return null;
    }

    const fileArray = Array.isArray(files) ? files : [files];

    return (
      <Box sx={{ mt: 3, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {label}
          </Typography>
          <Chip 
            label={`${fileArray.length} ${fileArray.length === 1 ? 'file' : 'files'}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <ImageList cols={4} gap={12} sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
          {fileArray.map((file, index) => {
            const previewUrl = getImagePreview(file);
            return (
              <ImageListItem 
                key={index}
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s ease-in-out',
                  }
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    loading="lazy"
                    style={{ 
                      width: '100%', 
                      height: '180px', 
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                  />
                ) : (
                  <Paper
                    sx={{
                      width: '100%',
                      height: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ fontSize: '3rem', color: 'primary.main' }}>
                      {getFileIcon(file)}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', px: 1, textAlign: 'center' }}>
                      {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                    </Typography>
                  </Paper>
                )}
                <ImageListItemBar
                  title={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Typography>
                  }
                  subtitle={
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {formatFileSize(file.size)}
                    </Typography>
                  }
                  actionIcon={
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fieldName, index);
                      }}
                      sx={{ 
                        color: 'error.main',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'white',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  position="below"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    '& .MuiImageListItemBar-title': {
                      color: 'text.primary',
                    }
                  }}
                />
              </ImageListItem>
            );
          })}
        </ImageList>
      </Box>
    );
  };

  /**
   * Handles viewing an existing document
   */
  const handleViewExistingDocument = (doc) => {
    setViewingDocument(doc);
    setViewDialogOpen(true);
  };

  /**
   * Renders a single document card
   */
  const renderDocumentCard = (doc) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fileUrl = doc.fileUrl.startsWith("/")
      ? `${baseUrl}${doc.fileUrl}`
      : `${baseUrl}/${doc.fileUrl}`;

    return (
      <Paper
        key={doc.id}
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'grey.300',
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
            borderColor: 'primary.main',
          }
        }}
      >
        {/* Image/Preview Section */}
        <Box
          sx={{
            width: '100%',
            height: '200px',
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            cursor: doc.isImage ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (doc.isImage) {
              handleViewExistingDocument(doc);
            }
          }}
        >
          {doc.isImage ? (
            <img
              src={fileUrl}
              alt={doc.fileName}
              loading="lazy"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ fontSize: '4rem', color: 'primary.main', mb: 1 }}>
                {doc.isPDF ? <PdfIcon sx={{ fontSize: '4rem' }} /> : <DocIcon sx={{ fontSize: '4rem' }} />}
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                {doc.fileName.length > 25 ? doc.fileName.substring(0, 22) + '...' : doc.fileName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Info and Actions Section */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            flexGrow: 1,
          }}
        >
          {/* File Name */}
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'medium',
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
            }}
            title={doc.fileName}
          >
            {doc.fileName}
          </Typography>

          {/* File Size */}
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {formatFileSize(doc.fileSize)}
          </Typography>

          {/* Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'flex-end',
              mt: 'auto',
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            {doc.isImage && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewExistingDocument(doc);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadExistingDocument(doc);
                }}
                sx={{ 
                  color: 'text.secondary',
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExistingDocument(doc.id, doc.fileName);
                }}
                sx={{ 
                  color: 'text.secondary',
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    );
  };

  /**
   * Renders existing documents for a category
   */
  const renderExistingDocuments = (fieldName) => {
    const existingDocs = getExistingDocumentsForCategory(fieldName);
    if (existingDocs.length === 0) return null;

    return (
      <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Uploaded Documents
          </Typography>
          <Chip 
            label={`${existingDocs.length} ${existingDocs.length === 1 ? 'file' : 'files'}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Grid container spacing={2}>
          {existingDocs.map((doc) => (
            <Grid item xs={12} sm={6} md={3} key={doc.id}>
              {renderDocumentCard(doc)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  /**
   * Renders a single document category with upload button and previews
   */
  const renderCategory = (field) => {
    const files = values[field.name];
    const fileArray = files 
      ? (Array.isArray(files) ? files : [files])
      : [];
    const fileCount = fileArray.length;
    const existingDocs = getExistingDocumentsForCategory(field.name);

    return (
      <Box key={field.name} sx={{ mb: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <FormField
              {...field}
              touched={formProps.touched}
              errors={formProps.errors}
              handleChange={formProps.handleChange}
              handleBlur={formProps.handleBlur}
              required={field.required}
              select={field.type === "select"}
              setFieldValue={formProps.setFieldValue}
              values={values}
            />
          </Box>
          {existingDocs.length > 0 && (
            <Chip 
              label={`${existingDocs.length} uploaded`}
              color="primary"
              size="small"
              sx={{ fontWeight: 'bold', minWidth: '100px' }}
            />
          )}
        </Box>
        
        {/* Show existing uploaded documents */}
        {loadingDocuments ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {renderExistingDocuments(field.name)}
            {existingDocs.length > 0 && (
              <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const fileInput = document.getElementById(`upload-${field.name}`);
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Add More Files
                </Button>
              </Box>
            )}
          </>
        )}
        
        {/* Show previews of newly selected files */}
        {fileCount > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Selected Files
              </Typography>
              <Chip 
                label={`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <ImageList 
              cols={4} 
              gap={12}
              rowHeight={200}
              sx={{ 
                mt: 1,
                width: '100%',
                height: 'auto',
                overflow: 'visible',
              }}
            >
              {fileArray.map((file, index) => {
                const previewUrl = getImagePreview(file);
                // Use a unique key combining file name and index to ensure all items render
                const uniqueKey = `${field.name}-${file.name}-${file.size}-${index}`;
                return (
                  <ImageListItem 
                    key={uniqueKey}
                    sx={{
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease-in-out',
                      }
                    }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        loading="lazy"
                        style={{ 
                          width: '100%', 
                          height: '180px', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <Paper
                        sx={{
                          width: '100%',
                          height: '180px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ fontSize: '3rem', color: 'primary.main' }}>
                          {getFileIcon(file)}
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', px: 1, textAlign: 'center' }}>
                          {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                        </Typography>
                      </Paper>
                    )}
                    <ImageListItemBar
                      title={
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 'medium',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </Typography>
                      }
                      subtitle={
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {formatFileSize(file.size)}
                        </Typography>
                      }
                      actionIcon={
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(field.name, index);
                          }}
                          sx={{ 
                            color: 'error.main',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'white',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                      position="below"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '& .MuiImageListItemBar-title': {
                          color: 'text.primary',
                        }
                      }}
                    />
                  </ImageListItem>
                );
              })}
            </ImageList>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <UploadFileIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Document Upload
          </Typography>
        </Box>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3, mt: 2.5 }}>
          {documentUploadFields.map((field) => renderCategory(field))}
        </Box>
      </Paper>

      {uploadStatus === "uploading" && (
        <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
          Uploading patient documents...
        </Alert>
      )}

      {uploadStatus === "success" && (
        <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
          Documents uploaded successfully!
        </Alert>
      )}

      {/* Document View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {viewingDocument?.fileName}
          </Typography>
          <IconButton onClick={() => setViewDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', bgcolor: 'grey.100' }}>
          {viewingDocument && (
            <>
              {viewingDocument.isImage ? (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img
                    src={viewingDocument.fileUrl.startsWith("/")
                      ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${viewingDocument.fileUrl}`
                      : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${viewingDocument.fileUrl}`}
                    alt={viewingDocument.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              ) : viewingDocument.isPDF ? (
                <Box sx={{ width: '100%', height: '70vh' }}>
                  <iframe
                    src={viewingDocument.fileUrl.startsWith("/")
                      ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${viewingDocument.fileUrl}`
                      : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${viewingDocument.fileUrl}`}
                    title={viewingDocument.fileName}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <DocIcon sx={{ fontSize: '5rem', color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {viewingDocument.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {formatFileSize(viewingDocument.fileSize)}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      handleDownloadExistingDocument(viewingDocument);
                      setViewDialogOpen(false);
                    }}
                  >
                    Download to View
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
            Close
          </Button>
          {viewingDocument && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                handleDownloadExistingDocument(viewingDocument);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentUpload;
