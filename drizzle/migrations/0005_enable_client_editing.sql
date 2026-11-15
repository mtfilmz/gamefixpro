ALTER TABLE public.clients ADD COLUMN source_key text;
GRANT UPDATE ON public.clients TO authenticated;
CREATE POLICY "Owners edit clients" ON public.clients FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE UNIQUE INDEX clients_owner_source_key_idx ON public.clients(user_id, source_key) WHERE source_key IS NOT NULL;