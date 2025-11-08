import * as Yup from "yup";

export const personalInfoValidationSchema = Yup.object({
  fullName: Yup.string()
    .required("Full Name is required")
    .min(3, "Name must be at least 3 characters"),
  nicPassport: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(5, "Invalid NIC/Passport number"),
  dateOfBirth: Yup.date()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .max(new Date(), "Birth date cannot be in the future"),
  age: Yup.number()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .positive("Age must be positive")
    .max(150, "Invalid age")
    .integer("Age must be a whole number"),
  gender: Yup.string()
    .required("Gender is required")
    .oneOf(["Male", "Female", "Other"], "Invalid gender selection"),
  maritalStatus: Yup.string()
    .nullable()
    .oneOf(
      ["Single", "Married", "Divorced", "Widowed", "Unknown", null],
      "Invalid marital status"
    ),
  contactNumber: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number format"),
  email: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .email("Invalid email format"),
});

export const emergencyContactValidationSchema = Yup.object({
  emergencyContactName: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(3, "Name must be at least 3 characters"),
  emergencyContactRelationship: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .oneOf(
      ["Spouse", "Parent", "Child", "Friend", "Other", null],
      "Invalid relationship"
    ),
  emergencyContactNumber: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number format"),
  address: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(5, "Address is too short"),
});

export const medicalDetailsValidationSchema = Yup.object({
  knownAllergies: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  medicalHistory: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  currentMedications: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  pregnancyStatus: Yup.string()
    .nullable()
    .oneOf(
      ["Not Applicable", "Pregnant", "Not Pregnant", null],
      "Invalid pregnancy status"
    ),
  bloodType: Yup.string()
    .nullable()
    .oneOf(
      ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown", null],
      "Invalid blood type"
    ),
  initialDiagnosis: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(5, "Please provide a more detailed diagnosis"),
});

export const admissionDetailsValidationSchema = Yup.object({
  admissionDateTime: Yup.date()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      "Admission date cannot be more than 24 hours in the past"
    )
    .max(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      "Admission date cannot be more than 24 hours in the future"
    ),
  department: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .oneOf(["ICU", "Surgery", "Medical", "HDU", null], "Invalid department selection"),
  consultantInCharge: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
});

export const documentUploadValidationSchema = Yup.object({
  medicalReports: Yup.mixed().nullable(),
  idProof: Yup.mixed().nullable(),
  consentForm: Yup.mixed().nullable(),
  other: Yup.mixed().nullable(),
});

export const validationSchema = Yup.object().shape({
  ...personalInfoValidationSchema.fields,
  ...emergencyContactValidationSchema.fields,
  ...medicalDetailsValidationSchema.fields,
  ...admissionDetailsValidationSchema.fields,
  ...documentUploadValidationSchema.fields,
});

export default validationSchema;
