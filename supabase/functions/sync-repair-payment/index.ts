import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { paymentPayload } from "../_shared/payment-contract.ts";
import { validatedSessionUserId } from "../_shared/session-rules.ts";

const schema = z.object({ payment_id: z.string().uuid() }).strict();
const receiptSchema = z.object({ status: z.literal("confirmed"), payment_id: z.string().uuid(), binding_id: z.string().uuid(), movement_id: z.string().uuid() });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Método no permitido" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    const authClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authorization ?? "" } }, auth: { persistSession: false, autoRefreshToken: false } });
    const userId = await validatedSessionUserId(authorization, token => authClient.auth.getClaims(token));
    if (!userId) return reply({ error: "Sesión inválida" }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: "Identificador de pago inválido" }, 400);
    const { data: payment, error } = await db.from("repair_payments").select("*").eq("id", parsed.data.payment_id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!payment) return reply({ error: "Pago no encontrado" }, 404);
    if (payment.sync_status === "synced") return reply({ status: "synced", movement_id: payment.remote_movement_id });
    const pending = async (message: string) => {
      const { error: updateError } = await db.from("repair_payments").update({ sync_error: message }).eq("id", payment.id).eq("sync_status", "pending");
      if (updateError) throw updateError;
      return reply({ status: "pending", error: message });
    };
    const { data: link, error: linkError } = await db.from("finance_account_links").select("binding_id,destination_user_id").eq("user_id", userId).eq("enabled", true).maybeSingle();
    if (linkError) throw linkError;
    const receiverUrl = Deno.env.get("BALANS_PAYMENT_RECEIVER_URL");
    const sharedSecret = Deno.env.get("BALANS_PAYMENT_SHARED_SECRET");
    if (!link || !receiverUrl || !sharedSecret) return await pending("Falta preparar la recepción y vincular tu cuenta de Balans Board");
    const url = new URL(receiverUrl);
    if (url.protocol !== "https:") return await pending("La conexión privada necesita una dirección HTTPS válida");
    const payload = paymentPayload(payment, link.binding_id);
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", "X-Integration-Secret": sharedSecret, "Idempotency-Key": payment.id }, body: JSON.stringify(payload) });
    } catch { return await pending("No se confirmó el envío; puedes reintentarlo sin duplicar el pago"); }
    if (!response.ok) return await pending(response.status === 400 && payment.client_phone != null
      ? "Balans Board rechazó el pago con teléfono; actualiza su receptor para admitir client_phone. El pago sigue guardado y pendiente, sin duplicarlo."
      : `Balans Board rechazó el envío (${response.status}); el pago sigue guardado`);
    const receipt = receiptSchema.safeParse(await response.json().catch(() => null));
    if (!receipt.success || receipt.data.payment_id !== payment.id || receipt.data.binding_id !== link.binding_id) return await pending("Balans Board no confirmó este pago; envío pendiente");
    const { error: savedError } = await db.from("repair_payments").update({ sync_status: "synced", remote_movement_id: receipt.data.movement_id, synced_at: new Date().toISOString(), sync_error: null }).eq("id", payment.id).eq("user_id", userId);
    if (savedError) throw savedError;
    return reply({ status: "synced", movement_id: receipt.data.movement_id });
  } catch { return reply({ error: "No se pudo confirmar el envío; el pago permanece guardado" }, 500); }
});