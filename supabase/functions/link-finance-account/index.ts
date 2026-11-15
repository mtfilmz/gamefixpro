import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { verifiedLink, redeemRequest } from "../_shared/finance-link-rules.ts";
import { validatedSessionUserId } from "../_shared/session-rules.ts";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }).strict(),
  z.object({ action: z.literal("link"), code: z.string().regex(/^[0-9a-f]{64}$/), currency: z.enum(["USD", "DOP"]) }).strict(),
]);
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
    const input = schema.safeParse(await req.json().catch(() => null));
    if (!input.success) return reply({ error: "Código o moneda inválidos" }, 400);
    const { data: existing, error: readError } = await db.from("finance_account_links").select("binding_id,enabled").eq("user_id", userId).maybeSingle();
    if (readError) throw readError;
    const linkUrl = Deno.env.get("BALANS_FINANCE_LINK_URL");
    const secret = Deno.env.get("BALANS_PAYMENT_SHARED_SECRET");
    const configured = Boolean(linkUrl && secret && Deno.env.get("BALANS_PAYMENT_RECEIVER_URL"));
    if (input.data.action === "status") return reply({ connected: Boolean(existing?.enabled), configured });
    if (existing) return reply({ error: "Esta cuenta ya tiene un vínculo registrado; no se reemplazó" }, 409);
    if (!configured || !linkUrl || !secret) return reply({ error: "Falta guardar la misma clave privada en ambas aplicaciones" }, 503);
    const url = new URL(linkUrl);
    if (url.protocol !== "https:") return reply({ error: "Dirección privada inválida" }, 503);
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", "X-Integration-Secret": secret }, body: JSON.stringify(redeemRequest(input.data.code, userId, input.data.currency)) });
    } catch { return reply({ error: "No se confirmó el vínculo. Revisa Balans Board antes de generar otro código" }, 502); }
    if (!response.ok) {
      const body = await response.text();
      console.error(`Finance linking failed [${response.status}]: ${body}`);
      const errors: Record<number, string> = { 403: "La clave privada no coincide entre las aplicaciones", 409: "Código usado, vencido, moneda distinta o cuenta ya vinculada" };
      return reply({ error: errors[response.status] ?? "Balans Board no pudo confirmar la vinculación", status: response.status }, response.status);
    }
    const receipt: unknown = await response.json().catch(() => null);
    if (!verifiedLink(receipt, input.data.currency)) return reply({ error: "Respuesta de vinculación inválida; revisa el vínculo en Balans Board" }, 502);
    const { error: saveError } = await db.from("finance_account_links").insert({ user_id: userId, binding_id: receipt.binding_id, destination_user_id: receipt.destination_user_id, enabled: true });
    if (saveError) return reply({ error: "Balans Board confirmó el código, pero no se guardó aquí. Desconecta allí y genera un código nuevo" }, 409);
    return reply({ connected: true, configured: true });
  } catch { return reply({ error: "No se pudo completar la vinculación" }, 500); }
});