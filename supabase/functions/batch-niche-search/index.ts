import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiKey, executeWithKeyRotation } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para buscar detalhes do canal
async function getChannelDetails(channelId: string, apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return data.items?.[0] || null;
}

// Função auxiliar para buscar vídeos de um nicho
async function searchNiche(niche: string, apiKey: string, filters: any) {
  console.log(`🔍 Buscando nicho: "${niche}"`);
  
  let allVideoIds: string[] = [];
  let pageToken: string | undefined = undefined;
  const maxPages = 50; // 50 páginas x 50 = 2500 vídeos buscados
  
  // Buscar múltiplas páginas para obter mais resultados
  for (let page = 0; page < maxPages; page++) {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', niche);
    searchUrl.searchParams.append('type', 'video');
    
    // Usar filtros dinâmicos ao invés de hardcoded
    if (filters.videoDuration === 'long') {
      searchUrl.searchParams.append('videoDuration', 'long');
    } else if (filters.videoDuration === 'medium') {
      searchUrl.searchParams.append('videoDuration', 'medium');
    } else if (filters.videoDuration === 'short') {
      searchUrl.searchParams.append('videoDuration', 'short');
    }
    // Se 'any', não adicionar o parâmetro
    
    const daysAgo = new Date(Date.now() - filters.maxVideoAge * 24 * 60 * 60 * 1000).toISOString();
    searchUrl.searchParams.append('publishedAfter', daysAgo);
    searchUrl.searchParams.append('order', 'viewCount');
    searchUrl.searchParams.append('maxResults', '50');
    if (pageToken) {
      searchUrl.searchParams.append('pageToken', pageToken);
    }
    searchUrl.searchParams.append('key', apiKey);

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      console.error(`Erro ao buscar nicho "${niche}" (página ${page + 1}):`, searchResponse.status);
      break;
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
    allVideoIds.push(...videoIds);
    
    pageToken = searchData.nextPageToken;
    if (!pageToken) break; // Não há mais páginas
  }

  if (allVideoIds.length === 0) return [];

  // Buscar detalhes dos vídeos em lotes de 50 (limite da API)
  const allVideos: any[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batchIds = allVideoIds.slice(i, i + 50);
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batchIds.join(',')}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    if (!videosResponse.ok) continue;

    const videosData = await videosResponse.json();
    allVideos.push(...(videosData.items || []));
  }

  // Processar cada vídeo e buscar dados do canal
  const processedVideos = await Promise.all(
    allVideos.map(async (video: any) => {
      const channelStats = await getChannelDetails(video.snippet.channelId, apiKey);
      
      // Parse duration (formato ISO 8601: PT20M13S)
      const durationMatch = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(durationMatch?.[1] || '0');
      const minutes = parseInt(durationMatch?.[2] || '0');
      const seconds = parseInt(durationMatch?.[3] || '0');
      const durationSeconds = hours * 3600 + minutes * 60 + seconds;

      // Calcular idade do vídeo
      const publishedAt = new Date(video.snippet.publishedAt);
      const ageInDays = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

      const viewCount = parseInt(video.statistics.viewCount || '0');
      const likeCount = parseInt(video.statistics.likeCount || '0');
      const commentCount = parseInt(video.statistics.commentCount || '0');
      const subscriberCount = parseInt(channelStats?.statistics?.subscriberCount || '0');

      // Calcular engagement
      const engagement = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

      // Calcular VPH (Views Por Hora)
      const ageInHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      const vph = Math.round(viewCount / Math.max(ageInHours, 1));

      // Calcular Viral Score
      const viralScore = (
        (viewCount / 1000) * 0.5 +
        (engagement * 100000) * 0.3 +
        (vph / 100) * 0.2
      );

      // Calcular ganhos estimados ($0.003 por view)
      const estimatedEarnings = viewCount * 0.003;

      // Calcular ratio views/inscritos
      const viewSubRatio = subscriberCount > 0 ? viewCount / subscriberCount : 0;

      // Calcular idade do canal
      let channelAgeInDays = null;
      if (channelStats?.snippet?.publishedAt) {
        const channelCreatedAt = new Date(channelStats.snippet.publishedAt);
        channelAgeInDays = Math.floor((Date.now() - channelCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: video.id,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        thumbnail: video.snippet.thumbnails.high.url,
        viewCount,
        subscriberCount,
        durationSeconds,
        ageInDays,
        publishedAt: video.snippet.publishedAt,
        niche,
        engagement,
        vph,
        viralScore,
        estimatedEarnings,
        viewSubRatio,
        likeCount,
        commentCount,
        channelAgeInDays,
      };
    })
  );

  // Aplicar filtros dinâmicos do usuário
  const filtered = processedVideos.filter(video => {
    // Filtro de inscritos
    if (filters.maxSubscribers && video.subscriberCount > filters.maxSubscribers) {
      return false;
    }
    if (filters.minSubscribers && video.subscriberCount < filters.minSubscribers) {
      return false;
    }
    
    // Filtro de views
    if (filters.minViews && video.viewCount < filters.minViews) {
      return false;
    }
    
    // Filtro de idade do vídeo
    if (filters.maxVideoAge && video.ageInDays > filters.maxVideoAge) {
      return false;
    }
    
    // Filtro de engagement
    if (filters.minEngagement && video.engagement < filters.minEngagement) {
      return false;
    }
    
    // Filtro de duração mínima em segundos
    if (filters.minDuration && video.durationSeconds < filters.minDuration) {
      return false;
    }
    
    // Filtro de duração do vídeo (categorias)
    const minDuration = filters.videoDuration === 'long' ? 1200 :   // 20+ min
                        filters.videoDuration === 'medium' ? 240 :   // 4-20 min
                        filters.videoDuration === 'short' ? 0 : 0;   // <4 min ou any
    if (video.durationSeconds < minDuration) {
      return false;
    }
    
    // Filtro de ratio views/subs
    if (filters.minViewSubRatio && video.viewSubRatio < filters.minViewSubRatio) {
      return false;
    }
    
    // Filtro de idade do canal
    if (filters.maxChannelAge && video.channelAgeInDays && 
        video.channelAgeInDays > filters.maxChannelAge) {
      return false;
    }
    
    return true;
  });

  console.log(`📊 Nicho "${niche}":`);
  console.log(`   → ${allVideoIds.length} IDs encontrados na busca`);
  console.log(`   → ${allVideos.length} vídeos detalhados`);
  console.log(`   → ${processedVideos.length} vídeos processados`);
  console.log(`   → ${filtered.length} após aplicar filtros`);
  console.log(`   → Retornando top ${Math.min(filtered.length, 500)}`);

  // Retornar top 500 vídeos após filtros
  return filtered
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 500);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { nichesBatch, batchSearchId, filters = {} } = await req.json();

    if (!nichesBatch || !Array.isArray(nichesBatch) || nichesBatch.length === 0) {
      return new Response(JSON.stringify({ error: 'Lista de nichos inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  // Valores padrão MUITO MAIS RELAXADOS para garantir resultados
  const defaultFilters = {
    maxSubscribers: 1000000,    // 1M ao invés de 100k
    minSubscribers: 0,
    minViews: 0,                // Sem mínimo ao invés de 5k
    maxVideoAge: 365,           // 1 ano ao invés de 60 dias
    minEngagement: 0,
    videoDuration: 'any',       // SEM limitação na busca inicial do YouTube
    minDuration: 480,           // 8+ minutos (480 segundos) - filtro aplicado após
    maxChannelVideos: 10000,
    maxChannelAge: 3650,
    minViewSubRatio: 0
  };

    const appliedFilters = { ...defaultFilters, ...filters };
    console.log(`📦 Processando batch de ${nichesBatch.length} nichos`);
    console.log(`📊 Filtros aplicados no batch:`, appliedFilters);

    // Buscar chave de API do YouTube (com descriptografia automática)
    const apiKeyInfo = await getApiKey(user.id, 'youtube', supabase);

    if (!apiKeyInfo) {
      return new Response(JSON.stringify({ error: 'Chave de API do YouTube não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔑 Usando chave do YouTube: ${apiKeyInfo.keyId || 'global'}`);
    const youtubeApiKey = apiKeyInfo.key;

    // Processar nichos em paralelo (5 por vez)
    const allResults: any[] = [];
    let quotaUsed = 0;

    for (let i = 0; i < nichesBatch.length; i += 5) {
      const batch = nichesBatch.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(niche => searchNiche(niche, youtubeApiKey, appliedFilters).catch(err => {
          console.error(`Erro ao processar nicho "${niche}":`, err);
          return [];
        }))
      );

      // Quota: search=100, videos=1, channels=1 por nicho = ~1250 por nicho (50 páginas)
      quotaUsed += batch.length * 1250;

      allResults.push(...batchResults.flat());
    }

    // Atualizar registro do batch search
    if (batchSearchId) {
      const { data: currentSearch } = await supabase
        .from('niche_batch_searches')
        .select('*')
        .eq('id', batchSearchId)
        .single();

      if (currentSearch) {
        const updatedResults = [...(currentSearch.results || []), ...allResults];
        const newProcessedCount = currentSearch.processed_count + nichesBatch.length;
        const newQuotaUsed = (currentSearch.quota_used || 0) + quotaUsed;

        await supabase
          .from('niche_batch_searches')
          .update({
            processed_count: newProcessedCount,
            results: updatedResults,
            quota_used: newQuotaUsed,
            status: newProcessedCount >= currentSearch.total_count ? 'completed' : 'processing',
          })
          .eq('id', batchSearchId);
      }
    }

    console.log(`✅ Batch processado: ${allResults.length} vídeos encontrados`);

    return new Response(JSON.stringify({
      success: true,
      videosFound: allResults.length,
      quotaUsed,
      videos: allResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro no batch search:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
