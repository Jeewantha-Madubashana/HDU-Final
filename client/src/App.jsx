import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppRoutes from "./routes/routes";
import GlobalSpinner from "./components/GlobalSpinner";
import GlobalToastHandler from "./components/GlobalToastHandler";
import GlobalAlertBanner from "./components/GlobalAlertBanner";
import "material-react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <GlobalSpinner />
        <GlobalAlertBanner />
        <AppRoutes />
        <GlobalToastHandler />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
