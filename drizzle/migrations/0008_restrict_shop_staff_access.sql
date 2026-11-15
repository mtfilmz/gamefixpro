DROP POLICY IF EXISTS "Authenticated users can update all repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated users can view all repairs" ON public.repairs;
CREATE POLICY "Staff can view repairs" ON public.repairs FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'tecnico'::public.app_role));
CREATE POLICY "Staff can update repairs" ON public.repairs FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'tecnico'::public.app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'tecnico'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can view app settings" ON public.app_settings;
CREATE POLICY "Staff can view app settings" ON public.app_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'tecnico'::public.app_role));

DROP POLICY IF EXISTS "Public can view repair images" ON storage.objects;
CREATE POLICY "Staff can view repair images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'repair-images' AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'tecnico'::public.app_role)));