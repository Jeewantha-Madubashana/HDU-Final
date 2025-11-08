import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Hotel,
  Remove as RemoveIcon,
  Assignment as AssignmentIcon,
  Person,
  Phone,
  CalendarToday,
  LocationOn,
  Wc,
  Close as CloseIcon,
  Email,
  Emergency,
  MedicalServices,
  History,
  Medication,
  Bloodtype,
  PregnantWoman,
  Warning,
  ContactEmergency,
  Info,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import DischargeDialog from "./DischargeDialog";
import CriticalFactorsForm from "./CriticalFactorsForm";
import PatientDocumentsViewer from "./PatientDocumentsViewer";
import UpdateIncompletePatientDialog from "./UpdateIncompletePatientDialog";
import PatientDetailsDialog from "./PatientDetailsDialog";
import { fetchLatestVitalSigns } from "../api/vitalSignsApi";
import axios from "axios";
import { useSelector } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import { useDispatch } from "react-redux";

const StyledCard = styled(Card)(({ theme, occupied }) => ({
  minHeight: "300px",
  height: "auto",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  transition: "all 0.3s ease",
  border: occupied ? "2px solid #e74c3c" : "2px solid #27ae60",
  cursor: occupied ? "pointer" : "default",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

/**
 * Section wrapper component for patient detail sections
 * @param {string} title - Section title
 * @param {ReactNode} icon - Icon component
 * @param {ReactNode} children - Section content
 */
const DetailSection = ({ title, icon, children }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      {icon}
      <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

/**
 * Individual detail item component
 * @param {string} label - Field label
 * @param {string|number} value - Field value
 * @param {ReactNode} icon - Optional icon component
 */
const DetailItem = ({ label, value, icon }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    {icon && <Box sx={{ mr: 1, color: "primary.main" }}>{icon}</Box>}
    <Typography variant="body2" sx={{ fontWeight: "500", minWidth: "120px" }}>
      {label}:
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {value || "Not specified"}
    </Typography>
  </Box>
);

/**
 * Bed card component displaying bed status and patient information
 * Supports viewing patient details, recording vitals, and discharging patients
 * @param {Object} bed - Bed object with patient information
 * @param {Function} [assignBed] - Callback to assign a patient to this bed
 * @param {Function} [deassignBed] - Callback to discharge patient from this bed
 */
const BedCard = ({ bed, assignBed, deassignBed, onUrgentAssign }) => {
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [vitalsFormOpen, setVitalsFormOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [updateIncompleteDialogOpen, setUpdateIncompleteDialogOpen] = useState(false);
  const [latestVitals, setLatestVitals] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const handleDeassignClick = (bed) => {
    if (deassignBed) {
      setDischargeDialogOpen(true);
    }
  };

  const handleDischargeClose = () => {
    setDischargeDialogOpen(false);
  };

  const handleDischargeSuccess = () => {
    setDischargeDialogOpen(false);
    if (deassignBed) {
      deassignBed(bed);
    }
  };

  const handleRecordVitalsClick = () => {
    setVitalsFormOpen(true);
  };

  const handleVitalsFormClose = () => {
    setVitalsFormOpen(false);
  };

  const handleVitalsFormSave = () => {
    if (patient?.id) {
      fetchLatestVitals();
    }
  };

  const handleUpdateIncompleteClick = () => {
    setUpdateIncompleteDialogOpen(true);
  };

  const handleUpdateIncompleteClose = () => {
    setUpdateIncompleteDialogOpen(false);
  };

  const handleUpdateIncompleteSuccess = async () => {
    // Refresh bed data to get updated patient status
    if (onUrgentAssign) {
      await onUrgentAssign();
    }
    fetchLatestVitals();
  };

  const fetchLatestVitals = async () => {
    if (!patient?.id) return;
    
    setLoadingVitals(true);
    try {
      const vitals = await fetchLatestVitalSigns(patient.id);
      if (vitals && vitals.length > 0) {
        setLatestVitals(vitals[0]);
      } else {
        setLatestVitals(null);
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setLatestVitals(null);
    } finally {
      setLoadingVitals(false);
    }
  };

  const handleCardClick = () => {
    if (isOccupied && patient) {
      setDetailDialogOpen(true);
    }
  };

  const handlePatientDetailsUpdate = async () => {
    // Refresh bed data after patient details update
    if (onUrgentAssign) {
      await onUrgentAssign();
    }
    fetchLatestVitals();
  };

  const handleUrgentAssign = async () => {
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      const response = await axios.post(
        `${BASE_URL}/beds/assign`,
        {
          patientData: {
            bedId: bed.id,
            isUrgentAdmission: true,
            department: "HDU",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      dispatch(
        showToast({
          message: response.data.msg || "Urgent patient assigned successfully",
          type: "success",
        })
      );

      if (onUrgentAssign) {
        await onUrgentAssign();
      }
    } catch (error) {
      dispatch(
        showToast({
          message: error.response?.data?.msg || "Failed to assign urgent patient",
          type: "error",
        })
      );
      console.error("Error assigning urgent patient:", error);
    }
  };

  const isOccupied = bed.patientId !== null;
  const patient = bed.Patient;
  const isIncomplete = patient?.isIncomplete === true;

  return (
    <>
      <StyledCard occupied={isOccupied} onClick={handleCardClick}>
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pt: 1.5, pb: 1.5, px: 1.5 }}>
          {/* Bed Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, mt: 0 }}>
            <Typography variant="h6" component="div" color="primary">
              Bed {bed.bedNumber}
            </Typography>
            <Chip
              label={isOccupied ? "Occupied" : "Available"}
              color={isOccupied ? "error" : "success"}
              size="small"
            />
          </Box>

          {isOccupied && patient ? (
            <>
              {/* Patient Avatar and Basic Info */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 1.5 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {patient.fullName}
                    </Typography>
                    {isIncomplete && (
                      <Chip
                        label="Incomplete"
                        size="small"
                        color="warning"
                        sx={{ fontSize: "10px", height: "20px" }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ID: {patient.patientNumber}
                  </Typography>
                </Box>
              </Box>

              {/* Patient Details */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Wc sx={{ fontSize: "16px", color: "primary.main" }} />
                  <Typography variant="body2">
                    <strong>Gender:</strong> {patient.gender}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  width: "100%",
                  mt: 1
                }}
              >
                {/* View Details Button */}
                <Button
                  variant="contained"
                  size="medium"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    backgroundColor: "#3498db",
                    color: "white",
                    paddingX: 2.5,
                    paddingY: 1.2,
                    boxShadow: "none",
                    border: "none",
                    "&:hover": {
                      backgroundColor: "#2980b9",
                      boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                      transform: "none",
                    },
                    "&:active": {
                      backgroundColor: "#21618c",
                      transform: "none",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  View Full Details
                </Button>
                <Tooltip title="Discharge patient with medical documentation" placement="top">
                  {deassignBed && (
                    <Button
                      variant="contained"
                      size="medium"
                      aria-label="Discharge patient"
                      sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "6px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        paddingX: 2.5,
                        paddingY: 1.2,
                        boxShadow: "none",
                        border: "none",
                        "&:hover": {
                          backgroundColor: "#c0392b",
                          boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
                          transform: "none",
                        },
                        "&:active": {
                          backgroundColor: "#a93226",
                          transform: "none",
                        },
                        width: "100%",
                        transition: "all 0.2s ease",
                      }}
                      startIcon={<RemoveIcon sx={{ fontSize: "18px" }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeassignClick(bed);
                      }}
                    >
                      Discharge Patient
                    </Button>
                  )}
                </Tooltip>
                {isIncomplete && (
                  <Tooltip title="Complete patient information" placement="top">
                    <Button
                      variant="contained"
                      size="medium"
                      aria-label="Update incomplete patient"
                      sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "6px",
                        backgroundColor: "#f39c12",
                        color: "white",
                        paddingX: 2.5,
                        paddingY: 1.2,
                        boxShadow: "none",
                        border: "none",
                        "&:hover": {
                          backgroundColor: "#e67e22",
                          boxShadow: "0 2px 8px rgba(243, 156, 18, 0.3)",
                          transform: "none",
                        },
                        "&:active": {
                          backgroundColor: "#d35400",
                          transform: "none",
                        },
                        width: "100%",
                        transition: "all 0.2s ease",
                      }}
                      startIcon={<Info sx={{ fontSize: "18px" }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateIncompleteClick();
                      }}
                    >
                      Complete Patient Info
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Update patient vital signs and medical data" placement="top">
                  <Button
                    variant="contained"
                    size="medium"
                    aria-label="Update patient vitals"
                    sx={{
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      paddingX: 2.5,
                      paddingY: 1.2,
                      boxShadow: "none",
                      border: "none",
                      "&:hover": {
                        backgroundColor: "#229954",
                        boxShadow: "0 2px 8px rgba(39, 174, 96, 0.3)",
                        transform: "none",
                      },
                      "&:active": {
                        backgroundColor: "#1e8449",
                        transform: "none",
                      },
                      width: "100%",
                      animation: bed.criticalStatus
                        ? "pulse 1.5s infinite"
                        : "none",
                      "@keyframes pulse": {
                        "0%": {
                          backgroundColor: "#27ae60",
                        },
                        "50%": {
                          backgroundColor: "#e74c3c",
                        },
                        "100%": {
                          backgroundColor: "#27ae60",
                        },
                      },
                      transition: "all 0.2s ease",
                    }}
                    startIcon={<AssignmentIcon sx={{ fontSize: "18px" }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecordVitalsClick();
                    }}
                  >
                    Update Vitals
                  </Button>
                </Tooltip>
              </Box>
            </>
          ) : (
            <>
              {/* Available Bed Content */}
              <Box sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Hotel sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  Available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {assignBed ? "Click to assign a patient" : "Bed is available"}
                </Typography>
              </Box>

              {/* Assign Patient Buttons - Only show if assignBed function is provided */}
              {assignBed && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
                  <Tooltip title="Assign a new patient to this bed with full details" placement="top">
                    <Button
                      variant="contained"
                      size="medium"
                      aria-label="Assign patient to bed"
                      sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "6px",
                        backgroundColor: "#3498db",
                        color: "white",
                        paddingX: 2.5,
                        paddingY: 1.2,
                        boxShadow: "none",
                        border: "none",
                        "&:hover": {
                          backgroundColor: "#2980b9",
                          boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                          transform: "none",
                        },
                        "&:active": {
                          backgroundColor: "#21618c",
                          transform: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                      startIcon={<Hotel sx={{ fontSize: "18px" }} />}
                      onClick={() => assignBed(bed)}
                    >
                      Assign Patient
                    </Button>
                  </Tooltip>
                  <Tooltip title="Urgent admission - Assign patient immediately without data entry" placement="top">
                    <Button
                      variant="outlined"
                      size="medium"
                      aria-label="Urgent assign patient"
                      sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "6px",
                        borderColor: "#e74c3c",
                        color: "#e74c3c",
                        paddingX: 2.5,
                        paddingY: 1.2,
                        "&:hover": {
                          borderColor: "#c0392b",
                          backgroundColor: "rgba(231, 76, 60, 0.1)",
                          transform: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                      startIcon={<Emergency sx={{ fontSize: "18px" }} />}
                      onClick={handleUrgentAssign}
                    >
                      Urgent Admission
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </StyledCard>

      {/* Patient Details Dialog - Always available for viewing and editing */}
      {patient && (
        <PatientDetailsDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          patient={patient}
          bedNumber={bed.bedNumber}
          onUpdate={handlePatientDetailsUpdate}
        />
      )}

      {/* Discharge Dialog */}
      <DischargeDialog
        open={dischargeDialogOpen}
        onClose={handleDischargeClose}
        onDischarge={handleDischargeSuccess}
        bed={bed}
        patient={patient}
      />

      {/* Vitals Form Dialog */}
      {patient && (
        <CriticalFactorsForm
          open={vitalsFormOpen}
          onClose={handleVitalsFormClose}
          onSave={handleVitalsFormSave}
          patientId={patient.id}
          bedNumber={bed.bedNumber}
        />
      )}

      {/* Patient Documents Viewer */}
      {patient && (
        <PatientDocumentsViewer
          open={documentsDialogOpen}
          onClose={() => setDocumentsDialogOpen(false)}
          patientId={patient.id}
        />
      )}

      {patient && isIncomplete && (
        <UpdateIncompletePatientDialog
          open={updateIncompleteDialogOpen}
          onClose={handleUpdateIncompleteClose}
          patientId={patient.id}
          onUpdate={handleUpdateIncompleteSuccess}
        />
      )}
    </>
  );
};

export default BedCard;
