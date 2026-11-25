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

export function getTrackUrl(repairId: string): string {
  // IMPORTANT: encode the ID — repair IDs include "#" which is a URL fragment delimiter
  return `${getPublicBaseUrl()}/track/${encodeURIComponent(repairId)}`;
}
