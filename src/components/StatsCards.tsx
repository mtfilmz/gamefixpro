import { Repair, EstadoReparacion } from "@/types/repair";

interface StatsCardsProps {
  repairs: Repair[];
  onSelectEstado?: (estado: EstadoReparacion | "TODOS") => void;
}

const StatsCards = ({ repairs, onSelectEstado }: StatsCardsProps) => {
  const pendientes = repairs.filter((r) => r.estado === "PENDIENTE").length;
  const diagnostico = repairs.filter((r) => r.estado === "DIAGNÓSTICO").length;
  const enReparacion = repairs.filter((r) => r.estado === "EN REPARACIÓN").length;
  const reparados = repairs.filter((r) => r.estado === "REPARADO").length;
  const entregados = repairs.filter((r) => r.estado === "ENTREGADO").length;

  const cards: { label: string; value: string; className: string; estado?: EstadoReparacion | "TODOS" }[] = [
    { label: "PENDIENTES", value: String(pendientes), className: "bg-status-pending", estado: "PENDIENTE" },
    { label: "DIAGNÓSTICO", value: String(diagnostico), className: "bg-status-diagnostic", estado: "DIAGNÓSTICO" },
    { label: "EN REPARACIÓN", value: String(enReparacion), className: "bg-status-repairing", estado: "EN REPARACIÓN" },
    { label: "REPARADOS", value: String(reparados), className: "bg-status-repaired", estado: "REPARADO" },
    { label: "ENTREGADOS", value: String(entregados), className: "bg-status-delivered", estado: "ENTREGADO" },
  ];

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {cards.map((c) => {
          const clickable = !!c.estado && !!onSelectEstado;
          const Tag: any = clickable ? "button" : "div";
          return (
            <Tag
              key={c.label}
              onClick={clickable ? () => onSelectEstado!(c.estado!) : undefined}
              className={`${c.className} rounded-xl p-4 border border-foreground/10 shadow flex flex-col items-center justify-center min-h-[80px] text-left ${
                clickable ? "active:scale-95 hover:opacity-90 transition-all cursor-pointer" : ""
              }`}
            >
              <span className="text-2xl font-black text-primary-foreground">{c.value}</span>
              <span className="text-[10px] font-bold text-primary-foreground/90 mt-0.5 uppercase tracking-wide text-center leading-tight">{c.label}</span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default StatsCards;
