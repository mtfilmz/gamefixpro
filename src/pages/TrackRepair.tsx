import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Phone } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

interface PublicRepair {
  id: string;
  cliente: string;
  marca: string;
  consola: string;
  estado: string;
  fecha: string;
  problemas: string[];
  historial: { estado: string; fecha: string; nota?: string }[];
  imagenes: { id: string; dataUrl: string; fecha: string; nota?: string }[];
  costoDiagnostico?: number;
  costoReparacion?: number;
  costoComponente?: number;
}

const estadoColors: Record<string, string> = {
  "PENDIENTE": "bg-status-pending",
  "DIAGNÓSTICO": "bg-status-diagnostic",
  "EN REPARACIÓN": "bg-status-repairing",
  "REPARADO": "bg-status-repaired",
  "ENTREGADO": "bg-status-delivered",
};

const estadoOrder = ["PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"];

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TrackRepair = () => {
  const { id } = useParams<{ id: string }>();
  const [repair, setRepair] = useState<PublicRepair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    document.title = `Estado de Reparación ${id} | Game Fix Pro`;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-repair-status?id=${encodeURIComponent(id)}`;
    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        setRepair(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando estado de reparación...</div>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Reparación no encontrada</h1>
        <p className="text-muted-foreground">No pudimos localizar la orden #{id}.</p>
      </div>
    );
  }

  const currentIdx = estadoOrder.indexOf(repair.estado);
  const total =
    (repair.costoReparacion || 0) +
    (repair.costoComponente || 0) -
    (repair.costoDiagnostico || 0);
  const hasCosts =
    repair.costoDiagnostico != null ||
    repair.costoReparacion != null ||
    repair.costoComponente != null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="bg-primary px-6 py-6 text-center">
        <h1 className="text-2xl md:text-3xl font-black text-primary-foreground tracking-wider">
          [&gt;] GAME FIX PRO
        </h1>
        <p className="text-primary-foreground/80 text-sm mt-1">Seguimiento de Reparación</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Order ID + Current Status */}
        <section className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Orden</div>
          <div className="text-5xl font-black text-foreground mt-1">{repair.id}</div>
          <div className="text-sm text-muted-foreground mt-1">Ingreso: {repair.fecha}</div>
          <div className="mt-4">
            <span
              className={`inline-block text-base font-black px-6 py-2 rounded-full text-primary-foreground ${
                estadoColors[repair.estado] || "bg-muted"
              }`}
            >
              {repair.estado}
            </span>
          </div>
        </section>

        {/* Progress steps */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Progreso</h2>
          <div className="space-y-3">
            {estadoOrder.map((e, idx) => {
              const done = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={e} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      done ? estadoColors[e] : "bg-muted"
                    }`}
                  >
                    {done && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? "font-bold text-foreground"
                        : done
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {e}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Equipment */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">Equipo</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="text-foreground font-semibold">{repair.cliente}</span>
            <span className="text-muted-foreground">Marca:</span>
            <span className="text-foreground">{repair.marca}</span>
            <span className="text-muted-foreground">Modelo:</span>
            <span className="text-foreground">{repair.consola}</span>
          </div>
          {repair.problemas?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-2">
                Problemas reportados
              </div>
              <ul className="space-y-1">
                {repair.problemas.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-status-repaired shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Photos */}
        {repair.imagenes && repair.imagenes.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
              Fotos del equipo
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {repair.imagenes.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label="Ampliar foto"
                  onClick={() => setPreviewIdx(idx)}
                  className="block aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-zoom-in"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.nota || "Foto del equipo"}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {repair.historial && repair.historial.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
              Historial
            </h2>
            <div className="relative ml-3">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {repair.historial.map((entry, i) => (
                  <div key={i} className="relative pl-6">
                    <div
                      className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-card ${
                        estadoColors[entry.estado] || "bg-muted"
                      }`}
                    />
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.fecha)}
                    </div>
                    <div className="text-sm font-bold text-foreground">{entry.estado}</div>
                    {entry.nota && (
                      <div className="text-xs text-muted-foreground mt-0.5">"{entry.nota}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Costs */}
        {hasCosts && (
          <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
              Costos
            </h2>
            <div className="space-y-1 text-sm">
              {repair.costoDiagnostico != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diagnóstico (acreditado):</span>
                  <span className="text-foreground font-semibold">
                    -${repair.costoDiagnostico.toFixed(2)}
                  </span>
                </div>
              )}
              {repair.costoReparacion != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reparación:</span>
                  <span className="text-foreground font-semibold">
                    ${repair.costoReparacion.toFixed(2)}
                  </span>
                </div>
              )}
              {repair.costoComponente != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Componente:</span>
                  <span className="text-foreground font-semibold">
                    ${repair.costoComponente.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-2 border-t border-border">
                <span className="text-foreground font-bold">Total:</span>
                <span className="text-primary font-black text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4">
          <a
            href="tel:7875001324"
            className="inline-flex items-center gap-1.5 text-primary font-medium"
          >
            <Phone className="w-3.5 h-3.5" />
            787-500-1324
          </a>
          <div className="mt-1">Game Fix Pro · www.gamefixpro.com</div>
        </footer>
      </main>

      {/* Fullscreen viewer with zoom */}
      {previewIdx !== null && repair.imagenes[previewIdx] && (
        <ImageLightbox
          src={repair.imagenes[previewIdx].dataUrl}
          alt={repair.imagenes[previewIdx].nota || "Foto del equipo"}
          index={previewIdx}
          total={repair.imagenes.length}
          onPrev={
            repair.imagenes.length > 1
              ? () =>
                  setPreviewIdx(
                    (c) => (c === null ? c : (c - 1 + repair.imagenes.length) % repair.imagenes.length),
                  )
              : undefined
          }
          onNext={
            repair.imagenes.length > 1
              ? () => setPreviewIdx((c) => (c === null ? c : (c + 1) % repair.imagenes.length))
              : undefined
          }
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>
  );
};

export default TrackRepair;
