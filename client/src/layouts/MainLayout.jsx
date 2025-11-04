import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GlobalAppBar from "../components/GlobalAppBar";
import GlobalAlertBanner from "../components/GlobalAlertBanner";
import GlobalSpinner from "../components/GlobalSpinner";
import { Box, Container } from "@mui/material";
import { setAppBarTitle } from "../features/ui/uiSlice";

const MainLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const routeTitles = {
      "/": "HDU Surgical Unit",
      "/landing": "Welcome to HDU Surgical Unit",
      "/nurse-dashboard": "Nurse Dashboard - Bed Management",
      "/house-officer-dashboard": "House Officer Dashboard",
      "/medical-officer-dashboard": "Medical Officer Dashboard",
      "/consultant-dashboard": "Consultant Dashboard",
    };

    const currentTitle = routeTitles[location.pathname] || "HDU Surgical Unit";
    dispatch(setAppBarTitle(currentTitle));
  }, [location.pathname, dispatch]);

  return (
    <Box>
      <GlobalAppBar role={user?.role} />
      <GlobalAlertBanner />
      <Container component="main">
        <Outlet />
      </Container>
      <GlobalSpinner />
    </Box>
  );
};

export default MainLayout;
