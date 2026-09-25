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

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      const notifyUpdate = () => window.dispatchEvent(new CustomEvent("orbit_pwa_update_ready", { detail: registration }));
      if (registration.waiting) notifyUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) notifyUpdate();
        });
      });
    }).catch(() => {});
  });
}

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
