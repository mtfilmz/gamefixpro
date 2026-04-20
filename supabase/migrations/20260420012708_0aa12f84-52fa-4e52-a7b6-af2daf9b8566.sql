-- Allow technicians (and admins) to view all repairs
DROP POLICY IF EXISTS "Users can view their own repairs" ON public.repairs;

CREATE POLICY "Authenticated users can view all repairs"
ON public.repairs
FOR SELECT
TO authenticated
USING (true);

-- Allow technicians (and admins) to update all repairs
DROP POLICY IF EXISTS "Users can update their own repairs" ON public.repairs;

CREATE POLICY "Authenticated users can update all repairs"
ON public.repairs
FOR UPDATE
TO authenticated
USING (true);

-- Keep delete restricted: only owner or admin
-- (existing policies "Users can delete their own repairs" and "Admins can delete all repairs" already cover this)