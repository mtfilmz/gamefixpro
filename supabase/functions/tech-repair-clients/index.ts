import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { validatedSessionUserId } from "../_shared/session-rules.ts";
import { canReadTechClients, clientExport, techAccount } from "../_shared/tech-client-rules.ts";
import { syncValues, syncKey } from "../_shared/tech-client-sync.ts";

const syncContactSchema = z.object({
  source_id: z.string().min(1).max(100), origin_gamefix_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200), phone: z.string().trim().max(30),
  email: z.string().trim().max(254).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
  contact: z.string().trim().max(200), address: z.string().trim().max(1000), notes: z.string().trim().max(4000),
}).strict();
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }).strict(),
  z.object({ action: z.literal("create") }).strict(),
  z.object({ action: z.literal("disconnect") }).strict(),
  z.object({ action: z.literal("receive_permission"), enabled: z.boolean() }).strict(),
  z.object({ action: z.literal("receive"), binding_id: z.string().uuid(), target_user_id: z.string().uuid(), clients: z.array(syncContactSchema).min(1).max(25) }).strict(),
  z.object({ action: z.literal("redeem"), code: z.string().regex(/^[0-9a-f]{64}$/), target_user_id: z.string().uuid(), target_email: z.string().email().max(254) }).strict(),
  z.object({ action: z.literal("list"), binding_id: z.string().uuid(), target_user_id: z.string().uuid(), kind: z.enum(["clients", "repairs"]), after: z.string().max(100).optional(), limit: z.number().int().min(1).max(100).default(100) }).strict(),
]);
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Método no permitido" }, 405);
  try {
    const text = await req.text();
    if (text.length > 200000) return reply({ error: "Solicitud demasiado grande" }, 413);
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) return reply({ error: "Solicitud inválida" }, 400);
    const input = parsed.data;
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const secret = Deno.env.get("TECH_REPAIR_CLIENT_SHARED_SECRET");
    if (input.action === "redeem" || input.action === "list" || input.action === "receive") {
      const supplied = req.headers.get("X-Client-Integration-Secret");
      if (!secret || !supplied || await hash(secret) !== await hash(supplied)) return reply({ error: "Conexión no autorizada" }, 403);
      if (input.action === "redeem") {
        if (input.target_email.trim().toLowerCase() !== techAccount) return reply({ error: "Cuenta no autorizada" }, 403);
        const { data, error } = await db.rpc("redeem_tech_client_link", { p_hash: await hash(input.code), p_target: input.target_user_id, p_email: input.target_email });
        if (error) return reply({ error: "Código usado, vencido o cuenta no autorizada" }, 409);
        return reply(data);
      }
      const { data: link, error } = await db.from("tech_repair_client_links").select("user_id,target_user_id,enabled,receive_enabled").eq("id", input.binding_id).maybeSingle();
      if (error) throw error;
      if (!link || !canReadTechClients(link, input.target_user_id)) return reply({ error: "Vínculo no autorizado" }, 403);
      if (input.action === "receive") {
        if (!link.receive_enabled) return reply({ error: "El propietario debe activar la recepción en Game Fix" }, 403);
        const results = [];
        for (const client of input.clients) {
          const { data, error: failure } = await db.rpc("receive_tech_client", {
            p_binding: input.binding_id, p_target: input.target_user_id, p_source: client.source_id,
            p_values: syncValues(client), p_key: JSON.parse(syncKey(client)), p_origin: client.origin_gamefix_id ?? null,
          });
          if (failure) return reply({ error: "No se completó la página; puedes reintentar sin duplicar clientes", results }, 409);
          results.push({ source_id: client.source_id, ...data });
        }
        return reply({ version: 2, binding_id: input.binding_id, results });
      }
      let query = db.from(input.kind).select(input.kind === "clients" ? "id,cliente,telefono,email,contacto,direccion,notas,source_key" : "id,cliente,telefono,email").eq("user_id", link.user_id).order("id").limit(input.limit + 1);
      if (input.after) query = query.gt("id", input.after);
      const { data: rows, error: readError } = await query;
      if (readError) throw readError;
      const page = (rows ?? []).slice(0, input.limit);
      return reply({ version: 1, binding_id: input.binding_id, kind: input.kind, clients: page.map(row => clientExport(row as unknown as Record<string, unknown>, input.kind)), next: (rows?.length ?? 0) > input.limit ? page.at(-1)?.id : null });
    }
    const authorization = req.headers.get("Authorization");
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authorization ?? "" } }, auth: { persistSession: false } });
    const uid = await validatedSessionUserId(authorization, token => auth.auth.getClaims(token));
    if (!uid) return reply({ error: "Sesión inválida" }, 401);
    const { data: link, error } = await db.from("tech_repair_client_links").select("id,enabled,receive_enabled").eq("user_id", uid).maybeSingle();
    if (error) throw error;
    if (input.action === "status") return reply({ connected: Boolean(link?.enabled), receive_enabled: Boolean(link?.enabled && link.receive_enabled), configured: Boolean(secret), target_email: techAccount, capabilities: ["clients:read", "clients:receive"], version: 2 });
    if (input.action === "receive_permission") {
      const { error: failure } = await auth.rpc("set_tech_client_receive", { p_enabled: input.enabled });
      if (failure) return reply({ error: "Vincula primero la cuenta de Tech Repair" }, 409);
      return reply({ connected: true, receive_enabled: input.enabled, configured: Boolean(secret) });
    }
    if (input.action === "disconnect") {
      // Caller-scoped RPC supplies the verified actor for transactional auditing.
      const { error: failure } = await auth.rpc("disconnect_tech_client_link");
      if (failure) throw failure;
      return reply({ connected: false, configured: Boolean(secret) });
    }
    if (!secret) return reply({ error: "Falta configurar la clave privada de clientes en ambas apps" }, 503);
    if (link?.enabled) return reply({ error: "La conexión de clientes ya está activa" }, 409);
    const code = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
    const { error: failure } = await db.rpc("prepare_tech_client_link", { p_user: uid, p_hash: await hash(code) });
    if (failure) return reply({ error: "No se pudo generar el código; actualiza la conexión" }, 409);
    return reply({ code, expires_at: new Date(Date.now() + 600000).toISOString(), connected: false, configured: true });
  } catch { return reply({ error: "No se pudo completar la consulta de clientes" }, 500); }
});