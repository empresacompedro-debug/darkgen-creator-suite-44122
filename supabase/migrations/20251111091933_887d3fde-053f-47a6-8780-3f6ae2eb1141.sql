-- Add provider column to thumbnail_modelings table
ALTER TABLE thumbnail_modelings 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'pollinations';