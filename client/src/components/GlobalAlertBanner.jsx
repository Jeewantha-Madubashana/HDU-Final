import { useSelector, useDispatch } from "react-redux";
import { Alert, Collapse, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { clearAlert } from "../features/alerts/alertsSlice";
import { useEffect, useState } from "react";

const GlobalAlertBanner = () => {
  const dispatch = useDispatch();
  const { alertMessage, alertType } = useSelector((state) => state.alerts);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (alertMessage) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        dispatch(clearAlert());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage, dispatch]);

  if (!alertMessage) return null;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: '40px',
        left: 0, 
        right: 0, 
        zIndex: 9999,
      }}
    >
      <Collapse in={show}>
        <Box sx={{ px: 2, py: 1 }}>
          <Alert
            severity={alertType}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setShow(false);
                  dispatch(clearAlert());
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{
              borderRadius: 2,
              fontSize: "15px",
              boxShadow: 1,
              textAlign: 'center', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', 
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center' 
              }
            }}
          >
            {alertMessage}
          </Alert>
        </Box>
      </Collapse>
    </Box>
  );
};

export default GlobalAlertBanner;