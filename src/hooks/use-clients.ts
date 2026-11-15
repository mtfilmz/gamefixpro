import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { clientSchema } from "@/lib/clients";
import { PreviousClient } from "@/lib/previous-clients";

export function useClients() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const key = ["clients", user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("cliente, telefono, email").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const addClient = async (client: PreviousClient) => {
    if (!user) throw new Error("Inicia sesión para guardar clientes");
    const parsed = clientSchema.parse(client);
    const { error } = await supabase.from("clients").insert({ cliente: parsed.cliente || "", telefono: parsed.telefono || "", email: parsed.email || "", user_id: user.id });
    if (error) throw error;
    await cache.invalidateQueries({ queryKey: key });
  };
  return { clients: query.data ?? [], loading: query.isLoading, error: query.error, refresh: query.refetch, addClient };
}