-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'repair-images';

-- Drop existing public/anon SELECT policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view repair images" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to repair images" ON storage.objects;

-- Users can view images in their own folder
CREATE POLICY "Users can view own repair images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'repair-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload to their own folder  
CREATE POLICY "Users can upload own repair images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'repair-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete from their own folder
CREATE POLICY "Users can delete own repair images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'repair-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);