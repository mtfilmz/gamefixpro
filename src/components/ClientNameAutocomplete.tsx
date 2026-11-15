import { useEffect, useMemo, useRef, useState } from "react";
import { Repair } from "@/types/repair";
import { PreviousClient, findPreviousClients } from "@/lib/previous-clients";
import { useClients } from "@/hooks/use-clients";
import { clientDirectory } from "@/lib/clients";

interface ClientNameAutocompleteProps {
  repairs: Repair[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: PreviousClient) => void;
  inputClass: string;
  hasError?: boolean;
}

/**
 * Campo "Nombre completo" con autocompletado: mientras el usuario escribe,
 * sugiere clientes ya registrados (de reparaciones y del directorio de clientes)
 * y al elegir uno rellena nombre, teléfono y correo.
 */
export default function ClientNameAutocomplete({ repairs, value, onChange, onSelect, inputClass, hasError }: ClientNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { clients: savedClients } = useClients();
  const clients = useMemo(() => clientDirectory(repairs, savedClients), [repairs, savedClients]);
  const matches = useMemo(() => findPreviousClients(clients, value).slice(0, 6), [clients, value]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => setHighlight(0), [value]);

  const pick = (client: PreviousClient) => {
    onSelect(client);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        required
        placeholder="Nombre completo *"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => (h + 1) % matches.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => (h - 1 + matches.length) % matches.length); }
          else if (e.key === "Enter") { e.preventDefault(); pick(matches[highlight]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className={inputClass}
        maxLength={100}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls="client-name-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={open && matches.length > 0 ? `client-suggestion-${highlight}` : undefined}
      />
      {open && value.trim() && matches.length > 0 && (
        <ul
          id="client-name-suggestions"
          role="listbox"
          aria-label="Clientes registrados"
          className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto"
        >
          {matches.map((client, index) => (
            <li key={`${client.cliente}-${client.telefono}-${index}`} role="option" id={`client-suggestion-${index}`} aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(client)}
                onMouseEnter={() => setHighlight(index)}
                className={`w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 transition-colors ${index === highlight ? "bg-primary/15" : "hover:bg-muted/50"}`}
              >
                <span className="block font-semibold text-sm text-foreground break-words">{client.cliente}</span>
                <span className="block text-xs text-muted-foreground break-words">
                  {[client.telefono, client.email].filter(Boolean).join(" · ") || "Sin contacto"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasError && <p className="text-destructive text-xs mt-1">Nombre requerido</p>}
    </div>
  );
}
