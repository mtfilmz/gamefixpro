import { z } from "zod";
import { PreviousClient, previousClients } from "./previous-clients";
import { Repair } from "@/types/repair";

export const clientSchema = z.object({
  cliente: z.string().trim().min(1, "Nombre requerido").max(200),
  telefono: z.string().trim().max(30),
  email: z.string().trim().max(254).refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Correo inválido"),
  contacto: z.string().trim().max(200).default(""),
  direccion: z.string().trim().max(1000).default(""),
  notas: z.string().trim().max(4000).default(""),
});

export type DirectoryClient = PreviousClient & { id?: string; source_key?: string | null; contacto?: string; direccion?: string; notas?: string };

export function clientKey(client: PreviousClient): string {
  const name = client.cliente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return JSON.stringify([name, client.telefono.replace(/\D/g, "") || client.email.trim().toLowerCase()]);
}

export function clientDirectory(repairs: Repair[], saved: DirectoryClient[]): DirectoryClient[] {
  const overridden = new Set(saved.flatMap(client => client.source_key ? [client.source_key] : []));
  const seen = new Set<string>();
  return [...saved, ...previousClients(repairs).filter(client => !overridden.has(clientKey(client)))].filter(client => {
    const key = clientKey(client);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.cliente.localeCompare(b.cliente, "es"));
}