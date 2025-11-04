import React, { useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  IconButton,
  Box,
  Avatar,
  CircularProgress,
  Link as MuiLink,
  Backdrop,
} from "@mui/material";
import { MuiTelInput } from "mui-tel-input";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../features/loaderSlice";
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useRegistrationForm } from "../../hooks/useRegistrationForm";
import { Link } from "react-router-dom";


const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    minHeight: "56px",
  },
  "& .MuiInputBase-root": {
    borderRadius: "12px",
    minHeight: "56px",
  },
};

const Register = () => {
  const { formik, nurseGrades } = useRegistrationForm();
  const dispatch = useDispatch();
  const globalLoading = useSelector((state) => state.loader.isLoading);
  const { values, handleChange, errors, touched, setFieldValue } = formik;

  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(setLoading(true));
    try {
      await formik.handleSubmit(event);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <Backdrop open={globalLoading} sx={{ zIndex: 1201, color: "#fff" }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
          overflowY: "auto",
          px: 2,
          py: 6,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 1000,
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            mx: "auto",
          }}
        >
          <Box textAlign="center" mb={3}>
            <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 1 }}>
              <PersonAdd />
            </Avatar>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: "bold", fontSize: "28px" }}
            >
              Register Account
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              gutterBottom
              sx={{ fontSize: "16px", color: "text.secondary" }}
            >
              Please fill in the form to create an account
            </Typography>
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Grid container spacing={2} direction="column">
                  <Grid item>
                    <FormControl fullWidth sx={roundedField} size="small">
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={values.role}
                        onChange={handleChange}
                        label="Role"
                      >
                        <MenuItem value="Consultant">Consultant</MenuItem>
                        <MenuItem value="Medical Officer">
                          Medical Officer
                        </MenuItem>
                        <MenuItem value="House Officer">House Officer</MenuItem>
                        <MenuItem value="Nurse">Nurse</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item>
                    <TextField
                      label="Username"
                      name="username"
                      value={values.username}
                      onChange={handleChange}
                      error={touched.username && Boolean(errors.username)}
                      helperText={touched.username && errors.username}
                      fullWidth
                      sx={roundedField}
                      size="small"
                    />
                  </Grid>

                  <Grid item>
                    <TextField
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={values.password}
                      onChange={handleChange}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      fullWidth
                      sx={roundedField}
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={togglePassword}>
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item>
                    <TextField
                      label="Registration Number"
                      name="registrationNumber"
                      value={values.registrationNumber}
                      onChange={handleChange}
                      error={
                        touched.registrationNumber &&
                        Boolean(errors.registrationNumber)
                      }
                      helperText={
                        touched.registrationNumber && errors.registrationNumber
                      }
                      fullWidth
                      sx={roundedField}
                      size="small"
                    />
                  </Grid>

                  <Grid item>
                    <FormControl fullWidth sx={roundedField} size="small">
                      <InputLabel>Ward</InputLabel>
                      <Select
                        name="ward"
                        value={values.ward}
                        onChange={handleChange}
                        label="Ward"
                      >
                        <MenuItem value="Side A">Side A</MenuItem>
                        <MenuItem value="Side B">Side B</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Grid container spacing={2} direction="column">
                  <Grid item>
                    <MuiTelInput
                      value={values.mobileNumber}
                      onChange={(val) => setFieldValue("mobileNumber", val)}
                      label="Mobile Number"
                      defaultCountry="LK"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      }}
                      TextFieldProps={{
                        sx: roundedField,
                        size: "small",
                        error:
                          touched.mobileNumber && Boolean(errors.mobileNumber),
                        helperText: touched.mobileNumber && errors.mobileNumber,
                      }}
                    />
                  </Grid>

                  <Grid item>
                    <TextField
                      label="Email"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      fullWidth
                      sx={roundedField}
                      size="small"
                    />
                  </Grid>

                  <Grid item>
                    <FormControl fullWidth sx={roundedField} size="small">
                      <InputLabel>Sex</InputLabel>
                      <Select
                        name="sex"
                        value={values.sex}
                        onChange={handleChange}
                        label="Sex"
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {["Consultant", "House Officer", "Medical Officer"].includes(
                    values.role
                  ) && (
                    <>
                      <Grid item>
                        <TextField
                          label="Name with Initials"
                          name="nameWithInitials"
                          value={values.nameWithInitials}
                          onChange={handleChange}
                          error={
                            touched.nameWithInitials &&
                            Boolean(errors.nameWithInitials)
                          }
                          helperText={
                            touched.nameWithInitials && errors.nameWithInitials
                          }
                          fullWidth
                          sx={roundedField}
                          size="small"
                        />
                      </Grid>

                      <Grid item>
                        <TextField
                          label="Speciality"
                          name="speciality"
                          value={values.speciality}
                          onChange={handleChange}
                          error={
                            touched.speciality && Boolean(errors.speciality)
                          }
                          helperText={touched.speciality && errors.speciality}
                          fullWidth
                          sx={roundedField}
                          size="small"
                        />
                      </Grid>
                    </>
                  )}

                  {values.role === "Nurse" && (
                    <Grid item>
                      <FormControl fullWidth sx={roundedField} size="small">
                        <InputLabel>Grade</InputLabel>
                        <Select
                          name="grade"
                          value={values.grade}
                          onChange={handleChange}
                          label="Grade"
                        >
                          {nurseGrades.map((grade) => (
                            <MenuItem key={grade} value={grade}>
                              {grade}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
            <Box mt={4}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
                disabled={globalLoading}
              >
                Register
              </Button>
            </Box>
            <Box mt={2} textAlign="center">
              <Typography align="center" sx={{ fontSize: "14px" }}>
                Already have an account?{" "}
                <MuiLink
                  component={Link}
                  to="/login"
                  fontSize="14px"
                  underline="hover"
                >
                  Login here
                </MuiLink>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default Register;
