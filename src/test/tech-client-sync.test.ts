import { describe, expect, it } from "vitest";
import { syncKey, syncValues } from "../../supabase/functions/_shared/tech-client-sync";
describe("Tech Repair incoming contacts", () => {
  it("deduplicates accents and phone formatting", () => { expect(syncKey({ name: " José ", phone: "(787) 555-0100", email: "" })).toBe(syncKey({ name: "jose", phone: "7875550100", email: "" })); });
  it("does not merge different people by name alone", () => { expect(syncKey({ name: "Ana", phone: "123", email: "" })).not.toBe(syncKey({ name: "Ana", phone: "456", email: "" })); });
  it("copies only the six allowed contact fields", () => {
    const input = { name: "Ana", phone: "787", email: "ana@example.com", contact: "Luis", address: "San Juan", notes: "Llamar", payment: 500 };
    expect(syncValues(input)).toEqual({ cliente: "Ana", telefono: "787", email: "ana@example.com", contacto: "Luis", direccion: "San Juan", notas: "Llamar" });
  });
});