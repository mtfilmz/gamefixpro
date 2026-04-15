import { Repair } from "@/types/repair";

interface StatsCardsProps {
  repairs: Repair[];
}

const StatsCards = ({ repairs }: StatsCardsProps) => {
  const saldo = repairs
    .filter((r) => r.estado !== "ENTREGADO")
    .reduce((sum, r) => sum + (r.costoDiagnostico || 0) + (r.costoReparacion || 0), 0);

  const formatMoney = (n: number) =>
    "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="mb-4">
      <div className="bg-stat-revenue rounded-xl p-5 border-2 border-foreground/20 shadow-lg flex flex-col items-center justify-center max-w-xs">
        <span className="text-3xl font-bold text-primary-foreground">{formatMoney(saldo)}</span>
        <span className="text-xs font-bold text-primary-foreground/90 mt-1">SALDO A COBRAR</span>
      </div>
    </div>
  );
};

export default StatsCards;
