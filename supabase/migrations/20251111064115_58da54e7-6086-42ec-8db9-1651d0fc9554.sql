-- Atualizar constraint para aceitar apenas huggingface e pollinations
ALTER TABLE thumbnail_modelings 
DROP CONSTRAINT IF EXISTS thumbnail_modelings_image_generator_check;

ALTER TABLE thumbnail_modelings 
ADD CONSTRAINT thumbnail_modelings_image_generator_check 
CHECK (image_generator = ANY (ARRAY['huggingface'::text, 'pollinations'::text]));