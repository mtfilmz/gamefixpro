import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Repair, EstadoReparacion, StatusChange, RepairImage } from "@/types/repair";
import { useAuth } from "@/hooks/use-auth";

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
    historial: (row.historial as StatusChange[]) || [],
    imagenes: (row.imagenes as RepairImage[]) || [],
    costoDiagnostico: row.costo_diagnostico != null ? Number(row.costo_diagnostico) : undefined,
    costoReparacion: row.costo_reparacion != null ? Number(row.costo_reparacion) : undefined,
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
    user_id: userId,
  };
}

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRepairs = async () => {
    if (!user) { setRepairs([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("repairs")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setRepairs(data.map(dbToRepair));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepairs();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("repairs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repairs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRepair = dbToRepair(payload.new);
            setRepairs((prev) => {
              if (prev.some((r) => r.id === newRepair.id)) return prev;
              return [...prev, newRepair];
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
  }, []);

  const saveRepair = async (repair: Repair) => {
    if (!user) return;
    const dbData = repairToDb(repair, user.id);
    await supabase.from("repairs").upsert(dbData);
  };

  const deleteRepairs = async (ids: string[]) => {
    await supabase.from("repairs").delete().in("id", ids);
  };

  return { repairs, loading, saveRepair, deleteRepairs, refreshRepairs: fetchRepairs };
}
