import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initInstallPrompt } from "./lib/pwa-utils";
import { requestNotificationPermission } from "./lib/notifications";

// PWA: Guard against iframe/preview contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
} else {
  // Init PWA install prompt & notifications in production
  initInstallPrompt();
  requestNotificationPermission();
}

createRoot(document.getElementById("root")!).render(<App />);
