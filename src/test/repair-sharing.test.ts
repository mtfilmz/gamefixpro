import { describe, it, expect, vi } from "vitest";
import { repairTotal, smsLink, shareReceipt } from "@/lib/repair-sharing";
import { Repair } from "@/types/repair";

describe("compartir registros", () => {
  const file = new File(["receipt"], "factura.png", { type: "image/png" });
  it("comparte la imagen cuando el dispositivo la admite", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareReceipt({ share, canShare: () => true }, file, "Orden", "Mensaje", "https://example.com")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Orden", text: "Mensaje", files: [file] });
  });
  it("abre compartir texto si no admite imágenes", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await shareReceipt({ share, canShare: () => false }, file, "Orden", "Mensaje", "https://example.com");
    expect(share).toHaveBeenCalledWith({ title: "Orden", text: "Mensaje", url: "https://example.com" });
  });
  it("ofrece opciones sin descarga cuando compartir no está disponible", async () => {
    expect(await shareReceipt({} as Pick<Navigator, "share" | "canShare">, file, "Orden", "Mensaje", "https://example.com")).toBe("options");
  });
  it("no descarga ni abre opciones al cancelar", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelado", "AbortError"));
    expect(await shareReceipt({ share }, file, "Orden", "Mensaje", "https://example.com")).toBe("cancelled");
  });
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