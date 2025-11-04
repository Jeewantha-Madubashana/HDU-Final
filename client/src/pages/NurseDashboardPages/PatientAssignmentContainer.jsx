import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { setDialogOpen } from "../../features/patients/patientSlice";
import { setLoading } from "../../features/loaderSlice";
import { showToast } from "../../features/ui/uiSlice";
import PatientAssignmentPage from "./PatientAssignmentPage";

const PatientAssignmentContainer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dialogOpen, selectedBed } = useSelector((state) => state.patient);

  useEffect(() => {
    if (!dialogOpen) {
      navigate("/nurse-dashboard");
    }
  }, [dialogOpen, navigate]);

  const handleClose = () => {
    dispatch(setDialogOpen(false));
  };

  const handleSubmit = async (values) => {
    try {
      const dataToSubmit = {
        ...values,
        bedId: selectedBed?.id,
      };

      const BASE_URL = `${import.meta.env.VITE_API_URL}/api/beds`;
      dispatch(setLoading(true));
      const response = await fetch(`${BASE_URL}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientData: dataToSubmit }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign bed.");
      }

      const data = await response.json();
      dispatch(
        showToast({ message: "Bed assigned successfully.", type: "success" })
      );
      dispatch(setDialogOpen(false));
      return data;
    } catch (error) {
      dispatch(showToast({ message: "Error assigning bed.", type: "error" }));
      console.error("[PatientAssignmentContainer] Error assigning bed:", error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!dialogOpen) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        minHeight: "100vh",
        bgcolor: "#f0f2f5",
        pt: 3,
        pb: 5,
        zIndex: 1200,
      }}
    >
      <PatientAssignmentPage
        handleSubmit={handleSubmit}
        onClose={handleClose}
      />
    </Box>
  );
};

export default PatientAssignmentContainer;
