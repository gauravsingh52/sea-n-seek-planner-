-- Phase 5: Social Features & Budget Tracking

-- Create trip comments table
CREATE TABLE trip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES trip_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create trip reactions table (likes, love, excited, etc)
CREATE TABLE trip_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'excited', 'wish')) DEFAULT 'like',
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create budget items table
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('accommodation', 'food', 'transport', 'activities', 'shopping', 'other')) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_actual BOOLEAN DEFAULT FALSE,
  day_number INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create trip followers table (who's following this trip)
CREATE TABLE trip_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('comment', 'reaction', 'shared', 'mentioned', 'update')) NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create trip tags table
CREATE TABLE trip_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, tag_name)
);

-- Create expense splits table (for shared budget)
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Create trip milestones table (events in the trip timeline)
CREATE TABLE trip_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMP,
  milestone_type TEXT CHECK (milestone_type IN ('flight', 'hotel', 'activity', 'meeting', 'custom')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_trip_comments_trip_id ON trip_comments(trip_id);
CREATE INDEX idx_trip_comments_user_id ON trip_comments(user_id);
CREATE INDEX idx_trip_comments_created_at ON trip_comments(created_at DESC);
CREATE INDEX idx_trip_reactions_trip_id ON trip_reactions(trip_id);
CREATE INDEX idx_trip_reactions_user_id ON trip_reactions(user_id);
CREATE INDEX idx_budget_items_trip_id ON budget_items(trip_id);
CREATE INDEX idx_budget_items_category ON budget_items(category);
CREATE INDEX idx_trip_followers_trip_id ON trip_followers(trip_id);
CREATE INDEX idx_trip_followers_user_id ON trip_followers(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_trip_tags_trip_id ON trip_tags(trip_id);
CREATE INDEX idx_expense_splits_budget_item_id ON expense_splits(budget_item_id);
CREATE INDEX idx_trip_milestones_trip_id ON trip_milestones(trip_id);
CREATE INDEX idx_trip_milestones_date_time ON trip_milestones(date_time);

-- Enable RLS
ALTER TABLE trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_comments
CREATE POLICY trip_comments_select_policy ON trip_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_comments.trip_id
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

CREATE POLICY trip_comments_insert_policy ON trip_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_comments.trip_id
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

-- RLS Policies for trip_reactions
CREATE POLICY trip_reactions_select_policy ON trip_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_reactions.trip_id
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

CREATE POLICY trip_reactions_insert_policy ON trip_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_reactions.trip_id
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

-- RLS Policies for budget_items
CREATE POLICY budget_items_select_policy ON budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = budget_items.trip_id
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

CREATE POLICY budget_items_insert_policy ON budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = budget_items.trip_id
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

-- RLS Policies for notifications
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger to update trip_comments updated_at
CREATE OR REPLACE FUNCTION update_trip_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_comments_updated_at_trigger
BEFORE UPDATE ON trip_comments
FOR EACH ROW
EXECUTE FUNCTION update_trip_comments_updated_at();

-- Trigger to update budget_items updated_at
CREATE OR REPLACE FUNCTION update_budget_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_items_updated_at_trigger
BEFORE UPDATE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_items_updated_at();

-- Trigger to update trip_milestones updated_at
CREATE OR REPLACE FUNCTION update_trip_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_milestones_updated_at_trigger
BEFORE UPDATE ON trip_milestones
FOR EACH ROW
EXECUTE FUNCTION update_trip_milestones_updated_at();

-- Function to get budget summary
CREATE OR REPLACE FUNCTION get_budget_summary(trip_id_param UUID)
RETURNS TABLE(
  total_estimated DECIMAL,
  total_actual DECIMAL,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN NOT is_actual THEN amount ELSE 0 END), 0)::DECIMAL as total_estimated,
    COALESCE(SUM(CASE WHEN is_actual THEN amount ELSE 0 END), 0)::DECIMAL as total_actual,
    COALESCE(
      jsonb_object_agg(
        category,
        jsonb_build_object(
          'estimated', SUM(CASE WHEN NOT is_actual THEN amount ELSE 0 END),
          'actual', SUM(CASE WHEN is_actual THEN amount ELSE 0 END)
        )
      ),
      '{}'::JSONB
    ) as by_category
  FROM budget_items
  WHERE budget_items.trip_id = trip_id_param
  GROUP BY TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  trip_id_param UUID,
  notification_type_param TEXT,
  actor_user_id_param UUID,
  message_param TEXT,
  action_url_param TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, trip_id, notification_type, actor_user_id, message, action_url
  ) VALUES (
    user_id_param, trip_id_param, notification_type_param, actor_user_id_param, message_param, action_url_param
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  trip_owner UUID;
BEGIN
  SELECT user_id INTO trip_owner FROM trips WHERE id = NEW.trip_id;
  
  IF trip_owner IS NOT NULL AND trip_owner != NEW.user_id THEN
    PERFORM create_notification(
      trip_owner,
      NEW.trip_id,
      'comment',
      NEW.user_id,
      'Someone commented on your trip',
      '/trip/' || NEW.trip_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_comment_trigger
AFTER INSERT ON trip_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();

-- Trigger to create notification on reaction
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  trip_owner UUID;
BEGIN
  SELECT user_id INTO trip_owner FROM trips WHERE id = NEW.trip_id;
  
  IF trip_owner IS NOT NULL AND trip_owner != NEW.user_id THEN
    PERFORM create_notification(
      trip_owner,
      NEW.trip_id,
      'reaction',
      NEW.user_id,
      'Someone reacted to your trip',
      '/trip/' || NEW.trip_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_reaction_trigger
AFTER INSERT ON trip_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_on_reaction();
