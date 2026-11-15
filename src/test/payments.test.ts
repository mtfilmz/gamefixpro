import { describe, it, expect, vi, beforeEach } from "vitest";
import { paymentSchema } from "@/lib/payments";
import { paymentPayload } from "../../supabase/functions/_shared/payment-contract";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc, functions: { invoke: mock.invoke } } }));
import { recordPayment, syncPayment } from "@/lib/payment-service";
const draft = { id: "a57c1010-e596-4fd0-a401-bd718d8a4c3a", amount: 150, paid_on: "2026-11-15", method: "cash" as const };
beforeEach(() => vi.clearAllMocks());
describe("pagos reales", () => {
  it("rechaza un pago de cero o negativo", () => {
    expect(paymentSchema.safeParse({ ...draft, amount: 0 }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...draft, amount: -1 }).success).toBe(false);
  });
  it("valida fecha y método", () => {
    expect(paymentSchema.safeParse({ ...draft, paid_on: "2026-02-30" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...draft, method: "invalid" }).success).toBe(false);
  });
  it("no envía presupuestos ni datos innecesarios", () => {
    const p = paymentPayload({ ...draft, repair_id: "#031", client_name: "Cliente prueba", equipment: "Sony — PS5", costo_diagnostico: 200, telefono: "123", imagenes: [] } as Parameters<typeof paymentPayload>[0], "binding");
    expect(p.amount).toBe(150);
    expect(Object.keys(p).sort()).toEqual(["version", "source_app", "binding_id", "payment_id", "repair_id", "client_name", "equipment", "amount", "paid_on", "method", "type", "source", "category", "description"].sort());
  });
  it("exporta un ingreso de negocio con categoría y nombre correctos", () => {
    const p = paymentPayload({ ...draft, repair_id: "#031", client_name: "Cliente prueba", equipment: "Sony — PS5" }, "binding");
    expect(p).toMatchObject({ type: "income", source: "business", category: "Reparaciones", description: "Pago de Cliente prueba — Sony — PS5", binding_id: "binding" });
  });
  it("conserva el mismo identificador al reintentar guardar", async () => {
    mock.rpc.mockResolvedValue({ error: null });
    await recordPayment("#031", draft); await recordPayment("#031", draft);
    expect(mock.rpc.mock.calls[0][1].p_id).toBe(draft.id);
    expect(mock.rpc.mock.calls[1][1].p_id).toBe(draft.id);
  });
  it("un nuevo abono usa su propio identificador", async () => {
    mock.rpc.mockResolvedValue({ error: null });
    await recordPayment("#031", draft);
    await recordPayment("#031", { ...draft, id: "7e44bfc4-9f39-4265-a33d-7d935db9c6c2", amount: 50 });
    expect(mock.rpc.mock.calls[0][1].p_id).not.toBe(mock.rpc.mock.calls[1][1].p_id);
    expect(mock.rpc.mock.calls[1][1].p_amount).toBe(50);
  });
  it("no declara sincronizado un pago pendiente", async () => {
    mock.invoke.mockResolvedValue({ data: { status: "pending", error: "Falta vínculo" }, error: null });
    await expect(syncPayment(draft.id)).rejects.toThrow("Falta vínculo");
  });
  it("reintenta enviar con el mismo identificador", async () => {
    mock.invoke.mockResolvedValue({ data: { status: "synced" }, error: null });
    await syncPayment(draft.id); await syncPayment(draft.id);
    expect(mock.invoke.mock.calls[0][1].body.payment_id).toBe(draft.id);
    expect(mock.invoke.mock.calls[1][1].body.payment_id).toBe(draft.id);
  });
  it("no inicia envío cuando guardar falla", async () => {
    mock.rpc.mockResolvedValue({ error: { message: "Error al guardar" } });
    await expect(recordPayment("#031", draft)).rejects.toThrow("Error al guardar");
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});