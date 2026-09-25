import React from "react";
import { RefreshCw, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAStatus: React.FC = () => {
  const [installPrompt, setInstallPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [updateRegistration, setUpdateRegistration] = React.useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setDismissed(false);
    };
    const captureUpdate = (event: Event) => {
      setUpdateRegistration((event as CustomEvent<ServiceWorkerRegistration>).detail);
      setDismissed(false);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("orbit_pwa_update_ready", captureUpdate);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstall);
      window.removeEventListener("orbit_pwa_update_ready", captureUpdate);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (dismissed || (!installPrompt && !updateRegistration)) return null;

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const update = () => {
    if (!updateRegistration?.waiting) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    });
    updateRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  const isUpdate = Boolean(updateRegistration);
  return <aside className="pwa-status" role="status" aria-live="polite">
    <div>{isUpdate ? <RefreshCw size={16} /> : <img src="/pwa-icon-192.png" alt="" aria-hidden="true" />}<span><b>{isUpdate ? "Anime Orbit update ready" : "Install Anime Orbit"}</b><small>{isUpdate ? "Reload once to use the newest version." : "Add it to your device."}</small></span></div>
    <button type="button" onClick={isUpdate ? update : () => void install()}>{isUpdate ? "Update" : "Install"}</button>
    <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss"><X size={15} /></button>
  </aside>;
};

export default PWAStatus;
