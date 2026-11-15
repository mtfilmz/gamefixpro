import { z } from "zod";
import { PreviousClient, previousClients } from "./previous-clients";
import { Repair } from "@/types/repair";

export const clientSchema = z.object({
  cliente: z.string().trim().min(1, "Nombre requerido").max(200),
  telefono: z.string().trim().max(30),
  email: z.string().trim().max(254).refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Correo inválido"),
});

export function clientDirectory(repairs: Repair[], saved: PreviousClient[]): PreviousClient[] {
  const seen = new Set<string>();
  return [...previousClients(repairs), ...saved].filter(client => {
    const name = client.cliente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const key = JSON.stringify([name, client.telefono.replace(/\D/g, "") || client.email.trim().toLowerCase()]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.cliente.localeCompare(b.cliente, "es"));
}