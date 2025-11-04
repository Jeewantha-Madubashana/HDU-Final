import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link as MuiLink,
  AlertTitle,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { setLoading } from "../../features/loaderSlice";
import { showToast } from "../../features/ui/uiSlice";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [approvalError, setApprovalError] = React.useState(null);

  const LoginSchema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    dispatch(setLoading(true));
    try {
      const result = await login(values);

      if (result.user && result.user.role) {
        const route =
          {
            Nurse: "/nurse-dashboard",
            "House Officer": "/house-officer-dashboard",
            "Medical Officer": "/medical-officer-dashboard",
            Consultant: "/consultant-dashboard",
            "Super Admin": "/super-admin-dashboard",
          }[result.user.role] || "/landing";

        navigate(route);
      } else {
        navigate("/landing");
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.msg || errorData.message || "Unable to log in. Please try again.";
      const isApprovalError = errorData.requiresApproval;
      const errorStatus = errorData.status;
      
      if (isApprovalError) {
        // Set approval error with details
        setApprovalError({
          title: errorMessage,
          detail: errorData.detail || errorMessage,
          status: errorStatus,
          userInfo: errorData.userInfo
        });
        setErrors({});
      } else {
        // Regular error
        setErrors({ general: errorMessage });
        setApprovalError(null);
      }
      
      console.error("Login error:", error);
      dispatch(
        showToast({
          message: errorMessage,
          type: isApprovalError ? "warning" : "error",
        })
      );
    }

    dispatch(setLoading(false));
    setSubmitting(false);
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: "16px",
          width: "100%",
          maxWidth: 400,
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", fontSize: "28px" }}
        >
          Welcome Back
        </Typography>

        <Typography
          variant="subtitle1"
          align="center"
          gutterBottom
          sx={{ fontSize: "16px", color: "text.secondary" }}
        >
          Sign in to your account to continue
        </Typography>

        <Formik
          initialValues={{ username: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
          }) => (
            <Form>
              {/* Approval Status Error */}
              {approvalError && (
                <Collapse in={!!approvalError}>
                  <Alert
                    severity={approvalError.status === "pending" ? "warning" : "error"}
                    icon={approvalError.status === "pending" ? <WarningIcon /> : <ErrorIcon />}
                    sx={{ mb: 2 }}
                    action={
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => setApprovalError(null)}
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    }
                  >
                    <AlertTitle sx={{ fontWeight: "bold", fontSize: "16px" }}>
                      {approvalError.title}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {approvalError.detail}
                    </Typography>
                    {approvalError.userInfo && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 0.5 }}>
                          Account Information:
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          Username: <strong>{approvalError.userInfo.username}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          Role: <strong>{approvalError.userInfo.role}</strong>
                        </Typography>
                        {approvalError.userInfo.registeredAt && (
                          <Typography variant="caption" sx={{ display: "block" }}>
                            Registered: <strong>{new Date(approvalError.userInfo.registeredAt).toLocaleDateString()}</strong>
                          </Typography>
                        )}
                      </Box>
                    )}
                    {approvalError.status === "pending" && (
                      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <InfoIcon fontSize="small" color="info" />
                        <Typography variant="caption" color="text.secondary">
                          You will receive access once the Super Admin approves your account.
                        </Typography>
                      </Box>
                    )}
                    {approvalError.status === "rejected" && (
                      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <ErrorIcon fontSize="small" color="error" />
                        <Typography variant="caption" color="text.secondary">
                          Please contact the system administrator for assistance.
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                </Collapse>
              )}

              {/* Regular Error */}
              {errors.general && !approvalError && (
                <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
                  {errors.general}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username"
                name="username"
                margin="normal"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                margin="normal"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
                type="submit"
                disabled={isSubmitting}
              >
                Login
              </Button>
            </Form>
          )}
        </Formik>

        <Typography align="center" sx={{ mt: 2, fontSize: "14px" }}>
          Not registered yet?{" "}
          <MuiLink component={Link} to="/register" fontSize="14px">
            Register here
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
