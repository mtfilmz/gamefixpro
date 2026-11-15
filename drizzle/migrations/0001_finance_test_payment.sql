ALTER TABLE public.repair_payments ADD COLUMN is_test boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX one_finance_test_per_owner ON public.repair_payments(user_id) WHERE is_test;
CREATE FUNCTION public.record_finance_test_payment(p_paid_on date, p_confirm boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE payment public.repair_payments;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión'; END IF;
 IF p_confirm IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirma el ingreso de prueba de 150'; END IF;
 IF p_paid_on IS NULL THEN RAISE EXCEPTION 'Fecha inválida'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.finance_account_links WHERE user_id = auth.uid() AND enabled) THEN RAISE EXCEPTION 'Vincula tu cuenta de Balans Board antes de enviar la prueba'; END IF;
 INSERT INTO public.repair_payments(id,user_id,repair_id,client_name,equipment,amount,paid_on,method,is_test)
 VALUES(gen_random_uuid(),auth.uid(),'PRUEBA-BALANS','Cliente de prueba','Prueba de recepción — sin reparación',150,p_paid_on,'other',true)
 ON CONFLICT (user_id) WHERE is_test DO NOTHING;
 SELECT * INTO payment FROM public.repair_payments WHERE user_id = auth.uid() AND is_test;
 RETURN to_jsonb(payment);
END;
$$;
REVOKE ALL ON FUNCTION public.record_finance_test_payment(date,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_finance_test_payment(date,boolean) TO authenticated;