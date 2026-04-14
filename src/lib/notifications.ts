export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones");
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const defaultOptions: NotificationOptions = {
    icon: "/pwa-icon-192.png",
    badge: "/pwa-icon-192.png",
    vibrate: [200, 100, 200],
    tag: "gamefixpro",
    ...options,
  };

  // Use SW notification if available, else fallback
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions);
    });
  } else {
    new Notification(title, defaultOptions);
  }
}

export function notifyStatusChange(repairId: string, cliente: string, newStatus: string) {
  sendLocalNotification(`🎮 ${repairId} - Estado Actualizado`, {
    body: `La reparación de ${cliente} cambió a: ${newStatus}`,
    tag: `status-${repairId}`,
  });
}

export function notifyNewRepair(repairId: string, cliente: string) {
  sendLocalNotification(`🆕 Nueva Reparación ${repairId}`, {
    body: `Equipo de ${cliente} registrado correctamente`,
    tag: `new-${repairId}`,
  });
}
