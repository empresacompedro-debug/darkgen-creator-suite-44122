-- Adicionar 'huggingface' aos valores permitidos de image_generator
ALTER TABLE thumbnail_modelings 
DROP CONSTRAINT thumbnail_modelings_image_generator_check;

ALTER TABLE thumbnail_modelings 
ADD CONSTRAINT thumbnail_modelings_image_generator_check 
CHECK (image_generator = ANY (ARRAY['lovable-ai'::text, 'nano-banana'::text, 'whisk'::text, 'imagefx'::text, 'huggingface'::text]));