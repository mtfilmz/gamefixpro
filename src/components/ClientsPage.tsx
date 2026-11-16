import { useMemo, useState } from "react";
import { Search, UserPlus, Users, Phone, Mail, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/types/repair";
import { clientDirectory, clientSchema, clientKey, DirectoryClient } from "@/lib/clients";
import { findPreviousClients } from "@/lib/previous-clients";
import { useClients } from "@/hooks/use-clients";
import { toast } from "sonner";
import TechClientConflicts from "./TechClientConflicts";

const inputClass = "w-full bg-input border border-border rounded-md px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export default function ClientsPage({ repairs }: { repairs: Repair[] }) {
  const { clients, loading, error, refresh, addClient, editClient } = useClients();
  const [editing, setEditing] = useState<DirectoryClient | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ cliente: "", telefono: "", email: "", contacto: "", direccion: "", notas: "" });
  const [formError, setFormError] = useState("");
  const directory = useMemo(() => clientDirectory(repairs, clients), [repairs, clients]);
  const visible = query.trim() ? directory.filter(client => findPreviousClients([client], query).length > 0) : directory;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message || "Revisa los datos"); return; }
    const client = { ...parsed.data, cliente: parsed.data.cliente || "", telefono: parsed.data.telefono || "", email: parsed.data.email || "" };
    if (directory.some(existing => existing !== editing && clientKey(existing) === clientKey(client))) { setFormError("Este cliente ya está en tu lista"); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editing) await editClient(editing, client);
      else await addClient(client);
      setQuery("");
      setOpen(false);
      toast.success(editing ? "Cliente actualizado" : "Cliente guardado");
    } catch { setFormError("No se pudo guardar el cliente. Intenta nuevamente."); }
    finally { setSaving(false); }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Clientes</h1><p className="text-sm text-muted-foreground mt-1">{directory.length} clientes</p></div>
      <Button onClick={() => { setEditing(null); setForm({ cliente: "", telefono: "", email: "", contacto: "", direccion: "", notas: "" }); setFormError(""); setOpen(true); }}><UserPlus />Agregar cliente</Button>
    </div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input aria-label="Buscar clientes" type="search" placeholder="Nombre, teléfono o correo" value={query} onChange={event => setQuery(event.target.value)} className={`${inputClass} pl-10`} /></div>
    <TechClientConflicts />
    {error && <div role="alert" className="text-sm text-destructive">No se pudieron cargar los clientes guardados. <Button variant="link" onClick={() => refresh()}>Reintentar</Button></div>}
    {loading ? <p role="status" className="text-muted-foreground">Cargando clientes...</p> : visible.length ? <div className="divide-y divide-border border-y border-border">
      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_2.5rem] gap-4 py-3 text-xs uppercase font-bold text-muted-foreground"><span>Cliente</span><span>Teléfono</span><span>Correo</span><span /></div>
      {visible.map((client, index) => <div key={client.id || index} className="record-highlight grid grid-cols-[1fr_2.5rem] md:grid-cols-[1fr_1fr_1fr_2.5rem] gap-2 md:gap-4 py-4 text-sm">
        <span className="font-semibold break-words">{client.cliente}</span>
        <span className="flex items-start gap-2 min-w-0 col-start-1 md:col-start-auto"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-words">{client.telefono || "Sin teléfono"}</span></span>
        <span className="flex items-start gap-2 min-w-0 col-start-1 md:col-start-auto"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-all">{client.email || "Sin correo"}</span></span>
        <Button variant="ghost" size="icon" className="col-start-2 row-start-1 md:col-start-4" aria-label={`Editar cliente ${client.cliente}`} title="Editar cliente" onClick={() => { setEditing(client); setForm({ cliente: client.cliente, telefono: client.telefono, email: client.email, contacto: client.contacto || "", direccion: client.direccion || "", notas: client.notas || "" }); setFormError(""); setOpen(true); }}><Pencil /></Button>
      </div>)}
    </div> : <p role="status" className="text-muted-foreground py-8">{query.trim() ? "No se encontraron clientes" : "Aún no hay clientes"}</p>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "Editar cliente" : "Agregar cliente"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1"><label htmlFor="client-name">Nombre *</label><input id="client-name" autoComplete="name" required maxLength={200} value={form.cliente} onChange={event => setForm({ ...form, cliente: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-phone">Teléfono</label><input id="client-phone" type="tel" autoComplete="tel" maxLength={30} value={form.telefono} onChange={event => setForm({ ...form, telefono: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-email">Correo</label><input id="client-email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-contact">Persona de contacto</label><input id="client-contact" maxLength={200} value={form.contacto} onChange={event => setForm({ ...form, contacto: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-address">Dirección</label><input id="client-address" maxLength={1000} value={form.direccion} onChange={event => setForm({ ...form, direccion: event.target.value })} className={inputClass} /></div>
        <div className="space-y-1"><label htmlFor="client-notes">Notas del cliente</label><textarea id="client-notes" maxLength={4000} rows={2} value={form.notas} onChange={event => setForm({ ...form, notas: event.target.value })} className={inputClass} /></div>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cliente"}</Button></div>
      </form>
    </DialogContent></Dialog>
  </section>;
}