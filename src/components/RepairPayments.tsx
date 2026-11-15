import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SavedPayment } from "@/lib/payments";
import { syncPayment } from "@/lib/payment-service";

const methods: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", other: "Otro" };
export default function RepairPayments({ repairId }: { repairId: string }) {
  const [payments, setPayments] = useState<SavedPayment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("repair_payments").select("*").eq("repair_id", repairId).order("created_at", { ascending: false });
    setError(error ? "No se pudieron consultar los pagos" : "");
    if (data) setPayments(data.map(p => ({ ...p, amount: Number(p.amount) })) as SavedPayment[]);
  };
  useEffect(() => { void load(); }, [repairId]);
  return <div className="space-y-3">
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    {!error && payments.length === 0 && <p className="text-muted-foreground text-sm">Sin pagos registrados por tu cuenta.</p>}
    {payments.map(p => <div key={p.id} className="record-highlight border-b border-border py-3 space-y-1">
      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold"><span>${p.amount.toFixed(2)} · {methods[p.method]}</span><span>{p.paid_on}</span></div>
      <p className="text-muted-foreground text-xs break-words">{p.client_name} — {p.equipment}</p>
      <p className="text-sm text-muted-foreground">{p.sync_status === "synced" ? "Sincronizado con Balans Board" : "Pendiente de Balans Board"}</p>
      {p.sync_error && <p className="text-xs text-muted-foreground">{p.sync_error}</p>}
      {p.sync_status === "pending" && <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={async () => {
        setBusy(p.id);
        try { await syncPayment(p.id); toast.success("Pago confirmado por Balans Board"); }
        catch (e) { toast.error(e instanceof Error ? e.message : "Envío pendiente"); }
        finally { await load(); setBusy(null); }
      }}><RefreshCw className={busy === p.id ? "animate-spin" : ""} />Reintentar envío</Button>}
    </div>)}
  </div>;
}