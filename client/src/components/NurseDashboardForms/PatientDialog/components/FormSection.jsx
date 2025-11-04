import React from "react";
import { Paper, Grid, Divider } from "@mui/material";
import SectionHeader from "../SectionHeader";
import FormField from "../FormField";

const FormSection = ({ icon, title, fields, formProps }) => {
  const { errors, touched, handleChange, handleBlur, setFieldValue, values } =
    formProps;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <SectionHeader icon={icon} title={title} />
      <Divider sx={{ my: 2.5 }} />

      <Grid container spacing={3}>
        {fields.map((field) => (
          <Grid item {...field.gridProps} key={field.name}>
            <FormField
              {...field}
              touched={touched}
              errors={errors}
              handleChange={handleChange}
              handleBlur={handleBlur}
              required={field.required}
              select={field.type === "select"}
              setFieldValue={setFieldValue}
              values={values}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default FormSection;
