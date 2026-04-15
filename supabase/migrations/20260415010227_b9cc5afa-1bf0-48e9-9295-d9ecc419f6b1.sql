
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-images', 'repair-images', true);

CREATE POLICY "Users can upload repair images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'repair-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own repair images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'repair-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all repair images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'repair-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own repair images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'repair-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view repair images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'repair-images');
