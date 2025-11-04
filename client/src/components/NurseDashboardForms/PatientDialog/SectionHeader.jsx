    import React from "react";
    import { Box, Typography } from "@mui/material";

    const SectionHeader = ({ icon, title }) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 3 }}>
        {icon}
        <Typography
        variant="h6"
        fontWeight="500"
        color="primary.main"
        sx={{ ml: 1 }}
        >
        {title}
        </Typography>
    </Box>
    );

    export default SectionHeader;
