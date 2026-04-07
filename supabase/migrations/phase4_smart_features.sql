-- Phase 4: AI Recommendations & Smart Features

-- Create user interests/preferences table
CREATE TABLE user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_activities TEXT[] DEFAULT '{}',
  travel_style TEXT CHECK (travel_style IN ('luxury', 'budget', 'adventure', 'cultural', 'relaxation')),
  average_budget_per_day DECIMAL(10, 2),
  preferred_climate TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  mobility_needs TEXT,
  pace TEXT CHECK (pace IN ('slow', 'moderate', 'fast')) DEFAULT 'moderate',
  group_size INTEGER,
  travel_season TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create recommendations table
CREATE TABLE trip_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('activity', 'restaurant', 'accommodation', 'transport', 'weather_advisory')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price_range TEXT,
  rating DECIMAL(2, 1),
  source TEXT,
  relevance_score DECIMAL(3, 2),
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Create travel checklist table
CREATE TABLE travel_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('documents', 'packing', 'health', 'planning', 'custom')) DEFAULT 'custom',
  created_at TIMESTAMP DEFAULT now()
);

-- Create checklist items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES travel_checklists(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  category TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Create weather cache table
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  weather_data JSONB NOT NULL,
  temperature_high DECIMAL(5, 2),
  temperature_low DECIMAL(5, 2),
  condition TEXT,
  humidity INTEGER,
  precip_chance INTEGER,
  wind_speed DECIMAL(5, 2),
  cached_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT now() + INTERVAL '6 hours'
);

-- Create emergency contacts table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  police_number TEXT,
  ambulance_number TEXT,
  fire_number TEXT,
  tourist_helpline TEXT,
  embassy_number TEXT,
  hospital_name TEXT,
  hospital_address TEXT,
  hospital_phone TEXT,
  data_source TEXT,
  last_updated TIMESTAMP DEFAULT now()
);

-- Create destination info table
CREATE TABLE destination_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL UNIQUE,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  description TEXT,
  best_time_to_visit TEXT[] DEFAULT '{}',
  avg_temperature_summer DECIMAL(5, 2),
  avg_temperature_winter DECIMAL(5, 2),
  currency TEXT,
  language TEXT[] DEFAULT '{}',
  visa_required BOOLEAN,
  highlights TEXT[],
  popular_activities TEXT[],
  avg_daily_cost_budget DECIMAL(10, 2),
  avg_daily_cost_mid DECIMAL(10, 2),
  avg_daily_cost_luxury DECIMAL(10, 2),
  data_source TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create saved recommendations table (for personalization)
CREATE TABLE user_saved_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES trip_recommendations(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, recommendation_id)
);

-- Create indexes
CREATE INDEX idx_user_travel_preferences_user_id ON user_travel_preferences(user_id);
CREATE INDEX idx_trip_recommendations_trip_id ON trip_recommendations(trip_id);
CREATE INDEX idx_trip_recommendations_type ON trip_recommendations(recommendation_type);
CREATE INDEX idx_travel_checklists_trip_id ON travel_checklists(trip_id);
CREATE INDEX idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX idx_weather_cache_location ON weather_cache(location);
CREATE INDEX idx_weather_cache_expires_at ON weather_cache(expires_at);
CREATE INDEX idx_emergency_contacts_trip_id ON emergency_contacts(trip_id);
CREATE INDEX idx_emergency_contacts_destination ON emergency_contacts(destination);
CREATE INDEX idx_destination_info_destination ON destination_info(destination);
CREATE INDEX idx_user_saved_recommendations_user_id ON user_saved_recommendations(user_id);

-- Enable RLS
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_travel_preferences
CREATE POLICY user_travel_preferences_select_policy ON user_travel_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_travel_preferences_insert_policy ON user_travel_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_travel_preferences_update_policy ON user_travel_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trip_recommendations
CREATE POLICY trip_recommendations_select_policy ON trip_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_recommendations.trip_id
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

-- RLS Policies for travel_checklists
CREATE POLICY travel_checklists_select_policy ON travel_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = travel_checklists.trip_id
      AND (
        auth.uid() = trips.user_id OR
        EXISTS (
          SELECT 1 FROM trip_collaborators
          WHERE trip_collaborators.trip_id = trips.id
          AND trip_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY travel_checklists_insert_policy ON travel_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = travel_checklists.trip_id
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

CREATE POLICY travel_checklists_update_policy ON travel_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = travel_checklists.trip_id
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

-- RLS Policies for checklist_items
CREATE POLICY checklist_items_select_policy ON checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM travel_checklists
      WHERE travel_checklists.id = checklist_items.checklist_id
      AND EXISTS (
        SELECT 1 FROM trips
        WHERE trips.id = travel_checklists.trip_id
        AND (
          auth.uid() = trips.user_id OR
          EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trips.id
            AND trip_collaborators.user_id = auth.uid()
          )
        )
      )
    )
  );

-- RLS Policies for emergency_contacts
CREATE POLICY emergency_contacts_select_policy ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = emergency_contacts.trip_id
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

-- RLS Policies for user_saved_recommendations
CREATE POLICY user_saved_recommendations_select_policy ON user_saved_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_saved_recommendations_insert_policy ON user_saved_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update user_travel_preferences updated_at
CREATE OR REPLACE FUNCTION update_user_travel_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_travel_preferences_updated_at_trigger
BEFORE UPDATE ON user_travel_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_travel_preferences_updated_at();

-- Trigger to update destination_info updated_at
CREATE OR REPLACE FUNCTION update_destination_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER destination_info_updated_at_trigger
BEFORE UPDATE ON destination_info
FOR EACH ROW
EXECUTE FUNCTION update_destination_info_updated_at();

-- Function to clean up expired weather cache
CREATE OR REPLACE FUNCTION cleanup_expired_weather_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM weather_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Seed some popular destinations
INSERT INTO destination_info (
  destination, latitude, longitude, description,
  best_time_to_visit, avg_temperature_summer, avg_temperature_winter,
  currency, language, visa_required, highlights, popular_activities,
  avg_daily_cost_budget, avg_daily_cost_mid, avg_daily_cost_luxury
) VALUES
  ('Paris', 48.8566, 2.3522, 'City of Light - Romance, Culture, and History',
   ARRAY['April-May', 'September-October'], 25, 5, 'EUR', ARRAY['French', 'English'], false,
   ARRAY['Eiffel Tower', 'Louvre', 'Notre-Dame', 'Champs-Élysées'], 
   ARRAY['Museum tours', 'River cruises', 'Wine tasting', 'Shopping'], 60, 120, 250),
  
  ('Tokyo', 35.6762, 139.6503, 'Japan''s vibrant capital - Tradition meets Technology',
   ARRAY['March-May', 'September-November'], 28, 5, 'JPY', ARRAY['Japanese', 'English'], false,
   ARRAY['Senso-ji Temple', 'Tokyo Tower', 'Shibuya Crossing', 'Akihabara'], 
   ARRAY['Temple visits', 'Shopping', 'Pub crawling', 'Karaoke'], 50, 100, 250),
  
  ('Bali', -8.6705, 115.2126, 'Tropical paradise with temples and beaches',
   ARRAY['April-May', 'August-November'], 31, 26, 'IDR', ARRAY['Indonesian', 'English'], false,
   ARRAY['Ubud Terraces', 'Tanah Lot Temple', 'Mount Batur', 'Beaches'], 
   ARRAY['Surfing', 'Yoga retreats', 'Temple tours', 'Diving'], 30, 60, 150),
  
  ('New York', 40.7128, -74.0060, 'The city that never sleeps',
   ARRAY['April-May', 'September-November'], 27, 0, 'USD', ARRAY['English'], false,
   ARRAY['Statue of Liberty', 'Times Square', 'Central Park', 'Brooklyn Bridge'], 
   ARRAY['Broadway shows', 'Museum tours', 'Street food', 'Shopping'], 80, 150, 300),
  
  ('Barcelona', 41.3851, 2.1734, 'Mediterranean charm with architectural marvels',
   ARRAY['April-May', 'September-October'], 27, 9, 'EUR', ARRAY['Spanish', 'Catalan', 'English'], false,
   ARRAY['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter'], 
   ARRAY['Beach time', 'Architecture tours', 'Tapas tasting', 'Flamenco'], 50, 100, 200);

-- Space for Phase 4 specific functions (recommendations engine, etc)
-- To be populated by application logic
