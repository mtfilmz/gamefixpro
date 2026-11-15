import { Repair } from "@/types/repair";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageUploader from "./ImageUploader";
import RepairPayments from "./RepairPayments";

export default function RepairDetailsDialog({ repair, onClose }: { repair: Repair | null; onClose: () => void }) {
  if (!repair) return null;
  const fields = [["Cliente", repair.cliente], ["Teléfono", repair.telefono], ["Correo", repair.email], ["Equipo", `${repair.marca} — ${repair.consola}`], ["Número de serie", repair.numeroSerie], ["Color", repair.color], ["Accesorios", repair.accesorios], ["Ingreso", repair.fecha], ["Estado", repair.estado]];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto w-[calc(100%-2rem)]">
      <DialogHeader><DialogTitle>Detalles — {repair.id}</DialogTitle><DialogDescription>{repair.cliente} · {repair.consola}</DialogDescription></DialogHeader>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm text-foreground break-words">{value || "—"}</dd></div>)}</dl>
      <section className="border-t border-border pt-4 space-y-2"><h3 className="font-semibold">Problemas y notas</h3><p className="text-sm break-words">{repair.problemas.join(", ") || "—"}</p><p className="text-sm whitespace-pre-wrap break-words">{repair.detalles || "—"}</p></section>
      <section className="border-t border-border pt-4"><h3 className="font-semibold mb-2">Costos</h3><dl className="grid grid-cols-2 gap-2 text-sm">{[["Diagnóstico", repair.costoDiagnostico ?? 0], ["Reparación", repair.costoReparacion ?? 0], ["Componente", repair.costoComponente ?? 0], ["Total", (repair.costoReparacion ?? 0) + (repair.costoComponente ?? 0) - (repair.costoDiagnostico ?? 0)]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt>{label}</dt><dd>${Number(value).toFixed(2)}</dd></div>)}</dl></section>
      <section className="border-t border-border pt-4"><h3 className="font-semibold mb-2">Fotos</h3>{repair.imagenes?.length ? <ImageUploader images={repair.imagenes} onChange={() => {}} readOnly /> : <p className="text-sm text-muted-foreground">Sin fotos</p>}</section>
      <section className="border-t border-border pt-4 space-y-2"><h3 className="font-semibold">Historial de estados</h3>{repair.historial?.length ? repair.historial.slice().reverse().map((entry, index) => <div key={index} className="text-sm break-words"><p className="font-medium">{entry.estado} · {new Date(entry.fecha).toLocaleString("es-MX")}</p>{entry.nota && <p className="text-muted-foreground">{entry.nota}</p>}</div>) : <p className="text-sm text-muted-foreground">Sin cambios registrados</p>}</section>
      <section className="border-t border-border pt-4"><h3 className="font-semibold mb-2">Pagos cobrados</h3><RepairPayments repairId={repair.id} /></section>
    </DialogContent>
  </Dialog>;
}