-- Adicionar 'scrapingbee' aos providers permitidos na tabela user_api_keys
ALTER TABLE user_api_keys
DROP CONSTRAINT IF EXISTS user_api_keys_api_provider_check;

-- Recriar a constraint incluindo 'scrapingbee' na lista de providers
ALTER TABLE user_api_keys
ADD CONSTRAINT user_api_keys_api_provider_check 
CHECK (api_provider = ANY (ARRAY['youtube'::text, 'gemini'::text, 'claude'::text, 'openai'::text, 'whisk'::text, 'imagefx'::text, 'huggingface'::text, 'kimi'::text, 'scrapingbee'::text]));