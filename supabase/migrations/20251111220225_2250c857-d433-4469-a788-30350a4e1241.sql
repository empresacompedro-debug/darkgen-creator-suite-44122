-- 1. Criar tabela isolada para Vertex AI
CREATE TABLE user_vertex_ai_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_encrypted BYTEA NOT NULL,
  vertex_config JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  quota_status JSONB DEFAULT '{"used": 0, "limit": null}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_vertex_keys_user ON user_vertex_ai_keys(user_id);
CREATE INDEX idx_vertex_keys_active ON user_vertex_ai_keys(user_id, is_active, last_used_at);

-- RLS políticas
ALTER TABLE user_vertex_ai_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias chaves Vertex"
  ON user_vertex_ai_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias chaves Vertex"
  ON user_vertex_ai_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias chaves Vertex"
  ON user_vertex_ai_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias chaves Vertex"
  ON user_vertex_ai_keys FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Criar função RPC dedicada para Vertex AI
CREATE OR REPLACE FUNCTION get_and_update_next_vertex_key(p_user_id UUID)
RETURNS TABLE(
  key_id UUID,
  encrypted_key BYTEA,
  vertex_config JSONB,
  priority INTEGER,
  key_number INTEGER,
  total_keys INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key_id UUID;
  v_encrypted BYTEA;
  v_config JSONB;
  v_priority INT;
  v_total INT;
  v_row_num INT;
BEGIN
  -- Contar total de chaves Vertex ativas
  SELECT COUNT(*) INTO v_total
  FROM user_vertex_ai_keys
  WHERE user_id = p_user_id AND is_active = true;

  IF v_total = 0 THEN
    RETURN;
  END IF;

  -- Buscar e atualizar atomicamente (FOR UPDATE SKIP LOCKED)
  UPDATE user_vertex_ai_keys
  SET last_used_at = NOW()
  WHERE id = (
    SELECT id FROM user_vertex_ai_keys
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY 
      last_used_at NULLS FIRST,
      priority ASC,
      id ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, api_key_encrypted, vertex_config, priority
  INTO v_key_id, v_encrypted, v_config, v_priority;

  IF v_key_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular key_number
  SELECT row_number INTO v_row_num
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY priority ASC, id ASC) as row_number
    FROM user_vertex_ai_keys
    WHERE user_id = p_user_id AND is_active = true
  ) sub
  WHERE id = v_key_id;

  RETURN QUERY SELECT v_key_id, v_encrypted, v_config, v_priority, v_row_num::INT, v_total::INT;
END;
$$;

-- 3. Migrar dados existentes de vertex-ai para nova tabela
INSERT INTO user_vertex_ai_keys (user_id, api_key_encrypted, vertex_config, priority, is_active, last_used_at, quota_status, created_at, updated_at)
SELECT user_id, api_key_encrypted, vertex_config, priority, is_active, last_used_at, quota_status, created_at, updated_at
FROM user_api_keys
WHERE api_provider = 'vertex-ai';

-- 4. Deletar registros vertex-ai da tabela antiga
DELETE FROM user_api_keys WHERE api_provider = 'vertex-ai';