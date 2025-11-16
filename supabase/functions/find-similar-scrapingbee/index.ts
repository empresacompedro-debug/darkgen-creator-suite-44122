import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getNextKeyRoundRobin, markKeyExhaustedAndGetNext } from '../_shared/round-robin.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarChannel {
  id: string;
  name: string;
  handle: string;
  url: string;
  thumbnail: string;
  subscribers: string;
  videos_count?: number;
  similarity_score: number;
  category?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { channelUrl, searchMethod = 'hybrid' } = await req.json();

    if (!channelUrl) {
      throw new Error('URL do canal é obrigatória');
    }

    console.log(`🔍 [ScrapingBee] Iniciando busca para: ${channelUrl} (método: ${searchMethod})`);

    // 1. Obter e validar chave ScrapingBee
    const scrapingbeeKeyData = await getNextKeyRoundRobin(user.id, 'scrapingbee' as any, supabaseClient);

    if (!scrapingbeeKeyData) {
      throw new Error('Configure sua chave ScrapingBee em Configurações antes de usar esta ferramenta');
    }

    const scrapingbeeKey = scrapingbeeKeyData.key;
    console.log(`🔑 [ScrapingBee] Chave obtida: ${scrapingbeeKey.substring(0, 10)}...`);

    // 1.1 Validar chave com teste simples
    console.log('🔍 [ScrapingBee] Validando chave...');
    const testUrl = buildScrapingBeeUrl('https://example.com', scrapingbeeKey, {
      render_js: false,
      premium_proxy: false
    });
    
    const testResponse = await fetch(testUrl);
    const spbStatus = testResponse.headers.get('spb-initial-status-code') || testResponse.headers.get('Spb-Initial-Status-Code');
    
    console.log(`📡 [ScrapingBee] Teste de chave - Status: ${testResponse.status}, Spb-Status: ${spbStatus}`);
    
    if (testResponse.status === 401 || testResponse.status === 403) {
      throw new Error('Chave ScrapingBee inválida. Verifique sua chave em Configurações.');
    }
    
    if (testResponse.status === 402) {
      throw new Error('Quota ScrapingBee esgotada. Recarregue seus créditos em app.scrapingbee.com');
    }

    // 2. Extrair channel handle/ID
    const channelHandle = extractChannelHandle(channelUrl);
    console.log(`📺 [ScrapingBee] Channel handle: ${channelHandle}`);

    // 3. Criar registro de progresso
    const { data: progressRecord, error: progressError } = await supabaseClient
      .from('similar_channels_progress')
      .insert({
        user_id: user.id,
        target_channel_url: channelUrl,
        search_method: searchMethod,
        status: 'running',
        channels_collected: [],
        quota_used: 0
      })
      .select()
      .single();

    if (progressError) {
      console.error('❌ Erro ao criar registro de progresso:', progressError);
    }

    const progressId = progressRecord?.id;

    // 4. Executar métodos de busca
    const allChannels: SimilarChannel[] = [];
    let totalQuotaUsed = 0;

    try {
      // Featured channels
      if (searchMethod === 'featured' || searchMethod === 'hybrid') {
        console.log('🎯 [Featured] Buscando canais em destaque...');
        const result = await scrapeFeaturedChannels(channelHandle, scrapingbeeKey);
        allChannels.push(...result.channels);
        totalQuotaUsed += result.quota;

        // Atualizar progresso
        if (progressId) {
          await updateProgress(supabaseClient, progressId, allChannels, totalQuotaUsed, { featured_done: true });
        }
      }

      // Related channels via video pages
      if (searchMethod === 'related-videos' || searchMethod === 'hybrid') {
        console.log('📹 [Related] Buscando canais relacionados...');
        const result = await scrapeRelatedChannels(channelHandle, scrapingbeeKey, supabaseClient, progressId, allChannels, totalQuotaUsed);
        allChannels.push(...result.channels);
        totalQuotaUsed += result.quota;

        // Atualizar progresso
        if (progressId) {
          await updateProgress(supabaseClient, progressId, allChannels, totalQuotaUsed, { related_done: true });
        }
      }

      // Keywords search
      if (searchMethod === 'keywords' || searchMethod === 'hybrid') {
        console.log('🔤 [Keywords] Buscando por keywords...');
        const result = await scrapeByKeywords(channelHandle, scrapingbeeKey);
        allChannels.push(...result.channels);
        totalQuotaUsed += result.quota;

        // Atualizar progresso
        if (progressId) {
          await updateProgress(supabaseClient, progressId, allChannels, totalQuotaUsed, { keywords_done: true });
        }
      }

      // 5. Processar resultados
      const uniqueChannels = removeDuplicates(allChannels);
      console.log(`✅ [ScrapingBee] ${uniqueChannels.length} canais únicos encontrados`);

      const scoredChannels = uniqueChannels
        .map(ch => ({
          ...ch,
          similarity_score: ch.similarity_score >= 0.6 ? ch.similarity_score : 0.6
        }))
        .filter(ch => ch.similarity_score >= 0.6)
        .sort((a, b) => b.similarity_score - a.similarity_score);

      // 6. Salvar resultado final
      const { error: insertError } = await supabaseClient
        .from('similar_channels_scrapingbee')
        .insert({
          user_id: user.id,
          target_channel_id: channelHandle,
          target_channel_name: channelHandle,
          target_channel_url: channelUrl,
          channels_found: scoredChannels,
          search_method: searchMethod,
          quota_used: totalQuotaUsed
        });

      if (insertError) {
        console.error('❌ Erro ao salvar histórico:', insertError);
      }

      // 7. Marcar progresso como completo
      if (progressId) {
        await supabaseClient
          .from('similar_channels_progress')
          .update({
            status: 'completed',
            channels_collected: scoredChannels,
            quota_used: totalQuotaUsed,
            completed_at: new Date().toISOString()
          })
          .eq('id', progressId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          channels: scoredChannels,
          total_found: scoredChannels.length,
          quota_used: totalQuotaUsed,
          progress_id: progressId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (searchError: any) {
      console.error('❌ Erro durante busca:', searchError);
      
      // Marcar progresso como erro
      if (progressId) {
        const errorStatus = searchError.message?.includes('402') ? 'quota_exceeded' : 'error';
        await supabaseClient
          .from('similar_channels_progress')
          .update({
            status: errorStatus,
            error_message: searchError.message,
            channels_collected: allChannels,
            quota_used: totalQuotaUsed
          })
          .eq('id', progressId);
      }

      throw searchError;
    }

  } catch (error: any) {
    console.error('❌ [ScrapingBee] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        channels: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============= Helper Functions =============

function extractChannelHandle(url: string): string {
  const patterns = [
    /youtube\.com\/@([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new Error('Formato de URL do YouTube inválido');
}

function buildScrapingBeeUrl(targetUrl: string, apiKey: string, options: {
  render_js?: boolean;
  stealth_proxy?: boolean;
  premium_proxy?: boolean;
  country_code?: string;
  wait_browser?: string;
  block_resources?: boolean;
  timeout?: number;
} = {}): string {
  const params = new URLSearchParams({
    api_key: apiKey,
    url: targetUrl,
    render_js: String(options.render_js ?? true),
    stealth_proxy: String(options.stealth_proxy ?? true),
    premium_proxy: String(options.premium_proxy ?? false),
    country_code: options.country_code ?? 'us',
    wait_browser: options.wait_browser ?? 'domcontentloaded',
    block_resources: String(options.block_resources ?? false),
    timeout: String(options.timeout ?? 30000),
    forward_headers: 'true'
  });

  return `https://app.scrapingbee.com/api/v1/?${params.toString()}`;
}

async function updateProgress(
  supabaseClient: any,
  progressId: string,
  channels: SimilarChannel[],
  quotaUsed: number,
  flags: any = {}
) {
  const uniqueChannels = removeDuplicates(channels);
  
  await supabaseClient
    .from('similar_channels_progress')
    .update({
      channels_collected: uniqueChannels,
      quota_used: quotaUsed,
      updated_at: new Date().toISOString(),
      ...flags
    })
    .eq('id', progressId);
}

function parseYouTubeInitialData(html: string): any {
  // Tentar múltiplas regex para extrair ytInitialData
  const patterns = [
    /var ytInitialData = ({[\s\S]*?});/,
    /ytInitialData\s*=\s*({[\s\S]*?});/,
    /window\["ytInitialData"\]\s*=\s*({[\s\S]*?});/,
    /window\['ytInitialData'\]\s*=\s*({[\s\S]*?});/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.log('⚠️ Erro ao parsear ytInitialData com pattern:', pattern);
      }
    }
  }

  return null;
}

async function scrapeFeaturedChannels(
  channelHandle: string,
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  const targetUrl = `https://www.youtube.com/@${channelHandle}/channels`;
  const scrapingUrl = buildScrapingBeeUrl(targetUrl, apiKey);

  console.log(`📡 [Featured] GET ${targetUrl}`);

  const response = await fetch(scrapingUrl, {
    headers: {
      'Spb-Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const spbCost = parseInt(response.headers.get('spb-cost') || response.headers.get('Spb-Cost') || '1');
  const spbStatus = response.headers.get('spb-initial-status-code') || response.headers.get('Spb-Initial-Status-Code');
  
  console.log(`📊 [Featured] Status: ${response.status}, Spb-Status: ${spbStatus}, Cost: ${spbCost}`);

  if (response.status === 402) {
    throw new Error('Quota ScrapingBee esgotada');
  }

  if (!response.ok) {
    console.error(`❌ [Featured] Erro HTTP ${response.status}`);
    return { channels: [], quota: spbCost };
  }

  const html = await response.text();
  const ytData = parseYouTubeInitialData(html);

  if (!ytData) {
    console.log('⚠️ [Featured] ytInitialData não encontrado');
    return { channels: [], quota: spbCost };
  }

  const channels: SimilarChannel[] = [];

  try {
    const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    
    for (const tab of tabs) {
      const content = tab?.tabRenderer?.content;
      if (!content) continue;

      const sections = content?.sectionListRenderer?.contents || [];
      
      for (const section of sections) {
        const items = section?.itemSectionRenderer?.contents || [];
        
        for (const item of items) {
          const channelRenderer = item?.channelRenderer;
          if (!channelRenderer) continue;

          const channelId = channelRenderer.channelId;
          const title = channelRenderer.title?.simpleText || '';
          const handle = channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace('/@', '') || channelId;
          const thumbnail = channelRenderer.thumbnail?.thumbnails?.[0]?.url || '';
          const subscriberText = channelRenderer.subscriberCountText?.simpleText || '0';

          if (channelId && title) {
            channels.push({
              id: channelId,
              name: title,
              handle: handle,
              url: `https://www.youtube.com/@${handle}`,
              thumbnail: thumbnail,
              subscribers: subscriberText,
              similarity_score: 0.85
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('❌ [Featured] Erro ao extrair canais:', e);
  }

  console.log(`✅ [Featured] ${channels.length} canais encontrados, quota: ${spbCost}`);
  return { channels, quota: spbCost };
}

async function scrapeRelatedChannels(
  channelHandle: string,
  apiKey: string,
  supabaseClient: any,
  progressId: string | undefined,
  currentChannels: SimilarChannel[],
  currentQuota: number
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  const channels: SimilarChannel[] = [];
  let totalQuota = 0;

  // 1. Buscar vídeos recentes do canal
  const videosUrl = `https://www.youtube.com/@${channelHandle}/videos`;
  const scrapingUrl = buildScrapingBeeUrl(videosUrl, apiKey);

  console.log(`📡 [Related] GET ${videosUrl}`);

  const response = await fetch(scrapingUrl, {
    headers: {
      'Spb-Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const spbCost = parseInt(response.headers.get('spb-cost') || response.headers.get('Spb-Cost') || '1');
  totalQuota += spbCost;

  console.log(`📊 [Related] Videos page - Cost: ${spbCost}`);

  if (!response.ok) {
    return { channels: [], quota: totalQuota };
  }

  const html = await response.text();
  const ytData = parseYouTubeInitialData(html);

  if (!ytData) {
    console.log('⚠️ [Related] ytInitialData não encontrado na página de vídeos');
    return { channels: [], quota: totalQuota };
  }

  // 2. Extrair IDs dos últimos 5 vídeos
  const videoIds: string[] = [];
  
  try {
    const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    
    for (const tab of tabs) {
      const richGrid = tab?.tabRenderer?.content?.richGridRenderer;
      if (!richGrid) continue;

      const contents = richGrid.contents || [];
      
      for (const item of contents) {
        const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
        if (videoRenderer?.videoId) {
          videoIds.push(videoRenderer.videoId);
          if (videoIds.length >= 5) break;
        }
      }
      
      if (videoIds.length >= 5) break;
    }
  } catch (e) {
    console.error('❌ [Related] Erro ao extrair IDs de vídeos:', e);
  }

  console.log(`📹 [Related] ${videoIds.length} vídeos encontrados para analisar`);

  // 3. Para cada vídeo, extrair canais recomendados
  for (const videoId of videoIds.slice(0, 3)) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const watchScrapingUrl = buildScrapingBeeUrl(watchUrl, apiKey);

    console.log(`📡 [Related] GET watch page: ${videoId}`);

    const watchResponse = await fetch(watchScrapingUrl, {
      headers: {
        'Spb-Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const watchCost = parseInt(watchResponse.headers.get('spb-cost') || watchResponse.headers.get('Spb-Cost') || '1');
    totalQuota += watchCost;

    console.log(`📊 [Related] Watch page ${videoId} - Cost: ${watchCost}`);

    if (!watchResponse.ok) continue;

    const watchHtml = await watchResponse.text();
    const watchYtData = parseYouTubeInitialData(watchHtml);

    if (!watchYtData) continue;

    try {
      const secondaryResults = watchYtData?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results || [];
      
      for (const result of secondaryResults) {
        const compactVideo = result?.compactVideoRenderer;
        if (!compactVideo) continue;

        const ownerText = compactVideo.longBylineText?.runs?.[0];
        if (!ownerText) continue;

        const channelId = ownerText.navigationEndpoint?.browseEndpoint?.browseId;
        const channelName = ownerText.text;
        const channelHandle = ownerText.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace('/@', '') || channelId;
        const channelThumb = compactVideo.channelThumbnail?.thumbnails?.[0]?.url || '';

        if (channelId && channelName) {
          channels.push({
            id: channelId,
            name: channelName,
            handle: channelHandle,
            url: `https://www.youtube.com/@${channelHandle}`,
            thumbnail: channelThumb,
            subscribers: 'N/A',
            similarity_score: 0.75
          });
        }
      }
    } catch (e) {
      console.error(`❌ [Related] Erro ao extrair canais do vídeo ${videoId}:`, e);
    }

    // Atualizar progresso incremental
    if (progressId) {
      const allChannels = [...currentChannels, ...channels];
      await updateProgress(supabaseClient, progressId, allChannels, currentQuota + totalQuota);
    }
  }

  console.log(`✅ [Related] ${channels.length} canais encontrados, quota total: ${totalQuota}`);
  return { channels, quota: totalQuota };
}

async function scrapeByKeywords(
  channelHandle: string,
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  const channels: SimilarChannel[] = [];
  let totalQuota = 0;

  // 1. Buscar página About
  const aboutUrl = `https://www.youtube.com/@${channelHandle}/about`;
  const scrapingUrl = buildScrapingBeeUrl(aboutUrl, apiKey);

  console.log(`📡 [Keywords] GET ${aboutUrl}`);

  const response = await fetch(scrapingUrl, {
    headers: {
      'Spb-Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const spbCost = parseInt(response.headers.get('spb-cost') || response.headers.get('Spb-Cost') || '1');
  totalQuota += spbCost;

  console.log(`📊 [Keywords] About page - Cost: ${spbCost}`);

  if (!response.ok) {
    return { channels: [], quota: totalQuota };
  }

  const html = await response.text();
  const ytData = parseYouTubeInitialData(html);

  if (!ytData) {
    return { channels: [], quota: totalQuota };
  }

  // 2. Extrair keywords da descrição
  const keywords: string[] = [];
  
  try {
    const aboutData = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.channelAboutFullMetadataRenderer;
    
    if (aboutData) {
      const description = aboutData.description?.simpleText || '';
      const channelName = aboutData.title?.simpleText || '';
      
      // Extrair palavras-chave da descrição (primeiras 3-5 palavras significativas)
      const words = description.split(/\s+/).filter((w: string) => w.length > 3 && !/^https?:/.test(w));
      keywords.push(...words.slice(0, 3));
      
      // Adicionar nome do canal como keyword
      if (channelName) {
        keywords.push(channelName);
      }
    }
  } catch (e) {
    console.error('❌ [Keywords] Erro ao extrair descrição:', e);
  }

  if (keywords.length === 0) {
    console.log('⚠️ [Keywords] Nenhuma keyword encontrada');
    return { channels: [], quota: totalQuota };
  }

  console.log(`🔤 [Keywords] Keywords extraídas: ${keywords.join(', ')}`);

  // 3. Buscar canais usando keywords
  const searchQuery = keywords.slice(0, 2).join(' ');
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIQAg%253D%253D`; // sp=EgIQAg== filtra apenas canais
  const searchScrapingUrl = buildScrapingBeeUrl(searchUrl, apiKey);

  console.log(`📡 [Keywords] GET search: ${searchQuery}`);

  const searchResponse = await fetch(searchScrapingUrl, {
    headers: {
      'Spb-Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const searchCost = parseInt(searchResponse.headers.get('spb-cost') || searchResponse.headers.get('Spb-Cost') || '1');
  totalQuota += searchCost;

  console.log(`📊 [Keywords] Search - Cost: ${searchCost}`);

  if (!searchResponse.ok) {
    return { channels: [], quota: totalQuota };
  }

  const searchHtml = await searchResponse.text();
  const searchYtData = parseYouTubeInitialData(searchHtml);

  if (!searchYtData) {
    return { channels: [], quota: totalQuota };
  }

  // 4. Extrair canais dos resultados
  try {
    const contents = searchYtData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      
      for (const item of items) {
        const channelRenderer = item?.channelRenderer;
        if (!channelRenderer) continue;

        const channelId = channelRenderer.channelId;
        const title = channelRenderer.title?.simpleText || '';
        const handle = channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace('/@', '') || channelId;
        const thumbnail = channelRenderer.thumbnail?.thumbnails?.[0]?.url || '';
        const subscriberText = channelRenderer.subscriberCountText?.simpleText || '0';

        if (channelId && title) {
          channels.push({
            id: channelId,
            name: title,
            handle: handle,
            url: `https://www.youtube.com/@${handle}`,
            thumbnail: thumbnail,
            subscribers: subscriberText,
            similarity_score: 0.65
          });
        }
      }
    }
  } catch (e) {
    console.error('❌ [Keywords] Erro ao extrair canais da busca:', e);
  }

  console.log(`✅ [Keywords] ${channels.length} canais encontrados, quota total: ${totalQuota}`);
  return { channels, quota: totalQuota };
}

function removeDuplicates(channels: SimilarChannel[]): SimilarChannel[] {
  const seen = new Map<string, SimilarChannel>();

  for (const channel of channels) {
    const key = channel.id || channel.handle;
    
    if (!seen.has(key)) {
      seen.set(key, channel);
    } else {
      const existing = seen.get(key)!;
      if (channel.similarity_score > existing.similarity_score) {
        seen.set(key, channel);
      }
    }
  }

  return Array.from(seen.values());
}
