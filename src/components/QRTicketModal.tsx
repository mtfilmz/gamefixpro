import { useRef, useCallback, useEffect, useState } from "react";
import { Repair } from "@/types/repair";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2, Printer, Phone, Link as LinkIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { toBlob } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getTrackUrl } from "@/lib/public-url";
import { repairTotal, repairMessage, smsLink, shareReceipt } from "@/lib/repair-sharing";

interface QRTicketModalProps {
  repair: Repair | null;
  open: boolean;
  onClose: () => void;
}

const QRTicketModal = ({ repair, open, onClose }: QRTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<{ repair: Repair; file: File } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [shareOptions, setShareOptions] = useState(false);
  const trackUrl = repair ? getTrackUrl(repair.id) : "";
  const file = image?.repair === repair ? image.file : null;

  useEffect(() => {
    setImage(null);
    setImageError(false);
    setShareOptions(false);
    if (!open || !repair) return;
    let cancelled = false;
    const node = ticketRef.current;
    if (!node) return;
    // Capture only the receipt, never surrounding controls or private photos.
    toBlob(node, { pixelRatio: 2, filter: element => !(element instanceof HTMLElement && element.dataset.capture === "exclude") })
      .then(blob => {
        if (cancelled) return;
        if (!blob) { setImageError(true); return; }
        setImage({ repair, file: new File([blob], `Factura-${repair.id.replace(/[^a-z0-9-]/gi, "")}.png`, { type: "image/png" }) });
      }).catch(() => { if (!cancelled) setImageError(true); });
    return () => { cancelled = true; };
  }, [open, repair]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const download = useCallback(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast.success("Imagen de factura descargada");
  }, [file]);

  const share = async () => {
    if (!repair || !file) return;
    const result = await shareReceipt(navigator, file, `Super Mobile Game Fix ${repair.id}`, repairMessage(repair, trackUrl), trackUrl);
    if (result === "options") setShareOptions(true);
  };

  if (!open || !repair) return null;
  const sms = smsLink(repair.telefono, repairMessage(repair, trackUrl), navigator.userAgent);
  const costs = [["Reparación", repair.costoReparacion ?? 0], ["Componente", repair.costoComponente ?? 0], ["Diagnóstico acreditado", -(repair.costoDiagnostico ?? 0)]] as const;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Compartir registro ${repair.id}`} className="fixed inset-0 z-[60] flex flex-col items-center bg-background/90 overflow-y-auto p-3 md:p-6">
      <div className="w-full max-w-lg flex flex-wrap items-center justify-end gap-2 mb-3 print:hidden">
        <Button size="icon" variant="secondary" title="Descargar factura" aria-label="Descargar factura" onClick={download} disabled={!file}><Download /></Button>
        <Popover open={shareOptions} onOpenChange={setShareOptions}>
          <PopoverTrigger asChild><Button size="icon" title="Compartir factura" aria-label="Compartir factura" onClick={event => { event.preventDefault(); void share(); }} disabled={!file}><Share2 /></Button></PopoverTrigger>
          <PopoverContent align="end" onEscapeKeyDown={event => event.stopPropagation()} className="z-[70] space-y-2 max-w-[calc(100vw-2rem)]">
            <h3 className="font-semibold text-sm">Compartir registro</h3>
            <Button asChild variant="secondary" className="w-full"><a href={`https://wa.me/?text=${encodeURIComponent(repairMessage(repair, trackUrl))}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
            {sms && <Button asChild variant="secondary" className="w-full"><a href={sms}><MessageSquare />Mensaje de texto</a></Button>}
            <Button asChild variant="secondary" className="w-full"><a href={`mailto:${encodeURIComponent(repair.email || "")}?subject=${encodeURIComponent(`Super Mobile Game Fix ${repair.id}`)}&body=${encodeURIComponent(repairMessage(repair, trackUrl))}`}>Correo electrónico</a></Button>
            <Button variant="outline" className="w-full" onClick={async () => {
              try { await navigator.clipboard.writeText(repairMessage(repair, trackUrl)); toast.success("Registro copiado"); setShareOptions(false); }
              catch { toast.error("No se pudo copiar el registro"); }
            }}><LinkIcon />Copiar registro y enlace</Button>
            <p className="text-xs text-muted-foreground">Estas opciones envían texto y enlace; la imagen requiere adjuntarla desde tu dispositivo.</p>
          </PopoverContent>
        </Popover>
        {sms ? <Button asChild variant="secondary"><a href={sms} aria-label="Enviar SMS al cliente" title={`Enviar SMS a ${repair.telefono}`}><MessageSquare /> SMS</a></Button> : <Button variant="secondary" disabled title="El registro no tiene un teléfono válido"><MessageSquare /> SMS</Button>}
        <Button size="icon" variant="secondary" title="Imprimir factura" aria-label="Imprimir factura" onClick={() => window.print()}><Printer /></Button>
        <Button size="icon" variant="destructive" title="Cerrar" aria-label="Cerrar comprobante" onClick={onClose}><X /></Button>
      </div>
      {imageError && <p role="alert" className="text-destructive mb-3 print:hidden">No se pudo generar la imagen. Cierra y vuelve a abrir el comprobante.</p>}
      <div ref={ticketRef} className="repair-receipt w-full max-w-lg overflow-hidden shrink-0" id="print-ticket">
        <header className="px-6 py-5 border-b border-inherit break-words">
          <h2 className="text-xl font-bold">Súper Mobile Tech Repair</h2>
          <address className="not-italic text-sm mt-2 space-y-1">
            <p>PR-185 Km 5.0, Campo Rico, Canóvanas</p>
            <p>Tel: 9394848958</p>
            <p>reparaciondecelularespr.com</p>
          </address>
          <p className="text-xl font-bold text-center mt-5">FACTURA DE SERVICIO</p>
          <p className="text-xs text-center mt-1">Comprobante de reparación</p>
        </header>
        <div className="px-6 py-4 border-b border-inherit flex justify-between gap-3">
          <div><p className="text-xs uppercase">Orden de servicio</p><p className="text-3xl font-black break-all">{repair.id}</p></div>
          <div className="text-right text-sm"><p>{repair.fecha}</p><p className="font-bold mt-1">{repair.estado}</p></div>
        </div>
        <section className="px-6 py-4 border-b border-inherit break-words">
          <h3 className="text-xs uppercase font-bold mb-2">Cliente</h3>
          <p className="font-bold">{repair.cliente}</p>
          <p className="flex items-center gap-2 text-sm mt-1"><Phone size={14} />{repair.telefono || "Sin teléfono"}</p>
          {repair.email && <p className="text-sm mt-1">{repair.email}</p>}
        </section>
        <section className="px-6 py-4 border-b border-inherit break-words text-sm space-y-1">
          <h3 className="text-xs uppercase font-bold mb-2">Equipo</h3>
          <p className="font-bold">{repair.marca} — {repair.consola}</p>
          {repair.numeroSerie && <p>Serie: {repair.numeroSerie}</p>}
          {repair.color && <p>Color: {repair.color}</p>}
          {repair.accesorios && <p>Accesorios: {repair.accesorios}</p>}
          <p className="pt-2 font-semibold">Problemas reportados</p>
          <p>{repair.problemas.join(", ") || "—"}</p>
          {repair.detalles && <p className="whitespace-pre-wrap">{repair.detalles}</p>}
        </section>
        <section className="px-6 py-4 border-b border-inherit">
          <h3 className="text-xs uppercase font-bold mb-3">Costos presupuestados</h3>
          <dl className="space-y-2 text-sm">{costs.map(([label, amount]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="shrink-0">{amount < 0 ? "−" : ""}${Math.abs(amount).toFixed(2)}</dd></div>)}
            <div className="flex justify-between gap-3 border-t border-inherit pt-3 font-bold text-lg"><dt>Total</dt><dd>${repairTotal(repair).toFixed(2)}</dd></div>
          </dl>
          <p className="text-xs mt-3">Presupuesto de servicio; no acredita pago ni sustituye una factura fiscal.</p>
        </section>
        <div className="px-6 py-5 flex flex-col items-center gap-3">
          <QRCodeSVG value={trackUrl} size={160} level="H" />
          <p className="text-xs">Seguimiento de la reparación</p>
          <Button data-capture="exclude" variant="link" className="print:hidden" onClick={async () => {
            try { await navigator.clipboard.writeText(trackUrl); toast.success("Enlace copiado"); }
            catch { toast.error("No se pudo copiar el enlace"); }
          }}><LinkIcon />Copiar enlace</Button>
        </div>
        <footer className="px-6 py-3 border-t border-inherit text-center text-xs font-semibold">Super Mobile Game Fix · {repair.id}</footer>
      </div>
    </div>
  );
};
export default QRTicketModal;
