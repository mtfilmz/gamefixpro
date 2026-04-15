import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initInstallPrompt } from "./lib/pwa-utils";
import { requestNotificationPermission } from "./lib/notifications";

// Limpiar datos viejos de localStorage (migrados a la nube)
localStorage.removeItem("gamefixpro_repairs");

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

function setupProductionPwa() {
  let hasReloaded = false;
  let updateApp: ((reloadPage?: boolean) => Promise<void>) | undefined;

  updateApp = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateApp?.(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdates = () => {
        registration.update().catch((error) => {
          console.warn("No se pudo buscar actualización de la app", error);
        });
      };

      checkForUpdates();
      window.addEventListener("focus", checkForUpdates);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForUpdates();
        }
      });

      navigator.serviceWorker?.addEventListener("controllerchange", () => {
        if (hasReloaded) return;
        hasReloaded = true;
        window.location.reload();
      });
    },
    onRegisterError(error) {
      console.error("Error al registrar la PWA", error);
    },
  });

  initInstallPrompt();
  requestNotificationPermission();
}

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
} else {
  setupProductionPwa();
}

createRoot(document.getElementById("root")!).render(<App />);
