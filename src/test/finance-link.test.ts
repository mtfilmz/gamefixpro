import { describe, expect, it } from "vitest";
import { verifiedLink, redeemRequest } from "../../supabase/functions/_shared/finance-link-rules";
const receipt = { binding_id: "a57c1010-e596-4fd0-a401-bd718d8a4c3a", destination_user_id: "7e44bfc4-9f39-4265-a33d-7d935db9c6c2", currency: "USD" };
describe("vinculación financiera", () => {
  it("acepta un recibo verificado para USD", () => { expect(verifiedLink(receipt, "USD")).toBe(true); });
  it("rechaza monedas distintas sin conversión", () => { expect(verifiedLink(receipt, "DOP")).toBe(false); });
  it("rechaza un destino no verificado", () => { expect(verifiedLink({ ...receipt, destination_user_id: "cliente" }, "USD")).toBe(false); });
  it("requiere UUID del vínculo", () => { expect(verifiedLink({ ...receipt, binding_id: "" }, "USD")).toBe(false); });
  it("deriva la identidad del usuario autenticado", () => { expect(redeemRequest("code", receipt.destination_user_id, "USD")).toEqual({ action: "redeem", code: "code", source_user_id: receipt.destination_user_id, currency: "USD" }); });
});