-- Migration: Add reply slip attachment fields to trackers
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS reply_slip_attachment VARCHAR(255);
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS reply_slip_attachment_mime_type VARCHAR(255);
