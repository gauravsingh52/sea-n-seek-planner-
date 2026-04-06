
-- Create shared_trips table
CREATE TABLE public.shared_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  title TEXT,
  itinerary_data JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_comments table
CREATE TABLE public.trip_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_trip_id UUID NOT NULL REFERENCES public.shared_trips(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;

-- shared_trips policies
CREATE POLICY "Anyone can view shared trips"
  ON public.shared_trips FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create shared trips"
  ON public.shared_trips FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update their shared trips"
  ON public.shared_trips FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their shared trips"
  ON public.shared_trips FOR DELETE
  USING (auth.uid() = created_by);

-- trip_comments policies
CREATE POLICY "Anyone can view comments"
  ON public.trip_comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add comments"
  ON public.trip_comments FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_shared_trips_share_code ON public.shared_trips(share_code);
CREATE INDEX idx_trip_comments_shared_trip_id ON public.trip_comments(shared_trip_id);
