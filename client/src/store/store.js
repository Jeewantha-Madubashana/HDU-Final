import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import loaderReducer from "../features/loaderSlice";
import uiReducer from "../features/ui/uiSlice";
import alertsReducer from "../features/alerts/alertsSlice";
import patientReducer from "../features/patients/patientSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loader: loaderReducer,
    ui: uiReducer,
    alerts: alertsReducer,
    patient: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["patient.fileObjects"],
      },
    }),
});
