import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeStep: 0,
  dialogOpen: false,
  selectedBed: null,
  formData: {
    patientId: "",
    fullName: "",
    nicPassport: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    maritalStatus: "",
    contactNumber: "",
    email: "",

    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    address: "",

    knownAllergies: "",
    medicalHistory: "",
    currentMedications: "",
    pregnancyStatus: "Not Applicable",
    bloodType: "",

    admissionDateTime: "",
    department: "",
    bedNumber: "",
    initialDiagnosis: "",
    consultantInCharge: "",

    medicalReports: null,
    idProof: null,
    consentForm: null,
  },
  fileObjects: {
    medicalReports: [],
    idProof: null,
    consentForm: null,
  },
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },
    setDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
      if (!action.payload) {
        state.activeStep = 0;
      }
    },
    setSelectedBed: (state, action) => {
      state.selectedBed = action.payload;
    },
    updateFormData: (state, action) => {
      const { medicalReports, idProof, consentForm, ...serializedData } =
        action.payload;

      state.formData = { ...state.formData, ...serializedData };

      if (medicalReports) {
        if (
          Array.isArray(medicalReports) &&
          medicalReports.length > 0 &&
          medicalReports[0] instanceof File
        ) {
          state.formData.medicalReports = medicalReports.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          }));
          state.fileObjects.medicalReports = medicalReports;
        } else {
          state.formData.medicalReports = medicalReports;
        }
      }

      if (idProof) {
        if (idProof instanceof File) {
          state.formData.idProof = {
            name: idProof.name,
            size: idProof.size,
            type: idProof.type,
            lastModified: idProof.lastModified,
          };
          state.fileObjects.idProof = idProof;
        } else {
          state.formData.idProof = idProof;
        }
      }

      if (consentForm) {
        if (consentForm instanceof File) {
          state.formData.consentForm = {
            name: consentForm.name,
            size: consentForm.size,
            type: consentForm.type,
            lastModified: consentForm.lastModified,
          };
          state.fileObjects.consentForm = consentForm;
        } else {
          state.formData.consentForm = consentForm;
        }
      }
    },
    resetForm: (state) => {
      state.formData = initialState.formData;
      state.fileObjects = initialState.fileObjects;
      state.activeStep = 0;
      state.dialogOpen = false;
      state.selectedBed = null;
    },
  },
});

export const {
  setActiveStep,
  setDialogOpen,
  setSelectedBed,
  updateFormData,
  resetForm,
} = patientSlice.actions;

export default patientSlice.reducer;
