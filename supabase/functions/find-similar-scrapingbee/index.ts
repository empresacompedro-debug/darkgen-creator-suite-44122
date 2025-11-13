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

    // 5. Calcular scores de similaridade (simplificado)
    const scoredChannels = uniqueChannels.map(ch => ({
      ...ch,
      similarity_score: Math.random() * 0.5 + 0.5 // Mock: 50%-100%
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
  // Extrair handle de URLs como:
  // https://youtube.com/@channelhandle
  // https://www.youtube.com/channel/UC...
  // https://youtube.com/c/channelname
  
  const patterns = [
    /@([^\/\?]+)/,           // @handle
    /channel\/([^\/\?]+)/,   // channel/UC...
    /c\/([^\/\?]+)/,         // c/name
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Se não encontrar, tentar extrair última parte da URL
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

    console.log(`📡 Scraping: ${targetUrl}`);
    const response = await fetch(scrapeUrl);
    
    if (!response.ok) {
      console.error(`❌ ScrapingBee error: ${response.status}`);
      return { channels: [], quota: 1 };
    }

    const html = await response.text();
    
    // Parse HTML para extrair canais (simplificado - em produção usar parser HTML)
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
  // Implementação simplificada - retorna mock
  console.log('⚠️ scrapeRelatedChannels não implementado completamente');
  return { channels: [], quota: 0 };
}

async function scrapeByKeywords(
  channelHandle: string,
  apiKey: string
): Promise<{ channels: SimilarChannel[]; quota: number }> {
  // Implementação simplificada - retorna mock
  console.log('⚠️ scrapeByKeywords não implementado completamente');
  return { channels: [], quota: 0 };
}

function parseChannelsFromHTML(html: string): SimilarChannel[] {
  // Parser HTML simplificado (em produção usar biblioteca como cheerio/jsdom)
  // Aqui retornamos mock para demonstração
  
  const channels: SimilarChannel[] = [];
  
  // Regex simples para capturar informações (não robusto, apenas exemplo)
  const channelPattern = /@([a-zA-Z0-9_-]+)/g;
  const matches = html.matchAll(channelPattern);
  
  for (const match of matches) {
    const handle = match[1];
    if (handle && handle.length > 3) {
      channels.push({
        id: `channel_${handle}`,
        name: handle,
        handle: handle,
        url: `https://youtube.com/@${handle}`,
        thumbnail: `https://yt3.ggpht.com/default.jpg`,
        subscribers: 'N/A',
        similarity_score: 0
      });
    }
  }
  
  return channels.slice(0, 10); // Limitar a 10 por segurança
}

function removeDuplicates(channels: SimilarChannel[]): SimilarChannel[] {
  const seen = new Set<string>();
  return channels.filter(ch => {
    if (seen.has(ch.handle)) return false;
    seen.add(ch.handle);
    return true;
  });
}
