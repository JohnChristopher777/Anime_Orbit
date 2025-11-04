import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GlobalContextProvider } from "./context/global.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FavouritesProvider } from "./context/FavouritesContext.jsx";
import GlobalStyle from "./Components/Globalstyle";
import Typography from "./Components/Typography";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GlobalStyle />
    <Typography />
    <AuthProvider>
      <GlobalContextProvider>
        <FavouritesProvider>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            style={{ zIndex: 99999 }}
          />
        </FavouritesProvider>
      </GlobalContextProvider>
    </AuthProvider>
  </React.StrictMode>
);
