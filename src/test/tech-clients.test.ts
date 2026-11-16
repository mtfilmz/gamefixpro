import { describe, it, expect } from "vitest";
import { canReadTechClients, clientExport, techAccount } from "../../supabase/functions/_shared/tech-client-rules";
describe("Tech Repair client sharing", () => {
  it("targets only the requested account", () => { expect(techAccount).toBe("supermobilepr@gmail.com"); });
  it("rejects another account", () => { expect(canReadTechClients({ enabled: true, target_user_id: "owner" }, "other")).toBe(false); });
  it("rejects revoked connections", () => { expect(canReadTechClients({ enabled: false, target_user_id: "owner" }, "owner")).toBe(false); });
  it("allows the bound account", () => { expect(canReadTechClients({ enabled: true, target_user_id: "owner" }, "owner")).toBe(true); });
  it("exports only the six contact fields and stable identity", () => {
    expect(clientExport({ id: "a", cliente: "Ana", telefono: "787", contacto: "Luis", email: "ana@example.com", direccion: "San Juan", notas: "Contacto por la tarde", amount: 150, imagenes: ["private"] }, "clients")).toEqual({ source_id: "clients:a", source_key: null, name: "Ana", phone: "787", contact: "Luis", email: "ana@example.com", address: "San Juan", notes: "Contacto por la tarde" });
  });
  it("never exports technical repair notes as client notes", () => { expect(clientExport({ id: "034", detalles: "private", notas: "private" }, "repairs").notes).toBe(""); });
});