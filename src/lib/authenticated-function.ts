import { FunctionsHttpError, type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function invokeAuthenticatedFunction(
  name: string,
  body: object,
  client: Pick<SupabaseClient, "auth" | "functions"> = supabase,
) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
  let session = data.session;
  const refresh = async () => {
    const result = await client.auth.refreshSession();
    if (result.error || !result.data.session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
    return result.data.session;
  };
  let refreshed = false;
  if (!session.expires_at || session.expires_at * 1000 <= Date.now() + 60_000) {
    session = await refresh();
    refreshed = true;
  }
  const invoke = () => client.functions.invoke(name, {
    body, headers: { Authorization: `Bearer ${session.access_token}` },
  });
  let result = await invoke();
  // Only authentication failures can be retried: do not repeat a redeemed code
  // after a network failure or a receiver rejection.
  if (!refreshed && result.error instanceof FunctionsHttpError && result.error.context.status === 401) {
    const failure = await result.error.context.clone().json().catch(() => null);
    if (failure?.error === "Sesión inválida" || failure?.message === "Invalid JWT") {
      session = await refresh();
      result = await invoke();
    }
  }
  return result;
}