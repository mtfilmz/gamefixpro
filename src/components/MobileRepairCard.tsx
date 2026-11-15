import { Repair } from "@/types/repair";
import { Phone, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileRepairCardProps {
  repair: Repair;
  onEdit: (repair: Repair) => void;
  onShowQR: (repair: Repair) => void;
  onUpdateStatus: (repair: Repair) => void;
  onReopen: (repair: Repair) => void;
  onDetails: (repair: Repair) => void;
  onDelete: (repair: Repair) => void;
}

const estadoColor: Record<string, string> = {
  PENDIENTE: "bg-status-pending",
  "DIAGNÓSTICO": "bg-status-diagnostic",
  "EN REPARACIÓN": "bg-status-repairing",
  REPARADO: "bg-status-repaired",
  ENTREGADO: "bg-status-delivered",
};

const MobileRepairCard = ({ repair, onEdit, onShowQR, onUpdateStatus, onReopen, onDetails, onDelete }: MobileRepairCardProps) => {
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
        <Button variant="ghost" className="text-foreground font-semibold text-sm h-auto p-0 whitespace-normal text-left justify-start" onClick={() => onDetails(repair)}>{repair.cliente}</Button>
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
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="icon" title="Ver detalles" aria-label={`Ver detalles ${repair.id}`} onClick={() => onDetails(repair)}><Eye className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" title="Eliminar registro" aria-label={`Eliminar ${repair.id}`} className="text-destructive" onClick={() => onDelete(repair)}><Trash2 className="h-4 w-4" /></Button>
        <button
          onClick={() => onShowQR(repair)}
          className="flex-1 min-w-[60px] bg-primary text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          QR
        </button>
        <button
          onClick={() => onUpdateStatus(repair)}
          className="flex-1 min-w-[60px] bg-status-diagnostic text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          ESTADO
        </button>
        <button
          onClick={() => onEdit(repair)}
          className="flex-1 min-w-[60px] bg-stat-completed text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
        >
          EDITAR
        </button>
        {repair.estado === "ENTREGADO" && (
          <button
            onClick={() => onReopen(repair)}
            className="basis-full bg-status-pending text-primary-foreground text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform min-h-[44px]"
          >
            🔄 REABRIR CASO
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileRepairCard;
