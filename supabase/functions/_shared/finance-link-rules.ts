export type Currency = "USD" | "DOP";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function verifiedLink(value: unknown, currency: Currency): value is { binding_id: string; destination_user_id: string; currency: Currency } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.binding_id === "string" && uuid.test(v.binding_id) && typeof v.destination_user_id === "string" && uuid.test(v.destination_user_id) && v.currency === currency;
}
export function redeemRequest(code: string, authenticatedUserId: string, currency: Currency) {
  return { action: "redeem", code, source_user_id: authenticatedUserId, currency };
}