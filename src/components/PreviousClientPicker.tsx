import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Repair } from "@/types/repair";
import { PreviousClient, findPreviousClients } from "@/lib/previous-clients";
import { useClients } from "@/hooks/use-clients";
import { clientDirectory } from "@/lib/clients";

export default function PreviousClientPicker({ repairs, onSelect }: { repairs: Repair[]; onSelect: (client: PreviousClient) => void }) {
  const [query, setQuery] = useState("");
  const { clients: savedClients } = useClients();
  const clients = useMemo(() => clientDirectory(repairs, savedClients), [repairs, savedClients]);
  const matches = useMemo(() => findPreviousClients(clients, query), [clients, query]);
  return <div className="mb-4 space-y-2">
    <label htmlFor="previous-client-search" className="text-sm font-medium">Buscar cliente anterior</label>
    <div className="relative">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <input id="previous-client-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nombre, teléfono o correo" autoComplete="off" className="w-full bg-input border border-border rounded-md pl-10 pr-12 py-3 text-base min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      {query && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" aria-label="Limpiar búsqueda de cliente" title="Limpiar búsqueda" onClick={() => setQuery("")}><X /></Button>}
    </div>
    {query.trim() && <div className="border border-border rounded-md max-h-52 overflow-y-auto" aria-label="Clientes anteriores">
      {matches.length ? matches.map((client, index) => <Button key={index} type="button" variant="ghost" className="w-full h-auto min-h-14 rounded-none px-3 py-3 justify-start text-left whitespace-normal border-b border-border last:border-b-0" onClick={() => { onSelect(client); setQuery(""); }}>
        <span className="min-w-0"><span className="block font-semibold break-words">{client.cliente}</span><span className="block text-xs text-muted-foreground break-words">{[client.telefono, client.email].filter(Boolean).join(" · ") || "Sin contacto"}</span></span>
      </Button>) : <p className="p-3 text-sm text-muted-foreground" role="status">No se encontraron clientes</p>}
    </div>}
  </div>;
}