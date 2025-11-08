import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { showToast } from "../features/ui/uiSlice";

export const useRegistrationForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const nurseGrades = [
    "Student Nurse (Trainee Nurse)",
    "Registered Nurse (RN)",
    "Grade II Nursing Officer (Staff Nurse)",
    "Grade I Nursing Officer (Senior Staff Nurse)",
    "Supra Grade Nursing Officer (Supervisory Nurse)",
    "Nursing Sister (Ward Sister / In-Charge Nurse)",
    "Matron / Chief Nursing Officer (CNO)",
    "Director of Nursing Services",
    "Public Health Nursing Officer (PHNO)",
    "Midwife / Nurse Midwife",
    "School Health Nurse",
    "Occupational Health Nurse",
    "ICU / Critical Care Nurse",
  ];

  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
    registrationNumber: Yup.string().required(
      "Registration Number is required"
    ),
    ward: Yup.string().required("Ward is required"),
    mobileNumber: Yup.string().required("Mobile number is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    sex: Yup.string().required("Sex is required"),
    role: Yup.string().required("Role is required"),
    nameWithInitials: Yup.string().when("role", {
      is: (role) =>
        ["House Officer", "Medical Officer", "Consultant"].includes(role),
      then: (schema) => schema.required("Name with initials is required"),
    }),
    speciality: Yup.string().when("role", {
      is: (role) =>
        ["House Officer", "Medical Officer", "Consultant"].includes(role),
      then: (schema) => schema.required("Speciality is required"),
    }),
    grade: Yup.string().when("role", {
      is: "Nurse",
      then: (schema) => schema.required("Grade is required"),
    }),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      nameWithInitials: "",
      registrationNumber: "",
      speciality: "",
      ward: "",
      mobileNumber: "",
      email: "",
      sex: "",
      grade: "",
      role: "Consultant",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await register(values);
        if (response?.requiresApproval || response?.status === "pending") {
          dispatch(
            showToast({ 
              message: response?.msg || "Registration successful. Your account is pending approval by Super Admin.",
              type: "info",
            })
          );
        } else {
          dispatch(
            showToast({ message: "Registration successful", type: "success" })
          );
        }
        navigate("/login");
      } catch (err) {
        console.error(err);
        const errorMessage = err.response?.data?.msg || err.response?.data?.message || "Registration failed. Please try again.";
        dispatch(
          showToast({
            message: errorMessage,
            type: "error",
          })
        );
      }
    },
  });

  return { formik, nurseGrades, loading };
};
