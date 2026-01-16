-- Migration: Create recipient_actions table
-- Date: 2026-01-16
-- Description: Add table for tracking actions taken by recipients (seen, read, remarks, etc.)

CREATE TABLE IF NOT EXISTS recipient_actions (
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
  CONSTRAINT fk_recipient_actions_tracker FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
  CONSTRAINT fk_recipient_actions_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipient_actions_tracker_id ON recipient_actions(tracker_id);
CREATE INDEX IF NOT EXISTS idx_recipient_actions_recipient_id ON recipient_actions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recipient_actions_status ON recipient_actions(status);
CREATE INDEX IF NOT EXISTS idx_recipient_actions_tracker_recipient ON recipient_actions(tracker_id, recipient_id);
