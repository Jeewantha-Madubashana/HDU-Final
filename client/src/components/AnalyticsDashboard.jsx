import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Bed as BedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import axios from "axios";
import { showToast } from "../features/ui/uiSlice";
import { useDispatch } from "react-redux";
import { getAverageLengthOfStay } from "../api/patientApi";
import { clearCredentials } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import CriticalAlertsAnalytics from "./CriticalAlertsAnalytics";

// Mock data for charts (in a real app, this would come from the API)
const mockVitalSignsData = {
  heartRate: [72, 75, 68, 80, 85, 78, 82, 76, 79, 81, 77, 74],
  bloodPressure: [120, 118, 125, 122, 128, 115, 130, 125, 122, 127, 120, 118],
  temperature: [36.8, 37.1, 36.9, 37.2, 37.0, 36.7, 37.3, 36.8, 37.1, 36.9, 37.0, 36.8],
  spO2: [98, 97, 99, 96, 98, 97, 98, 99, 97, 98, 96, 97],
};

const mockPatientDemographics = {
  ageGroups: [
    { label: "30-40", value: 3, color: "#2196F3" },
    { label: "40-50", value: 2, color: "#4CAF50" },
    { label: "50-60", value: 2, color: "#FF9800" },
  ],
  gender: [
    { label: "Male", value: 4, color: "#2196F3" },
    { label: "Female", value: 3, color: "#E91E63" },
  ],
};

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    bedOccupancy: 0,
    totalPatients: 0,
    criticalPatients: 0,
    averageLengthOfStay: 0,
    totalDischargedPatients: 0,
    minStay: 0,
    maxStay: 0,
    currentPatients: 0,
    currentAvgStay: 0,
    vitalSignsTrends: mockVitalSignsData,
    demographics: mockPatientDemographics,
    bedAvailability: [
      { label: "Available", value: 0, color: "#4CAF50" },
      { label: "Occupied", value: 0, color: "#F44336" },
    ],
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
      
      // Check if token exists
      if (!token) {
        console.error("No authentication token found");
        dispatch(
          showToast({
            message: "Authentication required. Please login again.",
            type: "error",
          })
        );
        return;
      }

      // Fetch beds data
      let bedsResponse;
      try {
        bedsResponse = await axios.get(`${BASE_URL}/beds`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ fetchAnalyticsData ~ bedsResponse:", bedsResponse);
      } catch (error) {
        console.error("Error fetching beds data:", error);
        dispatch(
          showToast({
            message: "Failed to fetch beds data",
            type: "error",
          })
        );
        return;
      }

      // Fetch critical patients with error handling
      let criticalPatients = 0;
      try {
        const criticalResponse = await axios.get(`${BASE_URL}/critical-factors/critical-patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ fetchAnalyticsData ~ criticalResponse:", criticalResponse);
        criticalPatients = criticalResponse.data?.length || 0;
      } catch (error) {
        console.error("Error fetching critical patients:", error);
        if (error.response?.status === 401) {
          dispatch(clearCredentials());
          dispatch(
            showToast({
              message: "Session expired. Please login again.",
              type: "error",
            })
          );
          navigate("/login");
          return;
        } else {
          dispatch(
            showToast({
              message: "Failed to fetch critical patients data",
              type: "warning",
            })
          );
        }
        // Continue with default value (0)
      }

      // Fetch ALOS data
      let alosResponse = {};
      try {
        alosResponse = await getAverageLengthOfStay();
      } catch (error) {
        console.error("Error fetching ALOS data:", error);
        dispatch(
          showToast({
            message: "Failed to fetch length of stay data",
            type: "warning",
          })
        );
        // Continue with default values
      }

      // Calculate analytics
      const beds = bedsResponse.data;
      const occupiedBeds = beds.filter(bed => bed.patientId !== null).length;
      const totalBeds = beds.length;
      const availableBeds = totalBeds - occupiedBeds;
      const bedOccupancy = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      setAnalyticsData({
        bedOccupancy: Math.round(bedOccupancy),
        totalPatients: occupiedBeds,
        criticalPatients: criticalPatients,
        averageLengthOfStay: parseFloat(alosResponse.avgLengthOfStay || 0),
        totalDischargedPatients: alosResponse.totalDischargedPatients || 0,
        minStay: alosResponse.minStay || 0,
        maxStay: alosResponse.maxStay || 0,
        currentPatients: alosResponse.currentPatients || 0,
        currentAvgStay: parseFloat(alosResponse.currentAvgStay || 0),
        vitalSignsTrends: mockVitalSignsData,
        demographics: mockPatientDemographics,
        bedAvailability: [
          { label: "Available", value: availableBeds, color: "#4CAF50" },
          { label: "Occupied", value: occupiedBeds, color: "#F44336" },
        ],
      });

    } catch (error) {
      console.error("Error fetching analytics data:", error);
      dispatch(
        showToast({
          message: "Failed to fetch analytics data",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: "50%",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend > 0 ? (
              <TrendingUpIcon sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ color: "error.main", fontSize: 16, mr: 0.5 }} />
            )}
            <Typography
              variant="caption"
              color={trend > 0 ? "success.main" : "error.main"}
            >
              {Math.abs(trend)}% from last week
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const SimpleBarChart = ({ data, title, height = 200, labels }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height, display: "flex", alignItems: "end", gap: 1, mt: 2 }}>
          {data.map((value, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                backgroundColor: "primary.main",
                height: `${(value / Math.max(...data)) * 100}%`,
                minHeight: "20px",
                borderRadius: "4px 4px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "white", fontWeight: "bold" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box display="flex" justifyContent="space-between" mt={1}>
          {labels ? labels.map((label, i) => (
            <Typography key={i} variant="caption" color="text.secondary" sx={{ textAlign: 'center', flex: 1 }}>
              {label}
            </Typography>
          )) : Array.from({ length: data.length }, (_, i) => (
            <Typography key={i} variant="caption" color="text.secondary">
              {i + 1}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const PieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Pie Chart Visualization */}
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `conic-gradient(${data.map((item, index) => {
                    const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                    const endAngle = startAngle + (item.value / total) * 360;
                    return `${item.color} ${startAngle}deg ${endAngle}deg`;
                  }).join(', ')}`,
                  transform: 'rotate(-90deg)',
                }}
              />
            </Box>
            
            {/* Legend */}
            <Box sx={{ flex: 1, ml: 2 }}>
              {data.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2">{item.label}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const VitalSignsTable = () => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Vital Signs Summary
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vital Sign</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell align="right">Max</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Heart Rate</TableCell>
                <TableCell align="right">78 bpm</TableCell>
                <TableCell align="right">68 bpm</TableCell>
                <TableCell align="right">85 bpm</TableCell>
                <TableCell align="right">
                  <Chip label="Normal" color="success" size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Blood Pressure</TableCell>
                <TableCell align="right">122/80</TableCell>
                <TableCell align="right">115/75</TableCell>
                <TableCell align="right">130/85</TableCell>
                <TableCell align="right">
                  <Chip label="Normal" color="success" size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Temperature</TableCell>
                <TableCell align="right">37.0°C</TableCell>
                <TableCell align="right">36.7°C</TableCell>
                <TableCell align="right">37.3°C</TableCell>
                <TableCell align="right">
                  <Chip label="Normal" color="success" size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>SpO2</TableCell>
                <TableCell align="right">97%</TableCell>
                <TableCell align="right">96%</TableCell>
                <TableCell align="right">99%</TableCell>
                <TableCell align="right">
                  <Chip label="Normal" color="success" size="small" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with refresh button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchAnalyticsData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bed Occupancy"
            value={`${analyticsData.bedOccupancy}%`}
            subtitle={`${analyticsData.totalPatients} patients`}
            icon={<BedIcon sx={{ color: "primary.main" }} />}
            color="#2196F3"
            trend={2.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={analyticsData.totalPatients}
            subtitle="Currently admitted"
            icon={<PersonIcon sx={{ color: "success.main" }} />}
            color="#4CAF50"
            trend={-1.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Patients"
            value={analyticsData.criticalPatients}
            subtitle="Requiring attention"
            icon={<WarningIcon sx={{ color: "error.main" }} />}
            color="#F44336"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Length of Stay"
            value={`${analyticsData.averageLengthOfStay} days`}
            subtitle={`${analyticsData.totalDischargedPatients} patients discharged`}
            icon={<TimelineIcon sx={{ color: "warning.main" }} />}
            color="#FF9800"
            trend={-0.8}
          />
        </Grid>
      </Grid>

      {/* Charts and Visualizations */}
      <Grid container spacing={3}>
        {/* Bed Availability */}
        <Grid item xs={12} md={6}>
          <PieChart
            data={analyticsData.bedAvailability}
            title="Bed Availability"
          />
        </Grid>

        {/* Patient Demographics - Age */}
        <Grid item xs={12} md={6}>
          <PieChart
            data={analyticsData.demographics.ageGroups}
            title="Patient Age Distribution"
          />
        </Grid>

        {/* Critical Alerts by Type */}
        <Grid item xs={12} md={6}>
          <SimpleBarChart
            data={[5, 3, 2, 1]} // Heart Rate, BP, SpO2, Temperature
            title="Critical Alerts by Type"
            labels={["Heart Rate", "Blood Pressure", "SpO2", "Temperature"]}
          />
        </Grid>

        {/* Patient Demographics - Gender */}
        <Grid item xs={12} md={6}>
          <PieChart
            data={analyticsData.demographics.gender}
            title="Patient Gender Distribution"
          />
        </Grid>

        {/* Vital Signs Summary Table */}
        <Grid item xs={12}>
          <VitalSignsTable />
        </Grid>






        {/* Critical Alerts Analytics Section */}
        <Grid item xs={12}>
          <Box sx={{ mt: 4 }}>
            <CriticalAlertsAnalytics />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 