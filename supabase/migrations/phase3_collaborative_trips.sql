-- Phase 3: Collaborative Trip Management & Sharing

-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  currency TEXT DEFAULT 'USD',
  total_cost DECIMAL(10, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create itinerary_legs table
CREATE TABLE itinerary_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('transport', 'hotel', 'activity')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  from_location TEXT,
  to_location TEXT,
  from_latitude DECIMAL(9, 6),
  from_longitude DECIMAL(9, 6),
  to_latitude DECIMAL(9, 6),
  to_longitude DECIMAL(9, 6),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  cost DECIMAL(10, 2) DEFAULT 0,
  day_number INTEGER,
  order_index INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create trip_collaborators table (for shared trips)
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'viewer',
  invited_email TEXT,
  accepted_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create trip_activity_feed table (for real-time updates)
CREATE TABLE trip_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  target_type TEXT,
  target_id TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_share_code ON trips(share_code);
CREATE INDEX idx_itinerary_legs_trip_id ON itinerary_legs(trip_id);
CREATE INDEX idx_trips_collaborators_trip_id ON trip_collaborators(trip_id);
CREATE INDEX idx_trips_collaborators_user_id ON trip_collaborators(user_id);
CREATE INDEX idx_activity_feed_trip_id ON trip_activity_feed(trip_id);
CREATE INDEX idx_activity_feed_created_at ON trip_activity_feed(created_at DESC);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own trips and shared trips
CREATE POLICY trips_select_policy ON trips
  FOR SELECT USING (
    auth.uid() = user_id OR
    is_public = TRUE OR
    EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_collaborators.trip_id = trips.id
      AND trip_collaborators.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert trips for themselves
CREATE POLICY trips_insert_policy ON trips
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- RLS Policy: Users can update their own trips or as editors
CREATE POLICY trips_update_policy ON trips
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_collaborators.trip_id = trips.id
      AND trip_collaborators.user_id = auth.uid()
      AND trip_collaborators.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_collaborators.trip_id = trips.id
      AND trip_collaborators.user_id = auth.uid()
      AND trip_collaborators.role IN ('owner', 'editor')
    )
  );

-- RLS Policy: Users can delete their own trips
CREATE POLICY trips_delete_policy ON trips
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- RLS Policy: Itinerary legs - same access as trips
CREATE POLICY itinerary_legs_select_policy ON itinerary_legs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_legs.trip_id
      AND (
        auth.uid() = trips.user_id OR
        trips.is_public = TRUE OR
        EXISTS (
          SELECT 1 FROM trip_collaborators
          WHERE trip_collaborators.trip_id = trips.id
          AND trip_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY itinerary_legs_insert_policy ON itinerary_legs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_legs.trip_id
      AND (
        auth.uid() = trips.user_id OR
        EXISTS (
          SELECT 1 FROM trip_collaborators
          WHERE trip_collaborators.trip_id = trips.id
          AND trip_collaborators.user_id = auth.uid()
          AND trip_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY itinerary_legs_update_policy ON itinerary_legs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_legs.trip_id
      AND (
        auth.uid() = trips.user_id OR
        EXISTS (
          SELECT 1 FROM trip_collaborators
          WHERE trip_collaborators.trip_id = trips.id
          AND trip_collaborators.user_id = auth.uid()
          AND trip_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY itinerary_legs_delete_policy ON itinerary_legs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_legs.trip_id
      AND (
        auth.uid() = trips.user_id OR
        EXISTS (
          SELECT 1 FROM trip_collaborators
          WHERE trip_collaborators.trip_id = trips.id
          AND trip_collaborators.user_id = auth.uid()
          AND trip_collaborators.role = 'owner'
        )
      )
    )
  );

-- Trigger to update trips.updated_at
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at_trigger
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_trips_updated_at();

-- Trigger to update itinerary_legs.updated_at
CREATE OR REPLACE FUNCTION update_itinerary_legs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER itinerary_legs_updated_at_trigger
BEFORE UPDATE ON itinerary_legs
FOR EACH ROW
EXECUTE FUNCTION update_itinerary_legs_updated_at();

-- Trigger to log activity when trip is modified
CREATE OR REPLACE FUNCTION log_trip_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO trip_activity_feed (trip_id, user_id, action, description)
    VALUES (NEW.id, auth.uid(), 'trip_created', 'Trip created: ' || NEW.title);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO trip_activity_feed (trip_id, user_id, action, description, changes)
    VALUES (NEW.id, auth.uid(), 'trip_updated', 'Trip updated', 
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_activity_log_trigger
AFTER INSERT OR UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION log_trip_activity();

-- Trigger to log itinerary leg activity
CREATE OR REPLACE FUNCTION log_leg_activity()
RETURNS TRIGGER AS $$
DECLARE
  trip_id_val UUID;
BEGIN
  SELECT trip_id INTO trip_id_val FROM itinerary_legs WHERE id = NEW.id LIMIT 1;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO trip_activity_feed (trip_id, user_id, action, description, target_type, target_id)
    VALUES (trip_id_val, auth.uid(), 'leg_added', 'Added ' || NEW.type || ': ' || NEW.title, 'leg', NEW.id::text);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO trip_activity_feed (trip_id, user_id, action, description, target_type, target_id)
    VALUES (trip_id_val, auth.uid(), 'leg_updated', 'Updated ' || NEW.type || ': ' || NEW.title, 'leg', NEW.id::text);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO trip_activity_feed (trip_id, user_id, action, description, target_type, target_id)
    VALUES (trip_id_val, auth.uid(), 'leg_deleted', 'Deleted ' || OLD.type || ': ' || OLD.title, 'leg', OLD.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leg_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON itinerary_legs
FOR EACH ROW
EXECUTE FUNCTION log_leg_activity();

-- Function to generate share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
BEGIN
  RETURN SUBSTRING(MD5(RANDOM()::text || now()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to make trip shareable
CREATE OR REPLACE FUNCTION make_trip_shareable(trip_id UUID)
RETURNS TEXT AS $$
DECLARE
  share_code_value TEXT;
BEGIN
  share_code_value := generate_share_code();
  UPDATE trips SET is_public = TRUE, share_code = share_code_value WHERE id = trip_id;
  RETURN share_code_value;
END;
$$ LANGUAGE plpgsql;
