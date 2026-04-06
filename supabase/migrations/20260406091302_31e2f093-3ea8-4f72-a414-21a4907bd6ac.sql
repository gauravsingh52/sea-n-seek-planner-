-- Enable realtime on shared_trips
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_trips;

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Creators can update their shared trips" ON public.shared_trips;

-- Allow anyone with the link to update (collaborative editing)
CREATE POLICY "Anyone can update shared trips"
ON public.shared_trips
FOR UPDATE
USING (true)
WITH CHECK (true);
