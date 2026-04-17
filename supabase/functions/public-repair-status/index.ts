import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("repairs")
      .select("id, cliente, marca, consola, estado, fecha, problemas, historial, imagenes, costo_diagnostico, costo_reparacion, costo_componente")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Reparación no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mask client name (first name + last initial)
    const parts = (data.cliente || "").trim().split(/\s+/);
    const clienteMasked = parts.length > 1
      ? `${parts[0]} ${parts[1][0]}.`
      : parts[0] || "Cliente";

    // Refresh signed URLs for images
    const imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];
    const refreshedImages = await Promise.all(
      imagenes.map(async (img: any) => {
        const match = img.dataUrl?.match(/repair-images\/(.+?)(?:\?|$)/);
        if (match) {
          const path = decodeURIComponent(match[1]);
          const { data: signed } = await supabase.storage
            .from("repair-images")
            .createSignedUrl(path, 60 * 60 * 24 * 7);
          return { ...img, dataUrl: signed?.signedUrl || img.dataUrl };
        }
        return img;
      })
    );

    return new Response(
      JSON.stringify({
        id: data.id,
        cliente: clienteMasked,
        marca: data.marca,
        consola: data.consola,
        estado: data.estado,
        fecha: data.fecha,
        problemas: data.problemas,
        historial: data.historial,
        imagenes: refreshedImages,
        costoDiagnostico: data.costo_diagnostico,
        costoReparacion: data.costo_reparacion,
        costoComponente: data.costo_componente,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
