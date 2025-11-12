-- Tabela para cachear análises de thumbnails (evitar re-análise)
CREATE TABLE IF NOT EXISTS dark_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text UNIQUE NOT NULL,
  video_id text,
  channel_id text,
  
  -- Resultado da análise
  is_dark boolean NOT NULL,
  confidence integer NOT NULL, -- 0-100
  has_face boolean NOT NULL,
  face_size text, -- 'none' | 'small' | 'medium' | 'large'
  content_type text, -- 'documentary' | 'narration' | 'vlog' | 'gaming' | 'react' | etc
  reason text NOT NULL,
  indicators jsonb, -- { thumbnail: "...", title: "...", overall: "..." }
  
  -- Metadados
  analysis_method text NOT NULL, -- 'gpt-4o-vision' | 'keywords' | 'manual'
  analyzed_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days'),
  
  -- Índices
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dark_cache_thumbnail ON dark_analysis_cache(thumbnail_url);
CREATE INDEX IF NOT EXISTS idx_dark_cache_video ON dark_analysis_cache(video_id);
CREATE INDEX IF NOT EXISTS idx_dark_cache_channel ON dark_analysis_cache(channel_id);
CREATE INDEX IF NOT EXISTS idx_dark_cache_expires ON dark_analysis_cache(expires_at);

-- RLS (permitir leitura/escrita autenticada)
ALTER TABLE dark_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read dark analysis cache"
  ON dark_analysis_cache FOR SELECT
  USING (true);

CREATE POLICY "Users can insert dark analysis cache"
  ON dark_analysis_cache FOR INSERT
  WITH CHECK (true);

-- Cleanup automático de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_dark_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM dark_analysis_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;