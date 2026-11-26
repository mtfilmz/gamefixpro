import { createClient } from "npm:@supabase/supabase-js@2";

// Página pública que ve el cliente. Se busca por el código secreto de la orden (?code=).
// Los enlaces de antes (?id=#055) solo muestran el estado: sin nombre, fotos ni costos.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const FOTO_DURA = 60 * 60; // los enlaces de las fotos duran 1 hora

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") ?? "").trim();
    const viejo = (url.searchParams.get("id") ?? "").trim();
    if (!code && !viejo) return json({ error: "Falta el código del enlace" }, 400);
    if (code && !/^[A-Za-z0-9_-]{8,64}$/.test(code)) return json({ error: "Reparación no encontrada" }, 404);

    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });
    const columnas = "id, cliente, marca, consola, estado, fecha, problemas, historial, imagenes, costo_diagnostico, costo_reparacion, costo_componente";
    const consulta = db.from("repairs").select(columnas);
    const { data, error } = await (code ? consulta.eq("tracking_code", code) : consulta.eq("id", viejo)).maybeSingle();
    if (error || !data) return json({ error: "Reparación no encontrada" }, 404);

    // Datos del negocio que se configuran en la app (Ajustes › Datos del negocio).
    const { data: ajustes } = await db.from("app_settings").select("config").eq("singleton_key", true).maybeSingle();
    const n = ((ajustes?.config as any)?.negocio ?? {}) as Record<string, string>;
    const negocio = {
      nombre: n.nombre || "Super Mobile Tech Repair",
      telefono: n.telefono || "787-500-1324",
      web: n.web || "reparaciondecelularespr.com",
    };

    if (!code) {
      return json({
        legacy: true, id: data.id, cliente: "", marca: data.marca, consola: data.consola,
        estado: data.estado, fecha: data.fecha, problemas: [], historial: data.historial ?? [], imagenes: [], negocio,
      });
    }

    // Nombre corto: primer nombre + inicial del apellido.
    const partes = (data.cliente || "").trim().split(/\s+/);
    const cliente = partes.length > 1 ? `${partes[0]} ${partes[1][0]}.` : partes[0] || "Cliente";

    // Fotos: se firman todas juntas, con enlaces de 1 hora.
    const imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];
    const rutas = imagenes.map((img: any) => {
      const m = String(img?.dataUrl ?? "").match(/repair-images\/(.+?)(?:\?|$)/);
      if (!m) return null;
      try { return decodeURIComponent(m[1]); } catch { return m[1]; }
    });
    const validas = rutas.filter((r: string | null): r is string => !!r);
    const firmadas = new Map<string, string>();
    if (validas.length > 0) {
      const { data: s } = await db.storage.from("repair-images").createSignedUrls(validas, FOTO_DURA);
      for (const x of s ?? []) if (x.path && x.signedUrl) firmadas.set(x.path, x.signedUrl);
    }
    const fotos = imagenes
      .map((img: any, i: number) => ({ ...img, dataUrl: (rutas[i] && firmadas.get(rutas[i] as string)) || "" }))
      .filter((img: any) => img.dataUrl);

    return json({
      id: data.id, cliente, marca: data.marca, consola: data.consola, estado: data.estado, fecha: data.fecha,
      problemas: data.problemas, historial: data.historial, imagenes: fotos,
      costoDiagnostico: data.costo_diagnostico, costoReparacion: data.costo_reparacion, costoComponente: data.costo_componente,
      negocio,
    });
  } catch {
    return json({ error: "No se pudo cargar la reparación" }, 500);
  }
});
