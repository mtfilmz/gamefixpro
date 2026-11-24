import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fields = { cliente: "Nombre", telefono: "Teléfono", email: "Correo", contacto: "Contacto", direccion: "Dirección", notas: "Notas" };
export default function TechClientConflicts() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["tech-client-conflicts", user?.id], enabled: Boolean(user), queryFn: async () => {
    const { data, error } = await supabase.from("tech_client_conflicts").select("id,local_snapshot,incoming").eq("user_id", user?.id ?? "");
    if (error) throw error;
    return data;
  } });
  const resolve = async (id: string, remote: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("resolve_tech_client_conflict", { p_id: id, p_use_remote: remote });
      if (error) throw error;
      await Promise.all([cache.invalidateQueries({ queryKey: ["tech-client-conflicts"] }), cache.invalidateQueries({ queryKey: ["clients"] })]);
      toast.success(remote ? "Datos de COBRO aceptados" : "Datos de Game Fix conservados");
    } catch { toast.error("No se resolvió el conflicto. Actualiza la lista y revisa los datos nuevamente."); }
    finally { setBusy(false); }
  };
  if (query.error) return <p role="alert" className="text-destructive">No se pudieron consultar los conflictos. <Button variant="link" onClick={() => void query.refetch()}>Reintentar</Button></p>;
  if (!query.data?.length) return null;
  return <section className="border-y border-border py-4 space-y-4"><h2 className="font-bold">Cambios de COBRO pendientes · {query.data.length}</h2>
    {query.data.map(item => {
      const local = item.local_snapshot as Record<string, string>;
      const remote = item.incoming as Record<string, string>;
      return <div key={item.id} className="record-highlight border-b border-border py-3 space-y-3">
        <h3 className="font-semibold break-words">{local.cliente}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm"><strong>Game Fix</strong><strong>COBRO</strong>
          {Object.entries(fields).map(([key, label]) => <div key={key} className="col-span-2 grid grid-cols-2 gap-3"><div className="min-w-0 break-words"><span className="text-muted-foreground">{label}: </span>{local[key] || "—"}</div><div className="min-w-0 break-words">{remote[key] || "—"}</div></div>)}
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => void resolve(item.id, false)}>Conservar Game Fix</Button><Button disabled={busy} onClick={() => void resolve(item.id, true)}>Aceptar COBRO</Button></div>
      </div>;
    })}
  </section>;
}