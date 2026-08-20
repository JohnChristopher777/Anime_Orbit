import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GlobalContextProvider } from "./context/global";
import { AuthProvider } from "./context/AuthContext";
import { FavouritesProvider } from "./context/FavouritesContext";
import { WatchlistProvider } from "./context/WatchlistContext";

import GlobalStyle from "./Components/Globalstyle";
import Typography from "./Components/Typography";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <GlobalStyle />
      <Typography />
      <AuthProvider>
        <GlobalContextProvider>
          <FavouritesProvider>
            <WatchlistProvider>
              <App />
            </WatchlistProvider>
          </FavouritesProvider>
        </GlobalContextProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}
