import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Wc as GenderIcon,
} from "@mui/icons-material";
import BedCard from "./BedCard";
import { useSelector } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import { useDispatch } from "react-redux";
import axios from "axios";

const BedManagementDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [filteredBeds, setFilteredBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBed, setSelectedBed] = useState(null);
  const [bedDetailsOpen, setBedDetailsOpen] = useState(false);
  const [editBedOpen, setEditBedOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bedNumber: "",
    patientId: null,
  });

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    fetchBeds();
  }, []);

  useEffect(() => {
    filterBeds();
  }, [beds, searchTerm, statusFilter]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      const response = await axios.get(`${BASE_URL}/beds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBeds(response.data);
    } catch (error) {
      dispatch(
        showToast({
          message: "Failed to fetch beds",
          type: "error",
        })
      );
      console.error("Error fetching beds:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBeds = () => {
    let filtered = beds;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((bed) => {
        if (statusFilter === "occupied") return bed.patientId !== null;
        if (statusFilter === "available") return bed.patientId === null;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((bed) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          bed.bedNumber.toLowerCase().includes(searchLower) ||
          (bed.Patient?.fullName &&
            bed.Patient.fullName.toLowerCase().includes(searchLower)) ||
          (bed.Patient?.patientNumber &&
            bed.Patient.patientNumber.toLowerCase().includes(searchLower))
        );
      });
    }

    setFilteredBeds(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleViewBedDetails = (bed) => {
    setSelectedBed(bed);
    setBedDetailsOpen(true);
  };

  const handleEditBed = (bed) => {
    setSelectedBed(bed);
    setEditForm({
      bedNumber: bed.bedNumber,
      patientId: bed.patientId,
    });
    setEditBedOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      await axios.put(
        `${BASE_URL}/beds/${selectedBed.id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch(
        showToast({
          message: "Bed updated successfully",
          type: "success",
        })
      );

      setEditBedOpen(false);
      fetchBeds();
    } catch (error) {
      dispatch(
        showToast({
          message: "Failed to update bed",
          type: "error",
        })
      );
      console.error("Error updating bed:", error);
    }
  };

  const handleAssignBed = (bed) => {
    // This will be handled by the parent component
    console.log("Assign bed:", bed);
  };

  const handleDeassignBed = async (bed) => {
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      await axios.delete(`${BASE_URL}/beds/${bed.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(
        showToast({
          message: "Patient removed from bed successfully",
          type: "success",
        })
      );

      fetchBeds();
    } catch (error) {
      dispatch(
        showToast({
          message: "Failed to remove patient from bed",
          type: "error",
        })
      );
      console.error("Error deassigning bed:", error);
    }
  };

  const getStatusStats = () => {
    const total = beds.length;
    const occupied = beds.filter((bed) => bed.patientId !== null).length;
    const available = total - occupied;
    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;

    return { total, occupied, available, occupancyRate };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const stats = getStatusStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bed Management Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage patient bed assignments and monitor occupancy
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Beds
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Occupied
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.occupied}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.available}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Occupancy Rate
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.occupancyRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search beds or patients"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Beds</MenuItem>
                  <MenuItem value="occupied">Occupied</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchBeds}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredBeds.length} of {beds.length} beds
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Beds Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredBeds.map((bed) => {
            return (
            <Grid key={bed.id} item xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  position: "relative",
                  backgroundColor: bed.patientId ? "#ffebee" : "#e8f5e8",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Bed Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      Bed {bed.bedNumber}
                    </Typography>
                    <Chip
                      label={bed.patientId ? "Occupied" : "Available"}
                      color={bed.patientId ? "error" : "success"}
                      size="small"
                    />
                  </Box>

                  {/* Patient Details */}
                  {bed.Patient ? (
                    <Box>
                      {/* Patient Basic Info */}
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {bed.Patient.fullName || "Unknown Patient"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {bed.Patient.patientNumber || "N/A"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Patient Details */}
                      <Box mb={2}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <GenderIcon sx={{ mr: 1, fontSize: "small", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {bed.Patient.gender || "N/A"}
                          </Typography>
                        </Box>
                        
                        {bed.Patient.contactNumber && (
                          <Box display="flex" alignItems="center" mb={1}>
                            <PhoneIcon sx={{ mr: 1, fontSize: "small", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                              {bed.Patient.contactNumber}
                            </Typography>
                          </Box>
                        )}

                        {bed.Patient.dateOfBirth && (
                          <Box display="flex" alignItems="center" mb={1}>
                            <CalendarIcon sx={{ mr: 1, fontSize: "small", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                              DOB: {formatDate(bed.Patient.dateOfBirth)}
                            </Typography>
                          </Box>
                        )}

                        {bed.Patient.address && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            📍 {bed.Patient.address}
                          </Typography>
                        )}
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Action Buttons */}
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewBedDetails(bed)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Bed">
                          <IconButton
                            size="small"
                            onClick={() => handleEditBed(bed)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Patient">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeassignBed(bed)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ) : bed.patientId ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Patient ID: {bed.patientId} (Details not loaded)
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => fetchBeds()}
                      >
                        Refresh Data
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" height="100%">
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        marginBottom={2}
                      >
                        No patient assigned
                      </Typography>
                      
                      <Box mt="auto">
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            textTransform: "none",
                            fontSize: "14px",
                            borderRadius: "30px",
                            backgroundColor: "success.main",
                            color: "white",
                            paddingX: 3,
                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.15)",
                            "&:hover": {
                              backgroundColor: "success.dark",
                              transform: "scale(1.05)",
                            },
                          }}
                          startIcon={<AddIcon />}
                          onClick={() => handleAssignBed(bed)}
                        >
                          Assign Patient
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        </Grid>
      )}

      {/* Bed Details Dialog */}
      <Dialog
        open={bedDetailsOpen}
        onClose={() => setBedDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bed Details - {selectedBed?.bedNumber}</DialogTitle>
        <DialogContent>
          {selectedBed && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Bed Information
              </Typography>
              <Typography><strong>Bed Number:</strong> {selectedBed.bedNumber}</Typography>
              <Typography><strong>Status:</strong> {selectedBed.patientId ? "Occupied" : "Available"}</Typography>
              
              {selectedBed.Patient && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Patient Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Name:</strong> {selectedBed.Patient.fullName}</Typography>
                      <Typography><strong>Patient ID:</strong> {selectedBed.Patient.patientNumber}</Typography>
                      <Typography><strong>Gender:</strong> {selectedBed.Patient.gender}</Typography>
                      <Typography><strong>Contact:</strong> {selectedBed.Patient.contactNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Date of Birth:</strong> {formatDate(selectedBed.Patient.dateOfBirth)}</Typography>
                      <Typography><strong>Address:</strong> {selectedBed.Patient.address}</Typography>
                      <Typography><strong>Admission Date:</strong> {formatDate(selectedBed.Patient.createdAt)}</Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBedDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Bed Dialog */}
      <Dialog
        open={editBedOpen}
        onClose={() => setEditBedOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Bed - {selectedBed?.bedNumber}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Bed Number"
              value={editForm.bedNumber}
              onChange={(e) => setEditForm({ ...editForm, bedNumber: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Patient ID (leave empty to unassign)"
              type="number"
              value={editForm.patientId || ""}
              onChange={(e) => setEditForm({ ...editForm, patientId: e.target.value || null })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBedOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BedManagementDashboard; 