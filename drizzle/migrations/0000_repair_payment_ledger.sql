CREATE TABLE public.repair_payments (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL,
 repair_id text NOT NULL,
 client_name text NOT NULL,
 equipment text NOT NULL,
 amount numeric(14,2) NOT NULL CHECK (amount > 0),
 paid_on date NOT NULL,
 method text NOT NULL CHECK (method IN ('cash','card','transfer','other')),
 sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced')),
 sync_error text,
 remote_movement_id uuid,
 synced_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.repair_payments TO authenticated;
GRANT ALL ON public.repair_payments TO service_role;
ALTER TABLE public.repair_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their payments" ON public.repair_payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.finance_account_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE,
 binding_id uuid NOT NULL UNIQUE,
 destination_user_id uuid NOT NULL,
 enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.finance_account_links TO service_role;
ALTER TABLE public.finance_account_links ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.record_repair_payment(p_id uuid, p_repair_id text, p_amount numeric, p_paid_on date, p_method text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.repairs; existing public.repair_payments; inserted public.repair_payments;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 IF p_id IS NULL OR p_repair_id IS NULL OR p_paid_on IS NULL OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 999999999999.99 OR p_amount <> round(p_amount,2) OR p_method IS NULL OR p_method NOT IN ('cash','card','transfer','other') THEN RAISE EXCEPTION 'Pago inválido'; END IF;
 SELECT * INTO r FROM public.repairs WHERE id = p_repair_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reparación no encontrada'; END IF;
 IF length(trim(r.cliente)) = 0 THEN RAISE EXCEPTION 'Cliente requerido'; END IF;
 INSERT INTO public.repair_payments(id,user_id,repair_id,client_name,equipment,amount,paid_on,method)
 VALUES(p_id,auth.uid(),p_repair_id,r.cliente,concat_ws(' — ',nullif(r.marca,''),nullif(r.consola,'')),p_amount,p_paid_on,p_method)
 ON CONFLICT(id) DO NOTHING RETURNING * INTO inserted;
 IF inserted.id IS NOT NULL THEN RETURN to_jsonb(inserted); END IF;
 SELECT * INTO existing FROM public.repair_payments WHERE id = p_id;
 IF existing.user_id IS DISTINCT FROM auth.uid() OR existing.repair_id IS DISTINCT FROM p_repair_id OR existing.amount IS DISTINCT FROM p_amount OR existing.paid_on IS DISTINCT FROM p_paid_on OR existing.method IS DISTINCT FROM p_method THEN RAISE EXCEPTION 'El identificador ya pertenece a otro pago; no se modificó'; END IF;
 RETURN to_jsonb(existing);
END;
$$;
REVOKE ALL ON FUNCTION public.record_repair_payment(uuid,text,numeric,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_repair_payment(uuid,text,numeric,date,text) TO authenticated;
CREATE INDEX repair_payments_owner_repair ON public.repair_payments(user_id,repair_id,created_at DESC);