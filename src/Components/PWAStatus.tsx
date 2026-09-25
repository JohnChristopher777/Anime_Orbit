import React from "react";
import { RefreshCw, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_PROMPT_SEEN_KEY = "anime_orbit_install_prompt_seen_v1";

const isInstalledApp = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const hasSeenInstallPrompt = () => {
  try {
    return localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const rememberInstallPrompt = () => {
  try {
    localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable in a locked-down browser. Avoid repeatedly
    // prompting during this mounted session through the state below.
  }
};

const PWAStatus: React.FC = () => {
  const [installPrompt, setInstallPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [updateRegistration, setUpdateRegistration] = React.useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const captureInstall = (event: Event) => {
      if (isInstalledApp() || hasSeenInstallPrompt()) return;
      event.preventDefault();
      rememberInstallPrompt();
      setInstallPrompt(event as InstallPromptEvent);
      setDismissed(false);
    };
    const captureUpdate = (event: Event) => {
      setUpdateRegistration((event as CustomEvent<ServiceWorkerRegistration>).detail);
      setDismissed(false);
    };
    const installed = () => {
      rememberInstallPrompt();
      setInstallPrompt(null);
    };
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
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // The browser may withdraw install eligibility between the event and
      // the user's click. The control simply disappears in that case.
    } finally {
      setInstallPrompt(null);
    }
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
