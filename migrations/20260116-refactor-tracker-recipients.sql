-- Migration: Create tracker_recipients table (replaces implicit junction table and recipient_actions)
-- Date: 2026-01-16 (updated)
-- Description: Combined tracker-recipient junction table with action tracking fields

-- Drop old tables if they exist (data migration should be done first)
DROP TABLE IF EXISTS recipient_actions CASCADE;

-- Create tracker_recipients table with action fields
CREATE TABLE IF NOT EXISTS tracker_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'seen', 'read', 'acknowledged', 'action_required', 'completed')),
  seen_at TIMESTAMP,
  read_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  "action" VARCHAR(255),
  remarks TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(tracker_id, recipient_id),
  CONSTRAINT fk_tracker_recipients_tracker FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
  CONSTRAINT fk_tracker_recipients_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracker_recipients_tracker_id ON tracker_recipients(tracker_id);
CREATE INDEX IF NOT EXISTS idx_tracker_recipients_recipient_id ON tracker_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_tracker_recipients_status ON tracker_recipients(status);
CREATE INDEX IF NOT EXISTS idx_tracker_recipients_tracker_recipient ON tracker_recipients(tracker_id, recipient_id);
