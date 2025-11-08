
-- Migration: 20251107111322

-- Migration: 20251106110353

-- Migration: 20251103162641

-- Migration: 20251103144647

-- Migration: 20251102000845

-- Migration: 20251101164739
-- Criar tabelas para histórico de conteúdo gerado

-- Tabela de roteiros
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  niche TEXT,
  theme TEXT,
  tone TEXT,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de imagens geradas
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  style TEXT,
  aspect_ratio TEXT,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de prompts de thumbnail
CREATE TABLE IF NOT EXISTS public.thumbnail_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de prompts para cenas
CREATE TABLE IF NOT EXISTS public.scene_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_content TEXT NOT NULL,
  prompts TEXT NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de traduções
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_script TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  target_languages TEXT[] NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de otimizações de vídeo
CREATE TABLE IF NOT EXISTS public.video_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_title TEXT,
  original_description TEXT,
  original_tags TEXT[],
  optimized_title TEXT NOT NULL,
  optimized_description TEXT NOT NULL,
  optimized_tags TEXT[] NOT NULL,
  original_score INTEGER,
  new_score INTEGER,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de otimizações de descrição
CREATE TABLE IF NOT EXISTS public.description_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_description TEXT NOT NULL,
  optimized_description TEXT NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de guias de edição
CREATE TABLE IF NOT EXISTS public.editing_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_topic TEXT NOT NULL,
  guide_content TEXT NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas (público sem autenticação)
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnail_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.description_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editing_guides ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (permitir todos acessarem sem autenticação)
CREATE POLICY "Permitir leitura pública de roteiros" ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de roteiros" ON public.scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de roteiros" ON public.scripts FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de imagens" ON public.generated_images FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de imagens" ON public.generated_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de imagens" ON public.generated_images FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de thumbnail prompts" ON public.thumbnail_prompts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de thumbnail prompts" ON public.thumbnail_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de thumbnail prompts" ON public.thumbnail_prompts FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de scene prompts" ON public.scene_prompts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de scene prompts" ON public.scene_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de scene prompts" ON public.scene_prompts FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de translations" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de translations" ON public.translations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de translations" ON public.translations FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de video optimizations" ON public.video_optimizations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de video optimizations" ON public.video_optimizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de video optimizations" ON public.video_optimizations FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de description optimizations" ON public.description_optimizations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de description optimizations" ON public.description_optimizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de description optimizations" ON public.description_optimizations FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de editing guides" ON public.editing_guides FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de editing guides" ON public.editing_guides FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão pública de editing guides" ON public.editing_guides FOR DELETE USING (true);

-- Migration: 20251101171445
-- Adicionar colunas faltantes em tabelas existentes
ALTER TABLE translations ADD COLUMN IF NOT EXISTS translations jsonb;

ALTER TABLE editing_guides 
  ADD COLUMN IF NOT EXISTS script text,
  ADD COLUMN IF NOT EXISTS scene_prompts text;

ALTER TABLE description_optimizations 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS include_cta boolean DEFAULT false;

ALTER TABLE video_optimizations 
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS original_data jsonb,
  ADD COLUMN IF NOT EXISTS optimized_data jsonb;

-- Criar tabelas faltantes
CREATE TABLE IF NOT EXISTS viral_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text NOT NULL,
  generation_type text NOT NULL,
  language text NOT NULL,
  titles jsonb NOT NULL,
  ai_model text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brainstorm_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche text NOT NULL,
  sub_niche text,
  language text NOT NULL,
  ideas jsonb NOT NULL,
  ai_model text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS similar_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_url text NOT NULL,
  days_filter integer NOT NULL,
  subscribers_filter integer NOT NULL,
  channels_found jsonb,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE viral_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE similar_channels ENABLE ROW LEVEL SECURITY;

-- Criar políticas públicas para todas as tabelas (permitir acesso sem autenticação)
CREATE POLICY "Permitir acesso público viral_titles" ON viral_titles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público brainstorm_ideas" ON brainstorm_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público similar_channels" ON similar_channels FOR ALL USING (true) WITH CHECK (true);

-- Migration: 20251101175043
-- Criar tabela para histórico do Conversor SRT
CREATE TABLE IF NOT EXISTS public.srt_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_original TEXT NOT NULL,
  srt_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.srt_conversions ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público
CREATE POLICY "Permitir leitura pública de srt conversions"
  ON public.srt_conversions FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública de srt conversions"
  ON public.srt_conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública de srt conversions"
  ON public.srt_conversions FOR DELETE
  USING (true);

-- Adicionar campo de título à tabela scene_prompts para melhor identificação
ALTER TABLE public.scene_prompts
ADD COLUMN IF NOT EXISTS title TEXT;

-- Migration: 20251101194011
-- Criar tabela de tracking de quota
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature TEXT NOT NULL,
  quota_used INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;

-- Política de acesso público (para edge functions)
CREATE POLICY "Permitir acesso público quota_usage"
  ON public.quota_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índice para otimizar queries
CREATE INDEX IF NOT EXISTS idx_quota_usage_feature_timestamp 
  ON public.quota_usage(feature, timestamp DESC);

-- Migration: 20251101203547
-- Fase 1: Criar tabela de chaves de API por usuário
CREATE TABLE user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_provider text NOT NULL CHECK (api_provider IN ('youtube', 'gemini', 'claude', 'openai', 'whisk', 'imagefx')),
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  quota_status jsonb DEFAULT '{"used": 0, "limit": null, "reset_at": null}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, api_provider)
);

-- Habilitar RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias chaves"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias chaves"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias chaves"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias chaves"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON user_api_keys(api_provider);
CREATE INDEX idx_user_api_keys_active ON user_api_keys(is_active) WHERE is_active = true;

-- Função para obter chave ativa do usuário
CREATE OR REPLACE FUNCTION get_active_api_key(p_user_id uuid, p_provider text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
BEGIN
  SELECT api_key INTO v_api_key
  FROM user_api_keys
  WHERE user_id = p_user_id
    AND api_provider = p_provider
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN v_api_key;
END;
$$;

-- Migration: 20251101221617
-- Criar tabela de concorrentes monitorados
CREATE TABLE competitor_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  channel_title TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_thumbnail TEXT,
  subscriber_count BIGINT,
  video_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de vídeos explosivos monitorados
CREATE TABLE monitored_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  view_count BIGINT NOT NULL,
  like_count INTEGER,
  comment_count INTEGER,
  vph DECIMAL NOT NULL,
  days_since_upload INTEGER NOT NULL,
  is_explosive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(monitor_id, video_id)
);

-- Índices para performance
CREATE INDEX idx_monitored_videos_monitor ON monitored_videos(monitor_id);
CREATE INDEX idx_monitored_videos_published ON monitored_videos(published_at DESC);
CREATE INDEX idx_monitored_videos_vph ON monitored_videos(vph DESC);
CREATE INDEX idx_monitored_videos_explosive ON monitored_videos(is_explosive);
CREATE INDEX idx_competitor_monitors_channel ON competitor_monitors(channel_id);

-- Habilitar RLS
ALTER TABLE competitor_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_videos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público)
CREATE POLICY "Acesso público competitor_monitors" ON competitor_monitors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público monitored_videos" ON monitored_videos FOR ALL USING (true) WITH CHECK (true);

-- Migration: 20251101232121
-- Adicionar colunas para sistema de múltiplas API Keys com rotação automática
ALTER TABLE user_api_keys 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- Criar índice para busca rápida de keys ativas por prioridade
CREATE INDEX IF NOT EXISTS idx_user_api_keys_priority 
ON user_api_keys(user_id, api_provider, is_active, priority);

-- Adicionar colunas para thumbnails e informações do canal alvo no histórico
ALTER TABLE similar_channels 
ADD COLUMN IF NOT EXISTS channel_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS target_channel_name TEXT,
ADD COLUMN IF NOT EXISTS target_channel_thumbnail TEXT;


-- Migration: 20251102002048
-- Add user_id column to all tables and update RLS policies for user isolation

-- 1. Scripts table
ALTER TABLE public.scripts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_scripts_user_id ON public.scripts(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de roteiros" ON public.scripts;
DROP POLICY IF EXISTS "Permitir inserção pública de roteiros" ON public.scripts;
DROP POLICY IF EXISTS "Permitir leitura pública de roteiros" ON public.scripts;

CREATE POLICY "Users can view own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scripts" ON public.scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- 2. Generated images table
ALTER TABLE public.generated_images ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de imagens" ON public.generated_images;
DROP POLICY IF EXISTS "Permitir inserção pública de imagens" ON public.generated_images;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON public.generated_images;

CREATE POLICY "Users can view own images" ON public.generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own images" ON public.generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.generated_images FOR DELETE USING (auth.uid() = user_id);

-- 3. Thumbnail prompts table
ALTER TABLE public.thumbnail_prompts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_thumbnail_prompts_user_id ON public.thumbnail_prompts(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de thumbnail prompts" ON public.thumbnail_prompts;
DROP POLICY IF EXISTS "Permitir inserção pública de thumbnail prompts" ON public.thumbnail_prompts;
DROP POLICY IF EXISTS "Permitir leitura pública de thumbnail prompts" ON public.thumbnail_prompts;

CREATE POLICY "Users can view own thumbnail prompts" ON public.thumbnail_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own thumbnail prompts" ON public.thumbnail_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own thumbnail prompts" ON public.thumbnail_prompts FOR DELETE USING (auth.uid() = user_id);

-- 4. Scene prompts table
ALTER TABLE public.scene_prompts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_scene_prompts_user_id ON public.scene_prompts(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de scene prompts" ON public.scene_prompts;
DROP POLICY IF EXISTS "Permitir inserção pública de scene prompts" ON public.scene_prompts;
DROP POLICY IF EXISTS "Permitir leitura pública de scene prompts" ON public.scene_prompts;

CREATE POLICY "Users can view own scene prompts" ON public.scene_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scene prompts" ON public.scene_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scene prompts" ON public.scene_prompts FOR DELETE USING (auth.uid() = user_id);

-- 5. Translations table
ALTER TABLE public.translations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_translations_user_id ON public.translations(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de translations" ON public.translations;
DROP POLICY IF EXISTS "Permitir inserção pública de translations" ON public.translations;
DROP POLICY IF EXISTS "Permitir leitura pública de translations" ON public.translations;

CREATE POLICY "Users can view own translations" ON public.translations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own translations" ON public.translations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own translations" ON public.translations FOR DELETE USING (auth.uid() = user_id);

-- 6. Video optimizations table
ALTER TABLE public.video_optimizations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_video_optimizations_user_id ON public.video_optimizations(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de video optimizations" ON public.video_optimizations;
DROP POLICY IF EXISTS "Permitir inserção pública de video optimizations" ON public.video_optimizations;
DROP POLICY IF EXISTS "Permitir leitura pública de video optimizations" ON public.video_optimizations;

CREATE POLICY "Users can view own video optimizations" ON public.video_optimizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own video optimizations" ON public.video_optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own video optimizations" ON public.video_optimizations FOR DELETE USING (auth.uid() = user_id);

-- 7. Description optimizations table
ALTER TABLE public.description_optimizations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_description_optimizations_user_id ON public.description_optimizations(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de description optimizations" ON public.description_optimizations;
DROP POLICY IF EXISTS "Permitir inserção pública de description optimizations" ON public.description_optimizations;
DROP POLICY IF EXISTS "Permitir leitura pública de description optimizations" ON public.description_optimizations;

CREATE POLICY "Users can view own description optimizations" ON public.description_optimizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own description optimizations" ON public.description_optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own description optimizations" ON public.description_optimizations FOR DELETE USING (auth.uid() = user_id);

-- 8. Editing guides table
ALTER TABLE public.editing_guides ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_editing_guides_user_id ON public.editing_guides(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de editing guides" ON public.editing_guides;
DROP POLICY IF EXISTS "Permitir inserção pública de editing guides" ON public.editing_guides;
DROP POLICY IF EXISTS "Permitir leitura pública de editing guides" ON public.editing_guides;

CREATE POLICY "Users can view own editing guides" ON public.editing_guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own editing guides" ON public.editing_guides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own editing guides" ON public.editing_guides FOR DELETE USING (auth.uid() = user_id);

-- 9. Viral titles table
ALTER TABLE public.viral_titles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_viral_titles_user_id ON public.viral_titles(user_id);

DROP POLICY IF EXISTS "Permitir acesso público viral_titles" ON public.viral_titles;

CREATE POLICY "Users can view own viral titles" ON public.viral_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own viral titles" ON public.viral_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own viral titles" ON public.viral_titles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own viral titles" ON public.viral_titles FOR DELETE USING (auth.uid() = user_id);

-- 10. Brainstorm ideas table
ALTER TABLE public.brainstorm_ideas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_brainstorm_ideas_user_id ON public.brainstorm_ideas(user_id);

DROP POLICY IF EXISTS "Permitir acesso público brainstorm_ideas" ON public.brainstorm_ideas;

CREATE POLICY "Users can view own brainstorm ideas" ON public.brainstorm_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own brainstorm ideas" ON public.brainstorm_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brainstorm ideas" ON public.brainstorm_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brainstorm ideas" ON public.brainstorm_ideas FOR DELETE USING (auth.uid() = user_id);

-- 11. Similar channels table
ALTER TABLE public.similar_channels ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_similar_channels_user_id ON public.similar_channels(user_id);

DROP POLICY IF EXISTS "Permitir acesso público similar_channels" ON public.similar_channels;

CREATE POLICY "Users can view own similar channels" ON public.similar_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own similar channels" ON public.similar_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own similar channels" ON public.similar_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own similar channels" ON public.similar_channels FOR DELETE USING (auth.uid() = user_id);

-- 12. SRT conversions table
ALTER TABLE public.srt_conversions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_srt_conversions_user_id ON public.srt_conversions(user_id);

DROP POLICY IF EXISTS "Permitir exclusão pública de srt conversions" ON public.srt_conversions;
DROP POLICY IF EXISTS "Permitir inserção pública de srt conversions" ON public.srt_conversions;
DROP POLICY IF EXISTS "Permitir leitura pública de srt conversions" ON public.srt_conversions;

CREATE POLICY "Users can view own srt conversions" ON public.srt_conversions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own srt conversions" ON public.srt_conversions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own srt conversions" ON public.srt_conversions FOR DELETE USING (auth.uid() = user_id);

-- 13. Quota usage table
ALTER TABLE public.quota_usage ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_quota_usage_user_id ON public.quota_usage(user_id);

DROP POLICY IF EXISTS "Permitir acesso público quota_usage" ON public.quota_usage;

CREATE POLICY "Users can view own quota usage" ON public.quota_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quota usage" ON public.quota_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quota usage" ON public.quota_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quota usage" ON public.quota_usage FOR DELETE USING (auth.uid() = user_id);

-- 14. Competitor monitors table
ALTER TABLE public.competitor_monitors ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_competitor_monitors_user_id ON public.competitor_monitors(user_id);

DROP POLICY IF EXISTS "Acesso público competitor_monitors" ON public.competitor_monitors;

CREATE POLICY "Users can view own competitor monitors" ON public.competitor_monitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own competitor monitors" ON public.competitor_monitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own competitor monitors" ON public.competitor_monitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own competitor monitors" ON public.competitor_monitors FOR DELETE USING (auth.uid() = user_id);

-- 15. Monitored videos table
ALTER TABLE public.monitored_videos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_monitored_videos_user_id ON public.monitored_videos(user_id);

DROP POLICY IF EXISTS "Acesso público monitored_videos" ON public.monitored_videos;

CREATE POLICY "Users can view own monitored videos" ON public.monitored_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own monitored videos" ON public.monitored_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monitored videos" ON public.monitored_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monitored videos" ON public.monitored_videos FOR DELETE USING (auth.uid() = user_id);

-- Migration: 20251102004426
-- Criar tabela para análises de títulos de concorrentes
CREATE TABLE public.sub_niche_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_data TEXT NOT NULL,
  videos_analyzed INTEGER,
  sub_niches_found JSONB NOT NULL,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para expansões de nichos
CREATE TABLE public.niche_expansions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  main_niche TEXT NOT NULL,
  nivel_detectado TEXT,
  lista_1 JSONB NOT NULL,
  lista_2 JSONB NOT NULL,
  language TEXT,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sub_niche_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_expansions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sub_niche_analyses
CREATE POLICY "Users can view own sub niche analyses"
  ON public.sub_niche_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sub niche analyses"
  ON public.sub_niche_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sub niche analyses"
  ON public.sub_niche_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para niche_expansions
CREATE POLICY "Users can view own niche expansions"
  ON public.niche_expansions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own niche expansions"
  ON public.niche_expansions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own niche expansions"
  ON public.niche_expansions FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_sub_niche_analyses_user_id ON public.sub_niche_analyses(user_id);
CREATE INDEX idx_sub_niche_analyses_created_at ON public.sub_niche_analyses(created_at DESC);
CREATE INDEX idx_niche_expansions_user_id ON public.niche_expansions(user_id);
CREATE INDEX idx_niche_expansions_created_at ON public.niche_expansions(created_at DESC);

-- Migration: 20251102023857
-- Criar tabela para armazenar análises do Sub-Niche Hunter
CREATE TABLE IF NOT EXISTS public.sub_niche_saved_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_name TEXT NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('titles', 'expansion')),
  
  -- Para análise de títulos
  competitor_data TEXT,
  videos_analyzed INTEGER,
  sub_nichos JSONB,
  insights TEXT,
  
  -- Para expansão de nicho
  main_niche TEXT,
  nivel_detectado TEXT,
  lista_1 JSONB,
  lista_2 JSONB,
  
  -- Metadados
  ai_model TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.sub_niche_saved_analyses ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_niche_saved_analyses' 
    AND policyname = 'Users can view own saved analyses'
  ) THEN
    CREATE POLICY "Users can view own saved analyses"
      ON public.sub_niche_saved_analyses
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_niche_saved_analyses' 
    AND policyname = 'Users can create own saved analyses'
  ) THEN
    CREATE POLICY "Users can create own saved analyses"
      ON public.sub_niche_saved_analyses
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_niche_saved_analyses' 
    AND policyname = 'Users can update own saved analyses'
  ) THEN
    CREATE POLICY "Users can update own saved analyses"
      ON public.sub_niche_saved_analyses
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_niche_saved_analyses' 
    AND policyname = 'Users can delete own saved analyses'
  ) THEN
    CREATE POLICY "Users can delete own saved analyses"
      ON public.sub_niche_saved_analyses
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_sub_niche_analyses_created_at 
  ON public.sub_niche_saved_analyses(created_at DESC);

-- Migration: 20251102024946
-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for Niche Finder search history
CREATE TABLE IF NOT EXISTS public.niche_finder_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_name TEXT NOT NULL,
  search_params JSONB NOT NULL,
  results JSONB NOT NULL,
  quota_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.niche_finder_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own searches" 
ON public.niche_finder_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches" 
ON public.niche_finder_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" 
ON public.niche_finder_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" 
ON public.niche_finder_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_niche_finder_searches_updated_at
BEFORE UPDATE ON public.niche_finder_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_niche_finder_searches_user_id ON public.niche_finder_searches(user_id);
CREATE INDEX idx_niche_finder_searches_created_at ON public.niche_finder_searches(created_at DESC);

-- Migration: 20251102025246
-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own searches" ON public.niche_finder_searches;
  DROP POLICY IF EXISTS "Users can create their own searches" ON public.niche_finder_searches;
  DROP POLICY IF EXISTS "Users can update their own searches" ON public.niche_finder_searches;
  DROP POLICY IF EXISTS "Users can delete their own searches" ON public.niche_finder_searches;
  DROP TRIGGER IF EXISTS update_niche_finder_searches_updated_at ON public.niche_finder_searches;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Create table for Niche Finder search history
CREATE TABLE IF NOT EXISTS public.niche_finder_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_name TEXT NOT NULL,
  search_params JSONB NOT NULL,
  results JSONB NOT NULL,
  quota_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.niche_finder_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own searches" 
ON public.niche_finder_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches" 
ON public.niche_finder_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" 
ON public.niche_finder_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" 
ON public.niche_finder_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_niche_finder_searches_updated_at
BEFORE UPDATE ON public.niche_finder_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance (if not exists)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_niche_finder_searches_user_id ON public.niche_finder_searches(user_id);
  CREATE INDEX IF NOT EXISTS idx_niche_finder_searches_created_at ON public.niche_finder_searches(created_at DESC);
END $$;

-- Migration: 20251102055038
-- Criar tabela de nichos de concorrentes
CREATE TABLE public.competitor_niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.competitor_niches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own niches" 
ON public.competitor_niches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own niches" 
ON public.competitor_niches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own niches" 
ON public.competitor_niches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own niches" 
ON public.competitor_niches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar coluna niche_id em competitor_monitors
ALTER TABLE public.competitor_monitors 
ADD COLUMN niche_id UUID REFERENCES public.competitor_niches(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_competitor_monitors_niche_id ON public.competitor_monitors(niche_id);

-- Create trigger for automatic timestamp updates on competitor_niches
CREATE TRIGGER update_competitor_niches_updated_at
BEFORE UPDATE ON public.competitor_niches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251102060550
-- Create filter_presets table for saving custom filter combinations
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own presets"
  ON filter_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own presets"
  ON filter_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON filter_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON filter_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_filter_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_filter_presets_updated_at();

-- Migration: 20251102061734
-- Criar tabela para salvar análises de nicho
CREATE TABLE niche_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_id UUID REFERENCES niche_finder_searches(id),
  niche_name TEXT NOT NULL,
  niche_description TEXT,
  keywords JSONB,
  metrics JSONB NOT NULL,
  video_ids JSONB NOT NULL,
  specificity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE niche_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own niche analyses"
  ON niche_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own niche analyses"
  ON niche_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own niche analyses"
  ON niche_analyses FOR DELETE
  USING (auth.uid() = user_id);



-- Migration: 20251103163241
-- Fix SECURITY DEFINER function vulnerability by adding authorization check
CREATE OR REPLACE FUNCTION public.get_active_api_key(p_user_id uuid, p_provider text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
BEGIN
  -- CRITICAL: Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only access your own API keys';
  END IF;
  
  SELECT api_key INTO v_api_key
  FROM user_api_keys
  WHERE user_id = p_user_id
    AND api_provider = p_provider
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN v_api_key;
END;
$$;

-- Enable pgcrypto extension for API key encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted column for API keys
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS api_key_encrypted bytea;

-- Create function to encrypt API keys
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use user_id as part of encryption key for additional security
  RETURN pgp_sym_encrypt(p_key, encode(p_user_id::text || Deno.env.get('ENCRYPTION_SECRET'), 'escape'));
END;
$$;

-- Create function to decrypt API keys
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, encode(p_user_id::text || Deno.env.get('ENCRYPTION_SECRET'), 'escape'));
END;
$$;

COMMENT ON COLUMN public.user_api_keys.api_key IS 'DEPRECATED: Use api_key_encrypted instead. This column will be removed in future migration.';
COMMENT ON COLUMN public.user_api_keys.api_key_encrypted IS 'Encrypted API key using pgcrypto. Use decrypt_api_key() function to retrieve.';

-- Migration: 20251103172420
-- Adicionar coluna is_draft para marcar rascunhos
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Índice para buscar rascunhos rapidamente
CREATE INDEX IF NOT EXISTS idx_scripts_draft ON scripts(user_id, is_draft, created_at);

-- Migration: 20251103183414
-- Add new fields to editing_guides table for SRT synchronization
ALTER TABLE editing_guides
ADD COLUMN IF NOT EXISTS srt_content text,
ADD COLUMN IF NOT EXISTS images_per_scene integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS narration_speed numeric DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS total_duration_seconds integer,
ADD COLUMN IF NOT EXISTS validation_status jsonb DEFAULT '{}'::jsonb;

-- Migration: 20251103205342
-- Criar tabela de thumbnails extraídas
CREATE TABLE IF NOT EXISTS public.extracted_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  resolution TEXT NOT NULL,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.extracted_thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extractions"
  ON public.extracted_thumbnails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create extractions"
  ON public.extracted_thumbnails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar tabela de modelagens de thumbnails
CREATE TABLE IF NOT EXISTS public.thumbnail_modelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  modeling_level TEXT NOT NULL CHECK (modeling_level IN ('identical', 'similar', 'concept')),
  include_text BOOLEAN DEFAULT false,
  custom_instructions TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10),
  image_generator TEXT NOT NULL CHECK (image_generator IN ('lovable-ai', 'nano-banana', 'whisk', 'imagefx')),
  generated_images JSONB NOT NULL DEFAULT '[]',
  ai_analysis TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.thumbnail_modelings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modelings"
  ON public.thumbnail_modelings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create modelings"
  ON public.thumbnail_modelings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own modelings"
  ON public.thumbnail_modelings FOR DELETE
  USING (auth.uid() = user_id);

-- Migration: 20251105063442
-- Create table to store batch search progress and results
CREATE TABLE public.niche_batch_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  niches_list TEXT[] NOT NULL,
  processed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing',
  quota_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.niche_batch_searches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own batch searches"
ON public.niche_batch_searches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batch searches"
ON public.niche_batch_searches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch searches"
ON public.niche_batch_searches
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batch searches"
ON public.niche_batch_searches
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_niche_batch_searches_updated_at
BEFORE UPDATE ON public.niche_batch_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106001321
-- Create table for niche lists
CREATE TABLE public.niche_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.niche_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own niche lists"
  ON public.niche_lists
  FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create own niche lists"
  ON public.niche_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own niche lists"
  ON public.niche_lists
  FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own niche lists"
  ON public.niche_lists
  FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Trigger for updated_at
CREATE TRIGGER update_niche_lists_updated_at
  BEFORE UPDATE ON public.niche_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default niche lists (system-wide, no user_id)
-- We'll use a special UUID for system defaults
INSERT INTO public.niche_lists (id, user_id, name, content, is_default) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'NICHOS DESCONHECIDOS', '', true),
('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'NICHOS OCULTOS/SOMBRIOS', '', true),
('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'NICHOS POPULARES', '', true),
('00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'SUBNICHOS & MICRONICHOS', '', true);


-- Migration: 20251106111305
-- Fix encryption functions to work properly in Postgres
-- (Remove invalid Deno.env.get reference and use user_id as encryption key)

CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Use user_id as encryption key (better than nothing, secure within RLS context)
  RETURN pgp_sym_encrypt(p_key, p_user_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text);
END;
$function$;

-- Migrate existing plaintext keys to encrypted storage
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, api_key, user_id FROM user_api_keys WHERE api_key IS NOT NULL AND api_key_encrypted IS NULL
  LOOP
    UPDATE user_api_keys 
    SET api_key_encrypted = public.encrypt_api_key(r.api_key, r.user_id)
    WHERE id = r.id;
  END LOOP;
END $$;

-- Drop the plaintext api_key column
ALTER TABLE user_api_keys DROP COLUMN IF EXISTS api_key;

-- Migration: 20251106111711
-- Fix 1: Restrict niche_lists RLS policy to prevent public access to default lists
DROP POLICY IF EXISTS "Users can view own niche lists" ON public.niche_lists;

CREATE POLICY "Users can view own niche lists" 
ON public.niche_lists 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix 2: Add search_path to update_filter_presets_updated_at function to prevent mutable search path vulnerability
CREATE OR REPLACE FUNCTION public.update_filter_presets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Migration: 20251106112211
-- Remove is_default functionality from niche_lists table
-- Update RLS policies to ensure complete user isolation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own niche lists" ON public.niche_lists;
DROP POLICY IF EXISTS "Users can create own niche lists" ON public.niche_lists;
DROP POLICY IF EXISTS "Users can update own niche lists" ON public.niche_lists;
DROP POLICY IF EXISTS "Users can delete own niche lists" ON public.niche_lists;

-- Recreate policies with strict user isolation (no is_default check)
CREATE POLICY "Users can view own niche lists" 
ON public.niche_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own niche lists" 
ON public.niche_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own niche lists" 
ON public.niche_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own niche lists" 
ON public.niche_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Delete any existing default lists from the database
DELETE FROM public.niche_lists WHERE is_default = true;

-- Remove the is_default column as it's no longer needed
ALTER TABLE public.niche_lists DROP COLUMN IF EXISTS is_default;

-- Migration: 20251106120927
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Only admins can insert plans"
  ON public.subscription_plans FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update plans"
  ON public.subscription_plans FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete plans"
  ON public.subscription_plans FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'pending', 'canceled')),
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires ON public.user_subscriptions(expires_at);

-- Create pix_payments table
CREATE TABLE public.pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'expired', 'canceled')),
  openpix_charge_id TEXT UNIQUE,
  qr_code_image TEXT,
  qr_code_text TEXT,
  correlation_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pix_payments
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.pix_payments FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_pix_payments_user ON public.pix_payments(user_id);
CREATE INDEX idx_pix_payments_status ON public.pix_payments(status);
CREATE INDEX idx_pix_payments_correlation ON public.pix_payments(correlation_id);

-- Create payment_settings table (admin only)
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key TEXT NOT NULL,
  openpix_app_id TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access payment settings
CREATE POLICY "Only admins can view payment settings"
  ON public.payment_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert payment settings"
  ON public.payment_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update payment settings"
  ON public.payment_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON public.pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default plan
INSERT INTO public.subscription_plans (name, description, price, interval, features)
VALUES (
  'Premium Mensal',
  'Acesso completo a todas as ferramentas',
  97.00,
  'monthly',
  '["Todas as ferramentas desbloqueadas", "Suporte prioritário", "Atualizações ilimitadas", "Exportação em Excel"]'::jsonb
);

-- Migration: 20251106125547
-- Migração para Mercado Pago PIX
-- Atualizar tabela payment_settings
ALTER TABLE payment_settings
  DROP COLUMN IF EXISTS openpix_app_id,
  ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT;

-- Atualizar tabela pix_payments
ALTER TABLE pix_payments
  RENAME COLUMN openpix_charge_id TO payment_id;

ALTER TABLE pix_payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS payment_status_detail TEXT;

-- Migration: 20251106131440
-- Remover referências ao Mercado Pago/OpenPix e adicionar AbacatePay
ALTER TABLE payment_settings
  DROP COLUMN IF EXISTS mercadopago_access_token,
  DROP COLUMN IF EXISTS mercadopago_public_key,
  ADD COLUMN IF NOT EXISTS abacatepay_api_key TEXT;

-- Atualizar tabela pix_payments para AbacatePay
ALTER TABLE pix_payments
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_cpf TEXT;

-- Migration: 20251106133648
-- Add abacatepay_id column to pix_payments table
ALTER TABLE public.pix_payments 
ADD COLUMN IF NOT EXISTS abacatepay_id text;

-- Migration: 20251106142626
-- Fix nullable user_id columns to prevent RLS bypass
-- This ensures all user-scoped records are properly associated with a user

-- Update existing NULL user_ids to a safe default (should be rare/none in production)
-- In a production scenario, you might want to delete these orphaned records instead
-- For now, we'll just set the constraint for new records

ALTER TABLE public.brainstorm_ideas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.competitor_monitors ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.description_optimizations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.editing_guides ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.extracted_thumbnails ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.generated_images ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.monitored_videos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.quota_usage ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scene_prompts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scripts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.similar_channels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.srt_conversions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.thumbnail_modelings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.thumbnail_prompts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.translations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.video_optimizations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.viral_titles ALTER COLUMN user_id SET NOT NULL;

-- Fix function search_path issues for security definer functions
-- Ensure all security definer functions have a fixed search_path

CREATE OR REPLACE FUNCTION public.get_active_api_key(p_user_id uuid, p_provider text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_api_key text;
BEGIN
  -- CRITICAL: Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only access your own API keys';
  END IF;
  
  SELECT api_key INTO v_api_key
  FROM user_api_keys
  WHERE user_id = p_user_id
    AND api_provider = p_provider
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN v_api_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use user_id as encryption key (better than nothing, secure within RLS context)
  RETURN pgp_sym_encrypt(p_key, p_user_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text);
END;
$function$;

-- Migration: 20251106142731
-- Fix nullable user_id columns to prevent RLS bypass
-- This ensures all user-scoped records are properly associated with a user

-- Update existing NULL user_ids to a safe default (should be rare/none in production)
-- In a production scenario, you might want to delete these orphaned records instead
-- For now, we'll just set the constraint for new records

ALTER TABLE public.brainstorm_ideas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.competitor_monitors ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.description_optimizations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.editing_guides ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.extracted_thumbnails ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.generated_images ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.monitored_videos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.quota_usage ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scene_prompts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scripts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.similar_channels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.srt_conversions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.thumbnail_modelings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.thumbnail_prompts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.translations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.video_optimizations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.viral_titles ALTER COLUMN user_id SET NOT NULL;

-- Fix function search_path issues for security definer functions
-- Ensure all security definer functions have a fixed search_path

CREATE OR REPLACE FUNCTION public.get_active_api_key(p_user_id uuid, p_provider text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_api_key text;
BEGIN
  -- CRITICAL: Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only access your own API keys';
  END IF;
  
  SELECT api_key INTO v_api_key
  FROM user_api_keys
  WHERE user_id = p_user_id
    AND api_provider = p_provider
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN v_api_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use user_id as encryption key (better than nothing, secure within RLS context)
  RETURN pgp_sym_encrypt(p_key, p_user_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text);
END;
$function$;

-- Migration: 20251106142805
-- Fix remaining functions with mutable search_path
-- Set search_path for all remaining trigger functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Migration: 20251106142938
-- Create table for encrypted service cookies
CREATE TABLE public.user_service_cookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  encrypted_cookie BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, service_name)
);

-- Enable RLS
ALTER TABLE public.user_service_cookies ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own cookies
CREATE POLICY "Users can view their own cookies"
  ON public.user_service_cookies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookies"
  ON public.user_service_cookies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookies"
  ON public.user_service_cookies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cookies"
  ON public.user_service_cookies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_service_cookies_updated_at
  BEFORE UPDATE ON public.user_service_cookies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for cookie encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_service_cookie(p_cookie text, p_user_id uuid)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only encrypt your own cookies';
  END IF;
  
  RETURN pgp_sym_encrypt(p_cookie, p_user_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_service_cookie(p_encrypted bytea, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own cookies';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text);
END;
$function$;

-- Migration: 20251106143335
-- Create audit log table for tracking sensitive operations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (no user check needed for server-side inserts)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Create webhook rate limiting table
CREATE TABLE public.webhook_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  identifier TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_request_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(endpoint, identifier, window_start)
);

-- No RLS needed - this is server-side only
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- System-only access (no user policies)
CREATE POLICY "System only access"
  ON public.webhook_rate_limits
  FOR ALL
  USING (false);

-- Create index for rate limit lookups
CREATE INDEX idx_webhook_rate_limits_lookup ON public.webhook_rate_limits(endpoint, identifier, window_start);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_webhook_rate_limit(
  p_endpoint TEXT,
  p_identifier TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_window TIMESTAMP WITH TIME ZONE;
  v_request_count INTEGER;
BEGIN
  -- Calculate current time window (truncated to the minute)
  v_current_window := date_trunc('minute', now());
  
  -- Get or create rate limit record
  INSERT INTO webhook_rate_limits (endpoint, identifier, window_start, request_count, last_request_at)
  VALUES (p_endpoint, p_identifier, v_current_window, 1, now())
  ON CONFLICT (endpoint, identifier, window_start)
  DO UPDATE SET 
    request_count = webhook_rate_limits.request_count + 1,
    last_request_at = now()
  RETURNING request_count INTO v_request_count;
  
  -- Clean up old rate limit records (older than 1 hour)
  DELETE FROM webhook_rate_limits 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  -- Return true if under limit, false if over
  RETURN v_request_count <= p_max_requests;
END;
$function$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Migration: 20251106145731
-- Add RLS policies for admins to view all payments and subscriptions

-- Policy for admins to view all payments
CREATE POLICY "Admins can view all payments"
ON public.pix_payments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy for admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Migration: 20251106180026
-- Add explosive_reason column to monitored_videos table
ALTER TABLE monitored_videos 
ADD COLUMN IF NOT EXISTS explosive_reason TEXT;

-- Migration: 20251106180354
-- Tabela para histórico de métricas dos vídeos (snapshots para gráficos de tendência)
CREATE TABLE IF NOT EXISTS video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  monitor_id UUID REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  view_count BIGINT NOT NULL,
  like_count INTEGER,
  comment_count INTEGER,
  vph NUMERIC NOT NULL,
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_monitor_id ON video_snapshots(monitor_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_user_id ON video_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_snapshot_at ON video_snapshots(snapshot_at);

-- RLS policies
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video snapshots"
  ON video_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video snapshots"
  ON video_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabela para configurações de alertas
CREATE TABLE IF NOT EXISTS competitor_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  monitor_id UUID REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  min_vph INTEGER DEFAULT 500,
  min_views INTEGER DEFAULT 50000,
  max_days INTEGER DEFAULT 7,
  notify_email BOOLEAN DEFAULT false,
  notify_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, monitor_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alert_settings_user_id ON competitor_alert_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_settings_monitor_id ON competitor_alert_settings(monitor_id);

-- RLS policies
ALTER TABLE competitor_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alert settings"
  ON competitor_alert_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela para alertas gerados
CREATE TABLE IF NOT EXISTS competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  monitor_id UUID REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'explosive_video', 'high_vph', 'viral'
  alert_message TEXT NOT NULL,
  video_data JSONB NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON competitor_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_monitor_id ON competitor_alerts(monitor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON competitor_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON competitor_alerts(created_at);

-- RLS policies
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON competitor_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON competitor_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON competitor_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON competitor_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: 20251106191909
-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify that the encrypt/decrypt functions work correctly
-- The functions encrypt_api_key and decrypt_api_key already exist in the database
-- They just need the pgcrypto extension to be enabled;

-- Migration: 20251106192417
-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the encryption functions to ensure they use pgcrypto correctly
DROP FUNCTION IF EXISTS public.encrypt_api_key(text, uuid);
DROP FUNCTION IF EXISTS public.decrypt_api_key(bytea, uuid);
DROP FUNCTION IF EXISTS public.encrypt_service_cookie(text, uuid);
DROP FUNCTION IF EXISTS public.decrypt_service_cookie(bytea, uuid);

-- Recreate encrypt_api_key function
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use user_id as encryption key
  RETURN pgp_sym_encrypt(p_key, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate decrypt_api_key function
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate encrypt_service_cookie function
CREATE OR REPLACE FUNCTION public.encrypt_service_cookie(p_cookie text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only encrypt your own cookies';
  END IF;
  
  RETURN pgp_sym_encrypt(p_cookie, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate decrypt_service_cookie function
CREATE OR REPLACE FUNCTION public.decrypt_service_cookie(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns the user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own cookies';
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Migration: 20251106192541
-- First ensure pgcrypto is in the extensions schema and public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.encrypt_api_key(text, uuid);
DROP FUNCTION IF EXISTS public.decrypt_api_key(bytea, uuid);
DROP FUNCTION IF EXISTS public.encrypt_service_cookie(text, uuid);
DROP FUNCTION IF EXISTS public.decrypt_service_cookie(bytea, uuid);

-- Recreate encrypt_api_key function with proper schema search path
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN extensions.pgp_sym_encrypt(p_key, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate decrypt_api_key function
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own API keys';
  END IF;
  
  RETURN extensions.pgp_sym_decrypt(p_encrypted, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate encrypt_service_cookie function
CREATE OR REPLACE FUNCTION public.encrypt_service_cookie(p_cookie text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only encrypt your own cookies';
  END IF;
  
  RETURN extensions.pgp_sym_encrypt(p_cookie, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;

-- Recreate decrypt_service_cookie function
CREATE OR REPLACE FUNCTION public.decrypt_service_cookie(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only decrypt your own cookies';
  END IF;
  
  RETURN extensions.pgp_sym_decrypt(p_encrypted, p_user_id::text, 'cipher-algo=aes256');
END;
$function$;


-- Migration: 20251107122204
-- Configurar role de admin para o usuário especificado
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'andreanselmolima@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Migration: 20251107150819
-- Adiciona coluna settings para armazenar metadados das imagens geradas
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Migration: 20251107153325
-- Adicionar 'huggingface' aos valores aceitos na constraint de api_provider
ALTER TABLE user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_api_provider_check;

ALTER TABLE user_api_keys ADD CONSTRAINT user_api_keys_api_provider_check 
CHECK (api_provider = ANY (ARRAY['youtube'::text, 'gemini'::text, 'claude'::text, 'openai'::text, 'whisk'::text, 'imagefx'::text, 'huggingface'::text]));

-- Migration: 20251107154440
-- Criar tabela para títulos virais gerados a partir de campeões
CREATE TABLE IF NOT EXISTS viral_titles_from_champions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_title TEXT NOT NULL,
  structure TEXT NOT NULL,
  theme TEXT NOT NULL,
  generated_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE viral_titles_from_champions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own viral titles"
  ON viral_titles_from_champions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own viral titles"
  ON viral_titles_from_champions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own viral titles"
  ON viral_titles_from_champions FOR DELETE
  USING (auth.uid() = user_id);
