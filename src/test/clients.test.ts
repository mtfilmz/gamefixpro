import { describe, expect, it } from "vitest";
import { clientDirectory, clientSchema } from "@/lib/clients";
import { clientKey } from "@/lib/clients";
import { Repair } from "@/types/repair";

describe("Clientes", () => {
  it("usa el contacto editado sin duplicar el cliente original del historial", () => {
    const original = { cliente: "Ana", telefono: "7875550100", email: "" };
    const repair = { ...original, fecha: "2026-11-15" } as Repair;
    const edited = { id: "saved-1", cliente: "Ana Pérez", telefono: "7875550200", email: "ana@example.com", source_key: clientKey(original) };
    expect(clientDirectory([repair], [edited])).toEqual([edited]);
    expect(repair.telefono).toBe("7875550100");
  });
  it("incluye clientes nuevos sin requerir una reparación", () => {
    expect(clientDirectory([], [{ cliente: "Ana", telefono: "7875550100", email: "" }])).toEqual([{ cliente: "Ana", telefono: "7875550100", email: "" }]);
  });
  it("no duplica nombres y contactos equivalentes", () => {
    expect(clientDirectory([], [{ cliente: "José", telefono: "(787) 555-0100", email: "" }, { cliente: "JOSE", telefono: "7875550100", email: "" }])).toHaveLength(1);
  });
  it("rechaza clientes sin nombre y correos inválidos", () => {
    expect(clientSchema.safeParse({ cliente: " ", telefono: "", email: "" }).success).toBe(false);
    expect(clientSchema.safeParse({ cliente: "Ana", telefono: "", email: "incorrecto" }).success).toBe(false);
  });
});