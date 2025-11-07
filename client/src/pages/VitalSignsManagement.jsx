import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import {
  getAllVitalSignsConfig,
  createVitalSignsConfig,
  updateVitalSignsConfig,
  deleteVitalSignsConfig,
  toggleVitalSignsConfigStatus,
} from "../api/vitalSignsConfigApi";

const VitalSignsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    unit: "",
    normalRangeMin: "",
    normalRangeMax: "",
    dataType: "integer",
    isActive: true,
    displayOrder: 0,
    description: "",
  });
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();

  useEffect(() => {
    fetchVitalSigns();
  }, []);

  const fetchVitalSigns = async () => {
    setLoading(true);
    try {
      const data = await getAllVitalSignsConfig();
      setVitalSigns(data);
    } catch (error) {
      dispatch(
        showToast({
          message: error.message || "Failed to fetch vital signs configurations",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        label: config.label,
        unit: config.unit || "",
        normalRangeMin: config.normalRangeMin || "",
        normalRangeMax: config.normalRangeMax || "",
        dataType: config.dataType || "integer",
        isActive: config.isActive !== undefined ? config.isActive : true,
        displayOrder: config.displayOrder || 0,
        description: config.description || "",
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        label: "",
        unit: "",
        normalRangeMin: "",
        normalRangeMax: "",
        dataType: "integer",
        isActive: true,
        displayOrder: 0,
        description: "",
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
    setFormData({
      name: "",
      label: "",
      unit: "",
      normalRangeMin: "",
      normalRangeMax: "",
      dataType: "integer",
      isActive: true,
      displayOrder: 0,
      description: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }
    if (formData.normalRangeMin !== "" && formData.normalRangeMax !== "") {
      if (parseFloat(formData.normalRangeMin) > parseFloat(formData.normalRangeMax)) {
        newErrors.normalRangeMax = "Maximum must be greater than minimum";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        normalRangeMin: formData.normalRangeMin ? parseFloat(formData.normalRangeMin) : null,
        normalRangeMax: formData.normalRangeMax ? parseFloat(formData.normalRangeMax) : null,
        displayOrder: parseInt(formData.displayOrder) || 0,
      };

      if (editingConfig) {
        await updateVitalSignsConfig(editingConfig.id, submitData);
        dispatch(
          showToast({
            message: "Vital sign configuration updated successfully",
            type: "success",
          })
        );
      } else {
        await createVitalSignsConfig(submitData);
        dispatch(
          showToast({
            message: "Vital sign configuration created successfully",
            type: "success",
          })
        );
      }
      handleCloseDialog();
      fetchVitalSigns();
    } catch (error) {
      dispatch(
        showToast({
          message: error.message || "Failed to save vital sign configuration",
          type: "error",
        })
      );
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Are you sure you want to delete "${label}"?`)) {
      return;
    }

    try {
      await deleteVitalSignsConfig(id);
      dispatch(
        showToast({
          message: "Vital sign configuration deleted successfully",
          type: "success",
        })
      );
      fetchVitalSigns();
    } catch (error) {
      dispatch(
        showToast({
          message: error.message || "Failed to delete vital sign configuration",
          type: "error",
        })
      );
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleVitalSignsConfigStatus(id);
      dispatch(
        showToast({
          message: "Vital sign status updated successfully",
          type: "success",
        })
      );
      fetchVitalSigns();
    } catch (error) {
      dispatch(
        showToast({
          message: error.message || "Failed to toggle vital sign status",
          type: "error",
        })
      );
    }
  };

  if (loading && vitalSigns.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Vital Signs Configuration Management
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchVitalSigns} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Vital Sign
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Label</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell><strong>Normal Range</strong></TableCell>
                  <TableCell><strong>Data Type</strong></TableCell>
                  <TableCell><strong>Display Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vitalSigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        No vital signs configurations found. Click "Add New Vital Sign" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vitalSigns.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {config.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {config.label}
                        </Typography>
                      </TableCell>
                      <TableCell>{config.unit || "-"}</TableCell>
                      <TableCell>
                        {config.normalRangeMin !== null && config.normalRangeMax !== null
                          ? `${config.normalRangeMin} - ${config.normalRangeMax}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip label={config.dataType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{config.displayOrder}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.isActive ? "Active" : "Inactive"}
                          color={config.isActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(config)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={config.isActive ? "Deactivate" : "Activate"}>
                            <IconButton
                              size="small"
                              color={config.isActive ? "default" : "success"}
                              onClick={() => handleToggleStatus(config.id)}
                            >
                              {config.isActive ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(config.id, config.label)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? "Edit Vital Sign Configuration" : "Add New Vital Sign Configuration"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name (Field Name)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name || "Unique field name (e.g., 'heartRate', 'bloodPressure')"}
                  disabled={!!editingConfig}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Label (Display Name)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  error={!!errors.label}
                  helperText={errors.label || "Display name (e.g., 'Heart Rate', 'Blood Pressure')"}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  helperText="Unit of measurement (e.g., 'bpm', 'mmHg', '°C', '%')"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Data Type"
                  value={formData.dataType}
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="integer">Integer</option>
                  <option value="decimal">Decimal</option>
                  <option value="text">Text</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Normal Range (Minimum)"
                  type="number"
                  value={formData.normalRangeMin}
                  onChange={(e) =>
                    setFormData({ ...formData, normalRangeMin: e.target.value })
                  }
                  helperText="Minimum normal value"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Normal Range (Maximum)"
                  type="number"
                  value={formData.normalRangeMax}
                  onChange={(e) =>
                    setFormData({ ...formData, normalRangeMax: e.target.value })
                  }
                  error={!!errors.normalRangeMax}
                  helperText={errors.normalRangeMax || "Maximum normal value"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Display Order"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                  helperText="Order in which to display this field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  helperText="Optional description or notes"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingConfig ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VitalSignsManagement;

