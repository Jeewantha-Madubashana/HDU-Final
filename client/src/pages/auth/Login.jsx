import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link as MuiLink,
} from "@mui/material";
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
          }[result.user.role] || "/landing";

        navigate(route);
      } else {
        navigate("/landing");
      }
    } catch (error) {
      setErrors({ general: "Invalid username or password" });
      console.error("Login error:", error);
      dispatch(
        showToast({
          message: "Unable to log in. Please try again.",
          type: "error",
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
              {errors.general && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
