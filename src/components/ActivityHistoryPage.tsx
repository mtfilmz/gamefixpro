import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { activityEntities, activityOperations } from "@/lib/activity-history";

const pageSize = 50;
export default function ActivityHistoryPage() {
  const { isAdmin, loading: roleLoading } = useRole();
  const [entity, setEntity] = useState("");
  const [operation, setOperation] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["activity-history", entity, operation, page],
    enabled: isAdmin,
    refetchInterval: 30000,
    queryFn: async () => {
      let request = supabase.from("activity_history").select("*", { count: "exact" }).order("occurred_at", { ascending: false }).order("id", { ascending: false });
      if (entity) request = request.eq("entity", entity);
      if (operation) request = request.eq("operation", operation);
      const { data, error, count } = await request.range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });
  if (roleLoading) return <p role="status">Cargando...</p>;
  if (!isAdmin) return <p role="alert" className="text-destructive">Acceso exclusivo para administradores.</p>;
  const selectClass = "bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm min-h-10 max-w-full";
  return <section className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3 items-center"><h1 className="text-xl font-bold flex items-center gap-2"><History className="h-5 w-5 text-primary" />Historial de actividad</h1><Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw />Actualizar</Button></div>
    <div className="flex flex-wrap gap-3">
      <select aria-label="Filtrar actividad por área" className={selectClass} value={entity} onChange={event => { setEntity(event.target.value); setPage(0); }}><option value="">Todas las áreas</option>{Object.entries(activityEntities).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Filtrar actividad por operación" className={selectClass} value={operation} onChange={event => { setOperation(event.target.value); setPage(0); }}><option value="">Todas las operaciones</option>{Object.entries(activityOperations).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <span className="text-sm text-muted-foreground self-center">{query.data?.count ?? 0} operaciones</span>
    </div>
    {query.isLoading ? <p role="status">Cargando historial...</p> : query.error ? <p role="alert" className="text-destructive">No se pudo cargar el historial. Intenta actualizar.</p> : !query.data?.rows.length ? <p role="status" className="text-muted-foreground py-8">No hay operaciones registradas.</p> : <div className="divide-y divide-border border-y border-border">
      {query.data.rows.map(entry => <article key={entry.id} className="record-highlight py-4 space-y-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{activityOperations[entry.operation]} · {activityEntities[entry.entity] || entry.entity}</span><time className="text-muted-foreground">{new Date(entry.occurred_at).toLocaleString("es-MX")}</time></div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground"><span className="break-all">Registro: {entry.record_id}</span><span className="break-all">Responsable: {entry.actor_id || "Proceso del servidor (sin usuario identificado)"}</span></div>
        <p className="break-words">Campos: {entry.changed_fields.join(", ") || "Sin cambios"}</p>
        <details><summary className="cursor-pointer text-primary">Ver valores registrados</summary><div className="grid md:grid-cols-2 gap-4 pt-3"><div><h2 className="font-semibold mb-1">Antes</h2><pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">{JSON.stringify(entry.before_values, null, 2) || "—"}</pre></div><div><h2 className="font-semibold mb-1">Después</h2><pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">{JSON.stringify(entry.after_values, null, 2) || "—"}</pre></div></div></details>
      </article>)}
    </div>}
    <div className="flex items-center justify-end gap-3"><Button variant="outline" size="icon" aria-label="Página anterior" title="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft /></Button><span className="text-sm">Página {page + 1}</span><Button variant="outline" size="icon" aria-label="Página siguiente" title="Página siguiente" disabled={(page + 1) * pageSize >= (query.data?.count ?? 0)} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div>
  </section>;
}