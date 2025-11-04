import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setDialogOpen } from "../../../features/patients/patientSlice";

const PatientDialog = ({ handleSubmit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  React.useEffect(() => {
    dispatch(setDialogOpen(true));
    
    // Only navigate to nurse-specific route if user is a Nurse
    if (user?.role === "Nurse") {
      navigate("/nurse-dashboard/patient-assignment");
    }
    // For other roles (Consultant, Medical Officer, House Officer), stay on current page
    // The dialog will be handled by the parent component
  }, [dispatch, navigate, user?.role]);

  // If not a nurse, don't render anything (parent component will handle the dialog)
  if (user?.role !== "Nurse") {
    return null;
  }

  return null;
};

export default PatientDialog;
