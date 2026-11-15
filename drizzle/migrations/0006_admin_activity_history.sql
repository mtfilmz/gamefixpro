CREATE TABLE public.activity_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 actor_id uuid,
 entity text NOT NULL,
 record_id text NOT NULL,
 operation text NOT NULL CHECK(operation IN ('INSERT','UPDATE','DELETE')),
 changed_fields text[] NOT NULL DEFAULT '{}',
 before_values jsonb,
 after_values jsonb
);
GRANT SELECT ON public.activity_history TO authenticated;
GRANT SELECT, INSERT ON public.activity_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.activity_history_id_seq TO service_role;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity history" ON public.activity_history FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'::public.app_role));
CREATE INDEX activity_history_occurred_idx ON public.activity_history(occurred_at DESC, id DESC);
CREATE OR REPLACE FUNCTION public.capture_activity_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_row jsonb := '{}'::jsonb; new_row jsonb := '{}'::jsonb; fields text[]; safe_old jsonb; safe_new jsonb; actor uuid; allowed text[] := ARRAY['cliente','telefono','email','marca','consola','numero_serie','color','accesorios','problemas','estado','fecha','costo_diagnostico','costo_reparacion','costo_componente','client_name','client_phone','equipment','amount','paid_on','method','sync_status','remote_movement_id','synced_at','is_test','role','enabled','destination_type','formats','data_scope','schedule_cron','status','file_names','started_at','completed_at'];
BEGIN
 IF TG_OP <> 'INSERT' THEN old_row := to_jsonb(OLD); END IF;
 IF TG_OP <> 'DELETE' THEN new_row := to_jsonb(NEW); END IF;
 SELECT coalesce(array_agg(k ORDER BY k),'{}'::text[]) INTO fields FROM (SELECT jsonb_object_keys(old_row || new_row) k) keys WHERE k NOT IN ('updated_at','created_at') AND (old_row->k) IS DISTINCT FROM (new_row->k);
 IF TG_OP = 'UPDATE' AND cardinality(fields)=0 THEN RETURN NEW; END IF;
 SELECT jsonb_object_agg(key,value) INTO safe_old FROM jsonb_each(old_row) WHERE key = ANY(allowed);
 SELECT jsonb_object_agg(key,value) INTO safe_new FROM jsonb_each(new_row) WHERE key = ANY(allowed);
 actor := auth.uid();
 IF actor IS NULL THEN actor := nullif(current_setting('app.audit_actor',true),'')::uuid; END IF;
 INSERT INTO public.activity_history(actor_id,entity,record_id,operation,changed_fields,before_values,after_values)
 VALUES(actor,TG_TABLE_NAME,coalesce(new_row->>'id',old_row->>'id',new_row->>'user_id',old_row->>'user_id',''),TG_OP,fields,safe_old,safe_new);
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capture_activity_history() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_repairs AFTER INSERT OR UPDATE OR DELETE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.repair_payments FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_links AFTER INSERT OR UPDATE OR DELETE ON public.finance_account_links FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_backup_settings AFTER INSERT OR UPDATE OR DELETE ON public.backup_settings FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_backup_runs AFTER INSERT OR UPDATE OR DELETE ON public.backup_runs FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE TRIGGER audit_delete_attempts AFTER INSERT OR UPDATE OR DELETE ON public.repair_delete_attempts FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE OR REPLACE FUNCTION public.delete_repairs_verified(p_user_id uuid,p_ids text[]) RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted text[]; admin_allowed boolean;
BEGIN
 IF p_user_id IS NULL OR p_ids IS NULL OR cardinality(p_ids)<1 OR cardinality(p_ids)>1000 THEN RAISE EXCEPTION 'invalid_request'; END IF;
 PERFORM set_config('app.audit_actor',p_user_id::text,true);
 admin_allowed:=public.has_role(p_user_id,'admin'::public.app_role);
 PERFORM 1 FROM public.repairs WHERE id=ANY(p_ids) FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.repairs WHERE id=ANY(p_ids) AND NOT (admin_allowed OR user_id=p_user_id) OR (id=ANY(p_ids) AND user_id IS NULL AND NOT admin_allowed)) THEN RAISE EXCEPTION 'permission_denied'; END IF;
 IF (SELECT count(*) FROM public.repairs WHERE id=ANY(p_ids))<>(SELECT count(DISTINCT v) FROM unnest(p_ids) v) THEN RAISE EXCEPTION 'repair_missing'; END IF;
 WITH removed AS (DELETE FROM public.repairs WHERE id=ANY(p_ids) RETURNING id) SELECT array_agg(id) INTO deleted FROM removed;
 RETURN deleted;
END; $$;