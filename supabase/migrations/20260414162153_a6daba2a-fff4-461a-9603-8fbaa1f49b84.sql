
-- Add user_id column to repairs
ALTER TABLE public.repairs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read" ON public.repairs;
DROP POLICY IF EXISTS "Allow public insert" ON public.repairs;
DROP POLICY IF EXISTS "Allow public update" ON public.repairs;
DROP POLICY IF EXISTS "Allow public delete" ON public.repairs;

-- Create user-scoped policies
CREATE POLICY "Users can view their own repairs"
ON public.repairs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repairs"
ON public.repairs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repairs"
ON public.repairs FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repairs"
ON public.repairs FOR DELETE TO authenticated
USING (auth.uid() = user_id);
