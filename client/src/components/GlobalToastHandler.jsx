import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ToastContainer, toast } from "material-react-toastify";
import { clearToast } from "../features/ui/uiSlice";

const GlobalToastHandler = () => {
  const dispatch = useDispatch();
  const { toastMessage, toastType } = useSelector((state) => state.ui);

  useEffect(() => {
    if (toastMessage) {
      toast[toastType](toastMessage);
      dispatch(clearToast());
    }
  }, [toastMessage, toastType, dispatch]);

  return <ToastContainer />;
};

export default GlobalToastHandler;
