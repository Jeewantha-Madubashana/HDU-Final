import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Tooltip,
  IconButton,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  fetchLatestVitalSigns,
  createVitalSigns,
  updateVitalSigns,
} from "../api/vitalSignsApi";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

const CriticalFactorsForm = ({ open, onClose, patientId, bedNumber }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const initialFormState = useMemo(
    () => ({
      heartRate: "", // 60–100 bpm
      respiratoryRate: "", // 12–20 breaths/min
      bloodPressureSystolic: "", // 90-120 mmHg
      bloodPressureDiastolic: "", // 60-80 mmHg
      spO2: "", // 95–100%
      temperature: "", // 36.1–37.2 °C
      glasgowComaScale: "", // 13–15 (normal)
      painScale: "", // 0–10
      bloodGlucose: "", // 70–140 mg/dL
      urineOutput: "", // ≥0.5 mL/kg/hr (Store as direct value for now)
    }),
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [latestRecord, setLatestRecord] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  const validationSchema = Yup.object({
    heartRate: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(20, "Heart rate should be at least 20 bpm")
      .max(250, "Heart rate should not exceed 250 bpm"),
    respiratoryRate: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(5, "Respiratory rate should be at least 5 breaths/min")
      .max(60, "Respiratory rate should not exceed 60 breaths/min"),
    bloodPressureSystolic: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(60, "Systolic pressure should be at least 60 mmHg")
      .max(250, "Systolic pressure should not exceed 250 mmHg"),
    bloodPressureDiastolic: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(30, "Diastolic pressure should be at least 30 mmHg")
      .max(150, "Diastolic pressure should not exceed 150 mmHg"),
    spO2: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(50, "SpO2 should be at least 50%")
      .max(100, "SpO2 should not exceed 100%"),
    temperature: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(30, "Temperature should be at least 30°C")
      .max(45, "Temperature should not exceed 45°C"),
    glasgowComaScale: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(3, "GCS should be at least 3")
      .max(15, "GCS should not exceed 15"),
    painScale: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(0, "Pain scale should be at least 0")
      .max(10, "Pain scale should not exceed 10"),
    bloodGlucose: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(20, "Blood glucose should be at least 20 mg/dL")
      .max(600, "Blood glucose should not exceed 600 mg/dL"),
    urineOutput: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .min(0, "Urine output should be at least 0 mL/kg/hr")
      .max(10, "Urine output should not exceed 10 mL/kg/hr"),
  });

  // Formik setup
  const formik = useFormik({
    initialValues: initialFormState,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        ...values,
        patientId: patientId,
        recordedBy: currentUser?.id,
        recordedAt: new Date().toISOString(),
      };

      // Convert empty strings to null for the backend
      for (const key in payload) {
        if (payload[key] === "") {
          payload[key] = null;
        }
      }

      try {
        // If in update mode, update the existing record, otherwise create a new one
        if (isUpdateMode && latestRecord?.id) {
          if (!amendmentReason.trim()) {
            setError("Amendment reason is required for updates.");
            setIsLoading(false);
            return;
          }
          payload.amendmentReason = amendmentReason;

          await updateVitalSigns(latestRecord.id, payload);
          setSuccessMessage("Critical factors updated successfully!");
        } else {

          await createVitalSigns(patientId, payload);
          setSuccessMessage("Critical factors recorded successfully!");
        }

        setIsLoading(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to record critical factors."
        );
        setIsLoading(false);
      }
    },
  });

  // Fetch the latest vital signs when the form opens
  useEffect(() => {
    if (open && patientId) {
      fetchLatestVitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId]);
  // Fetch latest vitals for the patient
  const fetchLatestVitals = async () => {
    if (!patientId) return;

    setFetchingData(true);
    setError(null);

    try {
      const data = await fetchLatestVitalSigns(patientId);
      if (data && data.length > 0) {
        // Get the most recent record (assuming they are sorted by recordedAt DESC)
        const latest = data[0];
        setLatestRecord(latest);

        // Populate form with the latest values
        const formValues = { ...initialFormState };
        // Map each field from the latest record to the form
        for (const key in formValues) {
          if (latest[key] !== null && latest[key] !== undefined) {
            formValues[key] = latest[key].toString();
          }
        }
        formik.setValues(formValues);
      } else {
        // If no records found, reset to initial state
        formik.resetForm();
        setLatestRecord(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch latest vital signs.");
      formik.resetForm();
    } finally {
      setFetchingData(false);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMessage(null);
      setIsUpdateMode(false);
      setAmendmentReason("");
      console.log(
        "[DEBUG] CriticalFactorsForm opened for patientId:",
        patientId
      );
    } else {
      formik.resetForm();
      setLatestRecord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Intentionally excluding formik to prevent infinite renders

  // Handle toggle between create and update modes
  const handleModeToggle = (event) => {
    setIsUpdateMode(event.target.checked);
    console.log(
      "[DEBUG] handleModeToggle called. New isUpdateMode:",
      event.target.checked
    );
    if (event.target.checked && latestRecord) {
      // Populate form with latest values for update
      const formValues = { ...initialFormState };
      for (const key in formValues) {
        if (latestRecord[key] !== null && latestRecord[key] !== undefined) {
          formValues[key] = latestRecord[key].toString();
        }
      }
      formik.setValues(formValues);
    } else {
      // Reset form for new entry
      formik.resetForm();
    }
  };
  // Check if any values are outside normal range
  const hasAbnormalValues = () => {
    for (const field of fields) {
      if (isOutsideNormalRange(field.name, formik.values[field.name])) {
        return true;
      }
    }
    return false;
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    // If there are abnormal values, show confirmation dialog first
    if (hasAbnormalValues()) {
      setConfirmDialogOpen(true);
    } else {
      // Otherwise, submit directly
      formik.handleSubmit();
    }
  };

  // Confirm and proceed with submission
  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    
    // When user confirms abnormal values, we bypass validation and submit directly
    await handleDirectSubmit(formik.values);
  };

  // Direct submit function that bypasses Formik validation
  const handleDirectSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      ...values,
      patientId: patientId,
      recordedBy: currentUser?.id,
      recordedAt: new Date().toISOString(),
    };

    // Convert empty strings to null for the backend
    for (const key in payload) {
      if (payload[key] === "") {
        payload[key] = null;
      }
    }
    
    try {
      // If in update mode, update the existing record, otherwise create a new one
      if (isUpdateMode && latestRecord?.id) {
        if (!amendmentReason.trim()) {
          setError("Amendment reason is required for updates.");
          setIsLoading(false);
          return;
        }
        payload.amendmentReason = amendmentReason;
        await updateVitalSigns(latestRecord.id, payload);
        setSuccessMessage("Critical factors updated successfully!");
      } else {
        await createVitalSigns(patientId, payload);
        setSuccessMessage("Critical factors recorded successfully!");
      }

      setIsLoading(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to record critical factors."
      );
      setIsLoading(false);
    }
  };

  // Cancel confirmation dialog
  const handleCancelConfirm = () => {
    setConfirmDialogOpen(false);
  };

  const fields = [
    {
      name: "heartRate",
      label: "Heart Rate (HR)",
      unit: "bpm",
      normalRange: "60–100",
    },
    {
      name: "respiratoryRate",
      label: "Respiratory Rate (RR)",
      unit: "breaths/min",
      normalRange: "12–20",
    },
    {
      name: "bloodPressureSystolic",
      label: "Blood Pressure (Systolic)",
      unit: "mmHg",
      normalRange: "90–120",
    },
    {
      name: "bloodPressureDiastolic",
      label: "Blood Pressure (Diastolic)",
      unit: "mmHg",
      normalRange: "60–80",
    },
    { name: "spO2", label: "SpO₂", unit: "%", normalRange: "95–100" },
    {
      name: "temperature",
      label: "Temperature",
      unit: "°C",
      normalRange: "36.1–37.2",
    },
    {
      name: "glasgowComaScale",
      label: "Glasgow Coma Scale",
      unit: "",
      normalRange: "13–15",
    },
    { name: "painScale", label: "Pain Scale", unit: "", normalRange: "0–10" },
    {
      name: "bloodGlucose",
      label: "Blood Glucose",
      unit: "mg/dL",
      normalRange: "70–140",
    },
    {
      name: "urineOutput",
      label: "Urine Output",
      unit: "mL/kg/hr",
      normalRange: "≥0.5",
    },
  ];

  // Function to check if a value is outside the normal range
  const isOutsideNormalRange = (field, value) => {
    if (!value || value === "") return false;

    const numValue = parseFloat(value);

    switch (field) {
      case "heartRate":
        return numValue < 60 || numValue > 100;
      case "respiratoryRate":
        return numValue < 12 || numValue > 20;
      case "bloodPressureSystolic":
        return numValue < 90 || numValue > 120;
      case "bloodPressureDiastolic":
        return numValue < 60 || numValue > 80;
      case "spO2":
        return numValue < 95 || numValue > 100;
      case "temperature":
        return numValue < 36.1 || numValue > 37.2;
      case "glasgowComaScale":
        return numValue < 13 || numValue > 15;
      case "painScale":
        return numValue < 0 || numValue > 10; // Updated to match requirement range 0-10
      case "bloodGlucose":
        return numValue < 70 || numValue > 140;
      case "urineOutput":
        return numValue < 0.5;
      default:
        return false;
    }
  };

  // Reset amendment reason when switching modes or closing
  useEffect(() => {
    if (!isUpdateMode || !open) {
      setAmendmentReason("");
    }
  }, [isUpdateMode, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "8px",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Record Vitals for Patient in Bed {bedNumber} (ID:{" "}
            {patientId || "N/A"})
          </Typography>
          <Tooltip
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Normal Ranges:
                </Typography>
                <Typography variant="body2">Heart Rate: 60-100 bpm</Typography>
                <Typography variant="body2">
                  Respiratory Rate: 12-20 breaths/min
                </Typography>
                <Typography variant="body2">
                  Blood Pressure (Systolic): 90-120 mmHg
                </Typography>
                <Typography variant="body2">
                  Blood Pressure (Diastolic): 60-80 mmHg
                </Typography>
                <Typography variant="body2">SpO2: 95-100%</Typography>
                <Typography variant="body2">
                  Temperature: 36.1-37.2°C
                </Typography>
                <Typography variant="body2">
                  Glasgow Coma Scale: 13-15
                </Typography>
                <Typography variant="body2">Pain Scale: 0-10</Typography>
                <Typography variant="body2">
                  Blood Glucose: 70-140 mg/dL
                </Typography>
                <Typography variant="body2">
                  Urine Output: ≥0.5 mL/kg/hr
                </Typography>
              </Box>
            }
            placement="right"
          >
            <IconButton>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              flexDirection: "column",
              borderRadius: "4px",
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2, fontWeight: "medium" }}>
              {isUpdateMode
                ? "Updating vital signs..."
                : "Saving vital signs..."}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {fetchingData ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {" "}
            {latestRecord && (
              <Box
                mb={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Latest vitals recorded:{" "}
                    {new Date(latestRecord.recordedAt).toLocaleString()}
                    {latestRecord.recorder &&
                      ` by ${
                        latestRecord.recorder.nameWithInitials ||
                        latestRecord.recorder.username
                      }`}
                  </Typography>
                  {latestRecord.isAmended && (
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mt: 0.5 }}
                    >
                      This record was amended on{" "}
                      {new Date(latestRecord.amendedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={isUpdateMode}
                      onChange={handleModeToggle}
                      color="primary"
                    />
                  }
                  label={
                    isUpdateMode ? "Update Latest Record" : "Create New Record"
                  }
                />
              </Box>
            )}{" "}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {fields.map((field) => {
                  const isOutsideRange = isOutsideNormalRange(
                    field.name,
                    formik.values[field.name]
                  );

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={field.name}
                      sx={{
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <TextField
                        fullWidth
                        type={
                          field.name === "temperature" ||
                          field.name === "urineOutput"
                            ? "number"
                            : "number"
                        }
                        name={field.name}
                        label={`${field.label} (${field.unit})`}
                        value={formik.values[field.name]}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          (formik.touched[field.name] &&
                            Boolean(formik.errors[field.name])) ||
                          isOutsideRange
                        }
                        helperText={
                          (formik.touched[field.name] &&
                            formik.errors[field.name]) ||
                          (isOutsideRange
                            ? `Outside normal range: ${field.normalRange}`
                            : `Normal: ${field.normalRange}`)
                        }
                        variant="outlined"
                        margin="dense"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {field.unit}
                            </Typography>
                          ),
                          sx: {
                            fontWeight: isOutsideRange ? "bold" : "normal",
                          },
                        }}
                        inputProps={{
                          step:
                            field.name === "temperature" ||
                            field.name === "urineOutput"
                              ? "0.1"
                              : "1",
                          style: {
                            textAlign: "right",
                            paddingRight: field.unit ? "50px" : "14px",
                          },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: isOutsideRange
                                ? "error.main"
                                : undefined,
                              borderWidth: isOutsideRange ? 2 : 1,
                            },
                            backgroundColor: isOutsideRange
                              ? "rgba(255, 0, 0, 0.05)"
                              : "transparent",
                          },
                          "& .MuiFormHelperText-root": {
                            color: isOutsideRange ? "error.main" : undefined,
                            fontWeight: isOutsideRange ? "bold" : undefined,
                          },
                          "& .MuiInputBase-input": {
                            fontWeight: isOutsideRange ? "bold" : "normal",
                          },
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
              <DialogActions sx={{ p: "16px 24px" }}>
                <Button onClick={onClose} color="secondary" variant="outlined">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                  {isLoading
                    ? "Saving..."
                    : isUpdateMode
                    ? "Update Vitals"
                    : "Save Vitals"}
                </Button>
              </DialogActions>
            </form>
          </>
        )}

        {/* Amendment reason input for update mode */}
        {isUpdateMode && (
          <Box mb={2}>
            <TextField
              label="Amendment Reason"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              required
              fullWidth
              multiline
              minRows={2}
              variant="outlined"
              margin="normal"
              helperText="Please provide a reason for updating this record."
            />
          </Box>
        )}
      </DialogContent>

      {/* Confirmation Dialog for abnormal values */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
          Abnormal Vital Signs
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Some vital signs are outside the normal range.
          </Alert>
          <Typography variant="body1" gutterBottom>
            Please confirm that you want to save the following vital signs that
            are outside the normal range:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {fields.map((field) => {
              const value = formik.values[field.name];
              if (value && isOutsideNormalRange(field.name, value)) {
                return (
                  <Typography
                    key={field.name}
                    variant="body2"
                    sx={{ mb: 1, color: "error.main", fontWeight: "bold" }}
                  >
                    {field.label}: {value} {field.unit} (Normal range:{" "}
                    {field.normalRange})
                  </Typography>
                );
              }
              return null;
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelConfirm}
            color="secondary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            color="error"
            variant="contained"
          >
            Confirm and Save
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CriticalFactorsForm;
