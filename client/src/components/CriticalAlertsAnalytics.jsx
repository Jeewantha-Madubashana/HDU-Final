import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";
import { getAlertAnalytics } from "../api/vitalSignsApi";

// Utility function to format alert types for display
const formatAlertType = (alertType) => {
  if (!alertType || alertType === 'None') return 'None';
  
  const formatMap = {
    'critical_patient': 'Critical Patient',
    'high_vital_signs': 'High Vital Signs',
    'critical_vital_signs': 'Critical Vital Signs',
    'low_vital_signs': 'Low Vital Signs',
    'high_occupancy': 'High Bed Occupancy',
    'low_availability': 'Low Bed Availability',
    'system_alert': 'System Alert',
    'medication_due': 'Medication Due',
    'equipment_failure': 'Equipment Failure',
    'patient_fall': 'Patient Fall Risk',
    'infection_control': 'Infection Control'
  };
  
  return formatMap[alertType] || alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const CriticalAlertsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7');
  const [analyticsData, setAnalyticsData] = useState({
    totalAlerts: 0,
    alertsByType: {},
    alertsByUser: {},
    alertsByDay: {},
    alertsByHour: {},
    responseTimeAnalysis: {
      averageResponseTime: 0,
      quickResponses: 0,
      slowResponses: 0,
    },
    recentAlerts: [],
    summary: {
      mostCommonAlertType: 'None',
      mostActiveUser: 'None',
      averageAlertsPerDay: 0,
      peakHour: '0'
    }
  });

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    }
  }, [timeRange, token]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await getAlertAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching alert analytics:", error);
      dispatch(
        showToast({
          message: "Failed to fetch alert analytics",
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
      </CardContent>
    </Card>
  );

  const SimpleBarChart = ({ data, title, height = 200, labels, color = "#2196F3" }) => {
    const dataValues = Array.isArray(data) ? data : Object.values(data);
    const dataLabels = labels || (Array.isArray(data) ? data.map((_, i) => i + 1) : Object.keys(data));
    const maxValue = Math.max(...dataValues, 1);

    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height, display: "flex", alignItems: "end", gap: 1, mt: 2 }}>
            {dataValues.map((value, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  backgroundColor: color,
                  height: `${(value / maxValue) * 100}%`,
                  minHeight: value > 0 ? "20px" : "5px",
                  borderRadius: "4px 4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: value === 0 ? 0.3 : 1,
                }}
              >
                {value > 0 && (
                  <Typography variant="caption" sx={{ color: "white", fontWeight: "bold" }}>
                    {value}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1} sx={{ overflowX: 'auto' }}>
            {dataLabels.map((label, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ 
                textAlign: 'center', 
                flex: 1, 
                minWidth: '40px',
                fontSize: '0.7rem'
              }}>
                {typeof label === 'string' && label.length > 8 ? label.substring(0, 8) + '...' : label}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const PieChart = ({ data, title }) => {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#607D8B'];
    
    if (total === 0) {
      return (
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Typography color="text.secondary">No data available</Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

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
                  background: `conic-gradient(${entries.map(([key, value], index) => {
                    const startAngle = entries.slice(0, index).reduce((sum, [, v]) => sum + (v / total) * 360, 0);
                    const endAngle = startAngle + (value / total) * 360;
                    return `${colors[index % colors.length]} ${startAngle}deg ${endAngle}deg`;
                  }).join(', ')})`,
                  transform: 'rotate(-90deg)',
                }}
              />
            </Box>
            
            {/* Legend */}
            <Box sx={{ flex: 1, ml: 2 }}>
              {entries.map(([key, value], index) => (
                <Box
                  key={key}
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
                        backgroundColor: colors[index % colors.length],
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {key.length > 15 ? key.substring(0, 15) + '...' : key}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {value} ({Math.round((value / total) * 100)}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const RecentAlertsTable = () => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Alert Acknowledgments
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Alert Type</TableCell>
                <TableCell>Patient ID</TableCell>
                <TableCell>Bed</TableCell>
                <TableCell>Acknowledged By</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.recentAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No recent alerts</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                analyticsData.recentAlerts.map((alert, index) => (
                  <TableRow key={alert.id || index}>
                    <TableCell>
                      <Chip 
                        label={formatAlertType(alert.alertType) || 'Unknown'} 
                        color={
                          alert.alertType?.includes('critical') ? 'error' : 
                          alert.alertType?.includes('high') || alert.alertType?.includes('low') ? 'warning' : 'default'
                        }
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{alert.patientId || 'N/A'}</TableCell>
                    <TableCell>{alert.bedNumber || 'N/A'}</TableCell>
                    <TableCell>{alert.acknowledgedBy || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip label={alert.acknowledgedByRole || 'Unknown'} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>
                      {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const HourlyActivityChart = () => {
    const hourlyData = Object.entries(analyticsData.alertsByHour).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));

    return (
      <SimpleBarChart
        data={hourlyData.map(d => d.count)}
        title="Alert Activity by Hour"
        labels={hourlyData.map(d => d.hour)}
        color="#FF9800"
        height={250}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Critical Alerts Analytics
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1">Last 24 Hours</MenuItem>
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAnalyticsData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Alerts Acknowledged"
            value={analyticsData.totalAlerts}
            subtitle={`Last ${timeRange} days`}
            icon={<WarningIcon sx={{ color: "error.main" }} />}
            color="#F44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Most Active User"
            value={analyticsData.summary.mostActiveUser.split(' ')[0] || 'None'}
            subtitle={analyticsData.summary.mostActiveUser || 'No activity'}
            icon={<PersonIcon sx={{ color: "primary.main" }} />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Most Common Alert"
            value={formatAlertType(analyticsData.summary.mostCommonAlertType)}
            subtitle="Alert type"
            icon={<AssignmentIcon sx={{ color: "warning.main" }} />}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Peak Activity Hour"
            value={`${analyticsData.summary.peakHour}:00`}
            subtitle="Most alerts acknowledged"
            icon={<AccessTimeIcon sx={{ color: "success.main" }} />}
            color="#4CAF50"
          />
        </Grid>
      </Grid>

      {/* Charts and Visualizations */}
      <Grid container spacing={3}>
        {/* Alerts by Type */}
        <Grid item xs={12} md={6}>
          <PieChart
            data={Object.fromEntries(
              Object.entries(analyticsData.alertsByType).map(([key, value]) => [
                formatAlertType(key), value
              ])
            )}
            title="Alerts by Type"
          />
        </Grid>

        {/* Alerts by User */}
        <Grid item xs={12} md={6}>
          <PieChart
            data={analyticsData.alertsByUser}
            title="Acknowledgments by Staff"
          />
        </Grid>

        {/* Daily Activity */}
        <Grid item xs={12} md={6}>
          <SimpleBarChart
            data={analyticsData.alertsByDay}
            title="Daily Alert Activity"
            labels={Object.keys(analyticsData.alertsByDay).map(date => 
              new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            )}
            color="#4CAF50"
          />
        </Grid>

        {/* Hourly Activity */}
        <Grid item xs={12} md={6}>
          <HourlyActivityChart />
        </Grid>

        {/* Recent Alerts Table */}
        <Grid item xs={12}>
          <RecentAlertsTable />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CriticalAlertsAnalytics; 