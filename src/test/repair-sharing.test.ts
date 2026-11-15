import { describe, it, expect } from "vitest";
import { repairTotal, smsLink } from "@/lib/repair-sharing";
import { Repair } from "@/types/repair";

describe("compartir registros", () => {
  it("acredita diagnóstico al total de la factura", () => {
    expect(repairTotal({ costoReparacion: 1000, costoComponente: 150, costoDiagnostico: 100 } as Repair)).toBe(1050);
  });
  it("dirige el SMS al teléfono guardado en Apple", () => {
    expect(smsLink("+1 (787) 555-0100", "Registro #034", "iPhone")).toBe("sms:+17875550100&body=Registro%20%23034");
  });
  it("dirige el SMS al teléfono guardado en Android sin inventar país", () => {
    expect(smsLink("787-555-0100", "Registro #034", "Android")).toBe("sms:7875550100?body=Registro%20%23034");
  });
  it("bloquea destinatarios ausentes o inválidos", () => {
    expect(smsLink("", "Mensaje", "iPhone")).toBeNull();
    expect(smsLink("123", "Mensaje", "Android")).toBeNull();
    expect(smsLink("7875550100?body=otro", "Mensaje", "Android")).toBeNull();
  });
});