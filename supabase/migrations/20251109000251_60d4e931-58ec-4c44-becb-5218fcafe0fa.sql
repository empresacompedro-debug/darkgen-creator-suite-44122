-- Remover a constraint antiga que não permite 'kimi'
ALTER TABLE user_api_keys
DROP CONSTRAINT IF EXISTS user_api_keys_api_provider_check;

-- Recriar a constraint incluindo 'kimi' na lista de providers permitidos
ALTER TABLE user_api_keys
ADD CONSTRAINT user_api_keys_api_provider_check 
CHECK (api_provider = ANY (ARRAY['youtube'::text, 'gemini'::text, 'claude'::text, 'openai'::text, 'whisk'::text, 'imagefx'::text, 'huggingface'::text, 'kimi'::text]));