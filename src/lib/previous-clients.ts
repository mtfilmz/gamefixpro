import { Repair } from "@/types/repair";

export type PreviousClient = Pick<Repair, "cliente" | "telefono" | "email">;
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function previousClients(repairs: Repair[]): PreviousClient[] {
  const seen = new Set<string>();
  return repairs.slice().sort((a, b) => (b.createdAt || b.fecha).localeCompare(a.createdAt || a.fecha)).flatMap(repair => {
    if (!repair.cliente.trim()) return [];
    const phone = repair.telefono.replace(/\D/g, "");
    const key = JSON.stringify([normalize(repair.cliente), phone || normalize(repair.email)]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ cliente: repair.cliente, telefono: repair.telefono, email: repair.email }];
  });
}

export function findPreviousClients(clients: PreviousClient[], query: string): PreviousClient[] {
  const q = normalize(query);
  if (!q) return [];
  const digits = query.replace(/\D/g, "");
  return clients.filter(client => normalize(client.cliente).includes(q) || normalize(client.email).includes(q) || (digits.length > 0 && !/[a-z]/i.test(q) && client.telefono.replace(/\D/g, "").includes(digits)));
}