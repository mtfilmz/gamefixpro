import { useState, useEffect } from "react";
import { Repair, EstadoReparacion } from "@/types/repair";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RepairFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (repair: Omit<Repair, "id"> & { id?: string }) => void;
  editRepair?: Repair | null;
}

const consolas = ["PS5", "PS4 Pro", "PS4", "Xbox Series X", "Xbox Series S", "Xbox One", "Nintendo Switch", "Nintendo Switch OLED", "Steam Deck"];
const estados: EstadoReparacion[] = ["PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"];

const RepairForm = ({ open, onClose, onSave, editRepair }: RepairFormProps) => {
  const [cliente, setCliente] = useState("");
  const [consola, setConsola] = useState(consolas[0]);
  const [problema, setProblema] = useState("");
  const [estado, setEstado] = useState<EstadoReparacion>("PENDIENTE");

  useEffect(() => {
    if (editRepair) {
      setCliente(editRepair.cliente);
      setConsola(editRepair.consola);
      setProblema(editRepair.problema);
      setEstado(editRepair.estado);
    } else {
      setCliente("");
      setConsola(consolas[0]);
      setProblema("");
      setEstado("PENDIENTE");
    }
  }, [editRepair, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editRepair?.id,
      cliente,
      consola,
      problema,
      estado,
      fecha: editRepair?.fecha || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">{editRepair ? "Editar Registro" : "Nuevo Registro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Nombre del cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="bg-input border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={consola}
            onChange={(e) => setConsola(e.target.value)}
            className="bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {consolas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            required
            placeholder="Descripción del problema"
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            className="bg-input border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {editRepair && (
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoReparacion)}
              className="bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {estados.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            {editRepair ? "Guardar Cambios" : "Registrar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RepairForm;
