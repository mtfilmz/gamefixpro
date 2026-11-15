import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), sync: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc } }));
vi.mock("@/lib/payment-service", () => ({ syncPayment: mock.sync }));
import { sendFinanceTest } from "@/lib/finance-test-service";
const id = "a57c1010-e596-4fd0-a401-bd718d8a4c3a";
const movement = "7e44bfc4-9f39-4265-a33d-7d935db9c6c2";
beforeEach(() => vi.clearAllMocks());
describe("prueba de recepción", () => {
  it("requiere confirmación explícita en el registro", async () => {
    mock.rpc.mockResolvedValue({ data: { id }, error: null }); mock.sync.mockResolvedValue({ status: "synced", movement_id: movement });
    await sendFinanceTest(); expect(mock.rpc.mock.calls[0][1].p_confirm).toBe(true);
  });
  it("reintenta el mismo pago persistido", async () => {
    mock.rpc.mockResolvedValue({ data: { id }, error: null }); mock.sync.mockResolvedValue({ status: "synced", movement_id: movement });
    await sendFinanceTest(); await sendFinanceTest(); expect(mock.sync.mock.calls).toEqual([[id], [id]]);
  });
  it("devuelve únicamente el recibo confirmado", async () => {
    mock.rpc.mockResolvedValue({ data: { id }, error: null }); mock.sync.mockResolvedValue({ status: "synced", movement_id: movement });
    expect(await sendFinanceTest()).toBe(movement);
  });
  it("no declara recepción sin movimiento válido", async () => {
    mock.rpc.mockResolvedValue({ data: { id }, error: null }); mock.sync.mockResolvedValue({ status: "synced", movement_id: "" });
    await expect(sendFinanceTest()).rejects.toThrow("recibo válido");
  });
  it("no envía cuando falta vínculo", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "Vincula tu cuenta" } });
    await expect(sendFinanceTest()).rejects.toThrow("Vincula tu cuenta"); expect(mock.sync).not.toHaveBeenCalled();
  });
});