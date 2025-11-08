import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Update as UpdateIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { getPatientChangeHistory } from "../api/patientApi";

/**
 * Component to display patient data change history
 * Shows all changes to Patient, EmergencyContact, MedicalRecord, and Admission
 * @param {number} patientId - ID of the patient
 */
const PatientChangeHistory = ({ patientId }) => {
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await getPatientChangeHistory(patientId);
        setChangeHistory(data.changeHistory || []);
      } catch (err) {
        console.error("Error fetching change history:", err);
        setError(err.message || "Failed to load change history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  const getTableDisplayName = (tableName) => {
    const tableMap = {
      patients: "Patient Details",
      emergency_contacts: "Emergency Contact Information",
      medical_records: "Medical Information",
      admissions: "Admission Details",
    };
    return tableMap[tableName] || tableName;
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "Not set";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value instanceof Date) return new Date(value).toLocaleString();
    return String(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (changeHistory.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No change history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, width: "100%" }}>
      <Box sx={{ width: "100%", position: "relative" }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: "absolute",
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: "divider",
            zIndex: 0,
          }}
        />
        
        {changeHistory.map((change, index) => (
          <Box key={change.id} sx={{ position: "relative", mb: 2, width: "100%", pl: 3 }}>
            {/* Timeline dot - centered on the vertical line */}
            <Box
              sx={{
                position: "absolute",
                left: 9,
                top: 8,
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: change.action === "CREATE" ? "primary.main" : "secondary.main",
                color: "white",
                boxShadow: 2,
                border: "2px solid white",
              }}
            >
              {change.action === "CREATE" ? (
                <AddIcon sx={{ fontSize: 14 }} />
              ) : (
                <UpdateIcon sx={{ fontSize: 14 }} />
              )}
            </Box>
            
            <Paper sx={{ p: 2, width: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {getTableDisplayName(change.tableName)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(change.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                      label={change.action}
                      size="small"
                      color={change.action === "CREATE" ? "primary" : "secondary"}
                    />
                    {change.user && (
                      <Chip
                        icon={<PersonIcon />}
                        label={change.user.nameWithInitials || change.user.username}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                
                {change.description && (
                  <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                    {change.description}
                  </Typography>
                )}

                {change.changes && Object.keys(change.changes).length > 0 && (
                  <Accordion sx={{ width: "100%" }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">
                        View {Object.keys(change.changes).length} change(s)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ width: "100%" }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                        {Object.entries(change.changes).map(([field, changeData]) => (
                          <Box key={field} sx={{ p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                              {formatFieldName(field)}
                            </Typography>
                            {change.action === "UPDATE" && changeData.old !== undefined && (
                              <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
                                Old: {formatValue(changeData.old)}
                              </Typography>
                            )}
                            <Typography variant="body2" color="success.main">
                              {change.action === "CREATE" ? "Value: " : "New: "}
                              {formatValue(changeData.new !== undefined ? changeData.new : changeData)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PatientChangeHistory;


