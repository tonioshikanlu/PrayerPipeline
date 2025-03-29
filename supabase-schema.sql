-- PrayerPipeline Schema for Supabase
-- Generated from shared/schema.ts

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'regular',
  phone TEXT,
  avatar TEXT,
  bio TEXT
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  privacy TEXT NOT NULL DEFAULT 'open',
  leader_rotation INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL
);

-- Organization tags table
CREATE TABLE IF NOT EXISTS organization_tags (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Group tags junction table
CREATE TABLE IF NOT EXISTS group_tags (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'waiting',
  follow_up_date TIMESTAMP,
  is_stale BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  prayer_request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  reference_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prayer tracking
CREATE TABLE IF NOT EXISTS praying_for (
  id SERIAL PRIMARY KEY,
  prayer_request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table for mobile push notification tokens (Expo)
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  prayer_requests BOOLEAN NOT NULL DEFAULT true,
  group_invitations BOOLEAN NOT NULL DEFAULT true,
  comments BOOLEAN NOT NULL DEFAULT true,
  status_updates BOOLEAN NOT NULL DEFAULT true,
  group_updates BOOLEAN NOT NULL DEFAULT true,
  stale_prayer_reminders BOOLEAN NOT NULL DEFAULT true,
  reminder_interval INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Group-specific notification preferences
CREATE TABLE IF NOT EXISTS group_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  muted BOOLEAN NOT NULL DEFAULT false,
  new_prayer_requests BOOLEAN NOT NULL DEFAULT true,
  prayer_status_updates BOOLEAN NOT NULL DEFAULT true,
  new_comments BOOLEAN NOT NULL DEFAULT true,
  group_updates BOOLEAN NOT NULL DEFAULT true,
  meeting_reminders BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Favorite groups table
CREATE TABLE IF NOT EXISTS favorite_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL,
  meeting_link TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_pattern TEXT,
  recurring_day INTEGER,
  recurring_until TIMESTAMP,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  parent_meeting_id INTEGER
);

-- Meeting notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prayer Reminders table
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_days TEXT,
  active_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add foreign key constraints
ALTER TABLE password_reset_tokens
  ADD CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE organizations
  ADD CONSTRAINT fk_organizations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE organization_members
  ADD CONSTRAINT fk_organization_members_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_organization_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE groups
  ADD CONSTRAINT fk_groups_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE organization_tags
  ADD CONSTRAINT fk_organization_tags_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE group_tags
  ADD CONSTRAINT fk_group_tags_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_group_tags_tag_id FOREIGN KEY (tag_id) REFERENCES organization_tags(id) ON DELETE CASCADE;

ALTER TABLE group_members
  ADD CONSTRAINT fk_group_members_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_group_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prayer_requests
  ADD CONSTRAINT fk_prayer_requests_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_prayer_requests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT fk_comments_prayer_request_id FOREIGN KEY (prayer_request_id) REFERENCES prayer_requests(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE praying_for
  ADD CONSTRAINT fk_praying_for_prayer_request_id FOREIGN KEY (prayer_request_id) REFERENCES prayer_requests(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_praying_for_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT fk_push_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notification_preferences
  ADD CONSTRAINT fk_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE group_notification_preferences
  ADD CONSTRAINT fk_group_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_group_notification_preferences_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE favorite_groups
  ADD CONSTRAINT fk_favorite_groups_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_favorite_groups_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE meetings
  ADD CONSTRAINT fk_meetings_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_meetings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_meetings_parent_meeting_id FOREIGN KEY (parent_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL;

ALTER TABLE meeting_notes
  ADD CONSTRAINT fk_meeting_notes_meeting_id FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_meeting_notes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prayer_reminders
  ADD CONSTRAINT fk_prayer_reminders_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_prayer_requests_group_id ON prayer_requests(group_id);
CREATE INDEX idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX idx_comments_prayer_request_id ON comments(prayer_request_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_meetings_group_id ON meetings(group_id);
CREATE INDEX idx_praying_for_prayer_request_id ON praying_for(prayer_request_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create table for sessions (for express-session with connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire"); 