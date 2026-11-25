import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import { initInstallPrompt } from "./lib/pwa-utils";
import { requestNotificationPermission } from "./lib/notifications";

// Tema elegido en Configuración › Apariencia (se guarda en este equipo)
try {
  const tema = localStorage.getItem("gamefix-tema");
  if (tema && tema !== "original") document.documentElement.dataset.theme = tema;
} catch {
  // sin localStorage: se usa el tema original
}

// Limpiar datos viejos de localStorage (migrados a la nube) — protegido para Safari modo privado
try {
  localStorage.removeItem("gamefixpro_repairs");
} catch {
  // localStorage no disponible (Safari privado, cookies bloqueadas)
}

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") || window.location.hostname.includes("lovableproject.com");

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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
