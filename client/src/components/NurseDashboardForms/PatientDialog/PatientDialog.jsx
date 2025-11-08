import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setDialogOpen } from "../../../features/patients/patientSlice";

/**
 * Patient Dialog component for Nurse role
 * Navigates to patient assignment page for nurses
 * Other roles are handled by parent component
 * @param {Function} handleSubmit - Submit handler function
 */
const PatientDialog = ({ handleSubmit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  React.useEffect(() => {
    dispatch(setDialogOpen(true));
    
    if (user?.role === "Nurse") {
      navigate("/nurse-dashboard/patient-assignment");
    }
  }, [dispatch, navigate, user?.role]);

  if (user?.role !== "Nurse") {
    return null;
  }

  return null;
};

export default PatientDialog;
