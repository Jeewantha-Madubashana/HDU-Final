import React from "react";
import { useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";

const GlobalSpinner = () => {
  const isLoading = useSelector((state) => state.loader.isLoading);

  if (!isLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.5)", 
        zIndex: 1000,
      }}
    >
      <CircularProgress />
    </div>
  );
};

export default GlobalSpinner;
