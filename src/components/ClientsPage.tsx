import { useMemo, useState } from "react";
import { Search, UserPlus, Users, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/types/repair";
import { clientDirectory, clientSchema } from "@/lib/clients";
import { findPreviousClients } from "@/lib/previous-clients";
import { useClients } from "@/hooks/use-clients";
import { toast } from "sonner";

const inputClass = "w-full bg-input border border-border rounded-md px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export default function ClientsPage({ repairs }: { repairs: Repair[] }) {
  const { clients, loading, error, refresh, addClient } = useClients();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ cliente: "", telefono: "", email: "" });
  const [formError, setFormError] = useState("");
  const directory = useMemo(() => clientDirectory(repairs, clients), [repairs, clients]);
  const visible = query.trim() ? findPreviousClients(directory, query) : directory;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message || "Revisa los datos"); return; }
    const client = { cliente: parsed.data.cliente || "", telefono: parsed.data.telefono || "", email: parsed.data.email || "" };
    if (clientDirectory([], [client, ...directory]).length === directory.length) { setFormError("Este cliente ya está en tu lista"); return; }
    setSaving(true);
    setFormError("");
    try {
      await addClient(client);
      setQuery("");
      setOpen(false);
      toast.success("Cliente guardado");
    } catch { setFormError("No se pudo guardar el cliente. Intenta nuevamente."); }
    finally { setSaving(false); }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Clientes</h1><p className="text-sm text-muted-foreground mt-1">{directory.length} clientes</p></div>
      <Button onClick={() => { setForm({ cliente: "", telefono: "", email: "" }); setFormError(""); setOpen(true); }}><UserPlus />Agregar cliente</Button>
    </div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input aria-label="Buscar clientes" type="search" placeholder="Nombre, teléfono o correo" value={query} onChange={event => setQuery(event.target.value)} className={`${inputClass} pl-10`} /></div>
    {error && <div role="alert" className="text-sm text-destructive">No se pudieron cargar los clientes guardados. <Button variant="link" onClick={() => refresh()}>Reintentar</Button></div>}
    {loading ? <p role="status" className="text-muted-foreground">Cargando clientes...</p> : visible.length ? <div className="divide-y divide-border border-y border-border">
      <div className="hidden md:grid grid-cols-3 gap-4 py-3 text-xs uppercase font-bold text-muted-foreground"><span>Cliente</span><span>Teléfono</span><span>Correo</span></div>
      {visible.map((client, index) => <div key={index} className="grid md:grid-cols-3 gap-2 md:gap-4 py-4 text-sm">
        <span className="font-semibold break-words">{client.cliente}</span>
        <span className="flex items-start gap-2 min-w-0"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-words">{client.telefono || "Sin teléfono"}</span></span>
        <span className="flex items-start gap-2 min-w-0"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-all">{client.email || "Sin correo"}</span></span>
      </div>)}
    </div> : <p role="status" className="text-muted-foreground py-8">{query.trim() ? "No se encontraron clientes" : "Aún no hay clientes"}</p>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Agregar cliente</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1"><label htmlFor="client-name">Nombre *</label><input id="client-name" autoComplete="name" required maxLength={200} value={form.cliente} onChange={event => setForm({ ...form, cliente: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-phone">Teléfono</label><input id="client-phone" type="tel" autoComplete="tel" maxLength={30} value={form.telefono} onChange={event => setForm({ ...form, telefono: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-email">Correo</label><input id="client-email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={inputClass} /></div>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cliente"}</Button></div>
      </form>
    </DialogContent></Dialog>
  </section>;
}