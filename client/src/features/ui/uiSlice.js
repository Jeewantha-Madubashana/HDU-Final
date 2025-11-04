import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toastMessage: null,
  toastType: "info",
  appBarTitle: "HDU Surgical Unit", 
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showToast: (state, action) => {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type || "info";
    },
    clearToast: (state) => {
      state.toastMessage = null;
      state.toastType = "info";
    },
    setAppBarTitle: (state, action) => {
      state.appBarTitle = action.payload;
    },
  },
});

export const { showToast, clearToast, setAppBarTitle } = uiSlice.actions;
export default uiSlice.reducer;
