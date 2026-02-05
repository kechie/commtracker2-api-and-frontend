-- Add due_date column to tracker_recipients table
ALTER TABLE tracker_recipients ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
