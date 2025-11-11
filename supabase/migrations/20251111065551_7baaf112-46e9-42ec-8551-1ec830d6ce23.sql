-- Make ai_analysis and ai_model optional in thumbnail_modelings table
ALTER TABLE public.thumbnail_modelings 
  ALTER COLUMN ai_analysis DROP NOT NULL,
  ALTER COLUMN ai_model DROP NOT NULL;