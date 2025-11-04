import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  alertMessage: null,
  alertType: "info", 
};

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setAlert: (state, action) => {
      state.alertMessage = action.payload.message;
      state.alertType = action.payload.type || "info";
    },
    clearAlert: (state) => {
      state.alertMessage = null;
      state.alertType = "info";
    },
  },
});

export const { setAlert, clearAlert } = alertsSlice.actions;
export default alertsSlice.reducer;
