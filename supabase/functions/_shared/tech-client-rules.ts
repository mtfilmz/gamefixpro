export const techAccount = "supermobilepr@gmail.com";
export function canReadTechClients(link: { enabled: boolean; target_user_id: string | null } | null, target: string) {
  return Boolean(link?.enabled && link.target_user_id === target);
}
export function clientExport(row: Record<string, unknown>, kind: "clients" | "repairs") {
  return {
    source_id: `${kind}:${row.id}`, source_key: row.source_key ?? null,
    name: row.cliente ?? "", phone: row.telefono ?? "", email: row.email ?? "",
    contact: row.contacto ?? "", address: row.direccion ?? "", notes: kind === "clients" ? row.notas ?? "" : "",
  };
}