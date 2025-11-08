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

/**
 * Default vital signs configuration used as fallback when backend config is unavailable
 * Ensures form always has fields to display even if API fails
 */
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

/**
 * Form component for recording and updating patient vital signs
 * Dynamically generates form fields based on backend vital signs configuration
 * Supports both create (new record) and update (amend existing) modes
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {Function} onClose - Callback when dialog is closed
 * @param {number} patientId - ID of the patient whose vitals are being recorded
 * @param {string} bedNumber - Bed number for display purposes
 * @param {Function} onSave - Callback after successful save to refresh parent data
 */
const CriticalFactorsForm = ({ open, onClose, patientId, bedNumber, onSave }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const [vitalSignsConfig, setVitalSignsConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  const initialFormState = useMemo(() => {
    const state = {};
    if (vitalSignsConfig.length > 0) {
      vitalSignsConfig.forEach((config) => {
        state[config.name] = "";
      });
    } else {
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

  useEffect(() => {
    const fetchVitalSignsConfig = async () => {
      setLoadingConfig(true);
      try {
        const configs = await getActiveVitalSignsConfig();
        const sortedConfigs = configs.sort((a, b) => a.displayOrder - b.displayOrder);
        setVitalSignsConfig(sortedConfigs);
      } catch (error) {
        console.error("Error fetching vital signs config:", error);
        setVitalSignsConfig([]);
      } finally {
        setLoadingConfig(false);
      }
    };

    if (open) {
      fetchVitalSignsConfig();
    }
  }, [open]);

  const validationSchema = useMemo(() => {
    const schema = {};
    const configsToUse = vitalSignsConfig.length > 0 ? vitalSignsConfig : defaultFields;
    
    configsToUse.forEach((config) => {
      if (config.dataType === "integer" || config.dataType === "decimal") {
        schema[config.name] = Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value));
        
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

  const formik = useFormik({
    initialValues: initialFormState,
    validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      let payload = {};
      
      if (isUpdateMode && latestRecord?.id) {
        payload = {
          ...values,
          patientId: patientId,
          recordedBy: currentUser?.id,
          recordedAt: new Date().toISOString(),
        };
      } else {
        const changedFields = {};
        
        for (const key in values) {
          const currentValue = values[key] === "" ? null : values[key];
          const previousValue = latestRecord?.[key] === null || latestRecord?.[key] === undefined 
            ? null 
            : latestRecord[key];
          
          if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
            const currentValueNum = typeof currentValue === 'string' && !isNaN(currentValue) 
              ? parseFloat(currentValue) 
              : currentValue;
            const previousValueNum = previousValue !== null && !isNaN(previousValue) 
              ? parseFloat(previousValue) 
              : previousValue;
            
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

      for (const key in payload) {
        if (payload[key] === "") {
          payload[key] = null;
        }
      }

      try {
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

  /**
   * Fetches and merges all historical vital sign records for the patient
   * Merges records chronologically to display the most recent value for each field
   * This ensures all previously entered data is visible, not just the latest record
   */
  const fetchLatestVitals = async () => {
    if (!patientId) return;

    setFetchingData(true);
    setError(null);

    try {
      const data = await fetchLatestVitalSigns(patientId);
      if (data && data.length > 0) {
        const latest = data[0];
        setLatestRecord(latest);

        const mergedValues = {};
        
        const sortedData = [...data].sort((a, b) => 
          new Date(a.recordedAt) - new Date(b.recordedAt)
        );
        
        sortedData.forEach(record => {
          for (const key in record) {
            const excludedFields = ['id', 'recordedAt', 'recordedBy', 'isAmended', 
              'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 
              'patientId', 'createdAt', 'updatedAt', 'recorder'];
            
            if (!excludedFields.includes(key) && 
                record[key] !== null && 
                record[key] !== undefined && 
                record[key] !== '' &&
                typeof record[key] !== 'object') {
              mergedValues[key] = record[key];
            }
          }
        });

        const formValues = { ...initialFormState };
        
        for (const key in formValues) {
          if (mergedValues[key] !== null && mergedValues[key] !== undefined && mergedValues[key] !== '') {
            formValues[key] = mergedValues[key].toString();
          }
        }
        
        formik.setValues(formValues);
      } else {
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

  useEffect(() => {
    if (open && patientId && vitalSignsConfig.length > 0 && !loadingConfig) {
      setTimeout(() => {
        fetchLatestVitals();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId, vitalSignsConfig.length, loadingConfig]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMessage(null);
      setIsUpdateMode(false);
      setAmendmentReason("");
      if (!latestRecord) {
        formik.resetForm({ values: initialFormState });
      }
    } else if (!open) {
      formik.resetForm();
      setLatestRecord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleModeToggle = (event) => {
    setIsUpdateMode(event.target.checked);
    if (event.target.checked && latestRecord) {
      const formValues = { ...initialFormState };
      for (const key in formValues) {
        if (latestRecord[key] !== null && latestRecord[key] !== undefined) {
          formValues[key] = latestRecord[key].toString();
        }
      }
      formik.setValues(formValues);
    } else {
      formik.resetForm();
    }
  };

  const hasAbnormalValues = () => {
    for (const field of fields) {
      if (isOutsideNormalRange(field.name, formik.values[field.name])) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (hasAbnormalValues()) {
      setConfirmDialogOpen(true);
    } else {
      formik.handleSubmit();
    }
  };

  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    await handleDirectSubmit(formik.values);
  };

  const handleDirectSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let payload = {};
    
    if (isUpdateMode && latestRecord?.id) {
      payload = {
        ...values,
        patientId: patientId,
        recordedBy: currentUser?.id,
        recordedAt: new Date().toISOString(),
      };
    } else {
      const changedFields = {};
      
      for (const key in values) {
        const currentValue = values[key] === "" ? null : values[key];
        const previousValue = latestRecord?.[key] === null || latestRecord?.[key] === undefined 
          ? null 
          : latestRecord[key];
        
        if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
          const currentValueNum = typeof currentValue === 'string' && !isNaN(currentValue) 
            ? parseFloat(currentValue) 
            : currentValue;
          const previousValueNum = previousValue !== null && !isNaN(previousValue) 
            ? parseFloat(previousValue) 
            : previousValue;
          
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

    for (const key in payload) {
      if (payload[key] === "") {
        payload[key] = null;
      }
    }
    
    try {
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

  const handleCancelConfirm = () => {
    setConfirmDialogOpen(false);
  };

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
    return defaultFields;
  }, [vitalSignsConfig]);

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
