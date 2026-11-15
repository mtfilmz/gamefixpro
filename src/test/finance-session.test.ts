import { describe, expect, it, vi } from "vitest";
import { FunctionsHttpError, type SupabaseClient } from "@supabase/supabase-js";
import { validatedSessionUserId } from "../../supabase/functions/_shared/session-rules";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { invokeAuthenticatedFunction } from "@/lib/authenticated-function";

const userId = "a57c1010-e596-4fd0-a401-bd718d8a4c3a";
const claims = { sub: userId, role: "authenticated" };
describe("verified edge sessions", () => {
  it("uses the validated subject, not a client supplied identity", async () => {
    const verify = vi.fn().mockResolvedValue({ data: { claims }, error: null });
    expect(await validatedSessionUserId("Bearer signed-token", verify)).toBe(userId);
    expect(verify).toHaveBeenCalledWith("signed-token");
  });
  it("rejects missing or malformed authorization without verification", async () => {
    const verify = vi.fn();
    for (const header of [null, "Basic token", "Bearer one two", "Bearer one,two"]) {
      expect(await validatedSessionUserId(header, verify)).toBeNull();
    }
    expect(verify).not.toHaveBeenCalled();
  });
  it("rejects expired or invalid signatures even if claims are returned", async () => {
    expect(await validatedSessionUserId("Bearer expired", async () => ({ data: { claims }, error: new Error("expired") }))).toBeNull();
  });
  it("rejects anonymous and service role identities", async () => {
    for (const role of ["anon", "service_role"]) {
      expect(await validatedSessionUserId("Bearer token", async () => ({ data: { claims: { ...claims, role } }, error: null }))).toBeNull();
    }
  });
  it("fails closed when verification is unavailable", async () => {
    expect(await validatedSessionUserId("Bearer token", async () => { throw new Error("offline"); })).toBeNull();
  });
});

function client(expired = false) {
  const session = { access_token: "old", expires_at: Math.floor(Date.now() / 1000) + (expired ? -10 : 3600) };
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: { ...session, access_token: "renewed" } }, error: null }),
  };
  const functions = { invoke: vi.fn().mockResolvedValue({ data: { connected: true }, error: null }) };
  return { auth, functions, api: { auth, functions } as unknown as Pick<SupabaseClient, "auth" | "functions"> };
}
const rejection = (status: number, error = "Sesión inválida") => ({ data: null, error: new FunctionsHttpError(new Response(JSON.stringify({ error }), { status })) });
describe("financial session renewal", () => {
  it("renews an expired session before sending a code", async () => {
    const c = client(true);
    await invokeAuthenticatedFunction("link-finance-account", { action: "link", code: "one-time" }, c.api);
    expect(c.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(c.functions.invoke).toHaveBeenCalledExactlyOnceWith("link-finance-account", { body: { action: "link", code: "one-time" }, headers: { Authorization: "Bearer renewed" } });
  });
  it("retries a session rejection only once with a renewed token", async () => {
    const c = client();
    c.functions.invoke.mockResolvedValue(rejection(401));
    const result = await invokeAuthenticatedFunction("link-finance-account", { action: "status" }, c.api);
    expect(c.functions.invoke).toHaveBeenCalledTimes(2);
    expect(c.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(result.error?.context.status).toBe(401);
  });
  it("does not replay a code after uncertain delivery or receiver rejection", async () => {
    for (const [status, error] of [[502, "No se confirmó"], [409, "Código usado"], [401, "Balans Board no pudo confirmar la vinculación"]] as const) {
      const c = client();
      c.functions.invoke.mockResolvedValue(rejection(status, error));
      await invokeAuthenticatedFunction("link-finance-account", { action: "link", code: "one-time" }, c.api);
      expect(c.functions.invoke).toHaveBeenCalledTimes(1);
      expect(c.auth.refreshSession).not.toHaveBeenCalled();
    }
  });
  it("never calls the function when renewal fails", async () => {
    const c = client(true);
    c.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("expired") });
    await expect(invokeAuthenticatedFunction("link-finance-account", { action: "status" }, c.api)).rejects.toThrow("Inicia sesión nuevamente");
    expect(c.functions.invoke).not.toHaveBeenCalled();
  });
});