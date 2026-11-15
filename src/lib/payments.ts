import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().finite().positive("El monto debe ser mayor que cero").max(999999999999.99).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.001, "Usa máximo dos decimales"),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, "Fecha inválida"),
  method: z.enum(["cash", "card", "transfer", "other"]),
});
export type PaymentDraft = z.infer<typeof paymentSchema>;
export interface SavedPayment extends PaymentDraft {
  repair_id: string;
  client_name: string;
  equipment: string;
  sync_status: "pending" | "synced";
  sync_error: string | null;
  remote_movement_id: string | null;
}
export function localPaymentDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}