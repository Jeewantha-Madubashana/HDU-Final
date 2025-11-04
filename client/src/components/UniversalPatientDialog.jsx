import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Formik, Form } from "formik";
import { setDialogOpen } from "../features/patients/patientSlice";
import { setLoading } from "../features/loaderSlice";
import { showToast } from "../features/ui/uiSlice";
import PatientAssignmentPage from "../pages/NurseDashboardPages/PatientAssignmentPage";

const UniversalPatientDialog = ({ handleSubmit }) => {
  const dispatch = useDispatch();
  const { dialogOpen, selectedBed } = useSelector((state) => state.patient);
  const user = useSelector((state) => state.auth.user);

  const handleClose = () => {
    dispatch(setDialogOpen(false));
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
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" component="div">
          Assign Patient to Bed {selectedBed?.bedNumber}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <PatientAssignmentPage handleSubmit={handleSubmit} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

export default UniversalPatientDialog; 