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
  // Lovable preview/sandbox hosts → use published URL instead
  if (host.includes("preview--") || host.includes("lovableproject.com") || host.includes("sandbox")) {
    return PUBLISHED_URL;
  }
  return window.location.origin;
}

export function getTrackUrl(repairId: string): string {
  // IMPORTANT: encode the ID — repair IDs include "#" which is a URL fragment delimiter
  return `${getPublicBaseUrl()}/track/${encodeURIComponent(repairId)}`;
}
