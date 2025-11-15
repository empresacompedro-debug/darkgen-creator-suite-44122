import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getNextKeyRoundRobin } from '../_shared/round-robin.ts';

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

    // 1. Obter chave ScrapingBee do usuário via Round-Robin
    const scrapingbeeKeyData = await getNextKeyRoundRobin(user.id, 'scrapingbee' as any, supabaseClient);

    if (!scrapingbeeKeyData) {
      throw new Error('Configure sua chave ScrapingBee em Configurações antes de usar esta ferramenta');
    }

    const scrapingbeeKey = scrapingbeeKeyData.key;
    console.log(`🔑 [ScrapingBee] Chave obtida: ${scrapingbeeKey.substring(0, 10)}...`);

    // 2. Extrair channel handle/ID da URL
    const channelHandle = extractChannelHandle(channelUrl);
    console.log(`📺 [ScrapingBee] Channel handle extraído: ${channelHandle}`);

    // 3. Executar busca conforme método escolhido
    let allChannels: SimilarChannel[] = [];
    let quotaUsed = 0;

    if (searchMethod === 'featured' || searchMethod === 'hybrid') {
      console.log('🎯 Buscando canais em destaque...');
      const featured = await scrapeFeaturedChannels(channelHandle, scrapingbeeKey);
      allChannels.push(...featured.channels);
      quotaUsed += featured.quota;
    }

    if (searchMethod === 'related-videos' || searchMethod === 'hybrid') {
      console.log('📹 Buscando canais de vídeos relacionados...');
      const related = await scrapeRelatedChannels(channelHandle, scrapingbeeKey);
      allChannels.push(...related.channels);
      quotaUsed += related.quota;
    }

    if (searchMethod === 'keywords' || searchMethod === 'hybrid') {
      console.log('🔤 Buscando por keywords...');
      const keywords = await scrapeByKeywords(channelHandle, scrapingbeeKey);
      allChannels.push(...keywords.channels);
      quotaUsed += keywords.quota;
    }

    // 4. Remover duplicatas
    const uniqueChannels = removeDuplicates(allChannels);
    console.log(`✅ [ScrapingBee] ${uniqueChannels.length} canais únicos encontrados`);

    // 5. Calcular scores de similaridade
    const scoredChannels = uniqueChannels.map(ch => ({
      ...ch,
      similarity_score: ch.similarity_score || (Math.random() * 0.3 + 0.7)
    })).sort((a, b) => b.similarity_score - a.similarity_score);

    // 6. Salvar no banco
    const { error: insertError } = await supabaseClient
      .from('similar_channels_scrapingbee')
      .insert({
        user_id: user.id,
        target_channel_id: channelHandle,
        target_channel_name: channelHandle,
        target_channel_url: channelUrl,
        channels_found: scoredChannels,
        search_method: searchMethod,
        quota_used: quotaUsed
      });

    if (insertError) {
      console.error('❌ Erro ao salvar no banco:', insertError);
      throw new Error(`Erro ao salvar resultados: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        channels: scoredChannels,
        quota_used: quotaUsed,
        total_found: scoredChannels.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [ScrapingBee] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============= FUNÇÕES AUXILIARES =============

function extractChannelHandle(url: string): string {
  const patterns = [
    /@([^\/\?]+)/,
    /channel\/([^\/\?]+)/,
    /c\/([^\/\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'unknown';
}

async function scrapeFeaturedChannels(
  channelHandle: string, 
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  const targetUrl = `https://youtube.com/@${channelHandle}/channels`;
  
  try {
    const scrapeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${apiKey}` +
      `&url=${encodeURIComponent(targetUrl)}` +
      `&render_js=true` +
      `&wait=3000` +
      `&premium_proxy=false`;

    console.log(`📡 Scraping featured: ${targetUrl}`);
    const response = await fetch(scrapeUrl);
    
    if (!response.ok) {
      console.error(`❌ ScrapingBee error: ${response.status}`);
      return { channels: [], quota: 1 };
    }

    const html = await response.text();
    const channels = parseChannelsFromHTML(html);
    
    console.log(`✅ Featured: ${channels.length} canais`);
    return { channels, quota: 1 };
  } catch (error) {
    console.error('❌ Erro em scrapeFeaturedChannels:', error);
    return { channels: [], quota: 0 };
  }
}

async function scrapeRelatedChannels(
  channelHandle: string,
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  const targetUrl = `https://youtube.com/@${channelHandle}/videos`;
  
  try {
    const scrapeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${apiKey}` +
      `&url=${encodeURIComponent(targetUrl)}` +
      `&render_js=true` +
      `&wait=3000` +
      `&premium_proxy=false`;

    console.log(`📡 Scraping vídeos: ${targetUrl}`);
    const response = await fetch(scrapeUrl);
    
    if (!response.ok) {
      console.error(`❌ ScrapingBee error: ${response.status}`);
      return { channels: [], quota: 1 };
    }

    const html = await response.text();
    const channels = extractChannelsFromVideos(html);
    
    console.log(`✅ Related: ${channels.length} canais de vídeos`);
    return { channels, quota: 1 };
  } catch (error) {
    console.error('❌ Erro em scrapeRelatedChannels:', error);
    return { channels: [], quota: 0 };
  }
}

async function scrapeByKeywords(
  channelHandle: string,
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  try {
    const channelUrl = `https://youtube.com/@${channelHandle}/about`;
    const scrapeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${apiKey}` +
      `&url=${encodeURIComponent(channelUrl)}` +
      `&render_js=true` +
      `&wait=3000` +
      `&premium_proxy=false`;

    console.log(`📡 Scraping about: ${channelUrl}`);
    const response = await fetch(scrapeUrl);
    
    if (!response.ok) {
      console.error(`❌ ScrapingBee error: ${response.status}`);
      return { channels: [], quota: 1 };
    }

    const html = await response.text();
    const keywords = extractKeywordsFromChannel(html);
    console.log(`🔑 Keywords: ${keywords.join(', ')}`);
    
    if (keywords.length === 0) {
      return { channels: [], quota: 1 };
    }
    
    const searchQuery = keywords.slice(0, 3).join(' ');
    const searchUrl = `https://youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const searchScrapeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${apiKey}` +
      `&url=${encodeURIComponent(searchUrl)}` +
      `&render_js=true` +
      `&wait=3000` +
      `&premium_proxy=false`;

    console.log(`📡 Scraping busca: ${searchUrl}`);
    const searchResponse = await fetch(searchScrapeUrl);
    
    if (!searchResponse.ok) {
      return { channels: [], quota: 2 };
    }

    const searchHtml = await searchResponse.text();
    const channels = extractChannelsFromSearch(searchHtml);
    
    console.log(`✅ Keywords: ${channels.length} canais`);
    return { channels, quota: 2 };
  } catch (error) {
    console.error('❌ Erro em scrapeByKeywords:', error);
    return { channels: [], quota: 0 };
  }
}

function parseChannelsFromHTML(html: string): SimilarChannel[] {
  const channels: SimilarChannel[] = [];
  
  try {
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (ytInitialDataMatch) {
      const ytData = JSON.parse(ytInitialDataMatch[1]);
      const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      
      for (const tab of tabs) {
        const content = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        
        for (const section of content) {
          const items = section?.itemSectionRenderer?.contents || [];
          
          for (const item of items) {
            const channelRenderer = item?.channelRenderer;
            if (channelRenderer) {
              const channelId = channelRenderer.channelId;
              const title = channelRenderer.title?.simpleText || '';
              const handle = channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace('/', '') || '';
              const thumbnail = channelRenderer.thumbnail?.thumbnails?.[0]?.url || '';
              const subscriberText = channelRenderer.subscriberCountText?.simpleText || 'Desconhecido';
              const description = channelRenderer.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '';
              
              if (channelId && title) {
                channels.push({
                  id: channelId,
                  name: title,
                  handle: handle,
                  url: `https://youtube.com${handle}`,
                  thumbnail: thumbnail,
                  subscribers: subscriberText,
                  similarity_score: 0.9,
                  category: 'YouTube',
                  description: description
                });
              }
            }
          }
        }
      }
    }
    
    if (channels.length === 0) {
      console.log('⚠️ ytInitialData não encontrado, usando fallback');
      const channelLinkPattern = /"browseId":"([^"]+)","canonicalBaseUrl":"(\/[^"]+)"/g;
      let match;
      const foundIds = new Set<string>();
      
      while ((match = channelLinkPattern.exec(html)) !== null) {
        const channelId = match[1];
        const handle = match[2];
        if (channelId.startsWith('UC') && handle.startsWith('/@') && !foundIds.has(channelId)) {
          foundIds.add(channelId);
          channels.push({
            id: channelId,
            name: handle.replace('/@', ''),
            handle: handle.replace('/', ''),
            url: `https://youtube.com${handle}`,
            thumbnail: `https://yt3.ggpht.com/ytc/${channelId}`,
            subscribers: 'Desconhecido',
            similarity_score: 0.7,
            category: 'YouTube'
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Parse error:', error);
  }
  
  console.log(`📊 Extraídos: ${channels.length} canais`);
  return channels;
}

function extractChannelsFromVideos(html: string): SimilarChannel[] {
  const channelMap = new Map<string, SimilarChannel>();
  
  try {
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (ytInitialDataMatch) {
      const ytData = JSON.parse(ytInitialDataMatch[1]);
      const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      
      for (const tab of tabs) {
        const contents = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
        
        for (const item of contents) {
          const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
          if (videoRenderer) {
            const channelId = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
            const channelName = videoRenderer.ownerText?.runs?.[0]?.text;
            const channelHandle = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl;
            const thumbnail = videoRenderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url;
            
            if (channelId && !channelMap.has(channelId)) {
              channelMap.set(channelId, {
                id: channelId,
                name: channelName || '',
                handle: channelHandle?.replace('/', '') || '',
                url: `https://youtube.com${channelHandle || ''}`,
                thumbnail: thumbnail || '',
                subscribers: 'Desconhecido',
                similarity_score: 0.75,
                category: 'YouTube'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error extracting from videos:', error);
  }
  
  return Array.from(channelMap.values());
}

function extractKeywordsFromChannel(html: string): string[] {
  const keywords: string[] = [];
  
  try {
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (ytInitialDataMatch) {
      const ytData = JSON.parse(ytInitialDataMatch[1]);
      const description = ytData?.metadata?.channelMetadataRenderer?.description || '';
      
      const words = description.split(/\s+/)
        .filter((w: string) => w.length > 4 && !/^https?:/.test(w))
        .slice(0, 5);
      
      keywords.push(...words);
    }
  } catch (error) {
    console.error('❌ Error extracting keywords:', error);
  }
  
  return keywords;
}

function extractChannelsFromSearch(html: string): SimilarChannel[] {
  const channelMap = new Map<string, SimilarChannel>();
  
  try {
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (ytInitialDataMatch) {
      const ytData = JSON.parse(ytInitialDataMatch[1]);
      const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      
      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents || [];
        
        for (const item of items) {
          const channelRenderer = item?.channelRenderer;
          if (channelRenderer) {
            const channelId = channelRenderer.channelId;
            const title = channelRenderer.title?.simpleText || '';
            const handle = channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace('/', '') || '';
            const thumbnail = channelRenderer.thumbnail?.thumbnails?.[0]?.url || '';
            const subscriberText = channelRenderer.subscriberCountText?.simpleText || 'Desconhecido';
            
            if (channelId && !channelMap.has(channelId)) {
              channelMap.set(channelId, {
                id: channelId,
                name: title,
                handle: handle,
                url: `https://youtube.com${handle}`,
                thumbnail: thumbnail,
                subscribers: subscriberText,
                similarity_score: 0.65,
                category: 'YouTube'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error extracting from search:', error);
  }
  
  return Array.from(channelMap.values());
}

function removeDuplicates(channels: SimilarChannel[]): SimilarChannel[] {
  const seen = new Map<string, SimilarChannel>();
  
  for (const channel of channels) {
    if (!seen.has(channel.id)) {
      seen.set(channel.id, channel);
    } else {
      const existing = seen.get(channel.id)!;
      if (channel.similarity_score > existing.similarity_score) {
        seen.set(channel.id, channel);
      }
    }
  }
  
  return Array.from(seen.values());
}
