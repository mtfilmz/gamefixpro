import { Repair, EstadoReparacion } from "@/types/repair";
import MobileRepairCard from "./MobileRepairCard";

interface RepairTableProps {
  repairs: Repair[];
  onEdit: (repair: Repair) => void;
  onShowQR: (repair: Repair) => void;
  onUpdateStatus: (repair: Repair) => void;
  onReopen: (repair: Repair) => void;
  filterEstado: EstadoReparacion | "TODOS";
  onFilterChange: (f: EstadoReparacion | "TODOS") => void;
  searchQuery?: string;
  title?: string;
}

const estadoColor: Record<EstadoReparacion, string> = {
  PENDIENTE: "bg-status-pending",
  "DIAGNÓSTICO": "bg-status-diagnostic",
  "EN REPARACIÓN": "bg-status-repairing",
  REPARADO: "bg-status-repaired",
  ENTREGADO: "bg-status-delivered",
};

function getProblemSummary(repair: Repair): string {
  if (Array.isArray(repair.problemas) && repair.problemas.length > 0) {
    return repair.problemas.join(", ");
  }
  return repair.detalles || "Sin detalle";
}

const RepairTable = ({ repairs, onEdit, onShowQR, onUpdateStatus, onReopen, filterEstado, onFilterChange, searchQuery = "", title = "HISTORIAL DE EQUIPOS" }: RepairTableProps) => {
  const byEstado = filterEstado === "TODOS" ? repairs : repairs.filter((r) => r.estado === filterEstado);
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? byEstado.filter((r) =>
        [r.id, r.cliente, r.telefono, r.consola, r.marca, r.numeroSerie, ...(r.problemas || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    : byEstado;
  const estados: (EstadoReparacion | "TODOS")[] = ["TODOS", "PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"];

  return (
    <div className="mt-6">
      <div className="bg-secondary rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-primary font-bold text-base md:text-lg">{title}</h2>
      </div>

      {/* Filter pills - scrollable on mobile */}
      <div className="bg-secondary/50 px-4 py-2 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {estados.map((e) => (
            <button
              key={e}
              onClick={() => onFilterChange(e)}
              className={`text-xs px-3 py-2 rounded-full font-bold transition-colors whitespace-nowrap min-h-[36px] ${
                filterEstado === e ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground active:bg-muted/80"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3 p-3">
        {filtered.map((r) => (
          <MobileRepairCard
            key={r.id}
            repair={r}
            onEdit={onEdit}
            onShowQR={onShowQR}
            onUpdateStatus={onUpdateStatus}
            onReopen={onReopen}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">No hay registros</div>
        )}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-accent">
              <th className="py-3 px-4 text-accent-foreground font-bold text-left">ID</th>
              <th className="py-3 px-4 text-accent-foreground font-bold text-left">CLIENTE</th>
              <th className="py-3 px-4 text-accent-foreground font-bold text-left">CONSOLA</th>
              <th className="py-3 px-4 text-accent-foreground font-bold text-left">PROBLEMA</th>
              <th className="py-3 px-4 text-accent-foreground font-bold text-center">ESTADO</th>
              <th className="py-3 px-4 text-accent-foreground font-bold text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                <td className="py-3 px-4 text-foreground">{r.id}</td>
                <td className="py-3 px-4 text-foreground">{r.cliente}</td>
                <td className="py-3 px-4 text-foreground">{r.consola}</td>
                <td className="py-3 px-4 text-foreground">{getProblemSummary(r)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`${estadoColor[r.estado]} text-xs font-bold px-3 py-1 rounded-full text-primary-foreground`}>
                    {r.estado}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      onClick={() => onShowQR(r)}
                      className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => onUpdateStatus(r)}
                      className="bg-status-diagnostic text-primary-foreground text-xs font-bold px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                    >
                      ESTADO
                    </button>
                    <button
                      onClick={() => onEdit(r)}
                      className="bg-stat-completed text-primary-foreground text-xs font-bold px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                    >
                      EDIT
                    </button>
                    {r.estado === "ENTREGADO" && (
                      <button
                        onClick={() => onReopen(r)}
                        className="bg-status-pending text-primary-foreground text-xs font-bold px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
                        title="Crear nuevo caso para este equipo"
                      >
                        REABRIR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">No hay registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepairTable;
