-- Migration: Add reply required flag to trackers (needs reply from recipient)
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS reply_required BOOLEAN DEFAULT false;

-- Increase LCE remarks capacity from VARCHAR(255) to unlimited text
ALTER TABLE trackers ALTER COLUMN lce_remarks TYPE TEXT;
