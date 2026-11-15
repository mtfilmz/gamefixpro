import { describe, expect, it } from "vitest";
import { clientDirectory, clientSchema } from "@/lib/clients";

describe("Clientes", () => {
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