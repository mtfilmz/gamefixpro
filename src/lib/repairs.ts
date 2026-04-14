import { Repair, EstadoReparacion, StatusChange } from "@/types/repair";

const STORAGE_KEY = "gamefixpro_repairs";

type StoredRepair = Partial<Repair> & {
  problema?: string;
};

const sampleData: Repair[] = [
  { id: "#001", cliente: "Juan Pérez", telefono: "555-1234", email: "juan@mail.com", marca: "Sony", consola: "PS5", numeroSerie: "SN-001", color: "Blanco", accesorios: "1 Control", problemas: ["No enciende"], detalles: "", estado: "PENDIENTE", fecha: "2026-04-10" },
  { id: "#002", cliente: "María López", telefono: "555-5678", email: "maria@mail.com", marca: "Microsoft", consola: "Xbox Series X", numeroSerie: "SN-002", color: "Negro", accesorios: "2 Controles", problemas: ["Sobrecalentamiento"], detalles: "", estado: "DIAGNÓSTICO", fecha: "2026-04-11" },
  { id: "#003", cliente: "Carlos Ruiz", telefono: "555-9012", email: "carlos@mail.com", marca: "Nintendo", consola: "Nintendo Switch", numeroSerie: "SN-003", color: "Neón", accesorios: "Dock, Joy-Cons", problemas: ["Daño por líquido"], detalles: "", estado: "REPARADO", fecha: "2026-04-09" },
  { id: "#004", cliente: "Ana Torres", telefono: "555-3456", email: "ana@mail.com", marca: "Sony", consola: "PS4 Pro", numeroSerie: "SN-004", color: "Negro", accesorios: "1 Control", problemas: ["No lee discos"], detalles: "", estado: "EN REPARACIÓN", fecha: "2026-04-12" },
  { id: "#005", cliente: "Pedro Sánchez", telefono: "555-7890", email: "pedro@mail.com", marca: "Microsoft", consola: "Xbox One", numeroSerie: "SN-005", color: "Blanco", accesorios: "Ninguno", problemas: ["No enciende"], detalles: "No carga", estado: "PENDIENTE", fecha: "2026-04-13" },
];

const validEstados: EstadoReparacion[] = ["PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"];

function inferBrand(consola: string): string {
  const model = consola.toLowerCase();

  if (model.includes("xbox")) {
    return "Microsoft";
  }

  if (model.includes("switch") || model.includes("nintendo") || model.includes("wii") || model.includes("3ds")) {
    return "Nintendo";
  }

  return "Sony";
}

function normalizeProblems(repair: StoredRepair): string[] {
  if (Array.isArray(repair.problemas)) {
    return repair.problemas
      .filter((problem): problem is string => typeof problem === "string")
      .map((problem) => problem.trim())
      .filter(Boolean);
  }

  if (typeof repair.problema === "string" && repair.problema.trim()) {
    return [repair.problema.trim()];
  }

  return [];
}

function normalizeRepair(repair: StoredRepair): Repair {
  const consola = typeof repair.consola === "string" && repair.consola.trim() ? repair.consola.trim() : "PS5";
  const estado = validEstados.includes(repair.estado as EstadoReparacion) ? (repair.estado as EstadoReparacion) : "PENDIENTE";

  return {
    id: typeof repair.id === "string" && repair.id.trim() ? repair.id.trim() : "#000",
    cliente: typeof repair.cliente === "string" ? repair.cliente.trim() : "",
    telefono: typeof repair.telefono === "string" ? repair.telefono.trim() : "",
    email: typeof repair.email === "string" ? repair.email.trim() : "",
    marca: typeof repair.marca === "string" && repair.marca.trim() ? repair.marca.trim() : inferBrand(consola),
    consola,
    numeroSerie: typeof repair.numeroSerie === "string" ? repair.numeroSerie.trim() : "",
    color: typeof repair.color === "string" ? repair.color.trim() : "",
    accesorios: typeof repair.accesorios === "string" ? repair.accesorios.trim() : "",
    problemas: normalizeProblems(repair),
    detalles: typeof repair.detalles === "string" ? repair.detalles.trim() : "",
    estado,
    fecha: typeof repair.fecha === "string" && repair.fecha.trim() ? repair.fecha : new Date().toISOString().slice(0, 10),
    historial: Array.isArray((repair as any).historial) ? (repair as any).historial : [],
    imagenes: Array.isArray((repair as any).imagenes) ? (repair as any).imagenes : [],
    costoDiagnostico: typeof (repair as any).costoDiagnostico === "number" ? (repair as any).costoDiagnostico : undefined,
    costoReparacion: typeof (repair as any).costoReparacion === "number" ? (repair as any).costoReparacion : undefined,
  };
}

export function getRepairs(): Repair[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    saveRepairs(sampleData);
    return sampleData;
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      saveRepairs(sampleData);
      return sampleData;
    }

    const normalized = parsed.map((repair) => normalizeRepair(repair as StoredRepair));
    saveRepairs(normalized);
    return normalized;
  } catch {
    saveRepairs(sampleData);
    return sampleData;
  }
}

export function saveRepairs(repairs: Repair[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs.map((repair) => normalizeRepair(repair))));
}

export function generateId(repairs: Repair[]): string {
  const max = repairs.reduce((currentMax, repair) => {
    const numericId = Number.parseInt(String(repair.id).replace("#", ""), 10);
    return Number.isNaN(numericId) ? currentMax : Math.max(currentMax, numericId);
  }, 0);

  return `#${String(max + 1).padStart(3, "0")}`;
}
