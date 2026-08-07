-- Migration: Add date released field to trackers
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS date_released TIMESTAMP WITH TIME ZONE;
