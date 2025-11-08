import React, { useEffect, useState } from "react";
import axios from "axios";
import apiClient from "../api/apiClient";
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
import UniversalPatientDialog from "../components/UniversalPatientDialog";
import CriticalAlertsSystem from "../components/CriticalAlertsSystem";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../features/loaderSlice";
import {
  setDialogOpen,
  setSelectedBed,
} from "../features/patients/patientSlice";
import { clearCredentials } from "../features/auth/authSlice";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const HouseOfficerDashboard = () => {
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
    dispatch(setAppBarTitle("House Officer Dashboard - Bed Management"));
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
      dispatch(setAppBarTitle(`House Officer Dashboard - Beds`));
    } catch (err) {
      setError(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAssignBed = (bedData) => {
    dispatch(setSelectedBed(bedData));
    dispatch(setDialogOpen(true));
  };

  const deAssignBed = async (bed) => {
    try {
      fetchBeds();
      dispatch(
        showToast({
          message: "Patient successfully discharged and bed released.",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showToast({
          message:
            "Failed to refresh bed status. Please try again.",
          type: "error",
        })
      );
      console.error(err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const dataToSubmit = {
        ...values,
        bedId: selectedBed?.id,
      };

      dispatch(setLoading(true));
      const response = await apiClient.post("/beds/assign", {
        patientData: dataToSubmit
      });

      dispatch(
        showToast({ message: "Bed assigned successfully.", type: "success" })
      );
      dispatch(setDialogOpen(false));
      fetchBeds();
      return response.data;
    } catch (error) {
      dispatch(showToast({ 
        message: error.response?.data?.msg || "Error assigning bed.", 
        type: "error" 
      }));
      console.error("[HouseOfficerDashboard] Error assigning bed:", error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
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
                  assignBed={handleAssignBed}
                  deassignBed={deAssignBed}
                />
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {selectedTab === 1 && (
        <AnalyticsDashboard />
      )}

      {dialogOpen && <UniversalPatientDialog handleSubmit={handleSubmit} />}

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

export default HouseOfficerDashboard;
