import { Repair } from "@/types/repair";
import { Phone } from "lucide-react";

interface MobileRepairCardProps {
  repair: Repair;
  onEdit: (repair: Repair) => void;
  onShowQR: (repair: Repair) => void;
  onUpdateStatus: (repair: Repair) => void;
}

const estadoColor: Record<string, string> = {
  PENDIENTE: "bg-status-pending",
  "DIAGNÓSTICO": "bg-status-diagnostic",
  "EN REPARACIÓN": "bg-status-repairing",
  REPARADO: "bg-status-repaired",
  ENTREGADO: "bg-status-delivered",
};

const MobileRepairCard = ({ repair, onEdit, onShowQR, onUpdateStatus }: MobileRepairCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Top row: ID + Status */}
      <div className="flex items-center justify-between">
        <span className="text-foreground font-mono font-bold text-lg">{repair.id}</span>
        <span className={`${estadoColor[repair.estado] || "bg-muted"} text-xs font-bold px-3 py-1 rounded-full text-primary-foreground`}>
          {repair.estado}
        </span>
      </div>

      {/* Client info */}
      <div>
        <div className="text-foreground font-semibold text-sm">{repair.cliente}</div>
        <div className="flex items-center gap-2 mt-1">
          <a
            href={`tel:${repair.telefono}`}
            className="flex items-center gap-1.5 text-primary text-sm font-medium active:opacity-70 min-h-[44px]"
          >
            <Phone className="w-4 h-4" />
            {repair.telefono}
          </a>
        </div>
      </div>

      {/* Console info */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{repair.consola}</span>
        <span className="mx-1">—</span>
        {(repair.problemas || []).slice(0, 2).join(", ")}
        {(repair.problemas || []).length > 2 && <span className="text-primary"> +{repair.problemas.length - 2}</span>}
      </div>

      {/* Date */}
      <div className="text-xs text-muted-foreground">{repair.fecha}</div>

      {/* Action buttons - large touch targets */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onShowQR(repair)}
          className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          QR
        </button>
        <button
          onClick={() => onUpdateStatus(repair)}
          className="flex-1 bg-status-diagnostic text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          ESTADO
        </button>
        <button
          onClick={() => onEdit(repair)}
          className="flex-1 bg-stat-completed text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          EDITAR
        </button>
      </div>
    </div>
  );
};

export default MobileRepairCard;
