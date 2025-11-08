import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { Formik, Form } from "formik";
import { setDialogOpen } from "../features/patients/patientSlice";
import { setLoading } from "../features/loaderSlice";
import { showToast } from "../features/ui/uiSlice";
import PatientAssignmentPage from "../pages/NurseDashboardPages/PatientAssignmentPage";

const UniversalPatientDialog = ({ handleSubmit }) => {
  const dispatch = useDispatch();
  const { dialogOpen, selectedBed } = useSelector((state) => state.patient);
  const user = useSelector((state) => state.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    dispatch(setDialogOpen(false));
  };

  const handleCancel = () => {
    handleClose();
  };

  if (!dialogOpen) {
    return null;
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <PatientAssignmentPage 
        handleSubmit={handleSubmit} 
        onClose={handleClose}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
      
      <DialogActions 
        sx={{ 
          p: 2, 
          bgcolor: "#f5f8fa", 
          borderTop: "1px solid #e0e0e0", 
          justifyContent: "flex-end", 
          minHeight: "64px",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="secondary"
          disabled={isSubmitting}
          sx={{
            borderRadius: 2,
            px: 3.5,
            py: 1.2,
            mr: 2,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="patient-assignment-form"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.2,
            fontWeight: "medium",
            textTransform: "none",
            minWidth: "180px",
          }}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isSubmitting ? "Assigning..." : "Assign Patient"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UniversalPatientDialog; 