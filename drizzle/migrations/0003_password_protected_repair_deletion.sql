CREATE TABLE public.repair_delete_attempts (user_id uuid PRIMARY KEY, window_started_at timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 0);
GRANT ALL ON public.repair_delete_attempts TO service_role;
ALTER TABLE public.repair_delete_attempts ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.allow_repair_delete_attempt(p_user_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE count_attempts integer;
BEGIN
 INSERT INTO public.repair_delete_attempts(user_id,attempts) VALUES(p_user_id,1)
 ON CONFLICT(user_id) DO UPDATE SET attempts=CASE WHEN repair_delete_attempts.window_started_at < now()-interval '15 minutes' THEN 1 ELSE repair_delete_attempts.attempts+1 END, window_started_at=CASE WHEN repair_delete_attempts.window_started_at < now()-interval '15 minutes' THEN now() ELSE repair_delete_attempts.window_started_at END
 RETURNING attempts INTO count_attempts;
 RETURN count_attempts<=5;
END; $$;
REVOKE ALL ON FUNCTION public.allow_repair_delete_attempt(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allow_repair_delete_attempt(uuid) TO service_role;
CREATE FUNCTION public.delete_repairs_verified(p_user_id uuid,p_ids text[]) RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE deleted text[]; admin_allowed boolean;
BEGIN
 IF p_user_id IS NULL OR p_ids IS NULL OR cardinality(p_ids)<1 OR cardinality(p_ids)>1000 THEN RAISE EXCEPTION 'invalid_request'; END IF;
 admin_allowed:=public.has_role(p_user_id,'admin'::public.app_role);
 PERFORM 1 FROM public.repairs WHERE id=ANY(p_ids) FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.repairs WHERE id=ANY(p_ids) AND NOT (admin_allowed OR user_id=p_user_id) OR (id=ANY(p_ids) AND user_id IS NULL AND NOT admin_allowed)) THEN RAISE EXCEPTION 'permission_denied'; END IF;
 IF (SELECT count(*) FROM public.repairs WHERE id=ANY(p_ids))<>(SELECT count(DISTINCT v) FROM unnest(p_ids) v) THEN RAISE EXCEPTION 'repair_missing'; END IF;
 WITH removed AS (DELETE FROM public.repairs WHERE id=ANY(p_ids) RETURNING id) SELECT array_agg(id) INTO deleted FROM removed;
 RETURN deleted;
END; $$;
REVOKE ALL ON FUNCTION public.delete_repairs_verified(uuid,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_repairs_verified(uuid,text[]) TO service_role;
REVOKE DELETE ON public.repairs FROM authenticated,anon;