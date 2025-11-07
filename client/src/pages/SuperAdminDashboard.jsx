import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  PersonAdd,
  People,
  HourglassEmpty,
  Settings,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showToast } from "../features/ui/uiSlice";
import * as authApi from "../api/authApi";

const SuperAdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approveDialog, setApproveDialog] = useState({ open: false, user: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, user: null });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingUsers();
    fetchAllUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await authApi.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      dispatch(
        showToast({
          message: "Failed to fetch pending users",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const users = await authApi.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      dispatch(
        showToast({
          message: "Failed to fetch all users",
          type: "error",
        })
      );
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await authApi.approveUser(approveDialog.user.id);
      dispatch(
        showToast({
          message: `User ${approveDialog.user.username} approved successfully`,
          type: "success",
        })
      );
      setApproveDialog({ open: false, user: null });
      fetchPendingUsers();
      fetchAllUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      dispatch(
        showToast({
          message: "Failed to approve user",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await authApi.rejectUser(rejectDialog.user.id);
      dispatch(
        showToast({
          message: `User ${rejectDialog.user.username} rejected`,
          type: "warning",
        })
      );
      setRejectDialog({ open: false, user: null });
      fetchPendingUsers();
      fetchAllUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
      dispatch(
        showToast({
          message: "Failed to reject user",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: "warning", label: "Pending", icon: <HourglassEmpty /> },
      approved: { color: "success", label: "Approved", icon: <CheckCircle /> },
      rejected: { color: "error", label: "Rejected", icon: <Cancel /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Super Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Settings />}
          onClick={() => navigate("/vital-signs-management")}
        >
          Manage Vital Signs
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <HourglassEmpty color="warning" />
                <Typography variant="h6">Pending Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {pendingUsers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Typography variant="h6">Approved Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {allUsers.filter((u) => u.status === "approved").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <People color="primary" />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {allUsers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<HourglassEmpty />}
            iconPosition="start"
            label={`Pending Approvals (${pendingUsers.length})`}
          />
          <Tab
            icon={<People />}
            iconPosition="start"
            label="All Users"
          />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : pendingUsers.length === 0 ? (
              <Alert severity="info">No pending user approvals</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Registration Number</TableCell>
                      <TableCell>Ward</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Registered At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.registrationNumber}</TableCell>
                        <TableCell>{user.ward || "N/A"}</TableCell>
                        <TableCell>
                          {user.nameWithInitials || "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            startIcon={<CheckCircle />}
                            variant="contained"
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() =>
                              setApproveDialog({ open: true, user })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            startIcon={<Cancel />}
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() =>
                              setRejectDialog({ open: true, user })
                            }
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registration Number</TableCell>
                    <TableCell>Ward</TableCell>
                    <TableCell>Registered At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>{user.registrationNumber}</TableCell>
                      <TableCell>{user.ward || "N/A"}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, user: null })}
      >
        <DialogTitle>Approve User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve user{" "}
            <strong>{approveDialog.user?.username}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setApproveDialog({ open: false, user: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={loading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, user: null })}
      >
        <DialogTitle>Reject User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reject user{" "}
            <strong>{rejectDialog.user?.username}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The user will not be able to login.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRejectDialog({ open: false, user: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboard;

