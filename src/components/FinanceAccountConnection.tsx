import { useEffect, useState } from "react";
import { Link2, RefreshCw, ExternalLink } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function FinanceAccountConnection() {
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [confirmed, setConfirmed] = useState(false);
  const call = async (body: object) => {
    setBusy(true); setError("");
    try {
      const { data, error: failure } = await supabase.functions.invoke("link-finance-account", { body });
      if (failure) {
        let message = "No se pudo consultar la vinculación";
        if (failure instanceof FunctionsHttpError) {
          const details = await failure.context.json().catch(() => null);
          if (typeof details?.error === "string") message = details.error;
        }
        throw new Error(message);
      }
      setConnected(data.connected === true); setConfigured(data.configured === true); setLoaded(true);
      if (data.connected) setCode("");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la vinculación"); }
    finally { setBusy(false); }
  };
  useEffect(() => { void call({ action: "status" }); }, []);
  return <section className="border-t border-border py-4 space-y-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-bold text-foreground flex items-center gap-2"><Link2 className="h-4 w-4" />Balans Board</h3>
      <Button variant="ghost" size="icon" aria-label="Actualizar vínculo" disabled={busy} onClick={() => void call({ action: "status" })}><RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button>
    </div>
    <p className="text-sm text-muted-foreground">{!loaded ? "Consultando conexión…" : connected ? "Cuenta vinculada" : configured ? "Cuenta sin vincular" : "Pendiente de configurar la clave privada en ambas aplicaciones"}</p>
    {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
    <Button asChild variant="outline" size="sm"><a href="https://ingreso-impuesto-compass.lovable.app" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />Abrir Balans Board</a></Button>
    {loaded && !connected && <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (confirmed) void call({ action: "link", code: code.trim(), currency }); }}>
      <div className="space-y-2"><Label htmlFor="finance-code">Código de vinculación de Balans Board</Label><Input id="finance-code" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={64} /></div>
      <div className="space-y-2"><Label>Moneda de esta cuenta</Label><Select value={currency} onValueChange={v => { setCurrency(v); setConfirmed(false); }}><SelectTrigger aria-label="Moneda de esta cuenta"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">Dólar estadounidense (USD)</SelectItem><SelectItem value="DOP">Peso dominicano (DOP)</SelectItem></SelectContent></Select></div>
      <div className="flex items-start gap-2"><Checkbox id="finance-currency-confirm" checked={confirmed} onCheckedChange={v => setConfirmed(v === true)} /><Label htmlFor="finance-currency-confirm" className="text-sm leading-5">Confirmo que ambas cuentas usan esta moneda, sin conversión.</Label></div>
      <Button type="submit" disabled={busy || !configured || !confirmed || !/^[0-9a-f]{64}$/.test(code.trim())}><Link2 className="h-4 w-4" />Vincular cuenta</Button>
    </form>}
  </section>;
}