import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  getPatientDocuments,
  deletePatientDocument,
  downloadPatientDocument,
} from "../api/documentApi";
import { useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";

/**
 * Component to display and manage patient documents organized by category
 * Supports viewing, editing, deleting, and downloading documents
 * @param {number} patientId - ID of the patient
 * @param {Function} onUpdate - Callback after document changes
 */
const PatientDocumentsTab = ({ patientId, onUpdate }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [categoryTab, setCategoryTab] = useState(0);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const dispatch = useDispatch();

  const categories = [
    { label: "Medical Reports", value: "MedicalReport" },
    { label: "ID Proofs", value: "IdProof" },
    { label: "Consent Forms", value: "ConsentForm" },
    { label: "Other Documents", value: "Other" },
  ];

  useEffect(() => {
    if (patientId) {
      fetchDocuments();
    }
  }, [patientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPatientDocuments(patientId);
      if (response.success && response.documents) {
        setDocuments(response.documents);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await deletePatientDocument(selectedDocument.id);
      dispatch(
        showToast({
          message: "Document deleted successfully",
          type: "success",
        })
      );
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      await fetchDocuments();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      dispatch(
        showToast({
          message: err.message || "Failed to delete document",
          type: "error",
        })
      );
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await downloadPatientDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(
        showToast({
          message: "Document downloaded successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showToast({
          message: err.message || "Failed to download document",
          type: "error",
        })
      );
    }
  };


  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getDocumentsByCategory = (category) => {
    return documents.filter((doc) => doc.documentType === category);
  };

  const handleViewDocument = (document) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fileUrl = document.fileUrl.startsWith("/")
      ? `${baseUrl}${document.fileUrl}`
      : `${baseUrl}/${document.fileUrl}`;
    setPreviewUrl(fileUrl);
    setPreviewDialogOpen(true);
  };

  /**
   * Renders a single document card (consistent with DocumentUpload component)
   */
  const renderDocumentCard = (document) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fileUrl = document.fileUrl.startsWith("/")
      ? `${baseUrl}${document.fileUrl}`
      : `${baseUrl}/${document.fileUrl}`;

    return (
      <Paper
        key={document.id}
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
            cursor: document.isImage ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (document.isImage) {
              handleViewDocument(document);
            }
          }}
        >
          {document.isImage ? (
            <img
              src={fileUrl}
              alt={document.fileName}
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
                {document.isPDF ? <PdfIcon sx={{ fontSize: '4rem' }} /> : <DocIcon sx={{ fontSize: '4rem' }} />}
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                {document.fileName.length > 25 ? document.fileName.substring(0, 22) + '...' : document.fileName}
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
            title={document.fileName}
          >
            {document.fileName}
          </Typography>

          {/* File Size */}
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {formatFileSize(document.fileSize)}
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
            {document.isImage && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDocument(document);
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
                  handleDownload(document);
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
                  setSelectedDocument(document);
                  setDeleteDialogOpen(true);
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

  const currentCategory = categories[categoryTab];
  const categoryDocuments = getDocumentsByCategory(currentCategory.value);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Tabs
        value={categoryTab}
        onChange={(e, newValue) => setCategoryTab(newValue)}
        sx={{ mb: 3 }}
      >
        {categories.map((category, index) => {
          const count = getDocumentsByCategory(category.value).length;
          return (
            <Tab
              key={index}
              label={`${category.label} (${count})`}
              sx={{ textTransform: "none" }}
            />
          );
        })}
      </Tabs>

      {categoryDocuments.length === 0 ? (
        <Alert severity="info">
          No {currentCategory.label.toLowerCase()} found for this patient.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {categoryDocuments.map((document) => (
            <Grid item xs={12} sm={6} md={3} key={document.id}>
              {renderDocumentCard(document)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedDocument(null);
        }}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedDocument?.fileName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedDocument(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewUrl(null);
        }}
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
            Document Preview
          </Typography>
          <IconButton onClick={() => {
            setPreviewDialogOpen(false);
            setPreviewUrl(null);
          }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', bgcolor: 'grey.100' }}>
          {previewUrl && (
            <>
              {previewUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i) ? (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img
                    src={previewUrl}
                    alt="Document Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              ) : previewUrl.match(/\.pdf$/i) ? (
                <Box sx={{ width: '100%', height: '70vh' }}>
                  <iframe
                    src={previewUrl}
                    title="Document Preview"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <DocIcon sx={{ fontSize: '5rem', color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Preview not available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Please download the document to view its content.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      if (categoryDocuments.length > 0) {
                        const doc = categoryDocuments.find(d => {
                          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                          const fileUrl = d.fileUrl.startsWith("/")
                            ? `${baseUrl}${d.fileUrl}`
                            : `${baseUrl}/${d.fileUrl}`;
                          return fileUrl === previewUrl;
                        });
                        if (doc) {
                          handleDownload(doc);
                        }
                      }
                    }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => {
            setPreviewDialogOpen(false);
            setPreviewUrl(null);
          }} variant="outlined">
            Close
          </Button>
          {previewUrl && categoryDocuments.length > 0 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const doc = categoryDocuments.find(d => {
                  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                  const fileUrl = d.fileUrl.startsWith("/")
                    ? `${baseUrl}${d.fileUrl}`
                    : `${baseUrl}/${d.fileUrl}`;
                  return fileUrl === previewUrl;
                });
                if (doc) {
                  handleDownload(doc);
                }
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

export default PatientDocumentsTab;

