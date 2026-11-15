CREATE TABLE public.clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 cliente text NOT NULL CHECK (length(trim(cliente)) BETWEEN 1 AND 200),
 telefono text NOT NULL DEFAULT '' CHECK (length(telefono) <= 30),
 email text NOT NULL DEFAULT '' CHECK (length(email) <= 254 AND (email = '' OR email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view clients" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners add clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX clients_user_id_idx ON public.clients(user_id);