-- Remove a constraint UNIQUE que impede múltiplas chaves por provider
-- Isso permite que usuários tenham 50, 100 ou quantas chaves quiserem por provider
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_user_id_api_provider_key;