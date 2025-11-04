import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Badge,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import axios from "axios";
import { acknowledgeAlert } from "../api/vitalSignsApi";

const CriticalAlertsSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(() => {
    // Load acknowledged alerts from localStorage on component mount
    const saved = localStorage.getItem('acknowledgedAlerts');
    try {
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [expanded, setExpanded] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertDetailsOpen, setAlertDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Persist acknowledged alerts to localStorage whenever they change
  const updateAcknowledgedAlerts = (newAcknowledgedAlerts) => {
    setAcknowledgedAlerts(newAcknowledgedAlerts);
    localStorage.setItem('acknowledgedAlerts', JSON.stringify([...newAcknowledgedAlerts]));
  };

  useEffect(() => {
    fetchCriticalAlerts();
    // Set up interval to refresh alerts every 30 seconds
    const interval = setInterval(fetchCriticalAlerts, 30000);
    
    // Clean up old acknowledged alerts from localStorage on mount
    const cleanupOldAlerts = () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const currentIntervalId = Math.floor(Date.now() / (15 * 60 * 1000));
      const cleanedAlerts = new Set();
      
      acknowledgedAlerts.forEach(alertId => {
        if (alertId.startsWith('critical-')) {
          const parts = alertId.split('-');
          if (parts.length >= 3) {
            const timestamp = parseInt(parts[parts.length - 1]);
            if (timestamp > oneHourAgo) {
              cleanedAlerts.add(alertId);
            }
          }
        } else if (alertId.startsWith('high-occupancy-') || alertId.startsWith('low-availability-')) {
          const parts = alertId.split('-');
          const intervalId = parseInt(parts[parts.length - 1]);
          if (intervalId >= currentIntervalId - 1) {
            cleanedAlerts.add(alertId);
          }
        }
      });
      
      if (cleanedAlerts.size !== acknowledgedAlerts.size) {
        updateAcknowledgedAlerts(cleanedAlerts);
      }
    };
    
    cleanupOldAlerts();
    
    return () => clearInterval(interval);
  }, []);

  const fetchCriticalAlerts = async () => {
    setLoading(true);
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      
      // Fetch critical patients
      const criticalResponse = await axios.get(`${BASE_URL}/critical-factors/critical-patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch bed data
      const bedsResponse = await axios.get(`${BASE_URL}/beds`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Generate alerts based on data
      const generatedAlerts = generateAlerts(criticalResponse.data || [], bedsResponse.data || []);
      
      // Clean up old acknowledged alerts
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
      const currentIntervalId = Math.floor(Date.now() / (15 * 60 * 1000));
      const cleanedAcknowledgedAlerts = new Set();
      
      acknowledgedAlerts.forEach(alertId => {
        if (alertId.startsWith('critical-')) {
          // Patient critical alerts - keep for 1 hour
          const parts = alertId.split('-');
          if (parts.length >= 3) {
            const timestamp = parseInt(parts[parts.length - 1]);
            if (timestamp > oneHourAgo) {
              cleanedAcknowledgedAlerts.add(alertId);
            }
          }
        } else if (alertId.startsWith('high-occupancy-') || alertId.startsWith('low-availability-')) {
          // System alerts - keep only current and previous interval (30 minutes max)
          const parts = alertId.split('-');
          const intervalId = parseInt(parts[parts.length - 1]);
          if (intervalId >= currentIntervalId - 1) { // Current or previous interval
            cleanedAcknowledgedAlerts.add(alertId);
          }
        } else {
          // Legacy or unknown alerts - keep for 30 minutes
          cleanedAcknowledgedAlerts.add(alertId);
        }
      });
      
      updateAcknowledgedAlerts(cleanedAcknowledgedAlerts);
      
      // Filter out already acknowledged alerts
      const filteredAlerts = generatedAlerts.filter(alert => !cleanedAcknowledgedAlerts.has(alert.id));
      setAlerts(filteredAlerts);

    } catch (error) {
      console.error("Error fetching critical alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (criticalPatients, beds) => {
    const alerts = [];

    // Critical patient alerts
    // Each alert ID includes the timestamp of the latest critical factors
    // This ensures new alerts appear when patient conditions change or worsen
    criticalPatients.forEach(patient => {
      // Create a unique alert ID based on patient and their latest critical factors
      // This ensures new alerts are generated when conditions change
      const latestFactors = patient.criticalFactors?.[0];
      const factorTimestamp = latestFactors?.recordedAt || new Date().toISOString();
      const alertId = `critical-${patient.patientId}-${new Date(factorTimestamp).getTime()}`;
      
      alerts.push({
        id: alertId,
        type: "critical_patient",
        severity: "high",
        title: "Critical Patient Alert",
        message: `Patient ${patient.patientName} in Bed ${patient.bedNumber} has critical vital signs`,
        timestamp: new Date().toISOString(),
        patientId: patient.patientId,
        bedNumber: patient.bedNumber,
        patientName: patient.patientName,
        details: patient.criticalFactors,
        factorTimestamp: factorTimestamp,
      });
    });

    // High occupancy alert
    const occupiedBeds = beds.filter(bed => bed.patientId !== null).length;
    const occupancyRate = (occupiedBeds / beds.length) * 100;
    
    if (occupancyRate > 80) {
      // Create alert ID that changes every 15 minutes to allow re-alerting
      const currentTime = Date.now();
      const intervalId = Math.floor(currentTime / (15 * 60 * 1000)); // 15-minute intervals
      
      alerts.push({
        id: `high-occupancy-${intervalId}`,
        type: "high_occupancy",
        severity: "medium",
        title: "High Bed Occupancy",
        message: `Bed occupancy is at ${occupancyRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        occupancyRate: occupancyRate,
      });
    }

    // Low bed availability alert
    const availableBeds = beds.filter(bed => bed.patientId === null).length;
    if (availableBeds <= 2) {
      // Create alert ID that changes every 15 minutes to allow re-alerting
      const currentTime = Date.now();
      const intervalId = Math.floor(currentTime / (15 * 60 * 1000)); // 15-minute intervals
      
      alerts.push({
        id: `low-availability-${availableBeds}-${intervalId}`,
        type: "low_availability",
        severity: "medium",
        title: "Low Bed Availability",
        message: `Only ${availableBeds} bed(s) available`,
        timestamp: new Date().toISOString(),
        availableBeds: availableBeds,
      });
    }

    return alerts;
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleViewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setAlertDetailsOpen(true);
  };

  const handleAcknowledgeAlert = async (alert) => {
    try {
      console.log("Acknowledging alert:", alert);
      
      // Prepare alert data based on alert type
      const alertData = {
        alertId: alert.id,
        alertType: alert.type,
        acknowledgedBy: alert.patientName || "System User",
      };

      // Add patient-specific data only if it exists
      if (alert.patientId) {
        alertData.patientId = alert.patientId;
      }
      if (alert.bedNumber) {
        alertData.bedNumber = alert.bedNumber;
      }

      console.log("Sending alert data:", alertData);

      // Call the API to acknowledge the alert
      await acknowledgeAlert(alertData);

      // Add to acknowledged alerts set to prevent reappearing
      const newAcknowledgedAlerts = new Set([...acknowledgedAlerts, alert.id]);
      updateAcknowledgedAlerts(newAcknowledgedAlerts);
      
      // Remove from current alerts
      setAlerts(prevAlerts => prevAlerts.filter(a => a.id !== alert.id));
      
      dispatch(
        showToast({
          message: "Alert acknowledged successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      dispatch(
        showToast({
          message: "Failed to acknowledge alert",
          type: "error",
        })
      );
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "info";
      default: return "default";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high": return <ErrorIcon color="error" />;
      case "medium": return <WarningIcon color="warning" />;
      case "low": return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const highPriorityAlerts = alerts.filter(alert => alert.severity === "high");
  const mediumPriorityAlerts = alerts.filter(alert => alert.severity === "medium");
  const lowPriorityAlerts = alerts.filter(alert => alert.severity === "low");

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Critical Alerts System
          </Typography>
          <Alert severity="success">
            No critical alerts at the moment. All systems are operating normally.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Critical Alerts System
            </Typography>
            <Badge badgeContent={alerts.length} color="error">
              <IconButton onClick={handleExpandClick}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Badge>
          </Box>

          <Collapse in={expanded}>
            <Box>
              {/* High Priority Alerts */}
              {highPriorityAlerts.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle1" color="error" gutterBottom>
                    High Priority ({highPriorityAlerts.length})
                  </Typography>
                  <List dense>
                    {highPriorityAlerts.map((alert) => (
                      <ListItem key={alert.id} sx={{ backgroundColor: '#ffebee', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                          {getSeverityIcon(alert.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={alert.message}
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewAlertDetails(alert)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAcknowledgeAlert(alert)}
                          >
                            Acknowledge
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Medium Priority Alerts */}
              {mediumPriorityAlerts.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle1" color="warning.main" gutterBottom>
                    Medium Priority ({mediumPriorityAlerts.length})
                  </Typography>
                  <List dense>
                    {mediumPriorityAlerts.map((alert) => (
                      <ListItem key={alert.id} sx={{ backgroundColor: '#fff3e0', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                          {getSeverityIcon(alert.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={alert.message}
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewAlertDetails(alert)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAcknowledgeAlert(alert)}
                          >
                            Acknowledge
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Low Priority Alerts */}
              {lowPriorityAlerts.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" color="info.main" gutterBottom>
                    Low Priority ({lowPriorityAlerts.length})
                  </Typography>
                  <List dense>
                    {lowPriorityAlerts.map((alert) => (
                      <ListItem key={alert.id} sx={{ backgroundColor: '#e3f2fd', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                          {getSeverityIcon(alert.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={alert.message}
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewAlertDetails(alert)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAcknowledgeAlert(alert)}
                          >
                            Acknowledge
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog
        open={alertDetailsOpen}
        onClose={() => setAlertDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details - {selectedAlert?.title}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedAlert.message}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                <strong>Severity:</strong> {selectedAlert.severity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Timestamp:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}
              </Typography>

              {selectedAlert.patientName && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Patient:</strong> {selectedAlert.patientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Bed:</strong> {selectedAlert.bedNumber}
                  </Typography>
                </>
              )}

              {selectedAlert.details && selectedAlert.details.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Critical Factors
                  </Typography>
                  <List dense>
                    {selectedAlert.details.map((factor, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Recorded at: ${new Date(factor.recordedAt).toLocaleString()}`}
                          secondary={
                            <Box>
                              {factor.heartRate && <Typography variant="body2">Heart Rate: {factor.heartRate} bpm</Typography>}
                              {factor.respiratoryRate && <Typography variant="body2">Respiratory Rate: {factor.respiratoryRate} breaths/min</Typography>}
                              {factor.bloodPressureSystolic && <Typography variant="body2">Blood Pressure: {factor.bloodPressureSystolic}/{factor.bloodPressureDiastolic} mmHg</Typography>}
                              {factor.spO2 && <Typography variant="body2">SpO2: {factor.spO2}%</Typography>}
                              {factor.temperature && <Typography variant="body2">Temperature: {factor.temperature}°C</Typography>}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDetailsOpen(false)}>Close</Button>
          {selectedAlert && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleAcknowledgeAlert(selectedAlert);
                setAlertDetailsOpen(false);
              }}
            >
              Acknowledge Alert
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CriticalAlertsSystem; 