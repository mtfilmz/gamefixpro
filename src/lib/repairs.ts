import { Repair } from "@/types/repair";

const STORAGE_KEY = "gamefixpro_repairs";

const sampleData: Repair[] = [
  { id: "#001", cliente: "Juan Pérez", consola: "PS5", problema: "No enciende", estado: "PENDIENTE", fecha: "2026-04-10" },
  { id: "#002", cliente: "María López", consola: "Xbox Series X", problema: "Sobrecalentamiento", estado: "DIAGNÓSTICO", fecha: "2026-04-11" },
  { id: "#003", cliente: "Carlos Ruiz", consola: "Nintendo Switch", problema: "Daño líquido", estado: "REPARADO", fecha: "2026-04-09" },
  { id: "#004", cliente: "Ana Torres", consola: "PS4 Pro", problema: "Lectura disco", estado: "EN REPARACIÓN", fecha: "2026-04-12" },
  { id: "#005", cliente: "Pedro Sánchez", consola: "Xbox One", problema: "No carga", estado: "PENDIENTE", fecha: "2026-04-13" },
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
