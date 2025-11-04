import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import HouseOfficerDashboard from "../pages/HouseOfficerDashboard";
import MedicalOfficerDashboard from "../pages/MedicalOfficerDashboard";
import NurseDashboard from "../pages/NurseDashboard";
import LandingPage from "../pages/LandingPage";
import ConsultantDashboard from "../pages/ConsultantDashboard";
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import MainLayout from "../layouts/MainLayout";
import PatientAssignmentContainer from "../pages/NurseDashboardPages/PatientAssignmentContainer";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ role, children }) => {
  const user = useSelector((state) => state.auth.user);
  if (!user || user.role !== role) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route
          path="/house-officer-dashboard"
          element={
            <ProtectedRoute role="House Officer">
              <HouseOfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-officer-dashboard"
          element={
            <ProtectedRoute role="Medical Officer">
              <MedicalOfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-dashboard"
          element={
            <ProtectedRoute role="Nurse">
              <NurseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-dashboard/patient-assignment"
          element={
            <ProtectedRoute role="Nurse">
              <PatientAssignmentContainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultant-dashboard"
          element={
            <ProtectedRoute role="Consultant">
              <ConsultantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin-dashboard"
          element={
            <ProtectedRoute role="Super Admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
