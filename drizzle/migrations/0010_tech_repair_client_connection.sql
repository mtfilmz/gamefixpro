ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contacto text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS direccion text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS notas text NOT NULL DEFAULT '';
CREATE TABLE public.tech_repair_client_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, target_user_id uuid, target_email text NOT NULL DEFAULT 'supermobilepr@gmail.com', enabled boolean NOT NULL DEFAULT false, code_hash text, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tech_repair_client_links TO service_role;
REVOKE ALL ON public.tech_repair_client_links FROM anon, authenticated;
ALTER TABLE public.tech_repair_client_links ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_tech_repair_client_links AFTER INSERT OR UPDATE OR DELETE ON public.tech_repair_client_links FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history();
CREATE OR REPLACE FUNCTION public.prepare_tech_client_link(p_user uuid, p_hash text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM set_config('app.audit_actor',p_user::text,true);
 INSERT INTO public.tech_repair_client_links(user_id, code_hash, expires_at) VALUES(p_user,p_hash,now()+interval '10 minutes')
 ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at WHERE NOT tech_repair_client_links.enabled;
 IF NOT FOUND THEN RAISE EXCEPTION 'already_linked'; END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.redeem_tech_client_link(p_hash text,p_target uuid,p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE link public.tech_repair_client_links;
BEGIN
 SELECT * INTO link FROM public.tech_repair_client_links WHERE code_hash=p_hash FOR UPDATE;
 IF NOT FOUND OR link.enabled OR link.expires_at <= now() OR lower(trim(p_email)) <> link.target_email THEN RAISE EXCEPTION 'invalid_code_or_account'; END IF;
 UPDATE public.tech_repair_client_links SET target_user_id=p_target,enabled=true,code_hash=null,expires_at=null WHERE id=link.id;
 RETURN jsonb_build_object('status','linked','binding_id',link.id,'target_user_id',p_target,'scope','clients:read');
END; $$;
REVOKE ALL ON FUNCTION public.prepare_tech_client_link(uuid,text), public.redeem_tech_client_link(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_tech_client_link(uuid,text), public.redeem_tech_client_link(text,uuid,text) TO service_role;