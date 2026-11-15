REVOKE ALL ON public.activity_history FROM anon, authenticated;
GRANT SELECT ON public.activity_history TO authenticated;
REVOKE ALL ON SEQUENCE public.activity_history_id_seq FROM anon, authenticated;