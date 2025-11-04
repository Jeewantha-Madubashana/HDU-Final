import { Button, Typography, Container, Box, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";

const HospitalHeroSection = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#e7ebf4",
        color: "#333",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={3} mb={4}>
              <img
                src="/1.jpeg"
                alt="Hospital Logo"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#2c3e50",
                  lineHeight: 1.5,
                }}
              >
                HDU Surgical Unit
                <br />
                District General Hospital
                <br />
                Kegalle
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                fontSize: "1.2rem",
                color: "#555",
                opacity: 0.9,
                marginBottom: "24px",
              }}
            >
              Streamlined healthcare management for better patient care and
              hospital efficiency.
            </Typography>

            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
            >
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  borderRadius: "8px",
                  backgroundColor: "#007bff",
                  textTransform: "none",
                  height: "50px",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#0056b3",
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="center">
              <img
                src="/hero.jpg"
                alt="hero"
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HospitalHeroSection;
