export function syncValues(row: { name: string; phone: string; email: string; contact: string; address: string; notes: string }) {
  return { cliente: row.name, telefono: row.phone, email: row.email, contacto: row.contact, direccion: row.address, notas: row.notes };
}
export function syncKey(row: { name: string; phone: string; email: string }) {
  return JSON.stringify([row.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(), row.phone.replace(/\D/g, "") || row.email.trim().toLowerCase()]);
}