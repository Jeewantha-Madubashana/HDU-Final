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
import { getActiveVitalSignsConfig } from "../api/vitalSignsConfigApi";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

// Default fallback fields (for backward compatibility)
const defaultFields = [
  { name: "heartRate", label: "Heart Rate (HR)", unit: "bpm", normalRange: "60–100", dataType: "integer", normalRangeMin: 60, normalRangeMax: 100 },
  { name: "respiratoryRate", label: "Respiratory Rate (RR)", unit: "breaths/min", normalRange: "12–20", dataType: "integer", normalRangeMin: 12, normalRangeMax: 20 },
  { name: "bloodPressureSystolic", label: "Blood Pressure (Systolic)", unit: "mmHg", normalRange: "90–120", dataType: "integer", normalRangeMin: 90, normalRangeMax: 120 },
  { name: "bloodPressureDiastolic", label: "Blood Pressure (Diastolic)", unit: "mmHg", normalRange: "60–80", dataType: "integer", normalRangeMin: 60, normalRangeMax: 80 },
  { name: "spO2", label: "SpO₂", unit: "%", normalRange: "95–100", dataType: "integer", normalRangeMin: 95, normalRangeMax: 100 },
  { name: "temperature", label: "Temperature", unit: "°C", normalRange: "36.1–37.2", dataType: "decimal", normalRangeMin: 36.1, normalRangeMax: 37.2 },
  { name: "glasgowComaScale", label: "Glasgow Coma Scale", unit: "", normalRange: "13–15", dataType: "integer", normalRangeMin: 13, normalRangeMax: 15 },
  { name: "painScale", label: "Pain Scale", unit: "", normalRange: "0–10", dataType: "integer", normalRangeMin: 0, normalRangeMax: 10 },
  { name: "bloodGlucose", label: "Blood Glucose", unit: "mg/dL", normalRange: "70–140", dataType: "integer", normalRangeMin: 70, normalRangeMax: 140 },
  { name: "urineOutput", label: "Urine Output", unit: "mL/kg/hr", normalRange: "≥0.5", dataType: "decimal", normalRangeMin: 0.5, normalRangeMax: null },
];

const CriticalFactorsForm = ({ open, onClose, patientId, bedNumber, onSave }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const [vitalSignsConfig, setVitalSignsConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // Generate initial form state dynamically from vital signs config, with fallback
  const initialFormState = useMemo(() => {
    const state = {};
    if (vitalSignsConfig.length > 0) {
      vitalSignsConfig.forEach((config) => {
        state[config.name] = "";
      });
    } else {
      // Fallback to default fields
      defaultFields.forEach((field) => {
        state[field.name] = "";
      });
    }
    return state;
  }, [vitalSignsConfig]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [latestRecord, setLatestRecord] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  // Fetch active vital signs configuration
  useEffect(() => {
    const fetchVitalSignsConfig = async () => {
      setLoadingConfig(true);
      try {
        const configs = await getActiveVitalSignsConfig();
        // Sort by displayOrder
        const sortedConfigs = configs.sort((a, b) => a.displayOrder - b.displayOrder);
        setVitalSignsConfig(sortedConfigs);
      } catch (error) {
        console.error("Error fetching vital signs config:", error);
        // Fallback to default configs if API fails
        setVitalSignsConfig([]);
      } finally {
        setLoadingConfig(false);
      }
    };

    if (open) {
      fetchVitalSignsConfig();
    }
  }, [open]);

  // Generate validation schema dynamically from vital signs config, with fallback
  const validationSchema = useMemo(() => {
    const schema = {};
    const configsToUse = vitalSignsConfig.length > 0 ? vitalSignsConfig : defaultFields;
    
    configsToUse.forEach((config) => {
      if (config.dataType === "integer" || config.dataType === "decimal") {
        schema[config.name] = Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value));
        
        // Add min/max validation if normal ranges are defined
        if (config.normalRangeMin !== null) {
          schema[config.name] = schema[config.name].min(
            config.normalRangeMin,
            `${config.label} should be at least ${config.normalRangeMin}${config.unit ? ` ${config.unit}` : ""}`
          );
        }
        if (config.normalRangeMax !== null) {
          schema[config.name] = schema[config.name].max(
            config.normalRangeMax,
            `${config.label} should not exceed ${config.normalRangeMax}${config.unit ? ` ${config.unit}` : ""}`
          );
        }
      } else if (config.dataType === "text") {
        schema[config.name] = Yup.string().nullable();
      }
    });
    return Yup.object(schema);
  }, [vitalSignsConfig]);

  // Formik setup
  const formik = useFormik({
    initialValues: initialFormState,
    validationSchema,
    enableReinitialize: true, // Reinitialize when initialFormState or validationSchema changes
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // When creating a new record (not updating), only include fields that were actually changed/entered
      // Compare with the latest record to determine which fields were updated
      let payload = {};
      
      if (isUpdateMode && latestRecord?.id) {
        // Update mode: send all values (as before)
        payload = {
          ...values,
          patientId: patientId,
          recordedBy: currentUser?.id,
          recordedAt: new Date().toISOString(),
        };
      } else {
        // Create mode: only include fields that were actually entered/changed
        // Compare with latest record to find changed fields
        const changedFields = {};
        
        for (const key in values) {
          const currentValue = values[key] === "" ? null : values[key];
          const previousValue = latestRecord?.[key] === null || latestRecord?.[key] === undefined 
            ? null 
            : latestRecord[key];
          
          // Include field if:
          // 1. It has a value (not empty/null)
          // 2. It's different from the previous record (or there's no previous record)
          if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
            // Convert to appropriate type for comparison
            const currentValueNum = typeof currentValue === 'string' && !isNaN(currentValue) 
              ? parseFloat(currentValue) 
              : currentValue;
            const previousValueNum = previousValue !== null && !isNaN(previousValue) 
              ? parseFloat(previousValue) 
              : previousValue;
            
            // Include if value changed or if there's no previous record
            if (!latestRecord || currentValueNum !== previousValueNum) {
              changedFields[key] = currentValue;
            }
          }
        }
        
        payload = {
          ...changedFields,
          patientId: patientId,
          recordedBy: currentUser?.id,
          recordedAt: new Date().toISOString(),
        };
      }

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
        // Call onSave callback to refresh parent data
        if (onSave) {
          onSave();
        }
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

  // Fetch latest vitals for the patient
  const fetchLatestVitals = async () => {
    if (!patientId) return;

    setFetchingData(true);
    setError(null);

    try {
      const data = await fetchLatestVitalSigns(patientId);
      if (data && data.length > 0) {
        // Get the most recent record (for update mode)
        const latest = data[0];
        setLatestRecord(latest);

        // Merge ALL records to get the most recent value for each field
        // This ensures we show all previously entered values, not just from the latest record
        const mergedValues = {};
        
        // Process all records in chronological order (oldest first)
        // This way, newer values will overwrite older ones
        const sortedData = [...data].sort((a, b) => 
          new Date(a.recordedAt) - new Date(b.recordedAt)
        );
        
        // Merge all records - each record adds/updates its fields
        sortedData.forEach(record => {
          // Process all fields in the record
          for (const key in record) {
            // Skip metadata fields
            const excludedFields = ['id', 'recordedAt', 'recordedBy', 'isAmended', 
              'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 
              'patientId', 'createdAt', 'updatedAt', 'recorder'];
            
            if (!excludedFields.includes(key) && 
                record[key] !== null && 
                record[key] !== undefined && 
                record[key] !== '' &&
                typeof record[key] !== 'object') {
              // Use the most recent value (later records overwrite earlier ones)
              mergedValues[key] = record[key];
            }
          }
        });

        // Populate form with merged values from all records
        const formValues = { ...initialFormState };
        
        // Map merged values to form fields
        for (const key in formValues) {
          if (mergedValues[key] !== null && mergedValues[key] !== undefined && mergedValues[key] !== '') {
            formValues[key] = mergedValues[key].toString();
          }
        }
        
        formik.setValues(formValues);
      } else {
        // If no records found, reset to initial state
        formik.resetForm({ values: initialFormState });
        setLatestRecord(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch latest vital signs.");
      formik.resetForm({ values: initialFormState });
    } finally {
      setFetchingData(false);
    }
  };

  // Fetch the latest vital signs when the form opens and config is loaded
  useEffect(() => {
    if (open && patientId && vitalSignsConfig.length > 0 && !loadingConfig) {
      // Wait a bit for formik to reinitialize with new config
      setTimeout(() => {
        fetchLatestVitals();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId, vitalSignsConfig.length, loadingConfig]);

  // Reset form when dialog opens (but don't reset when config changes if form is already open)
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMessage(null);
      setIsUpdateMode(false);
      setAmendmentReason("");
      // Only reset if we don't have a latest record yet
      if (!latestRecord) {
        formik.resetForm({ values: initialFormState });
      }
    } else if (!open) {
      formik.resetForm();
      setLatestRecord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only reset when dialog opens/closes, not when config changes

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

    // When creating a new record (not updating), only include fields that were actually changed/entered
    let payload = {};
    
    if (isUpdateMode && latestRecord?.id) {
      // Update mode: send all values (as before)
      payload = {
        ...values,
        patientId: patientId,
        recordedBy: currentUser?.id,
        recordedAt: new Date().toISOString(),
      };
    } else {
      // Create mode: only include fields that were actually entered/changed
      // Compare with latest record to find changed fields
      const changedFields = {};
      
      for (const key in values) {
        const currentValue = values[key] === "" ? null : values[key];
        const previousValue = latestRecord?.[key] === null || latestRecord?.[key] === undefined 
          ? null 
          : latestRecord[key];
        
        // Include field if:
        // 1. It has a value (not empty/null)
        // 2. It's different from the previous record (or there's no previous record)
        if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
          // Convert to appropriate type for comparison
          const currentValueNum = typeof currentValue === 'string' && !isNaN(currentValue) 
            ? parseFloat(currentValue) 
            : currentValue;
          const previousValueNum = previousValue !== null && !isNaN(previousValue) 
            ? parseFloat(previousValue) 
            : previousValue;
          
          // Include if value changed or if there's no previous record
          if (!latestRecord || currentValueNum !== previousValueNum) {
            changedFields[key] = currentValue;
          }
        }
      }
      
      payload = {
        ...changedFields,
        patientId: patientId,
        recordedBy: currentUser?.id,
        recordedAt: new Date().toISOString(),
      };
    }

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
      // Call onSave callback to refresh parent data
      if (onSave) {
        onSave();
      }
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

  // Generate fields array dynamically from vital signs config, with fallback to defaults
  const fields = useMemo(() => {
    if (vitalSignsConfig.length > 0) {
      return vitalSignsConfig.map((config) => ({
        name: config.name,
        label: config.label,
        unit: config.unit || "",
        normalRange: 
          config.normalRangeMin !== null && config.normalRangeMax !== null
            ? `${config.normalRangeMin}–${config.normalRangeMax}`
            : config.normalRangeMin !== null
            ? `≥${config.normalRangeMin}`
            : config.normalRangeMax !== null
            ? `≤${config.normalRangeMax}`
            : "",
        dataType: config.dataType,
        normalRangeMin: config.normalRangeMin,
        normalRangeMax: config.normalRangeMax,
      }));
    }
    // Fallback to default fields if config is empty
    return defaultFields;
  }, [vitalSignsConfig]);

  // Function to check if a value is outside the normal range (dynamic with fallback)
  const isOutsideNormalRange = (fieldName, value) => {
    if (!value || value === "") return false;

    const numValue = parseFloat(value);
    const configsToUse = vitalSignsConfig.length > 0 ? vitalSignsConfig : defaultFields;
    const config = configsToUse.find((c) => c.name === fieldName);
    
    if (!config) return false;
    
    if (config.normalRangeMin !== null && numValue < config.normalRangeMin) {
      return true;
    }
    if (config.normalRangeMax !== null && numValue > config.normalRangeMax) {
      return true;
    }
    
    return false;
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
                {(vitalSignsConfig.length > 0 ? vitalSignsConfig : defaultFields).map((config, index) => (
                  <Typography key={config.id || config.name || index} variant="body2">
                    {config.label}:{" "}
                    {config.normalRangeMin !== null && config.normalRangeMax !== null
                      ? `${config.normalRangeMin}-${config.normalRangeMax}`
                      : config.normalRangeMin !== null
                      ? `≥${config.normalRangeMin}`
                      : config.normalRangeMax !== null
                      ? `≤${config.normalRangeMax}`
                      : "N/A"}
                    {config.unit ? ` ${config.unit}` : ""}
                  </Typography>
                ))}
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

        {loadingConfig ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading vital signs configuration...
            </Typography>
          </Box>
        ) : fetchingData ? (
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
                          field.dataType === "text"
                            ? "text"
                            : field.dataType === "decimal"
                            ? "number"
                            : "number"
                        }
                        name={field.name}
                        label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}
                        value={formik.values[field.name] || ""}
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
                            ? `⚠️ Outside normal range${field.normalRange ? ` (${field.normalRange}${field.unit ? ` ${field.unit}` : ""})` : ""}`
                            : field.normalRange
                            ? `Normal range: ${field.normalRange}${field.unit ? ` ${field.unit}` : ""}`
                            : "")
                        }
                        variant="outlined"
                        margin="dense"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: field.unit ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {field.unit}
                            </Typography>
                          ) : null,
                          sx: {
                            fontWeight: isOutsideRange ? "bold" : "normal",
                          },
                        }}
                        inputProps={{
                          step: field.dataType === "decimal" ? "0.1" : field.dataType === "integer" ? "1" : undefined,
                          style: {
                            textAlign: field.dataType === "text" ? "left" : "right",
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
