-- Add missing columns to scene_prompts table
ALTER TABLE public.scene_prompts 
  ADD COLUMN IF NOT EXISTS generation_mode text,
  ADD COLUMN IF NOT EXISTS scene_style text,
  ADD COLUMN IF NOT EXISTS characters jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optimize_for text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS include_text boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_scene_prompts_user_id_created_at 
  ON public.scene_prompts(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.scene_prompts.generation_mode IS 'automatic or manual scene generation mode';
COMMENT ON COLUMN public.scene_prompts.scene_style IS 'realistic, cinematic, animated, artistic, comic';
COMMENT ON COLUMN public.scene_prompts.characters IS 'Array of character objects with name, appearance, clothing, characteristics';
COMMENT ON COLUMN public.scene_prompts.optimize_for IS 'midjourney, flux, dalle, stable - image generator optimization';
COMMENT ON COLUMN public.scene_prompts.language IS 'Language code for prompt generation (pt-BR, en, etc)';
COMMENT ON COLUMN public.scene_prompts.include_text IS 'Whether to include text in generated images';