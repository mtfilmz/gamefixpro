import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { passwordMatches } from "../_shared/repair-delete-rules.ts";

const schema = z.object({ ids: z.array(z.string().min(1).max(200)).min(1).max(1000), password: z.string().min(1).max(200) }).strict();
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Método no permitido" }, 405);
  try {
    const token = /^Bearer ([^\s,]+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
    if (!token) return reply({ error: "Inicia sesión para eliminar" }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: "Sesión inválida" }, 401);
    const input = schema.safeParse(await req.json().catch(() => null));
    if (!input.success) return reply({ error: "Selecciona los registros e introduce la contraseña" }, 400);
    if (!Deno.env.get("REPAIR_DELETE_PASSWORD")) return reply({ error: "Eliminación pendiente de configurar" }, 503);
    const { data: allowed, error: limitError } = await db.rpc("allow_repair_delete_attempt", { p_user_id: auth.user.id });
    if (limitError) throw limitError;
    if (!allowed) return reply({ error: "Demasiados intentos. Espera 15 minutos para volver a intentar." }, 429);
    if (!await passwordMatches(input.data.password, Deno.env.get("REPAIR_DELETE_PASSWORD"))) return reply({ error: "Contraseña incorrecta. No se eliminó ningún registro." }, 403);
    const { data, error } = await db.rpc("delete_repairs_verified", { p_user_id: auth.user.id, p_ids: [...new Set(input.data.ids)] });
    if (error) return reply({ error: "No se eliminaron registros. Verifica que sean tuyos o que tengas permiso de administrador." }, 403);
    return reply({ deleted_ids: data });
  } catch { return reply({ error: "No se pudo completar la eliminación" }, 500); }
});