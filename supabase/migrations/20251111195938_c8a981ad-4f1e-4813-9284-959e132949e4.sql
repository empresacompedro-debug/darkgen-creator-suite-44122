-- Adicionar campo para configuração do Vertex AI
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS vertex_config JSONB DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN user_api_keys.vertex_config IS 'Configuração específica para Vertex AI: {"project_id": "...", "location": "us-central1"}';

-- Criar índice para melhorar performance de queries com vertex_config
CREATE INDEX IF NOT EXISTS idx_user_api_keys_vertex_config 
ON user_api_keys USING GIN (vertex_config) 
WHERE vertex_config IS NOT NULL;