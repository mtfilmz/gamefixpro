import { useRef, useCallback } from "react";
import { Repair } from "@/types/repair";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2, Printer } from "lucide-react";

interface QRTicketModalProps {
  repair: Repair | null;
  open: boolean;
  onClose: () => void;
}

const QRTicketModal = ({ repair, open, onClose }: QRTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const qrValue = repair ? `GAMEFIX-${repair.id}-${repair.consola}-${repair.cliente}` : "";

  const handleDownloadQR = useCallback(() => {
    if (!repair) return;
    const svg = document.getElementById("qr-ticket-svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = `QR-${repair.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [repair]);

  const handleShare = useCallback(async () => {
    if (!repair) return;
    const text = `Game Fix Pro - ${repair.id}\nCliente: ${repair.cliente}\nConsola: ${repair.consola}\nEstado: ${repair.estado}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Game Fix Pro ${repair.id}`, text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Información copiada al portapapeles");
    }
  }, [repair]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!open || !repair) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 backdrop-blur-sm overflow-y-auto py-6 px-4 print:bg-white print:p-0">
      {/* Action buttons - hidden on print */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2 print:hidden">
        <button
          onClick={handleDownloadQR}
          className="bg-status-repaired text-primary-foreground p-2.5 rounded-lg hover:opacity-80 transition-opacity"
          title="Descargar QR"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={handleShare}
          className="bg-stat-completed text-primary-foreground p-2.5 rounded-lg hover:opacity-80 transition-opacity"
          title="Compartir"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={handlePrint}
          className="bg-accent text-accent-foreground p-2.5 rounded-lg hover:opacity-80 transition-opacity"
          title="Imprimir ticket"
        >
          <Printer className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="bg-destructive text-destructive-foreground p-2.5 rounded-lg hover:opacity-80 transition-opacity"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="bg-white text-gray-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full"
        id="print-ticket"
      >
        {/* Header */}
        <div className="bg-[hsl(var(--primary))] px-6 py-5 text-center">
          <div className="text-3xl font-black text-white tracking-wider">[&gt;] GAME FIX PRO</div>
          <div className="text-white/80 text-sm mt-1 font-medium tracking-wide">Comprobante de Recepción</div>
        </div>

        {/* ID grande */}
        <div className="text-center py-4 border-b-2 border-dashed border-gray-300">
          <div className="text-xs text-gray-500 uppercase tracking-widest">Orden de Servicio</div>
          <div className="text-5xl font-black text-gray-900 mt-1">{repair.id}</div>
          <div className="text-sm text-gray-500 mt-1">{repair.fecha}</div>
        </div>

        {/* Datos del cliente */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cliente</div>
          <div className="text-base font-bold text-gray-900">{repair.cliente}</div>
          <div className="text-sm text-gray-600">{repair.telefono}</div>
          {repair.email && <div className="text-sm text-gray-600">{repair.email}</div>}
        </div>

        {/* Datos de la consola */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Equipo</div>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span className="text-gray-500">Marca:</span>
            <span className="font-semibold text-gray-900">{repair.marca}</span>
            <span className="text-gray-500">Modelo:</span>
            <span className="font-semibold text-gray-900">{repair.consola}</span>
            {repair.numeroSerie && (
              <>
                <span className="text-gray-500">Serie:</span>
                <span className="font-semibold text-gray-900">{repair.numeroSerie}</span>
              </>
            )}
            {repair.color && (
              <>
                <span className="text-gray-500">Color:</span>
                <span className="font-semibold text-gray-900">{repair.color}</span>
              </>
            )}
          </div>
          {repair.accesorios && (
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Accesorios: </span>
              <span className="text-gray-900">{repair.accesorios}</span>
            </div>
          )}
        </div>

        {/* Problemas */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Problemas Reportados</div>
          <ul className="space-y-1">
            {(repair.problemas || []).map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-gray-900">
                <span className="text-green-600 font-bold">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Detalles */}
        {repair.detalles && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detalles Adicionales</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{repair.detalles}</p>
          </div>
        )}

        {/* Estado */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</span>
          <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">{repair.estado}</span>
        </div>

        {/* QR */}
        <div className="px-6 py-6 flex flex-col items-center">
          <QRCodeSVG id="qr-ticket-svg" value={qrValue} size={180} bgColor="#ffffff" fgColor="#1a1a3e" level="H" />
          <div className="text-xs text-gray-400 mt-3 tracking-wide">Escanear para ver estado</div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 text-center border-t border-gray-200">
          <div className="text-xs text-gray-500 font-bold">Game Fix Pro</div>
          <div className="text-xs text-gray-400 mt-0.5">Tel: (555) 123-4567 | info@gamefixpro.com</div>
          <div className="text-xs text-gray-400">www.gamefixpro.com</div>
        </div>
      </div>
    </div>
  );
};

export default QRTicketModal;
