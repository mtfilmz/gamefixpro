import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PaymentDraft, paymentSchema } from "./payments";
import { invokeAuthenticatedFunction } from "./authenticated-function";

export async function syncPayment(id: string) {
  const { data, error } = await invokeAuthenticatedFunction("sync-repair-payment", { payment_id: id });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const text = await error.context.text();
      try { throw new Error(JSON.parse(text).error || "Pago guardado; envío pendiente"); }
      catch (parsed) { if (parsed instanceof SyntaxError) throw new Error("Pago guardado; envío pendiente"); throw parsed; }
    }
    throw new Error("Pago guardado; envío pendiente. Revisa tu conexión.");
  }
  if (data?.status !== "synced") throw new Error(data?.error || "Pago guardado; conexión con Balans Board pendiente");
  return data;
}
export async function recordPayment(repairId: string, draft: PaymentDraft) {
  const payment = paymentSchema.parse(draft);
  const { error } = await supabase.rpc("record_repair_payment", {
    p_id: payment.id, p_repair_id: repairId, p_amount: payment.amount, p_paid_on: payment.paid_on, p_method: payment.method,
  });
  if (error) throw new Error(error.message);
}