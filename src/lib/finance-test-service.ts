import { supabase } from "@/integrations/supabase/client";
import { localPaymentDate } from "./payments";
import { syncPayment } from "./payment-service";
import { z } from "zod";

const receipt = z.object({ status: z.literal("synced"), movement_id: z.string().uuid() });
export async function sendFinanceTest() {
  const { data, error } = await supabase.rpc("record_finance_test_payment", { p_paid_on: localPaymentDate(), p_confirm: true });
  if (error) throw new Error(error.message);
  const payment = z.object({ id: z.string().uuid() }).safeParse(data);
  if (!payment.success) throw new Error("No se confirmó el registro del pago de prueba");
  const result = receipt.safeParse(await syncPayment(payment.data.id));
  if (!result.success) throw new Error("Balans Board no confirmó un recibo válido; recepción pendiente");
  return result.data.movement_id;
}