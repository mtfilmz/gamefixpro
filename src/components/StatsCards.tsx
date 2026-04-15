import { Repair } from "@/types/repair";

interface StatsCardsProps {
  repairs: Repair[];
}

const StatsCards = ({ repairs }: StatsCardsProps) => {
  const pendientes = repairs.filter((r) => r.estado === "PENDIENTE").length;
  const diagnostico = repairs.filter((r) => r.estado === "DIAGNÓSTICO").length;
  const enReparacion = repairs.filter((r) => r.estado === "EN REPARACIÓN").length;
  const reparados = repairs.filter((r) => r.estado === "REPARADO").length;
  const entregados = repairs.filter((r) => r.estado === "ENTREGADO").length;

  const saldo = repairs
    .filter((r) => r.estado !== "ENTREGADO")
    .reduce((sum, r) => {
      const reparacion = r.costoReparacion || 0;
      const componente = r.costoComponente || 0;
      const diag = r.costoDiagnostico || 0;
      return sum + reparacion + componente + diag;
    }, 0);

  const formatMoney = (n: number) =>
    "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const cards = [
    { label: "PENDIENTES", count: pendientes, className: "bg-status-pending" },
    { label: "DIAGNÓSTICO", count: diagnostico, className: "bg-status-diagnostic" },
    { label: "EN REPARACIÓN", count: enReparacion, className: "bg-status-repairing" },
    { label: "REPARADOS", count: reparados, className: "bg-status-repaired" },
    { label: "ENTREGADOS", count: entregados, className: "bg-status-delivered" },
  ];

  return (
    <div className="mb-4 space-y-3">
      {/* Status count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`${c.className} rounded-xl p-3 border border-foreground/10 shadow flex flex-col items-center justify-center`}
          >
            <span className="text-2xl font-black text-primary-foreground">{c.count}</span>
            <span className="text-[10px] font-bold text-primary-foreground/90 mt-0.5 uppercase tracking-wide">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Revenue card */}
      <div className="bg-stat-revenue rounded-xl p-5 border-2 border-foreground/20 shadow-lg flex flex-col items-center justify-center max-w-xs">
        <span className="text-3xl font-bold text-primary-foreground">{formatMoney(saldo)}</span>
        <span className="text-xs font-bold text-primary-foreground/90 mt-1">SALDO A COBRAR</span>
      </div>
    </div>
  );
};

export default StatsCards;
