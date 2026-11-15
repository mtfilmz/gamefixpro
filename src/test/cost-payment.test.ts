import { describe, expect, it } from "vitest";
import { costPaymentAmount } from "@/lib/cost-payment";

describe("monto automático desde costos", () => {
  it("suma reparación y componente y acredita el diagnóstico", () => {
    expect(costPaymentAmount("200", "50", "25")).toBe("225.00");
  });
  it("actualiza el monto al cambiar los costos", () => {
    expect(costPaymentAmount("200", "50", "25")).toBe("225.00");
    expect(costPaymentAmount("300", "50", "25")).toBe("325.00");
  });
  it("mantiene un abono introducido manualmente", () => {
    expect(costPaymentAmount("300", "50", "25", "100")).toBe("100");
  });
  it("no propone pagos de cero ni negativos", () => {
    expect(costPaymentAmount("", "", "")).toBe("");
    expect(costPaymentAmount("20", "", "30")).toBe("");
  });
  it("calcula centavos sin errores de punto flotante", () => {
    expect(costPaymentAmount("0.10", "0.20", "0")).toBe("0.30");
  });
});