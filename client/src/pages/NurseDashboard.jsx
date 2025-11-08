import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Card,
  Tabs,
  Tab,
} from "@mui/material";
import BedCard from "../components/BedCard";
import { showToast, setAppBarTitle } from "../features/ui/uiSlice";

import CriticalAlertsSystem from "../components/CriticalAlertsSystem";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../features/loaderSlice";
import {
  setDialogOpen,
  setSelectedBed,
} from "../features/patients/patientSlice";
import { clearCredentials } from "../features/auth/authSlice";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const NurseDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [error, setError] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const selectedBed = useSelector((state) => state.patient.selectedBed);
  const dialogOpen = useSelector((state) => state.patient.dialogOpen);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(setAppBarTitle("Nurse Dashboard - Bed Management"));
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBeds();
  }, [dispatch, token, navigate]);

  const fetchBeds = async () => {
    const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
    dispatch(setLoading(true));
    try {
      const response = await axios.get(`${BASE_URL}/beds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBeds(response.data);
      dispatch(setAppBarTitle(`Nurse Dashboard - Beds`));
    } catch (err) {
      setError(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUrgentAssign = async () => {
    await fetchBeds();
  };

  const handleViewPatientDetails = (bed) => {
  };

  const closeLogoutDialog = () => {
    setLogoutDialogOpen(false);
  };

  const confirmLogout = () => {
    dispatch(clearCredentials());
    navigate("/");
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (error) {
    return (
      <Typography variant="h6" color="error" align="center">
        Error: {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}


      {/* Critical Alerts System */}
      <Box sx={{ mb: 3 }}>
        <CriticalAlertsSystem />
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Bed Management" />
          <Tab label="Analytics Dashboard" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Bed Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click on occupied beds to view patient details and update vital signs. 
            As a Nurse, you can view patient details and update vitals, but cannot assign or discharge patients.
          </Typography>
          
          <Grid
            container
            spacing={3}
            justifyContent="center"
            sx={{ width: "100%", margin: "0 auto" }}
          >
            {beds.slice(0, 10).map((bed) => (
              <Grid key={bed.id} item xs={12} sm={6} md={2.4}>
                <BedCard
                  bed={bed}
                  assignBed={null}
                  deassignBed={null}
                  onUrgentAssign={handleUrgentAssign}
                />
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {selectedTab === 1 && (
        <AnalyticsDashboard />
      )}



      <Dialog
        open={logoutDialogOpen}
        onClose={closeLogoutDialog}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLogoutDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={confirmLogout} color="primary" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NurseDashboard;
