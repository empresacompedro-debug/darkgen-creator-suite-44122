-- Criar tabela de buscas relacionadas
CREATE TABLE public.related_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_term TEXT NOT NULL,
  
  -- Configurações de busca
  min_duration INTEGER DEFAULT 1200,
  dark_detection_method TEXT DEFAULT 'lovable-ai',
  
  -- Progresso e estatísticas (sem limite)
  status TEXT DEFAULT 'searching',
  current_iteration INTEGER DEFAULT 0,
  total_videos_found INTEGER DEFAULT 0,
  total_videos_analyzed INTEGER DEFAULT 0,
  total_faceless_found INTEGER DEFAULT 0,
  quota_used INTEGER DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stopped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_related_searches_user_id ON public.related_searches(user_id);
CREATE INDEX idx_related_searches_status ON public.related_searches(status);

-- Criar tabela de vídeos relacionados
CREATE TABLE public.related_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES related_searches(id) ON DELETE CASCADE,
  
  -- Dados do vídeo
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  view_count BIGINT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados do canal
  channel_id TEXT,
  channel_title TEXT,
  channel_thumbnail TEXT,
  subscriber_count INTEGER,
  channel_created_at TIMESTAMP WITH TIME ZONE,
  channel_age_days INTEGER,
  
  -- Métricas
  vph INTEGER,
  view_sub_ratio DECIMAL,
  engagement DECIMAL,
  
  -- Detecção Faceless
  is_dark BOOLEAN DEFAULT false,
  dark_score INTEGER,
  dark_method TEXT,
  dark_analysis JSONB,
  
  -- Rastreamento iterativo
  iteration INTEGER DEFAULT 0,
  parent_video_id TEXT,
  batch_number INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(search_id, youtube_video_id)
);

CREATE INDEX idx_related_videos_search_id ON public.related_videos(search_id);
CREATE INDEX idx_related_videos_is_dark ON public.related_videos(is_dark);
CREATE INDEX idx_related_videos_iteration ON public.related_videos(iteration);
CREATE INDEX idx_related_videos_batch ON public.related_videos(batch_number);

-- Enable Row Level Security
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_videos ENABLE ROW LEVEL SECURITY;

-- Policies para related_searches
CREATE POLICY "Users can view their own searches"
  ON public.related_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
  ON public.related_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches"
  ON public.related_searches FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para related_videos
CREATE POLICY "Users can view videos from their searches"
  ON public.related_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.related_searches
      WHERE related_searches.id = related_videos.search_id
      AND related_searches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert videos to their searches"
  ON public.related_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.related_searches
      WHERE related_searches.id = related_videos.search_id
      AND related_searches.user_id = auth.uid()
    )
  );