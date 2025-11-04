import React from "react";
import { Box, Alert, Typography } from "@mui/material";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import FormSection from "./FormSection";
import { documentUploadFields } from "../config/formFields";

const DocumentUpload = ({ formProps, uploadStatus }) => {
  return (
    <Box>
      <FormSection
        icon={<UploadFileIcon color="primary" fontSize="large" />}
        title="Document Upload"
        fields={documentUploadFields}
        formProps={formProps}
      />

      {uploadStatus === "uploading" && (
        <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
          Uploading patient documents...
        </Alert>
      )}

      {uploadStatus === "success" && (
        <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
          Documents uploaded successfully!
        </Alert>
      )}
    </Box>
  );
};

export default DocumentUpload;
