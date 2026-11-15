import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Repair, EstadoReparacion, StatusChange, RepairImage } from "@/types/repair";
import { useAuth } from "@/hooks/use-auth";

async function refreshImageUrls(images: RepairImage[]): Promise<RepairImage[]> {
  if (!images || images.length === 0) return [];
  const refreshed: RepairImage[] = [];
  for (const img of images) {
    // Extract storage path from any supabase URL (public or signed)
    const match = img.dataUrl?.match(/repair-images\/(.+?)(?:\?|$)/);
    if (match) {
      const path = decodeURIComponent(match[1]);
      const { data } = await supabase.storage
        .from("repair-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      refreshed.push({ ...img, dataUrl: data?.signedUrl || img.dataUrl });
    } else {
      refreshed.push(img);
    }
  }
  return refreshed;
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
  };
}

function repairToDb(r: Repair, userId: string) {
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
    imagenes: JSON.parse(JSON.stringify(r.imagenes || [])),
    costo_diagnostico: r.costoDiagnostico ?? null,
    costo_reparacion: r.costoReparacion ?? null,
    costo_componente: r.costoComponente ?? null,
    user_id: userId,
  };
}

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const fetchRepairs = async () => {
    if (!user) { setRepairs([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("repairs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const parsed = data.map(dbToRepair);
      // Refresh signed URLs for images in parallel
      const withUrls = await Promise.all(
        parsed.map(async (r) => ({
          ...r,
          imagenes: await refreshImageUrls(r.imagenes || []),
        }))
      );
      setRepairs(withUrls);
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
          if (payload.eventType === "INSERT") {
            const newRepair = dbToRepair(payload.new);
            setRepairs((prev) => {
              if (prev.some((r) => r.id === newRepair.id)) return prev;
              return [newRepair, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = dbToRepair(payload.new);
            setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id;
            setRepairs((prev) => prev.filter((r) => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busy]);

  const saveRepair = async (repair: Repair) => {
    if (!user) throw new Error("Debes iniciar sesión para guardar");
    const dbData = repairToDb(repair, user.id);
    const { error } = await supabase.from("repairs").upsert(dbData);
    if (error) throw new Error(error.message);
  };

  const deleteRepairs = async (ids: string[]) => {
    await supabase.from("repairs").delete().in("id", ids);
  };

  return { repairs, loading, saveRepair, deleteRepairs, refreshRepairs: fetchRepairs, setBusy };
}
