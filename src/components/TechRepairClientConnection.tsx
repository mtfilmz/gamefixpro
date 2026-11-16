import { useEffect, useState } from "react";
import { Users, Link2, Unlink, RefreshCw, ExternalLink } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { invokeAuthenticatedFunction } from "@/lib/authenticated-function";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function TechRepairClientConnection() {
  const [connected, setConnected] = useState(false), [configured, setConfigured] = useState(false), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const [code, setCode] = useState(""), [expires, setExpires] = useState("");
  const [receiveEnabled, setReceiveEnabled] = useState(false);
  const call = async (action: "status" | "create" | "disconnect" | "receive_permission", enabled?: boolean) => {
    setBusy(true); setError("");
    try {
      const { data, error: failure } = await invokeAuthenticatedFunction("tech-repair-clients", action === "receive_permission" ? { action, enabled } : { action });
      if (failure) {
        const detail = failure instanceof FunctionsHttpError ? await failure.context.json().catch(() => null) : null;
        throw new Error(detail?.error || "No se pudo consultar la conexión de clientes");
      }
      setLoaded(true); setConnected(data.connected === true); setConfigured(data.configured === true);
      setReceiveEnabled(data.receive_enabled === true);
      if (data.code) { setCode(data.code); setExpires(data.expires_at); }
      if (data.connected || action === "disconnect") { setCode(""); setExpires(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la conexión"); }
    finally { setBusy(false); }
  };
  useEffect(() => { void call("status"); }, []);
  useEffect(() => { if (!expires) return; const timer = window.setTimeout(() => { setCode(""); setExpires(""); }, Math.max(0, new Date(expires).getTime() - Date.now())); return () => window.clearTimeout(timer); }, [expires]);
  return <section className="border-t border-border py-4 space-y-3">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold flex items-center gap-2"><Users className="h-4 w-4" />Clientes · Tech Repair</h3><Button variant="ghost" size="icon" aria-label="Actualizar conexión de clientes" disabled={busy} onClick={() => void call("status")}><RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button></div>
    <p className="text-sm text-muted-foreground break-all">supermobilepr@gmail.com</p>
    <p role="status" className="text-sm">{!loaded ? "Consultando conexión…" : connected ? "Clientes conectados" : configured ? "Clientes sin conectar" : "Pendiente de configurar la clave privada de clientes"}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {connected && <label className="flex items-center justify-between gap-3 text-sm">Recibir clientes de Tech Repair<Switch aria-label="Recibir clientes de Tech Repair" checked={receiveEnabled} disabled={busy} onCheckedChange={value => void call("receive_permission", value)} /></label>}
    {code && <div className="space-y-1"><p className="text-sm">Código de vinculación · vence a las {new Date(expires).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p><input aria-label="Código de conexión de clientes" value={code} readOnly autoComplete="off" className="w-full bg-input border border-border rounded-md p-2 font-mono text-sm" /></div>}
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !loaded || !configured || connected} onClick={() => void call("create")}><Link2 className="h-4 w-4" />Generar código de clientes</Button>{connected && <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm("¿Desconectar el acceso de Tech Repair a tus clientes? Los clientes y los pagos se conservarán.")) void call("disconnect"); }}><Unlink className="h-4 w-4" />Desconectar clientes</Button>}<Button variant="outline" asChild><a href="https://pocket-tech-quote-craft.lovable.app/ajustes" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />Abrir Tech Repair</a></Button></div>
  </section>;
}