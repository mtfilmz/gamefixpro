import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Repair, EstadoReparacion, StatusChange, RepairImage } from "@/types/repair";
import { useAuth } from "@/hooks/use-auth";

/* Fotos: en la base se guarda solo la ruta ("repair-images/<carpeta>/<archivo>"), sin enlace.
   Para verlas se piden enlaces que duran 1 hora, todos juntos en una sola consulta,
   y se reusan mientras les queden más de 10 minutos. */
const FOTO_DURA = 60 * 60;
const firmas = new Map<string, { url: string; vence: number }>();

export function rutaDeFoto(dataUrl?: string): string | null {
  const m = dataUrl?.match(/repair-images\/(.+?)(?:\?|$)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function fotoParaGuardar(img: RepairImage): RepairImage {
  const ruta = rutaDeFoto(img.dataUrl);
  return ruta ? { ...img, dataUrl: "repair-images/" + ruta } : img;
}

async function firmarFotos(lista: Repair[]): Promise<Repair[]> {
  const ahora = Date.now();
  const faltan = new Set<string>();
  for (const r of lista) {
    for (const img of r.imagenes || []) {
      const ruta = rutaDeFoto(img.dataUrl);
      const f = ruta ? firmas.get(ruta) : undefined;
      if (ruta && (!f || f.vence - ahora < 10 * 60 * 1000)) faltan.add(ruta);
    }
  }
  const rutas = [...faltan];
  for (let i = 0; i < rutas.length; i += 100) {
    const { data } = await supabase.storage.from("repair-images").createSignedUrls(rutas.slice(i, i + 100), FOTO_DURA);
    for (const d of data || []) {
      if (d.path && d.signedUrl) firmas.set(d.path, { url: d.signedUrl, vence: ahora + FOTO_DURA * 1000 });
    }
  }
  return lista.map((r) => ({
    ...r,
    imagenes: (r.imagenes || []).map((img) => {
      const ruta = rutaDeFoto(img.dataUrl);
      const f = ruta ? firmas.get(ruta) : undefined;
      return f ? { ...img, dataUrl: f.url } : img;
    }),
  }));
}

function dbToRepair(row: any): Repair {
  return {
    id: row.id,
    cliente: row.cliente || "",
    telefono: row.telefono || "",
    email: row.email || "",
    marca: row.marca || "",
    consola: row.consola || "",
    numeroSerie: row.numero_serie || "",
    color: row.color || "",
    accesorios: row.accesorios || "",
    problemas: row.problemas || [],
    detalles: row.detalles || "",
    estado: row.estado as EstadoReparacion,
    fecha: row.fecha || "",
    createdAt: row.created_at || "",
    historial: (row.historial as StatusChange[]) || [],
    imagenes: (row.imagenes as RepairImage[]) || [],
    costoDiagnostico: row.costo_diagnostico != null ? Number(row.costo_diagnostico) : undefined,
    costoReparacion: row.costo_reparacion != null ? Number(row.costo_reparacion) : undefined,
    costoComponente: row.costo_componente != null ? Number(row.costo_componente) : undefined,
    trackingCode: row.tracking_code || undefined,
  };
}

/* Lo que la app guarda de una orden. El dueño (user_id) y el código del enlace los pone la nube. */
function repairToDb(r: Repair) {
  return {
    id: r.id,
    cliente: r.cliente,
    telefono: r.telefono,
    email: r.email,
    marca: r.marca,
    consola: r.consola,
    numero_serie: r.numeroSerie,
    color: r.color,
    accesorios: r.accesorios,
    problemas: r.problemas,
    detalles: r.detalles,
    estado: r.estado,
    fecha: r.fecha,
    historial: JSON.parse(JSON.stringify(r.historial || [])),
    imagenes: JSON.parse(JSON.stringify((r.imagenes || []).map(fotoParaGuardar))),
    costo_diagnostico: r.costoDiagnostico ?? null,
    costo_reparacion: r.costoReparacion ?? null,
    costo_componente: r.costoComponente ?? null,
  };
}

/* Solo los campos que cambiaron, para no pisar lo que otro equipo cambió en otros campos. */
function cambios(antes: Repair, despues: Repair): Record<string, unknown> {
  const a = repairToDb(antes) as Record<string, unknown>;
  const d = repairToDb(despues) as Record<string, unknown>;
  const diff: Record<string, unknown> = {};
  for (const k of Object.keys(d)) {
    if (k !== "id" && JSON.stringify(a[k]) !== JSON.stringify(d[k])) diff[k] = d[k];
  }
  return diff;
}

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const repairsRef = useRef<Repair[]>([]);
  repairsRef.current = repairs;

  const fetchRepairs = async () => {
    if (!user) { setRepairs([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("repairs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRepairs(await firmarFotos(data.map(dbToRepair)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepairs();
    const interval = setInterval(() => {
      if (!busy) fetchRepairs();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, busy]);

  useEffect(() => {
    const channel = supabase
      .channel("repairs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repairs" },
        (payload) => {
          if (busy) return;
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id;
            setRepairs((prev) => prev.filter((r) => r.id !== deletedId));
            return;
          }
          const fila = dbToRepair(payload.new);
          void firmarFotos([fila]).then(([conFotos]) => {
            setRepairs((prev) => {
              if (prev.some((r) => r.id === conFotos.id)) return prev.map((r) => (r.id === conFotos.id ? conFotos : r));
              return payload.eventType === "INSERT" ? [conFotos, ...prev] : prev;
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busy]);

  /** Número de una orden nueva: lo da la nube, así dos equipos nunca repiten el mismo. */
  const nextRepairId = async (): Promise<string> => {
    const { data, error } = await (supabase.rpc as any)("next_repair_id");
    if (error || typeof data !== "string") throw new Error("No se pudo obtener el número de orden. Revisa la conexión.");
    return data;
  };

  /** Guarda una orden. Si es nueva la crea. Si ya existe, manda solo lo que cambió comparando
      con cómo estaba cuando se abrió (antes), para no pisar lo que otro equipo cambió. */
  const saveRepair = async (repair: Repair, antes?: Repair | null): Promise<Repair> => {
    if (!user) throw new Error("Debes iniciar sesión para guardar");
    const previo = antes ?? repairsRef.current.find((r) => r.id === repair.id) ?? null;
    if (!previo) {
      const { data, error } = await (supabase.from("repairs") as any)
        .insert({ ...repairToDb(repair), user_id: user.id })
        .select("tracking_code")
        .single();
      if (error) throw new Error(error.code === "23505" ? "Ese número de orden ya existe. Vuelve a guardar." : error.message);
      return { ...repair, trackingCode: data?.tracking_code ?? undefined };
    }
    const resultado = { ...repair, trackingCode: repair.trackingCode ?? previo.trackingCode };
    const diff = cambios(previo, repair);
    if (Object.keys(diff).length === 0) return resultado;
    const { data, error } = await (supabase.from("repairs") as any).update(diff).eq("id", repair.id).select("id");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("No se guardó: la orden ya no existe o no tienes permiso.");
    return resultado;
  };

  const deleteRepairs = async (ids: string[], password: string) => {
    const { data, error } = await supabase.functions.invoke("delete-repairs", { body: { ids, password } });
    if (error) {
      let message = "No se pudo eliminar. Revisa tu conexión.";
      if (error.context instanceof Response) {
        const details = await error.context.json().catch(() => null);
        if (typeof details?.error === "string") message = details.error;
      }
      throw new Error(message);
    }
    if (!Array.isArray(data?.deleted_ids)) throw new Error("No se confirmó la eliminación");
    setRepairs(previous => previous.filter(repair => !data.deleted_ids.includes(repair.id)));
  };

  return { repairs, loading, saveRepair, nextRepairId, deleteRepairs, refreshRepairs: fetchRepairs, setBusy };
}
