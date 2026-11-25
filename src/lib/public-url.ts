/**
 * Returns the public base URL used to share repair tracking links with clients.
 *
 * - In production (published domain or custom domain), uses the current origin.
 * - In Lovable preview/sandbox, falls back to the published app URL so links
 *   shared with customers don't require a Lovable login.
 */
const PUBLISHED_URL = "https://gamefixpro.lovable.app";

export function getPublicBaseUrl(): string {
  if (typeof window === "undefined") return PUBLISHED_URL;

  const host = window.location.hostname;
  const esWeb = window.location.protocol === "https:" || window.location.protocol === "http:";
  // Programa de Windows y APK (Tauri: tauri.localhost), equipo local y vistas previas de Lovable:
  // esas direcciones no existen en el teléfono del cliente, así que se usa la dirección publicada.
  if (
    !esWeb ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host.includes("preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("sandbox")
  ) {
    return PUBLISHED_URL;
  }
  return window.location.origin;
}

/**
 * Enlace que se comparte con el cliente. Usa el código secreto de la orden, así nadie puede
 * ver otra orden cambiando el número. Si la orden todavía no tiene código, usa el número
 * (enlace de antes, que solo muestra el estado).
 */
export function getTrackUrl(repair: { id: string; trackingCode?: string } | string): string {
  const base = getPublicBaseUrl();
  if (typeof repair !== "string" && repair.trackingCode) {
    return `${base}/track/${encodeURIComponent(repair.trackingCode)}`;
  }
  const id = typeof repair === "string" ? repair : repair.id;
  // El número lleva "#", que en una dirección corta el enlace: por eso va codificado.
  return `${base}/track/${encodeURIComponent(id)}`;
}
