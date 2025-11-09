import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiKey, executeWithKeyRotation } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para buscar vídeos de um nicho com rotação automática de chaves
async function searchNiche(niche: string, userId: string, supabaseClient: any, filters: any) {
  console.log(`🔍 Buscando nicho: "${niche}"`);
  
  let allVideoIds: string[] = [];
  let pageToken: string | undefined = undefined;
  const maxPages = filters.maxPages || 10; // Configurável pelo usuário
  
  // Buscar múltiplas páginas com rotação automática de chaves
  for (let page = 0; page < maxPages; page++) {
    try {
      const searchData = await executeWithKeyRotation(
        userId,
        'youtube',
        supabaseClient,
        async (apiKey) => {
          const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
          searchUrl.searchParams.append('part', 'snippet');
          searchUrl.searchParams.append('q', niche);
          searchUrl.searchParams.append('type', 'video');
          searchUrl.searchParams.append('order', 'viewCount');
          searchUrl.searchParams.append('maxResults', '50');
          if (pageToken) {
            searchUrl.searchParams.append('pageToken', pageToken);
          }
          searchUrl.searchParams.append('key', apiKey);

          const response = await fetch(searchUrl.toString());
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erro na página ${page + 1}:`, response.status, errorText);
            
            if (response.status === 403) {
              throw new Error(`Quota exceeded: ${errorText}`);
            }
            
            return { items: [], nextPageToken: null };
          }

          return await response.json();
        },
        3
      );
      
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
      allVideoIds.push(...videoIds);
      
      pageToken = searchData.nextPageToken;
      if (!pageToken) break;
      
      if (page < maxPages - 1 && pageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error: any) {
      console.error(`❌ Erro ao buscar página ${page + 1} do nicho "${niche}":`, error.message);
      
      if (error.message.includes('Todas as chaves')) {
        console.error(`🚫 Todas as chaves esgotadas. Parando busca.`);
        break;
      }
      
      continue;
    }
  }

  if (allVideoIds.length === 0) return [];

  // Buscar detalhes dos vídeos em lotes de 50 com rotação de chaves
  const allVideos: any[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    try {
      const batchIds = allVideoIds.slice(i, i + 50);
      
      const videosData = await executeWithKeyRotation(
        userId,
        'youtube',
        supabaseClient,
        async (apiKey) => {
          const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batchIds.join(',')}&key=${apiKey}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 403) {
              throw new Error('Quota exceeded');
            }
            return { items: [] };
          }
          
          return await response.json();
        },
        3
      );
      
      allVideos.push(...(videosData.items || []));
    } catch (error) {
      console.error(`Erro ao buscar detalhes do batch ${i}-${i+50}:`, error);
      continue;
    }
  }

  // Processar cada vídeo e buscar dados do canal com rotação de chaves
  const processedVideos = await Promise.all(
    allVideos.map(async (video: any) => {
      let channelStats = null;
      
      try {
        channelStats = await executeWithKeyRotation(
          userId,
          'youtube',
          supabaseClient,
          async (apiKey) => {
            const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${video.snippet.channelId}&key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
              if (response.status === 403) {
                throw new Error('Quota exceeded');
              }
              return null;
            }
            
            const data = await response.json();
            return data.items?.[0] || null;
          },
          3
        );
      } catch (error) {
        console.error(`Erro ao buscar canal ${video.snippet.channelId}:`, error);
      }
      
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
    // Filtro 1: Duração mínima em segundos (8+ minutos = 480 segundos)
    if (filters.minDuration && video.durationSeconds < filters.minDuration) {
      return false;
    }
    
    // Filtro 2: Inscritos mínimos no canal (800+ inscritos)
    // IMPORTANTE: Só filtra se temos dados do canal (subscriberCount > 0)
    // Se subscriberCount = 0, significa que não conseguimos buscar os dados do canal
    // Nesse caso, mantemos o vídeo para não perder resultados válidos
    if (filters.minSubscribers && video.subscriberCount > 0 && video.subscriberCount < filters.minSubscribers) {
      return false;
    }
    
    return true;
  });

  console.log(`📊 Nicho "${niche}":`);
  console.log(`   → ${allVideoIds.length} IDs encontrados na busca`);
  console.log(`   → ${allVideos.length} vídeos detalhados`);
  console.log(`   → ${processedVideos.length} vídeos processados`);
  console.log(`   → ${filtered.length} após aplicar filtros (≥8min + ≥800 inscritos)`);
  
  // Log detalhado de filtros aplicados
  const filteredByDuration = processedVideos.filter(v => v.durationSeconds < filters.minDuration).length;
  const filteredBySubscribers = processedVideos.filter(v => v.subscriberCount < filters.minSubscribers).length;
  console.log(`   📌 Filtrados: ${filteredByDuration} por duração, ${filteredBySubscribers} por inscritos`);
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

  // Filtros padrão: duração 8+ minutos e 800+ inscritos
  const defaultFilters = {
    minDuration: 480,       // Filtro 1: 8+ minutos
    minSubscribers: 800,    // Filtro 2: 800+ inscritos no canal
    videoDuration: 'any',   // Não limitar na busca
    maxPages: 10            // 10 páginas = ~500 vídeos, 1.250 quota
  };

    const appliedFilters = { ...defaultFilters, ...filters };
    console.log(`📦 Processando batch de ${nichesBatch.length} nichos`);
    console.log(`📊 Filtros aplicados no batch:`, appliedFilters);

    // Processar nichos em paralelo (5 por vez) com rotação automática de chaves
    const allResults: any[] = [];
    let quotaUsed = 0;

    for (let i = 0; i < nichesBatch.length; i += 5) {
      const batch = nichesBatch.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(niche => searchNiche(niche, user.id, supabase, appliedFilters).catch(err => {
          console.error(`Erro ao processar nicho "${niche}":`, err);
          return [];
        }))
      );

      // Quota: search=100 + videos=1 + channels=1 por página = ~125 por página
      const quotaPerNiche = appliedFilters.maxPages * 125;
      quotaUsed += batch.length * quotaPerNiche;

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
      debug: {
        totalProcessed: nichesBatch.length,
        videosPerNiche: Math.round(allResults.length / nichesBatch.length),
        averageQuotaPerNiche: Math.round(quotaUsed / nichesBatch.length)
      }
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
