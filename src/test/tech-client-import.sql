-- Integration assertions run in a transaction and leave no clients or links behind.
BEGIN;
DO $$
DECLARE owner_id uuid:=gen_random_uuid(); target_id uuid:=gen_random_uuid(); binding uuid; receipt jsonb; cid uuid; conflict_id uuid;
v jsonb:='{"cliente":"José","telefono":"7875550100","email":"","contacto":"Luis","direccion":"San Juan","notas":"Llamar"}';
k jsonb:='["jose","7875550100"]';
BEGIN
 INSERT INTO public.tech_repair_client_links(user_id,target_user_id,enabled,receive_enabled) VALUES(owner_id,target_id,true,true) RETURNING id INTO binding;
 receipt:=public.receive_tech_client(binding,target_id,'tech:1',v,k);
 IF receipt->>'status'<>'created' THEN RAISE EXCEPTION 'create failed'; END IF;
 cid:=(receipt->>'client_id')::uuid;
 receipt:=public.receive_tech_client(binding,target_id,'tech:1',v,k);
 IF receipt->>'status'<>'unchanged' OR (SELECT count(*) FROM public.clients WHERE user_id=owner_id)<>1 THEN RAISE EXCEPTION 'retry duplicated'; END IF;
 receipt:=public.receive_tech_client(binding,target_id,'tech:2',v,k);
 IF receipt->>'client_id'<>cid::text THEN RAISE EXCEPTION 'normalized match duplicated'; END IF;
 v:=jsonb_set(v,'{notas}','"Remote correction"');
 receipt:=public.receive_tech_client(binding,target_id,'tech:1',v,k);
 IF receipt->>'status'<>'conflict' OR (SELECT notas FROM public.clients WHERE id=cid)<>'Llamar' THEN RAISE EXCEPTION 'conflict overwritten'; END IF;
 SELECT id INTO conflict_id FROM public.tech_client_conflicts WHERE binding_id=binding AND source_id='tech:1';
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
 PERFORM public.resolve_tech_client_conflict(conflict_id,false);
 receipt:=public.receive_tech_client(binding,target_id,'tech:1',v,k);
 IF receipt->>'status'<>'unchanged' OR EXISTS(SELECT 1 FROM public.tech_client_conflicts WHERE id=conflict_id) THEN RAISE EXCEPTION 'resolved conflict repeated'; END IF;
 v:=jsonb_set(v,'{telefono}','"7875550199"');
 receipt:=public.receive_tech_client(binding,target_id,'tech:1',v,'["jose","7875550199"]');
 IF receipt->>'status'<>'conflict' OR (SELECT count(*) FROM public.clients WHERE user_id=owner_id)<>1 THEN RAISE EXCEPTION 'changed phone duplicated'; END IF;
 SELECT id INTO conflict_id FROM public.tech_client_conflicts WHERE binding_id=binding AND source_id='tech:1';
 PERFORM public.resolve_tech_client_conflict(conflict_id,true);
 IF (SELECT telefono FROM public.clients WHERE id=cid)<>'7875550199' THEN RAISE EXCEPTION 'remote resolution failed'; END IF;
 PERFORM public.set_tech_client_receive(false);
 BEGIN
  PERFORM public.receive_tech_client(binding,target_id,'tech:3',v,k);
  RAISE EXCEPTION 'disabled receipt allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'receive_disabled' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.receive_tech_client(binding,gen_random_uuid(),'tech:4',v,k);
  RAISE EXCEPTION 'wrong owner allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'unauthorized' THEN RAISE; END IF;
 END;
END $$;
ROLLBACK;