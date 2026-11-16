import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { clientSchema, clientKey, DirectoryClient } from "@/lib/clients";

export function useClients() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const key = ["clients", user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, cliente, telefono, email, source_key, contacto, direccion, notas").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const addClient = async (client: DirectoryClient) => {
    if (!user) throw new Error("Inicia sesión para guardar clientes");
    const parsed = clientSchema.parse(client);
    const { error } = await supabase.from("clients").insert({ ...parsed, cliente: parsed.cliente || "", user_id: user.id });
    if (error) throw error;
    await cache.invalidateQueries({ queryKey: key });
  };
  const editClient = async (original: DirectoryClient, client: DirectoryClient) => {
    if (!user) throw new Error("Inicia sesión para editar clientes");
    const parsed = clientSchema.parse(client);
    const values = { ...parsed, cliente: parsed.cliente || "" };
    // Preserve the original identity so old repairs no longer reintroduce stale contact data.
    const result = original.id
      ? await supabase.from("clients").update({ ...values, source_key: original.source_key || clientKey(original) }).eq("id", original.id).eq("user_id", user.id).select("id").single()
      : await supabase.from("clients").insert({ ...values, user_id: user.id, source_key: clientKey(original) }).select("id").single();
    if (result.error) throw result.error;
    await cache.invalidateQueries({ queryKey: key });
  };
  return { clients: query.data ?? [], loading: query.isLoading, error: query.error, refresh: query.refetch, addClient, editClient };
}