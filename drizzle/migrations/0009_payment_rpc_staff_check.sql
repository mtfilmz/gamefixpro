CREATE OR REPLACE FUNCTION public.record_repair_payment(p_id uuid, p_repair_id text, p_amount numeric, p_paid_on date, p_method text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.repairs; existing public.repair_payments; inserted public.repair_payments;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 IF p_id IS NULL OR p_repair_id IS NULL OR p_paid_on IS NULL OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 999999999999.99 OR p_amount <> round(p_amount,2) OR p_method IS NULL OR p_method NOT IN ('cash','card','transfer','other') THEN RAISE EXCEPTION 'Pago inválido'; END IF;
 SELECT * INTO r FROM public.repairs WHERE id = p_repair_id;
 IF NOT FOUND OR NOT (r.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'tecnico'::public.app_role)) THEN RAISE EXCEPTION 'Reparación no encontrada'; END IF;
 IF length(trim(r.cliente)) = 0 THEN RAISE EXCEPTION 'Cliente requerido'; END IF;
 INSERT INTO public.repair_payments(id,user_id,repair_id,client_name,equipment,amount,paid_on,method,client_phone)
 VALUES(p_id,auth.uid(),p_repair_id,r.cliente,concat_ws(' — ',nullif(r.marca,''),nullif(r.consola,'')),p_amount,p_paid_on,p_method,trim(r.telefono))
 ON CONFLICT(id) DO NOTHING RETURNING * INTO inserted;
 IF inserted.id IS NOT NULL THEN RETURN to_jsonb(inserted); END IF;
 SELECT * INTO existing FROM public.repair_payments WHERE id = p_id;
 IF existing.user_id IS DISTINCT FROM auth.uid() OR existing.repair_id IS DISTINCT FROM p_repair_id OR existing.amount IS DISTINCT FROM p_amount OR existing.paid_on IS DISTINCT FROM p_paid_on OR existing.method IS DISTINCT FROM p_method THEN RAISE EXCEPTION 'El identificador ya pertenece a otro pago; no se modificó'; END IF;
 RETURN to_jsonb(existing);
END;
$function$;