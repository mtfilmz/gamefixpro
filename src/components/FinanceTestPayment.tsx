import { useEffect, useState } from "react";
import { CheckCircle2, Send, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendFinanceTest } from "@/lib/finance-test-service";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export default function FinanceTestPayment({ ready }: { ready: boolean }) {
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [exists, setExists] = useState(false);
  const [movement, setMovement] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.from("repair_payments").select("id,sync_status,remote_movement_id,sync_error").eq("is_test", true).maybeSingle().then(({ data, error: failure }) => {
      if (!active) return;
      if (failure) { setError("No se pudo consultar la prueba anterior"); return; }
      setExists(Boolean(data)); setMovement(data?.sync_status === "synced" ? data.remote_movement_id ?? "" : "");
      setError(data?.sync_error ?? ""); setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  const send = async () => {
    setBusy(true); setError("");
    try { setMovement(await sendFinanceTest()); setExists(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Recepción no confirmada"); }
    finally { setBusy(false); }
  };
  return <div className="border-t border-border pt-4 space-y-3">
    <h4 className="text-sm font-semibold">Pago de prueba · $150</h4>
    <div role="status" aria-live="polite" className="text-sm flex items-start gap-2">
      {movement ? <CheckCircle2 className="h-4 w-4 shrink-0 text-status-repaired" /> : error ? <AlertCircle className="h-4 w-4 shrink-0 text-destructive" /> : null}
      <p className={error ? "text-destructive" : "text-muted-foreground"}>{busy ? "Enviando; esperando confirmación de Balans Board…" : movement ? "Recepción completada: Balans Board confirmó el ingreso de prueba." : !ready ? "Recepción sin probar: primero vincula tu cuenta de Balans Board." : error ? `Recepción no confirmada: ${error}` : exists ? "Pago de prueba guardado; recepción pendiente." : "Prueba aún no enviada."}</p>
    </div>
    {movement && <p className="text-xs text-muted-foreground break-all">Recibo del ingreso: {movement}</p>}
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline" disabled={!ready || busy || !loaded}><span>{exists || movement ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}</span>{movement ? "Verificar recibo de prueba" : exists || error ? "Reintentar pago de prueba" : "Enviar pago de prueba"}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Confirmar pago de prueba</AlertDialogTitle><AlertDialogDescription>Se registrará un ingreso real de $150 en Balans Board, en la moneda de tus cuentas vinculadas, a nombre de «Cliente de prueba», con método «Otro». No es una simulación ni un cobro bancario. Los reintentos conservan el mismo pago y no crean otro ingreso.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void send()}>Confirmar envío de $150</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}