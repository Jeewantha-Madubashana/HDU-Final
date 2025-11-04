import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Person,
  Phone,
  CalendarToday,
  LocationOn,
  Wc,
  Assignment,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "../features/loaderSlice";
import { showToast } from "../features/ui/uiSlice";
import { setDialogOpen } from "../features/patients/patientSlice";

const DischargeDialog = ({ open, onClose, onDischarge, bed, patient }) => {
  const [dischargeData, setDischargeData] = useState({
    dischargeReason: "",
    doctorComments: "",
    dischargeInstructions: "",
    followUpRequired: false,
    followUpDate: "",
    medicationsPrescribed: "",
  });

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const handleInputChange = (field, value) => {
    setDischargeData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!dischargeData.dischargeReason.trim()) {
      newErrors.dischargeReason = "Discharge reason is required";
    }
    
    if (!dischargeData.doctorComments.trim()) {
      newErrors.doctorComments = "Doctor comments are required";
    }
    
    if (dischargeData.followUpRequired && !dischargeData.followUpDate) {
      newErrors.followUpDate = "Follow-up date is required when follow-up is needed";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));
    
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      
      // First, create discharge record
      const dischargeResponse = await fetch(`${BASE_URL}/patients/${patient.id}/discharge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bedId: bed.id,
          ...dischargeData
        }),
      });

      if (!dischargeResponse.ok) {
        throw new Error("Failed to discharge patient");
      }

      const dischargeResult = await dischargeResponse.json();
      
      // The discharge process already deassigns the bed, so no need for separate DELETE call

      dispatch(
        showToast({
          message: "Patient discharged successfully with complete medical record.",
          type: "success",
        })
      );
      
      // Close dialog and reset form
      handleCancel();
      
      // Call the onDischarge callback to refresh parent component
      onDischarge();
      
    } catch (error) {
      console.error("Discharge error:", error);
      dispatch(
        showToast({
          message: "Failed to discharge patient. Please try again.",
          type: "error",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setDischargeData({
      dischargeReason: "",
      doctorComments: "",
      dischargeInstructions: "",
      followUpRequired: false,
      followUpDate: "",
      medicationsPrescribed: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: "primary.main", 
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: 1
      }}>
        <Assignment />
        Patient Discharge Process
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Patient Information Card */}
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Patient Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Person color="primary" />
                  <Typography variant="body2">
                    <strong>Name:</strong> {patient?.fullName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Wc color="primary" />
                  <Typography variant="body2">
                    <strong>Gender:</strong> {patient?.gender}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2">
                    <strong>DOB:</strong> {patient?.dateOfBirth}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Phone color="primary" />
                  <Typography variant="body2">
                    <strong>Contact:</strong> {patient?.contactNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="body2">
                    <strong>Address:</strong> {patient?.address}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip 
                    label={`Bed ${bed?.bedNumber}`} 
                    color="secondary" 
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Discharge Form */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discharge Reason *"
              value={dischargeData.dischargeReason}
              onChange={(e) => handleInputChange("dischargeReason", e.target.value)}
              error={!!errors.dischargeReason}
              helperText={errors.dischargeReason || "Primary reason for discharge"}
              multiline
              rows={2}
              placeholder="e.g., Recovery complete, Treatment finished, Patient request"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Doctor Comments *"
              value={dischargeData.doctorComments}
              onChange={(e) => handleInputChange("doctorComments", e.target.value)}
              error={!!errors.doctorComments}
              helperText={errors.doctorComments || "Medical assessment and discharge notes"}
              multiline
              rows={4}
              placeholder="Enter detailed medical comments, patient condition, treatment outcomes, and any concerns..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discharge Instructions"
              value={dischargeData.dischargeInstructions}
              onChange={(e) => handleInputChange("dischargeInstructions", e.target.value)}
              multiline
              rows={3}
              placeholder="Instructions for patient care, medications, diet, activity restrictions..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Medications Prescribed"
              value={dischargeData.medicationsPrescribed}
              onChange={(e) => handleInputChange("medicationsPrescribed", e.target.value)}
              multiline
              rows={2}
              placeholder="List medications, dosages, and duration..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Follow-up Required
                </Typography>
                <Button
                  variant={dischargeData.followUpRequired ? "contained" : "outlined"}
                  color={dischargeData.followUpRequired ? "primary" : "default"}
                  onClick={() => handleInputChange("followUpRequired", !dischargeData.followUpRequired)}
                  size="small"
                >
                  {dischargeData.followUpRequired ? "Yes" : "No"}
                </Button>
              </Box>
              
              {dischargeData.followUpRequired && (
                <TextField
                  fullWidth
                  type="date"
                  label="Follow-up Date *"
                  value={dischargeData.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                  error={!!errors.followUpDate}
                  helperText={errors.followUpDate}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> This action will permanently discharge the patient and release the bed. 
            All discharge information will be recorded in the patient's medical history.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
          color="secondary"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{
            bgcolor: "#e74c3c",
            "&:hover": {
              bgcolor: "#c0392b",
            },
          }}
        >
          Confirm Discharge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DischargeDialog; 