import { useState, useEffect } from "react";
import { Repair, EstadoReparacion } from "@/types/repair";
import { generateId } from "@/lib/repairs";
import { QRCodeSVG } from "qrcode.react";

interface RepairFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (repair: Omit<Repair, "id"> & { id?: string }) => void;
  editRepair?: Repair | null;
  repairs: Repair[];
}

const marcas = ["Sony", "Microsoft", "Nintendo"];
const modelosPorMarca: Record<string, string[]> = {
  Sony: ["PS5", "PS5 Digital", "PS4 Pro", "PS4 Slim", "PS4", "PS3"],
  Microsoft: ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S", "Xbox One"],
  Nintendo: ["Nintendo Switch", "Nintendo Switch OLED", "Nintendo Switch Lite", "Wii U", "3DS"],
};
const estados: EstadoReparacion[] = ["PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"];

const PROBLEMAS_OPTIONS = [
  "Solo Diagnóstico",
  "Mantenimiento",
  "No enciende",
  "Daño por líquido",
  "Sufrió caída",
  "Sobrecalentamiento",
  "Subida de luz",
  "Se apaga jugando",
  "Se apaga con juegos pesados",
  "Se congela/Freezes",
  "No lee discos",
  "Problemas de conexión",
];

const inputClass =
  "w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm";

const RepairForm = ({ open, onClose, onSave, editRepair, repairs }: RepairFormProps) => {
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [marca, setMarca] = useState(marcas[0]);
  const [consola, setConsola] = useState(modelosPorMarca[marcas[0]][0]);
  const [numeroSerie, setNumeroSerie] = useState("");
  const [color, setColor] = useState("");
  const [accesorios, setAccesorios] = useState("");
  const [problemas, setProblemas] = useState<string[]>([]);
  const [detalles, setDetalles] = useState("");
  const [estado, setEstado] = useState<EstadoReparacion>("PENDIENTE");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextId = editRepair?.id || generateId(repairs);

  useEffect(() => {
    if (editRepair) {
      setCliente(editRepair.cliente);
      setTelefono(editRepair.telefono);
      setEmail(editRepair.email);
      setMarca(editRepair.marca);
      setConsola(editRepair.consola);
      setNumeroSerie(editRepair.numeroSerie);
      setColor(editRepair.color);
      setAccesorios(editRepair.accesorios);
      setProblemas(editRepair.problemas);
      setDetalles(editRepair.detalles);
      setEstado(editRepair.estado);
    } else {
      setCliente(""); setTelefono(""); setEmail("");
      setMarca(marcas[0]); setConsola(modelosPorMarca[marcas[0]][0]);
      setNumeroSerie(""); setColor(""); setAccesorios("");
      setProblemas([]); setDetalles(""); setEstado("PENDIENTE");
    }
    setErrors({});
  }, [editRepair, open]);

  useEffect(() => {
    setConsola(modelosPorMarca[marca]?.[0] || "");
  }, [marca]);

  const toggleProblema = (p: string) => {
    setProblemas((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cliente.trim()) e.cliente = "Nombre requerido";
    if (!telefono.trim()) e.telefono = "Teléfono requerido";
    if (!email.trim()) e.email = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (!consola) e.consola = "Modelo requerido";
    if (problemas.length === 0) e.problemas = "Selecciona al menos un problema";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      id: editRepair?.id,
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      marca,
      consola,
      numeroSerie: numeroSerie.trim(),
      color: color.trim(),
      accesorios: accesorios.trim(),
      problemas,
      detalles: detalles.trim(),
      estado,
      fecha: editRepair?.fecha || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-primary rounded-t-xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-foreground">
            {editRepair ? "Editar Registro" : "Nuevo Registro"}
          </h2>
          <span className="text-primary-foreground/80 font-mono text-sm">{nextId}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SECCIÓN 1 - Datos del Cliente */}
          <section>
            <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">📋 Datos del Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input required placeholder="Nombre completo *" value={cliente} onChange={(e) => setCliente(e.target.value)} className={inputClass} maxLength={100} />
                {errors.cliente && <p className="text-destructive text-xs mt-1">{errors.cliente}</p>}
              </div>
              <div>
                <input required placeholder="Teléfono *" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} maxLength={20} />
                {errors.telefono && <p className="text-destructive text-xs mt-1">{errors.telefono}</p>}
              </div>
              <div>
                <input required type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} maxLength={255} />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          </section>

          {/* SECCIÓN 2 - Datos de la Consola */}
          <section>
            <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">🎮 Datos de la Consola</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass}>
                {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div>
                <select value={consola} onChange={(e) => setConsola(e.target.value)} className={inputClass}>
                  {(modelosPorMarca[marca] || []).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.consola && <p className="text-destructive text-xs mt-1">{errors.consola}</p>}
              </div>
              <input placeholder="Número de Serie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} className={inputClass} maxLength={50} />
              <input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} maxLength={30} />
              <div className="sm:col-span-2">
                <input placeholder="Accesorios incluidos" value={accesorios} onChange={(e) => setAccesorios(e.target.value)} className={inputClass} maxLength={200} />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3 - Problemas */}
          <section>
            <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">⚠️ Problemas Reportados</h3>
            {errors.problemas && <p className="text-destructive text-xs mb-2">{errors.problemas}</p>}
            <div className="grid grid-cols-2 gap-2">
              {PROBLEMAS_OPTIONS.map((p) => (
                <label
                  key={p}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors border ${
                    problemas.includes(p)
                      ? "bg-primary/20 border-primary text-foreground"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={problemas.includes(p)}
                    onChange={() => toggleProblema(p)}
                    className="accent-primary w-4 h-4 shrink-0"
                  />
                  <span className="leading-tight">{p}</span>
                </label>
              ))}
            </div>
          </section>

          {/* SECCIÓN 4 - Detalles */}
          <section>
            <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">📝 Detalles Adicionales</h3>
            <textarea
              placeholder="Notas libres, observaciones, detalles del problema..."
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              rows={4}
              maxLength={1000}
              className={`${inputClass} resize-none`}
            />
          </section>

          {/* SECCIÓN 5 - Estado y QR */}
          <section>
            <h3 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">🔧 Estado e Identificación</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Estado inicial</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoReparacion)} className={inputClass}>
                    {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ID asignado</label>
                  <div className="bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-mono font-bold text-lg">
                    {nextId}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs text-muted-foreground">Preview QR</label>
                <div className="bg-foreground p-2 rounded-lg">
                  <QRCodeSVG value={`GAMEFIX-${nextId}`} size={90} bgColor="hsl(0,0%,95%)" fgColor="hsl(233,50%,17%)" />
                </div>
              </div>
            </div>
          </section>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-status-repaired text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              {editRepair ? "Guardar Cambios" : "Guardar Registro"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-destructive text-destructive-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairForm;
