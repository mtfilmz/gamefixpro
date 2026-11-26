// Gaming Fix · cuentas de usuario. Solo un administrador puede usarla.
// - list: correos de las cuentas, para ver quién es quién en Ajustes › Usuarios.
// - create: crea una cuenta nueva (correo + contraseña temporal) y le da su rol, todo junto.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

// ---- igual que _shared/session-rules.ts: la sesión se valida en Supabase, nunca se decodifica aquí ----
type ClaimsResult = { data: { claims?: Record<string, unknown> } | null; error: unknown };
async function validatedSessionUserId(authorization: string | null, verify: (token: string) => Promise<ClaimsResult>): Promise<string | null> {
  const token = /^Bearer ([^\s,]+)$/i.exec(authorization ?? "")?.[1];
  if (!token) return null;
  try {
    const { data, error } = await verify(token);
    const claims = data?.claims;
    if (error || claims?.role !== "authenticated" || typeof claims.sub !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.sub)) return null;
    return claims.sub;
  } catch { return null; }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }).strict(),
  z.object({
    action: z.literal("create"),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(72),
    role: z.enum(["admin", "tecnico"]),
  }).strict(),
]);

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Método no permitido" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const authorization = req.headers.get("Authorization");
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authorization ?? "" } }, auth: { persistSession: false, autoRefreshToken: false } });
    const userId = await validatedSessionUserId(authorization, token => auth.auth.getClaims(token));
    if (!userId) return reply({ error: "Sesión inválida" }, 401);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: admin, error: roleError } = await db.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (roleError) throw roleError;
    if (!admin) return reply({ error: "Solo un administrador puede manejar las cuentas" }, 403);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const pwd = parsed.error.issues.some(i => i.path[0] === "password");
      const mail = parsed.error.issues.some(i => i.path[0] === "email");
      return reply({ error: pwd ? "La contraseña debe tener de 8 a 72 caracteres" : mail ? "Escribe un correo válido" : "Solicitud inválida" }, 400);
    }
    const input = parsed.data;

    if (input.action === "list") {
      const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      return reply({
        users: data.users.map(u => ({ user_id: u.id, email: u.email ?? "", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null })),
      });
    }

    const { data: created, error: createError } = await db.auth.admin.createUser({ email: input.email, password: input.password, email_confirm: true });
    if (createError || !created?.user) {
      const msg = String(createError?.message ?? "");
      if (/already|registered|exists/i.test(msg)) return reply({ error: "Ya existe una cuenta con ese correo" }, 409);
      if (/password/i.test(msg)) return reply({ error: "Esa contraseña no se acepta. Usa una más larga o distinta." }, 400);
      throw createError ?? new Error("sin usuario");
    }
    const newId = created.user.id;
    const { error: assignError } = await db.from("user_roles").insert({ user_id: newId, role: input.role });
    if (assignError) {
      // Sin rol la cuenta no sirve: se borra para no dejarla a medias.
      await db.auth.admin.deleteUser(newId).catch(() => null);
      throw assignError;
    }
    return reply({ user_id: newId, email: created.user.email ?? input.email, role: input.role });
  } catch {
    return reply({ error: "No se pudo completar. Inténtalo de nuevo." }, 500);
  }
});
