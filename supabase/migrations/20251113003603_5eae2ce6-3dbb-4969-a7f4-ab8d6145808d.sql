-- Criar tabela para armazenar resultados de buscas ScrapingBee
CREATE TABLE IF NOT EXISTS similar_channels_scrapingbee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_channel_id TEXT NOT NULL,
  target_channel_name TEXT,
  target_channel_url TEXT NOT NULL,
  target_channel_thumbnail TEXT,
  
  -- Resultados
  channels_found JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadados da busca
  search_method TEXT NOT NULL CHECK (search_method IN ('featured', 'related-videos', 'keywords', 'hybrid')),
  quota_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_similar_channels_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE similar_channels_scrapingbee ENABLE ROW LEVEL SECURITY;

-- Policies: Usuários podem ver apenas suas próprias buscas
CREATE POLICY "Users can view own searches"
  ON similar_channels_scrapingbee FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own searches"
  ON similar_channels_scrapingbee FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
  ON similar_channels_scrapingbee FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para melhor performance
CREATE INDEX idx_similar_channels_user_created ON similar_channels_scrapingbee(user_id, created_at DESC);