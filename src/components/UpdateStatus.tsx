import { useState } from "react";
import { Repair, EstadoReparacion, StatusChange } from "@/types/repair";
import { X, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import { notifyStatusChange } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import RepairPayments from "./RepairPayments";
import { getConfig } from "@/lib/config";

interface UpdateStatusProps {
  repair: Repair | null;
  open: boolean;
  onClose: () => void;
  onSave: (repair: Repair) => void;
  onShowQR: (repair: Repair) => void;
}

const colorPorEstado: Record<string, string> = {
  PENDIENTE: "bg-status-pending",
  DIAGNÓSTICO: "bg-status-diagnostic",
  "EN REPARACIÓN": "bg-status-repairing",
  "EN MANTENIMIENTO": "bg-status-repairing",
  REPARADO: "bg-status-repaired",
  "LISTO PARA ENTREGAR": "bg-status-repaired",
  ENTREGADO: "bg-status-delivered",
};

/** Los estados salen de Configuración › Estados de Reparación (incluye los que agregues, como LISTO PARA ENTREGAR). */
function estadosConfigurados(): { value: EstadoReparacion; label: string; colorClass: string }[] {
  return getConfig().estados.map((value) => ({
    value: value as EstadoReparacion,
    label: value,
    colorClass: colorPorEstado[value] || "bg-accent",
  }));
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const UpdateStatus = ({ repair, open, onClose, onSave, onShowQR }: UpdateStatusProps) => {
  const [selectedEstado, setSelectedEstado] = useState<EstadoReparacion | null>(null);
  const [nota, setNota] = useState("");
  const [costoReparacion, setCostoReparacion] = useState<string>("");
  const [costoComponente, setCostoComponente] = useState<string>("");

  // Reset when repair changes
  const [lastRepairId, setLastRepairId] = useState<string | null>(null);
  if (repair && repair.id !== lastRepairId) {
    setLastRepairId(repair.id);
    setSelectedEstado(null);
    setNota("");
    setCostoReparacion(repair.costoReparacion != null ? String(repair.costoReparacion) : "");
    setCostoComponente(repair.costoComponente != null ? String(repair.costoComponente) : "");
  }

  if (!open || !repair) return null;

  const historial = repair.historial || [];
  const currentEstado = repair.estado;
  const estados = estadosConfigurados();

  const handleSave = () => {
    if (!selectedEstado || selectedEstado === currentEstado) {
      toast.error("Selecciona un estado diferente al actual");
      return;
    }

    const newEntry: StatusChange = {
      estado: selectedEstado,
      fecha: new Date().toISOString(),
      nota: nota.trim() || undefined,
    };

    const updated: Repair = {
      ...repair,
      estado: selectedEstado,
      historial: [...historial, newEntry],
      costoReparacion: costoReparacion ? parseFloat(costoReparacion) : repair.costoReparacion,
      costoComponente: costoComponente ? parseFloat(costoComponente) : repair.costoComponente,
    };

    onSave(updated);
    notifyStatusChange(updated.id, updated.cliente, selectedEstado);
    toast.success(`Estado actualizado a ${selectedEstado}`);
    setSelectedEstado(null);
    setNota("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl">
        {/* Header */}
        <div className="bg-primary rounded-t-xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-foreground">Actualizar Estado — {repair.id}</h2>
          <button onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
          {/* LEFT PANEL - Info + Timeline */}
          <div className="space-y-5">
            {/* Equipment Info */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">📋 Información del Equipo</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="text-foreground font-bold">{repair.id}</span>
                <span className="text-muted-foreground">Cliente:</span>
                <span className="text-foreground font-semibold">{repair.cliente}</span>
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="text-foreground">{repair.telefono}</span>
                <span className="text-muted-foreground">Consola:</span>
                <span className="text-foreground">
                  {repair.marca} — {repair.consola}
                </span>
                {repair.numeroSerie && (
                  <>
                    <span className="text-muted-foreground">Serie:</span>
                    <span className="text-foreground">{repair.numeroSerie}</span>
                  </>
                )}
                <span className="text-muted-foreground">Ingreso:</span>
                <span className="text-foreground">{repair.fecha}</span>
              </div>
            </section>

            {/* Problems */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">⚠️ Problemas Reportados</h3>
              <ul className="space-y-1">
                {(repair.problemas || []).map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-status-repaired shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              {repair.detalles && (
                <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-2">{repair.detalles}</p>
              )}
            </section>

            {/* Photos */}
            {repair.imagenes && repair.imagenes.length > 0 && (
              <section className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">📷 Fotos del Equipo</h3>
                <ImageUploader images={repair.imagenes} onChange={() => {}} readOnly />
              </section>
            )}

            {/* Timeline */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">🕐 Historial de Estados</h3>
              {historial.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin cambios de estado registrados aún.</p>
              ) : (
                <div className="relative ml-3">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {historial.map((entry, i) => {
                      const estadoMeta = estados.find((e) => e.value === entry.estado);
                      return (
                        <div key={i} className="relative pl-6">
                          <div
                            className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-card ${estadoMeta?.colorClass || "bg-muted"}`}
                          />
                          <div className="text-xs text-muted-foreground">{formatTimestamp(entry.fecha)}</div>
                          <div className="text-sm font-bold text-foreground">{entry.estado}</div>
                          {entry.nota && <div className="text-xs text-muted-foreground mt-0.5">"{entry.nota}"</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT PANEL - Update Status */}
          <div className="space-y-5">
            {/* Current status */}
            <section className="bg-muted/30 border border-border rounded-lg p-4 text-center">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">Estado Actual</h3>
              <span
                className={`inline-block text-lg font-black px-6 py-2 rounded-full text-primary-foreground ${estados.find((e) => e.value === currentEstado)?.colorClass}`}
              >
                {currentEstado}
              </span>
            </section>

            {/* Select new status */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">🔄 Cambiar a:</h3>
              <div className="grid grid-cols-1 gap-2">
                {estados.map((e) => {
                  const isSelected = selectedEstado === e.value;
                  const isCurrent = currentEstado === e.value;
                  return (
                    <button
                      key={e.value}
                      onClick={() => !isCurrent && setSelectedEstado(e.value)}
                      disabled={isCurrent}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                        isCurrent
                          ? "opacity-40 cursor-not-allowed bg-muted/50 text-muted-foreground"
                          : isSelected
                            ? `${e.colorClass} text-primary-foreground ring-2 ring-foreground`
                            : `${e.colorClass}/20 text-foreground border border-border hover:border-foreground/50`
                      }`}
                    >
                      <span>{e.label}</span>
                      {isSelected && <Check className="w-5 h-5" />}
                      {isCurrent && <span className="text-xs opacity-70">(actual)</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Costs */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">💰 Costos</h3>
              {repair.costoDiagnostico != null && (
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">Diagnóstico:</span>
                  <span className="text-foreground font-bold">${repair.costoDiagnostico.toFixed(2)}</span>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Costo de Reparación</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={costoReparacion}
                    onChange={(e) => setCostoReparacion(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground mb-1 block">Componente Adicional</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={costoComponente}
                    onChange={(e) => setCostoComponente(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]"
                  />
                </div>
              </div>
              {(repair.costoDiagnostico != null || costoReparacion || costoComponente) && (
                <div className="flex justify-between items-center text-sm mt-3 pt-2 border-t border-border">
                  <span className="text-foreground font-bold">Total:</span>
                  <span className="text-primary font-black text-lg">
                    $
                    {(
                      (costoReparacion ? parseFloat(costoReparacion) : 0) +
                      (costoComponente ? parseFloat(costoComponente) : 0) -
                      (repair.costoDiagnostico || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-primary font-bold text-sm uppercase tracking-wide">Pagos cobrados</h3>
              <RepairPayments repairId={repair.id} />
            </section>

            {/* Notes */}
            <section className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">📝 Notas del cambio</h3>
              <textarea
                placeholder="Agregar comentarios sobre la actualización (opcional)..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              />
            </section>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button onClick={() => onShowQR(repair)} className="w-full">
                <LinkIcon className="w-4 h-4" />
                Compartir registro y factura
              </Button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-destructive text-destructive-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => onShowQR(repair)}
                  className="flex-1 bg-status-delivered text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Ver QR
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-status-repaired text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatus;
