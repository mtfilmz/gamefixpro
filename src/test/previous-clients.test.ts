import { describe, expect, it } from "vitest";
import { previousClients, findPreviousClients } from "@/lib/previous-clients";
import { Repair } from "@/types/repair";

const repair = (data: Partial<Repair>): Repair => ({ id: "#001", cliente: "José Guzmán", telefono: "787-555-0100", email: "jose@example.com", marca: "Sony", consola: "PS5", numeroSerie: "SN-1", color: "Blanco", accesorios: "Control", problemas: ["No enciende"], detalles: "", estado: "ENTREGADO", fecha: "2026-11-15", ...data });
describe("clientes anteriores", () => {
  it("recupera únicamente nombre, teléfono y correo sin datos de equipo o pago", () => {
    expect(previousClients([repair({ costoDiagnostico: 100, costoReparacion: 1000 })])).toEqual([{ cliente: "José Guzmán", telefono: "787-555-0100", email: "jose@example.com" }]);
  });
  it("encuentra clientes por nombre, teléfono y correo", () => {
    const clients = previousClients([repair({})]);
    expect(findPreviousClients(clients, "jose")).toHaveLength(1);
    expect(findPreviousClients(clients, "7875550100")).toHaveLength(1);
    expect(findPreviousClients(clients, "jose@example.com")).toHaveLength(1);
    expect(findPreviousClients(clients, "nadie")).toHaveLength(0);
    expect(findPreviousClients(clients, "")).toHaveLength(0);
  });
  it("no repite el mismo cliente y conserva el contacto de su registro más reciente", () => {
    const old = repair({ fecha: "2026-11-01", email: "viejo@example.com" });
    const recent = repair({ fecha: "2026-11-15", telefono: "(787) 555 0100", email: "nuevo@example.com" });
    expect(previousClients([old, recent])).toEqual([{ cliente: "José Guzmán", telefono: "(787) 555 0100", email: "nuevo@example.com" }]);
  });
  it("mantiene separados clientes con el mismo nombre y distinto teléfono", () => {
    expect(previousClients([repair({}), repair({ telefono: "787-555-0200" })])).toHaveLength(2);
  });
});