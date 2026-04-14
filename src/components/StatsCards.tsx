import { Repair } from "@/types/repair";

interface StatsCardsProps {
  repairs: Repair[];
}

const StatsCards = ({ repairs }: StatsCardsProps) => {
  const pendientes = repairs.filter((r) => r.estado === "PENDIENTE").length;
  const enReparacion = repairs.filter((r) => r.estado === "EN REPARACIÓN" || r.estado === "DIAGNÓSTICO").length;
  const completados = repairs.filter((r) => r.estado === "REPARADO" || r.estado === "ENTREGADO").length;

  const stats = [
    { value: pendientes, label: "PENDIENTES", colorClass: "bg-stat-pending" },
    { value: enReparacion, label: "EN REPARACIÓN", colorClass: "bg-stat-repairing" },
    { value: completados, label: "COMPLETADOS", colorClass: "bg-stat-completed" },
    { value: "$2,350", label: "INGRESOS", colorClass: "bg-stat-revenue" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`${s.colorClass} rounded-xl p-5 border-2 border-foreground/20 shadow-lg flex flex-col items-center justify-center`}
        >
          <span className="text-3xl font-bold text-primary-foreground">{s.value}</span>
          <span className="text-xs font-bold text-primary-foreground/90 mt-1">{s.label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
