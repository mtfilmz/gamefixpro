import { Repair } from "@/types/repair";

const STORAGE_KEY = "gamefixpro_repairs";
const sampleData: Repair[] = [
  { id: "#001", cliente: "Juan Pérez", telefono: "555-1234", email: "juan@mail.com", marca: "Sony", consola: "PS5", numeroSerie: "SN-001", color: "Blanco", accesorios: "1 Control", problemas: ["No enciende"], detalles: "", estado: "PENDIENTE", fecha: "2026-04-10" },
  { id: "#002", cliente: "María López", telefono: "555-5678", email: "maria@mail.com", marca: "Microsoft", consola: "Xbox Series X", numeroSerie: "SN-002", color: "Negro", accesorios: "2 Controles", problemas: ["Sobrecalentamiento"], detalles: "", estado: "DIAGNÓSTICO", fecha: "2026-04-11" },
  { id: "#003", cliente: "Carlos Ruiz", telefono: "555-9012", email: "carlos@mail.com", marca: "Nintendo", consola: "Nintendo Switch", numeroSerie: "SN-003", color: "Neón", accesorios: "Dock, Joy-Cons", problemas: ["Daño por líquido"], detalles: "", estado: "REPARADO", fecha: "2026-04-09" },
  { id: "#004", cliente: "Ana Torres", telefono: "555-3456", email: "ana@mail.com", marca: "Sony", consola: "PS4 Pro", numeroSerie: "SN-004", color: "Negro", accesorios: "1 Control", problemas: ["No lee discos"], detalles: "", estado: "EN REPARACIÓN", fecha: "2026-04-12" },
  { id: "#005", cliente: "Pedro Sánchez", telefono: "555-7890", email: "pedro@mail.com", marca: "Microsoft", consola: "Xbox One", numeroSerie: "SN-005", color: "Blanco", accesorios: "Ninguno", problemas: ["No enciende"], detalles: "No carga", estado: "PENDIENTE", fecha: "2026-04-13" },
];

export function getRepairs(): Repair[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    return sampleData;
  }
  return JSON.parse(data);
}

export function saveRepairs(repairs: Repair[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
}

export function generateId(repairs: Repair[]): string {
  const max = repairs.reduce((m, r) => {
    const n = parseInt(r.id.replace("#", ""));
    return n > m ? n : m;
  }, 0);
  return `#${String(max + 1).padStart(3, "0")}`;
}
