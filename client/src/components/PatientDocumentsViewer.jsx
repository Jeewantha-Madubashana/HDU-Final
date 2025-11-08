import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Folder as FolderIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getPatientDocuments, downloadPatientDocument, deletePatientDocument } from '../api/documentApi';

/**
 * Patient Documents Viewer component
 * Displays and manages patient documents with download and delete capabilities
 * @param {number} patientId - ID of the patient whose documents are being viewed
 * @param {boolean} open - Controls dialog visibility
 * @param {Function} onClose - Callback when dialog is closed
 */
const PatientDocumentsViewer = ({ patientId, open, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  useEffect(() => {
    if (open && patientId) {
      fetchDocuments();
    }
  }, [open, patientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPatientDocuments(patientId);
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileDocument) => {
    try {
      const response = await downloadPatientDocument(fileDocument.id);
      
      const blob = new Blob([response.data], { type: fileDocument.fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileDocument.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download ${fileDocument.fileName}: ${err.message}`);
    }
  };

  const handleDeleteClick = (fileDocument) => {
    setDocumentToDelete(fileDocument);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      await deletePatientDocument(documentToDelete.id);
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    } catch (err) {
      setError(`Failed to delete ${documentToDelete.fileName}: ${err.message}`);
    }
  };

  const getFileIcon = (fileDocument) => {
    if (fileDocument.isImage) return <ImageIcon color="primary" />;
    if (fileDocument.isPDF) return <PdfIcon color="error" />;
    if (fileDocument.isVideo) return <VideoIcon color="secondary" />;
    if (fileDocument.isAudio) return <AudioIcon color="info" />;
    if (fileDocument.isDocument) return <DocumentIcon color="action" />;
    return <FolderIcon color="disabled" />;
  };

  const getFileTypeLabel = (fileDocument) => {
    if (fileDocument.isImage) return 'Image';
    if (fileDocument.isPDF) return 'PDF';
    if (fileDocument.isVideo) return 'Video';
    if (fileDocument.isAudio) return 'Audio';
    if (fileDocument.isDocument) return 'Document';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.documentType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Patient Documents</Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && documents.length === 0 && (
            <Box display="flex" flexDirection="column" alignItems="center" minHeight="200px" justifyContent="center">
              <FolderIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No documents found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload documents during patient registration or via the patient management system.
              </Typography>
            </Box>
          )}

          {!loading && !error && documents.length > 0 && (
            <Box>
              {Object.entries(groupedDocuments).map(([documentType, docs]) => (
                <Box key={documentType} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    {documentType === 'MedicalReport' ? 'Medical Reports' :
                     documentType === 'IdProof' ? 'ID Proof' :
                     documentType === 'ConsentForm' ? 'Consent Forms' :
                     'Other Documents'} ({docs.length})
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {docs.map((fileDocument) => (
                      <Grid item xs={12} sm={6} md={4} key={fileDocument.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                                {getFileIcon(fileDocument)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Tooltip title={fileDocument.fileName}>
                                  <Typography variant="subtitle2" noWrap>
                                    {fileDocument.fileName}
                                  </Typography>
                                </Tooltip>
                                <Chip 
                                  label={getFileTypeLabel(fileDocument)} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" display="block">
                              Size: {formatFileSize(fileDocument.fileSize)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Uploaded: {formatDate(fileDocument.uploadedAt)}
                            </Typography>
                          </CardContent>
                          
                          <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                            <Tooltip title="Download">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleDownload(fileDocument)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(fileDocument)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PatientDocumentsViewer; 