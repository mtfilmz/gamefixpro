CREATE TABLE public.tech_client_imports (binding_id uuid NOT NULL REFERENCES public.tech_repair_client_links(id), source_id text NOT NULL, client_id uuid NOT NULL REFERENCES public.clients(id), last_remote jsonb NOT NULL, PRIMARY KEY(binding_id,source_id));
GRANT ALL ON public.tech_client_imports TO service_role;
ALTER TABLE public.tech_client_imports ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tech_client_conflicts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, binding_id uuid NOT NULL REFERENCES public.tech_repair_client_links(id), source_id text NOT NULL, client_id uuid NOT NULL REFERENCES public.clients(id), local_snapshot jsonb NOT NULL, incoming jsonb NOT NULL, UNIQUE(binding_id,source_id));
GRANT SELECT ON public.tech_client_conflicts TO authenticated;
GRANT ALL ON public.tech_client_conflicts TO service_role;
ALTER TABLE public.tech_client_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_read ON public.tech_client_conflicts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.tech_client_values(c public.clients) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT jsonb_build_object('cliente',c.cliente,'telefono',c.telefono,'email',c.email,'contacto',c.contacto,'direccion',c.direccion,'notas',c.notas) $$;
CREATE FUNCTION public.receive_tech_client(p_binding uuid,p_target uuid,p_source text,p_values jsonb,p_key jsonb,p_origin uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE owner_id uuid; c public.clients; m public.tech_client_imports; local_values jsonb;
BEGIN
 SELECT user_id INTO owner_id FROM public.tech_repair_client_links WHERE id=p_binding AND enabled AND target_user_id=p_target FOR UPDATE;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 SELECT * INTO m FROM public.tech_client_imports WHERE binding_id=p_binding AND source_id=p_source;
 IF FOUND THEN SELECT * INTO c FROM public.clients WHERE id=m.client_id AND user_id=owner_id FOR UPDATE;
 ELSIF p_origin IS NOT NULL THEN SELECT * INTO c FROM public.clients WHERE id=p_origin AND user_id=owner_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'unknown_origin'; END IF;
 ELSE
 SELECT * INTO c FROM public.clients WHERE user_id=owner_id AND jsonb_build_array(lower(trim(regexp_replace(normalize(cliente,NFD),'[̀-ͯ]','','g'))),coalesce(nullif(regexp_replace(telefono,'[^0-9]','','g'),''),lower(trim(email))))=p_key ORDER BY created_at LIMIT 1 FOR UPDATE;
 END IF;
 IF c.id IS NULL THEN
 INSERT INTO public.clients(user_id,cliente,telefono,email,contacto,direccion,notas) VALUES(owner_id,p_values->>'cliente',p_values->>'telefono',p_values->>'email',p_values->>'contacto',p_values->>'direccion',p_values->>'notas') RETURNING * INTO c;
 INSERT INTO public.tech_client_imports VALUES(p_binding,p_source,c.id,p_values);
 RETURN jsonb_build_object('status','created','client_id',c.id);
 END IF;
 local_values:=public.tech_client_values(c);
 IF local_values=p_values OR m.last_remote=p_values THEN
 INSERT INTO public.tech_client_imports VALUES(p_binding,p_source,c.id,p_values) ON CONFLICT(binding_id,source_id) DO UPDATE SET last_remote=excluded.last_remote;
 IF local_values=p_values THEN DELETE FROM public.tech_client_conflicts WHERE binding_id=p_binding AND source_id=p_source; END IF;
 RETURN jsonb_build_object('status','unchanged','client_id',c.id);
 END IF;
 INSERT INTO public.tech_client_conflicts(user_id,binding_id,source_id,client_id,local_snapshot,incoming) VALUES(owner_id,p_binding,p_source,c.id,local_values,p_values) ON CONFLICT(binding_id,source_id) DO UPDATE SET local_snapshot=excluded.local_snapshot,incoming=excluded.incoming;
 INSERT INTO public.tech_client_imports VALUES(p_binding,p_source,c.id,coalesce(m.last_remote,local_values)) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('status','conflict','client_id',c.id);
END $$;
REVOKE ALL ON FUNCTION public.receive_tech_client(uuid,uuid,text,jsonb,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_tech_client(uuid,uuid,text,jsonb,jsonb,uuid) TO service_role;
CREATE FUNCTION public.resolve_tech_client_conflict(p_id uuid,p_use_remote boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.tech_client_conflicts; c public.clients;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 SELECT * INTO r FROM public.tech_client_conflicts WHERE id=p_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
 SELECT * INTO c FROM public.clients WHERE id=r.client_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR public.tech_client_values(c)<>r.local_snapshot THEN RAISE EXCEPTION 'client_changed_refresh'; END IF;
 IF p_use_remote THEN UPDATE public.clients SET cliente=r.incoming->>'cliente',telefono=r.incoming->>'telefono',email=r.incoming->>'email',contacto=r.incoming->>'contacto',direccion=r.incoming->>'direccion',notas=r.incoming->>'notas' WHERE id=c.id; END IF;
 UPDATE public.tech_client_imports SET last_remote=r.incoming WHERE binding_id=r.binding_id AND source_id=r.source_id;
 DELETE FROM public.tech_client_conflicts WHERE id=r.id;
END $$;
REVOKE ALL ON FUNCTION public.resolve_tech_client_conflict(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_tech_client_conflict(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tech_client_values(public.clients) TO service_role;