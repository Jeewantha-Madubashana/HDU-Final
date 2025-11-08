import React, { useEffect } from "react";
import { Field } from "formik";
import {
  TextField,
  MenuItem,
  Box,
  FormHelperText,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { MuiTelInput } from "mui-tel-input";

/**
 * Reusable form field component supporting multiple input types
 * Handles text, number, date, select, file upload, and telephone inputs
 * @param {string} name - Field name
 * @param {string} label - Field label
 * @param {string} [type='text'] - Input type
 * @param {boolean} [multiline=false] - Whether field supports multiline
 * @param {number} [rows] - Number of rows for multiline fields
 * @param {boolean} [select=false] - Whether field is a select dropdown
 * @param {Array} [options=[]] - Options for select fields
 * @param {Object} touched - Formik touched object
 * @param {Object} errors - Formik errors object
 * @param {Function} handleChange - Formik change handler
 * @param {Function} handleBlur - Formik blur handler
 * @param {boolean} [required=false] - Whether field is required
 * @param {string} [accept] - File types to accept for file inputs
 * @param {boolean} [multiple] - Whether file input accepts multiple files
 * @param {Function} setFieldValue - Formik setFieldValue function
 * @param {Object} values - Formik values object
 * @param {string} [helperText] - Helper text to display
 * @param {boolean} [disabled=false] - Whether field is disabled
 */
const FormField = ({
  name,
  label,
  type = "text",
  multiline = false,
  rows,
  select = false,
  options = [],
  touched,
  errors,
  handleChange,
  handleBlur,
  required = false,
  accept,
  multiple,
  setFieldValue,
  values,
  helperText,
  disabled = false,
}) => {
  const calculateAge = React.useCallback(
    (dob) => {
      try {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age >= 0 && age <= 150) {
          setFieldValue("age", age);
        }
      } catch (error) {
        console.error("Error calculating age:", error);
      }
    },
    [setFieldValue]
  );

  useEffect(() => {
    if (name === "dateOfBirth" && values.dateOfBirth) {
      calculateAge(values.dateOfBirth);
    }
  }, [name, values.dateOfBirth, calculateAge]);

  const handleInputValidation = (e) => {
    if (name === "age" && type === "number") {
      if (e.target.value < 0 || e.target.value === "-") {
        setFieldValue(name, 0);
        return;
      }
    }

    handleChange(e);
  };

  const handleFieldChange = (e) => {
    if (type === "number") {
      handleInputValidation(e);
    } else {
      handleChange(e);
    }

    if (e.target.name === "dateOfBirth" && e.target.value) {
      calculateAge(e.target.value);
    }
  };

  if (type === "file") {
    const handleFileChange = (event) => {
      const selectedFiles = event.currentTarget.files;
      
      if (multiple) {
        const filesArray = Array.from(selectedFiles);
        setFieldValue(name, filesArray.length > 0 ? filesArray : null);
      } else {
        setFieldValue(name, selectedFiles.length > 0 ? selectedFiles[0] : null);
      }
    };

    const getFileNames = () => {
      if (!values || !values[name]) return "";
      
      if (multiple && Array.isArray(values[name])) {
        return values[name].map((file) => file.name).join(", ");
      } else if (values[name] && typeof values[name] === "object" && values[name].name) {
        return values[name].name;
      }
      return "";
    };

    const fileNames = getFileNames();
    const fileCount = values && values[name] 
      ? (Array.isArray(values[name]) ? values[name].length : 1) 
      : 0;

    return (
      <Box sx={{ width: "100%" }}>
        <input
          accept={accept}
          style={{ display: "none" }}
          id={`upload-${name}`}
          multiple={multiple}
          type="file"
          onChange={handleFileChange}
          key={`file-input-${name}`}
        />
        <label htmlFor={`upload-${name}`}>
          <Button
            component="span"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: "12px",
              py: 1.2,
              px: 2,
              textTransform: "none",
              width: "100%",
              justifyContent: "flex-start",
              color: "primary.main",
              borderColor: "rgba(0, 0, 0, 0.23)",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          >
            {label}
            {required && (
              <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                *
              </Box>
            )}
          </Button>
        </label>
        {fileCount > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <AttachFileIcon
                fontSize="small"
                sx={{ mr: 0.5, color: "primary.main" }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  fontWeight: "medium",
                  mr: 1,
                }}
              >
                {multiple && fileCount > 1 
                  ? "Files selected"
                  : "File selected"
                }
              </Typography>
              <Chip 
                label={fileCount}
                size="small"
                color="primary"
                sx={{ 
                  height: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              />
            </Box>
            {multiple && fileCount > 1 ? (
              <Box sx={{ ml: 2.5, maxHeight: "100px", overflowY: "auto" }}>
                {values[name] && Array.isArray(values[name]) && values[name].map((file, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      fontSize: "0.75rem",
                      lineHeight: 1.2,
                      mb: 0.2,
                    }}
                  >
                    • {file.name}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  ml: 2.5,
                  display: "block",
                  fontSize: "0.75rem",
                }}
              >
                • {fileNames}
              </Typography>
            )}
          </Box>
        )}
        {helperText && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              mt: 0.5,
              display: "block",
            }}
          >
            {helperText}
          </Typography>
        )}
        {touched[name] && errors[name] && (
          <FormHelperText
            error
            sx={{
              ml: 1.5,
              mt: 0.5,
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "error.main",
              display: "flex",
              alignItems: "center",
            }}
          >
            {errors[name]}
          </FormHelperText>
        )}
      </Box>
    );
  }

  if (type === "tel") {
    return (
      <Box sx={{ width: "100%" }}>
        <MuiTelInput
          value={values[name]}
          onChange={(value) => setFieldValue(name, value)}
          label={
            <>
              {label}
              {required && (
                <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                  *
                </Box>
              )}
            </>
          }
          defaultCountry="LK"
          fullWidth
          size="small"
          error={touched[name] && Boolean(errors[name])}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "background.paper",
              borderRadius: "12px",
              "&:hover fieldset": {
                borderColor: "primary.light",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                borderWidth: 2,
              },
              "&.Mui-error fieldset": {
                borderColor: "error.main",
                borderWidth: 2,
              },
            },
          }}
        />
        {touched[name] && errors[name] && (
          <FormHelperText
            error
            sx={{
              ml: 1.5,
              mt: 0.5,
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "error.main",
              display: "flex",
              alignItems: "center",
            }}
          >
            {errors[name]}
          </FormHelperText>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Field
        as={TextField}
        name={name}
        label={
          <>
            {label}
            {required && (
              <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                *
              </Box>
            )}
          </>
        }
        type={type}
        fullWidth
        variant="outlined"
        size="small"
        onChange={handleFieldChange}
        onBlur={handleBlur}
        error={touched[name] && Boolean(errors[name])}
        helperText={helperText || (touched[name] && errors[name])}
        disabled={disabled}
        multiline={multiline}
        rows={rows}
        select={select}
        InputLabelProps={
          type === "date" || type === "datetime-local" ? { shrink: true } : {}
        }
        inputProps={type === "number" && name === "age" ? { min: 0 } : {}}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "background.paper",
            borderRadius: "12px",
            "&:hover fieldset": {
              borderColor: "primary.light",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: 2,
            },
            "&.Mui-error fieldset": {
              borderColor: "error.main",
              borderWidth: 2,
            },
          },
        }}
      >
        {select &&
          options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
      </Field>
      {touched[name] && errors[name] && (
        <FormHelperText
          error
          sx={{
            ml: 1.5,
            mt: 0.5,
            fontSize: "0.75rem",
            fontWeight: "500",
            color: "error.main",
            display: "flex",
            alignItems: "center",
          }}
        >
          {errors[name]}
        </FormHelperText>
      )}
    </Box>
  );
};

export default FormField;
