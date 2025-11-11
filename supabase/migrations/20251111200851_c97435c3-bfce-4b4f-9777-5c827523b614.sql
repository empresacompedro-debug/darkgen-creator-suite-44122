-- Tabela para logging de uso de API (tracking Gemini vs Vertex AI)
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'vertex-ai', 'claude', 'openai')),
  function_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para queries rápidas
  CONSTRAINT idx_user_provider UNIQUE (id)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_provider ON api_usage_logs(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage_logs(timestamp);

-- RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Função SQL para agregação de estatísticas (últimas 24h)
CREATE OR REPLACE FUNCTION get_usage_stats_24h(p_user_id UUID)
RETURNS JSONB AS $$
  SELECT COALESCE(jsonb_build_object(
    'gemini', jsonb_build_object(
      'requests', COUNT(*) FILTER (WHERE provider = 'gemini'),
      'activeKeys', (SELECT COUNT(*) FROM user_api_keys WHERE user_id = p_user_id AND api_provider = 'gemini' AND is_active = true)
    ),
    'vertexAi', jsonb_build_object(
      'requests', COUNT(*) FILTER (WHERE provider = 'vertex-ai'),
      'activeKeys', (SELECT COUNT(*) FROM user_api_keys WHERE user_id = p_user_id AND api_provider = 'vertex-ai' AND is_active = true),
      'estimatedCost', ROUND((COUNT(*) FILTER (WHERE provider = 'vertex-ai') * 0.00125)::numeric, 4)
    ),
    'savingsEstimate', ROUND((COUNT(*) FILTER (WHERE provider = 'gemini') * 0.00125)::numeric, 4)
  ), '{"gemini":{"requests":0,"activeKeys":0},"vertexAi":{"requests":0,"activeKeys":0,"estimatedCost":0},"savingsEstimate":0}'::jsonb)
  FROM api_usage_logs
  WHERE user_id = p_user_id
    AND timestamp > NOW() - INTERVAL '24 hours';
$$ LANGUAGE SQL SECURITY DEFINER;