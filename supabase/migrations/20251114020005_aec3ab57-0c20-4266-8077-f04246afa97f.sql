-- Criar tabela para trackear progresso em tempo real
CREATE TABLE IF NOT EXISTS similar_channels_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_channel_url TEXT NOT NULL,
  search_method TEXT NOT NULL CHECK (search_method IN ('featured', 'related-videos', 'keywords', 'hybrid')),
  
  -- Progresso
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'quota_exceeded', 'error')),
  channels_collected JSONB NOT NULL DEFAULT '[]'::jsonb,
  quota_used INTEGER DEFAULT 0,
  
  -- Métodos executados
  featured_done BOOLEAN DEFAULT false,
  related_done BOOLEAN DEFAULT false,
  keywords_done BOOLEAN DEFAULT false,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Erro (se houver)
  error_message TEXT,
  
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE similar_channels_progress ENABLE ROW LEVEL SECURITY;

-- Policies: Usuários podem gerenciar apenas seu próprio progresso
CREATE POLICY "Users can manage own progress"
  ON similar_channels_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para polling eficiente
CREATE INDEX idx_progress_user_status ON similar_channels_progress(user_id, status, updated_at DESC);

-- Índice para cleanup de registros antigos
CREATE INDEX idx_progress_started_at ON similar_channels_progress(started_at);