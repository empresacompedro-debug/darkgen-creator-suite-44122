import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey, markApiKeyAsExhaustedAndRotate } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Extrair userId do JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log('Sem usuário autenticado, usando chave global');
      }
    }

    // Buscar API Keys (prioriza chaves do usuário)
    const youtubeKeyResult = await getApiKey(userId, 'youtube', supabaseClient);
    if (!youtubeKeyResult) {
      throw new Error('YouTube API key não configurada');
    }
    let YOUTUBE_API_KEY = youtubeKeyResult.key;
    let currentKeyId = youtubeKeyResult.keyId;

    const { 
      channelUrl, 
      daysFilter, 
      subscribersFilter, 
      minSubscribers = 0, // NOVO: mínimo de inscritos (para monetização)
      maxChannels = 200, 
      formatFilter = 'all', 
      languageFilter = 'any', 
      countryFilter = [],
      minVideoDuration = 0, // em minutos
      maxVideoAgeDays = 9999 // em dias - SEM LIMITE por padrão (mudança de 365 para 9999)
    } = await req.json();

    // 📊 Inicializar contadores de estatísticas
    let filterStats = {
      totalFound: 0,
      rejectedByCountry: 0,
      rejectedByDateOrSubs: 0,
      rejectedByMinSubscribers: 0, // NOVO: rejeições por monetização
      rejectedByVideoDuration: 0,
      rejectedByFormat: 0,
      similarityErrors: 0,
      finalCount: 0
    };

    console.log('Buscando canais similares para:', channelUrl);

    // Extrair ID do canal da URL
    let channelId = '';
    if (channelUrl.includes('youtube.com/channel/')) {
      channelId = channelUrl.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
    } else if (channelUrl.includes('youtube.com/@')) {
      // Buscar ID do canal pelo handle com múltiplas estratégias
      const handle = channelUrl.split('youtube.com/@')[1].split('/')[0].split('?')[0];
      console.log(`🔍 Buscando canal por handle: @${handle}`);
      
      // Estratégia 1: Buscar pelo handle exato com aspas
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q="${handle}"&key=${YOUTUBE_API_KEY}`;
      let searchResponse = await fetch(searchUrl);
      let searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        // Detectar erro 403 (quota exceeded) e tentar rotacionar
        if (searchResponse.status === 403 || searchData.error?.code === 403) {
          console.log(`⚠️ API Key ${currentKeyId} esgotada durante busca inicial. Tentando rotacionar...`);
          
          const rotated = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
          
          if (rotated) {
            return new Response(
              JSON.stringify({
                success: false,
                rotated: true,
                message: `🔄 Quota da API do YouTube excedida. Automaticamente trocada para a próxima chave. Por favor, tente novamente.`,
                newKeyId: rotated.keyId
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'YOUTUBE_QUOTA_EXCEEDED',
                message: `❌ Todas as suas API Keys do YouTube esgotaram a quota diária.\n\nPara continuar:\n1. Vá em Configurações\n2. Adicione uma nova API Key do YouTube\n3. Ou aguarde até amanhã para a quota resetar`
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
        
        console.error('❌ Erro na busca do canal:', searchData);
        throw new Error(`Erro ao buscar canal: ${searchData.error?.message || 'Erro desconhecido'}`);
      }
      
      // Se não encontrou com aspas, tentar sem aspas
      if (!searchData.items || searchData.items.length === 0) {
        console.log(`⚠️ Nenhum resultado com aspas, tentando busca ampla para: ${handle}`);
        searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=10&key=${YOUTUBE_API_KEY}`;
        searchResponse = await fetch(searchUrl);
        searchData = await searchResponse.json();
        
        if (!searchResponse.ok) {
          console.error('❌ Erro na segunda busca:', searchData);
          throw new Error(`Erro ao buscar canal: ${searchData.error?.message || 'Erro desconhecido'}`);
        }
      }
      
      if (searchData.items && searchData.items.length > 0) {
        // Tentar encontrar correspondência exata primeiro
        const exactMatch = searchData.items.find((item: any) => 
          item.snippet.customUrl?.toLowerCase() === `@${handle.toLowerCase()}` ||
          item.snippet.title.toLowerCase() === handle.toLowerCase().replace(/_/g, ' ')
        );
        
        channelId = exactMatch ? exactMatch.id.channelId : searchData.items[0].id.channelId;
        console.log(`✅ Canal encontrado: ${channelId} (${exactMatch ? 'match exato' : 'primeiro resultado'})`);
        console.log(`   Título: ${exactMatch?.snippet.title || searchData.items[0].snippet.title}`);
      } else {
        console.error('❌ Nenhum resultado para o handle:', handle);
        console.error('   Resposta da API:', JSON.stringify(searchData, null, 2));
        throw new Error(`Canal não encontrado para @${handle}. Possíveis causas:\n- O handle pode estar incorreto\n- O canal pode não existir\n- O canal pode estar privado\n\nVerifique se o URL está correto e tente novamente.`);
      }
    } else if (channelUrl.includes('youtube.com/c/')) {
      const customUrl = channelUrl.split('youtube.com/c/')[1].split('/')[0].split('?')[0];
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${customUrl}&key=${YOUTUBE_API_KEY}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].id.channelId;
      } else {
        throw new Error('Canal não encontrado');
      }
    } else {
      throw new Error('URL do canal inválida');
    }

    console.log('ID do canal encontrado:', channelId);

    // Obter dados do canal alvo incluindo contentDetails para analisar vídeos
    const targetChannelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const targetChannelResponse = await fetch(targetChannelUrl);
    const targetChannelData = await targetChannelResponse.json();

    if (!targetChannelResponse.ok || !targetChannelData.items || targetChannelData.items.length === 0) {
      throw new Error('Não foi possível obter dados do canal');
    }

    const targetChannel = targetChannelData.items[0];
    const targetDescription = targetChannel.snippet.description;
    const targetKeywords = targetChannel.brandingSettings?.channel?.keywords || '';
    const targetCategory = targetChannel.snippet.description;
    const targetChannelThumbnail = targetChannel.snippet.thumbnails?.default?.url || '';
    const targetChannelName = targetChannel.snippet.title;

    // 🌍 DETECTAR IDIOMA DO CANAL ALVO
    const targetLanguage = targetChannel.snippet.defaultLanguage || '';
    const targetCountry = targetChannel.snippet.country || '';
    
    // Mapeamento país → idioma
    const countryToLanguage: Record<string, string> = {
      'BR': 'pt', 'PT': 'pt',
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'IN': 'en',
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es',
      'FR': 'fr',
      'DE': 'de',
      'IT': 'it',
      'RU': 'ru',
      'JP': 'ja',
      'KR': 'ko',
      'CN': 'zh',
    };
    
    const detectedLanguage = targetLanguage || countryToLanguage[targetCountry] || 'unknown';
    console.log(`🌍 Idioma detectado do canal alvo: ${detectedLanguage} (language: ${targetLanguage}, country: ${targetCountry})`);

    console.log('Dados do canal alvo obtidos');
    
    // Analisar vídeos do canal alvo para detectar formato (Shorts vs vídeos longos)
    console.log('🎬 Analisando formato de conteúdo do canal alvo...');
    const uploadsPlaylistId = targetChannel.contentDetails.relatedPlaylists.uploads;
    const recentVideosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`;
    const recentVideosResponse = await fetch(recentVideosUrl);
    const recentVideosData = await recentVideosResponse.json();
    
    let isTargetShortsChannel = false;
    let avgVideoDuration = 0;
    let targetContentType = 'videos longos';
    let recentVideoIds: string[] = [];
    const allHashtags: string[] = [];
    
    if (recentVideosResponse.ok && recentVideosData.items && recentVideosData.items.length > 0) {
      recentVideoIds = recentVideosData.items.map((item: any) => item.contentDetails.videoId);
      const videoIds = recentVideoIds.join(',');
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const videoDetailsResponse = await fetch(videoDetailsUrl);
      const videoDetailsData = await videoDetailsResponse.json();
      
      if (videoDetailsResponse.ok && videoDetailsData.items) {
        // Calcular duração média dos vídeos E extrair hashtags
        const durations = videoDetailsData.items.map((video: any) => {
          const duration = video.contentDetails.duration; // Formato: PT#M#S ou PT#S
          const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
          const minutes = parseInt(match?.[1] || '0');
          const seconds = parseInt(match?.[2] || '0');
          
          // Extrair hashtags do título e descrição
          const title = video.snippet?.title || '';
          const description = video.snippet?.description || '';
          const combinedText = `${title} ${description}`;
          
          // Regex para encontrar hashtags (#palavra ou #PalavraComposta)
          const hashtagMatches = combinedText.match(/#[\wÀ-ÿ]+/g);
          if (hashtagMatches) {
            allHashtags.push(...hashtagMatches.map(tag => tag.toLowerCase()));
          }
          
          return minutes * 60 + seconds;
        });
        
        avgVideoDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
        
        // Considerar Shorts se a maioria dos vídeos tem menos de 60 segundos
        const shortsCount = durations.filter((d: number) => d <= 60).length;
        isTargetShortsChannel = shortsCount / durations.length > 0.7; // 70% ou mais são Shorts
        
        targetContentType = isTargetShortsChannel ? 'Shorts' : 'vídeos longos';
        console.log(`✅ Formato detectado: ${targetContentType} (duração média: ${Math.round(avgVideoDuration)}s, ${shortsCount}/${durations.length} são Shorts)`);
      }
    }
    
    // Processar hashtags coletadas
    const hashtagFrequency: Record<string, number> = {};
    allHashtags.forEach(tag => {
      hashtagFrequency[tag] = (hashtagFrequency[tag] || 0) + 1;
    });
    
    // Pegar top 10 hashtags mais usadas
    const topHashtags = Object.entries(hashtagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag.replace('#', ''));
    
    if (topHashtags.length > 0) {
      console.log(`🏷️ Top hashtags encontradas: ${topHashtags.slice(0, 5).join(', ')}`);
    }

    // Analisar transcrições para identificar o nicho real com IA
    console.log('🤖 Analisando transcrições dos vídeos para identificar nicho...');
    let nicheAnalysis = '';
    let detectedNiche = '';
    let contentStyle = '';
    let mainThemes: string[] = [];
    
    try {
      // Buscar legendas de até 5 vídeos recentes
      const videosToAnalyze = recentVideoIds.slice(0, 5);
      const transcriptions: string[] = [];
      
      for (const videoId of videosToAnalyze) {
        try {
          // Buscar lista de legendas disponíveis
          const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
          const captionsResponse = await fetch(captionsUrl);
          const captionsData = await captionsResponse.json();
          
          if (captionsResponse.ok && captionsData.items && captionsData.items.length > 0) {
            // Preferir legendas em português, depois em inglês, depois qualquer uma
            let captionTrack = captionsData.items.find((c: any) => c.snippet.language === 'pt' || c.snippet.language === 'pt-BR');
            if (!captionTrack) {
              captionTrack = captionsData.items.find((c: any) => c.snippet.language === 'en');
            }
            if (!captionTrack) {
              captionTrack = captionsData.items[0];
            }
            
            // Tentar baixar a legenda (nota: requer OAuth, então pegamos apenas metadados)
            // Como não podemos baixar diretamente sem OAuth, vamos usar os títulos e descrições dos vídeos
            const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
            const videoDetailsResponse = await fetch(videoDetailsUrl);
            const videoDetailsData = await videoDetailsResponse.json();
            
            if (videoDetailsResponse.ok && videoDetailsData.items && videoDetailsData.items.length > 0) {
              const video = videoDetailsData.items[0];
              const videoTranscript = `Título: ${video.snippet.title}\nDescrição: ${video.snippet.description.substring(0, 300)}`;
              transcriptions.push(videoTranscript);
              console.log(`📝 Coletado contexto do vídeo: ${video.snippet.title.substring(0, 50)}...`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Erro ao buscar legenda do vídeo ${videoId}:`, error);
        }
      }
      
      if (transcriptions.length > 0) {
        console.log(`📚 Analisando conteúdo de ${transcriptions.length} vídeos com IA...`);
        
        // Usar Lovable AI (Gemini) para analisar o conteúdo
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        
        const analysisPrompt = `Você é um especialista em análise de conteúdo do YouTube. Analise os títulos e descrições dos vídeos abaixo e identifique:

1. O NICHO ESPECÍFICO do canal (ex: curiosidades históricas, fatos científicos, histórias de terror, etc.)
2. O ESTILO de comunicação (ex: casual, sério, humorístico, educativo)
3. Os TEMAS PRINCIPAIS abordados (liste 5-8 palavras-chave relevantes)
4. O TIPO DE PÚBLICO-ALVO

Vídeos do canal:
${transcriptions.join('\n\n---\n\n')}

Responda em formato JSON:
{
  "nicho": "descrição específica do nicho em 3-5 palavras",
  "estilo": "descrição do estilo em 2-3 palavras",
  "temas": ["tema1", "tema2", "tema3", "tema4", "tema5"],
  "publico": "descrição do público em 2-3 palavras"
}`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'user', content: analysisPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          
          // Extrair JSON da resposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            detectedNiche = analysis.nicho || '';
            contentStyle = analysis.estilo || '';
            mainThemes = analysis.temas || [];
            
            nicheAnalysis = `Nicho: ${detectedNiche}, Estilo: ${contentStyle}, Temas: ${mainThemes.join(', ')}`;
            console.log(`✅ Análise de nicho concluída: ${nicheAnalysis}`);
          }
        } else {
          console.log('⚠️ Erro na análise com IA, usando análise básica');
        }
      } else {
        console.log('⚠️ Nenhuma transcrição coletada, usando análise básica de título/descrição');
      }
    } catch (error) {
      console.log('⚠️ Erro na análise de transcrições:', error);
      console.log('Continuando com análise básica de palavras-chave');
    }

    // Função helper para extrair palavras-chave relevantes de um texto
    const extractTopWords = (text: string, count: number): string[] => {
      const stopWords = ['o', 'a', 'de', 'do', 'da', 'em', 'para', 'com', 'e', 'é', 'um', 'uma', 'os', 'as', 'que', 'no', 'na', 'por', 'se', 'mais', 'como', 'dos', 'das', 'seu', 'sua'];
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));
      
      const frequency: Record<string, number> = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
      
      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([word]) => word);
    };

    // 🔄 FUNÇÃO HELPER: Buscar com paginação automática
    async function fetchWithPagination(
      baseUrl: string,
      apiKey: string,
      maxPages: number = 5
    ): Promise<any[]> {
      let allItems: any[] = [];
      let nextPageToken: string | undefined;
      let pageCount = 0;
      
      do {
        const url = nextPageToken 
          ? `${baseUrl}&pageToken=${nextPageToken}&key=${apiKey}`
          : `${baseUrl}&key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          console.error(`⚠️ Erro na página ${pageCount + 1}:`, data.error);
          break;
        }
        
        if (data.items) {
          allItems.push(...data.items);
          console.log(`   📄 Página ${pageCount + 1}: +${data.items.length} itens (total acumulado: ${allItems.length})`);
        }
        
        nextPageToken = data.nextPageToken;
        pageCount++;
        
      } while (nextPageToken && pageCount < maxPages);
      
      return allItems;
    }

    // Buscar canais relacionados com estratégia multi-nivel
    console.log('🔍 Iniciando busca multi-estratégia de canais similares');
    
    // Usar análise de IA se disponível, senão extrair termos básicos
    let nicheTerms: string[] = [];
    if (mainThemes.length > 0) {
      nicheTerms = mainThemes;
      console.log(`🎯 Usando temas detectados pela IA: ${nicheTerms.join(', ')}`);
    } else {
      nicheTerms = extractTopWords(`${targetChannelName} ${targetDescription}`, 8);
      console.log(`🎯 Termos do nicho extraídos (análise básica): ${nicheTerms.join(', ')}`);
    }
    
    // Criar termo de idioma para as buscas (REMOVIDO para aumentar resultados)
    const languageTerms: Record<string, string> = {
      'pt': 'português brasil',
      'en': 'english',
      'es': 'español',
      'fr': 'français',
      'de': 'deutsch',
      'it': 'italiano',
      'ru': 'русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
    };
    const languageQuery = ''; // Removido para aumentar pool de canais - IA filtrará depois
    
    // APLICAR FILTRO DE FORMATO DO USUÁRIO (all/shorts/long)
    console.log(`🎬 Filtro de formato solicitado: ${formatFilter}`);
    
    // Se usuário forçou Shorts ou Longos, sobrescrever detecção automática
    let forcedShortsChannel = isTargetShortsChannel;
    if (formatFilter === 'shorts') {
      forcedShortsChannel = true;
      console.log('🔒 Forçando busca apenas por SHORTS (escolha do usuário)');
    } else if (formatFilter === 'long') {
      forcedShortsChannel = false;
      console.log('🔒 Forçando busca apenas por LONGOS (escolha do usuário)');
    }
    
    // 🌐 FUNÇÃO HELPER: Gerar parâmetros de idioma para YouTube API
    const getLanguageParams = (filter: string): string => {
      if (filter === 'any') return '';
      
      const languageMap: Record<string, { region: string; lang: string }> = {
        'en-US': { region: 'US', lang: 'en' },
        'pt-BR': { region: 'BR', lang: 'pt' },
        'es-ES': { region: 'ES', lang: 'es' },
        'fr-FR': { region: 'FR', lang: 'fr' },
        'de-DE': { region: 'DE', lang: 'de' },
        'it-IT': { region: 'IT', lang: 'it' },
        'ja-JP': { region: 'JP', lang: 'ja' },
        'ko-KR': { region: 'KR', lang: 'ko' },
        'zh-CN': { region: 'CN', lang: 'zh' },
        'en-CA': { region: 'CA', lang: 'en' },
        'en-AU': { region: 'AU', lang: 'en' },
        'es-MX': { region: 'MX', lang: 'es' },
        'es-AR': { region: 'AR', lang: 'es' },
        'pt-PT': { region: 'PT', lang: 'pt' },
      };
      
      const config = languageMap[filter];
      if (!config) return '';
      
      return `&regionCode=${config.region}&relevanceLanguage=${config.lang}`;
    };
    
    const languageParams = getLanguageParams(languageFilter);
    console.log(`🌍 Filtro de idioma aplicado: ${languageFilter} ${languageParams ? `(${languageParams})` : '(todos os idiomas)'}`);
    
    // Estratégia 1: Buscar combinando nicho detectado + formato (SEM idioma) - AUMENTADO PARA 100
    const formatTerm = forcedShortsChannel ? 'shorts' : '';
    let searchKeywords = detectedNiche 
      ? `${detectedNiche} ${formatTerm}`.trim()
      : `${nicheTerms.slice(0, 3).join(' ')} ${formatTerm}`.trim();
    
    // ✅ ESTRATÉGIA 1 COM PAGINAÇÃO
    console.log(`📋 Estratégia 1: Buscando por nicho + formato - "${searchKeywords}" (COM PAGINAÇÃO)`);
    const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchKeywords)}&maxResults=50${languageParams}`;
    
    let allChannels = await fetchWithPagination(baseUrl, YOUTUBE_API_KEY, 10); // 10 páginas = até 500 resultados
    console.log(`✅ Estratégia 1 retornou: ${allChannels.length} canais (com paginação)`);

    // ✅ ESTRATÉGIA 2 COM PAGINAÇÃO
    if (allChannels.length < 200 && isTargetShortsChannel) {
      const shortsQuery = `${nicheTerms[0]} shorts`;
      console.log(`📋 Estratégia 2: Busca específica para Shorts - "${shortsQuery}" (COM PAGINAÇÃO)`);
      
      const baseUrl2 = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(shortsQuery)}&maxResults=50${languageParams}`;
      const shortsChannels = await fetchWithPagination(baseUrl2, YOUTUBE_API_KEY, 5);
      
      allChannels = [...allChannels, ...shortsChannels];
      console.log(`✅ Estratégia 2 adicionou: ${shortsChannels.length} canais (total: ${allChannels.length})`);
    }

    // ✅ ESTRATÉGIA 3 COM PAGINAÇÃO
    if (allChannels.length < 300) {
      const nicheQuery = `${nicheTerms.slice(0, 5).join(' ')}`;
      console.log(`📋 Estratégia 3: Buscando por termos do nicho - "${nicheQuery}" (COM PAGINAÇÃO)`);
      
      const baseUrl3 = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(nicheQuery)}&maxResults=50${languageParams}`;
      const nicheChannels = await fetchWithPagination(baseUrl3, YOUTUBE_API_KEY, 5);
      
      allChannels = [...allChannels, ...nicheChannels];
      console.log(`✅ Estratégia 3 adicionou: ${nicheChannels.length} canais (total: ${allChannels.length})`);
    }

    // Estratégia 4: Buscar por hashtags mais comuns do nicho
    if (topHashtags.length > 0) {
      console.log(`🏷️ Estratégia 4: Buscando por hashtags - "${topHashtags.slice(0, 3).join(', ')}"`);
      
      for (const hashtag of topHashtags.slice(0, 8)) {
        try {
          const hashtagQuery = `${hashtag} ${formatTerm}`.trim();
          const hashtagUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(hashtagQuery)}&maxResults=30${languageParams}&key=${YOUTUBE_API_KEY}`;
          const hashtagResponse = await fetch(hashtagUrl);
          const hashtagSearch = await hashtagResponse.json();
          
          if (hashtagResponse.ok && hashtagSearch.items) {
            allChannels = [...allChannels, ...hashtagSearch.items];
            console.log(`   ✓ Hashtag "${hashtag}": ${hashtagSearch.items.length} canais`);
          }
        } catch (error) {
          console.error(`   ✗ Erro na busca por hashtag ${hashtag}:`, error);
        }
      }
      
      console.log(`✅ Estratégia 4 concluída (total acumulado: ${allChannels.length} canais)`);
    }
    
    // Estratégia 5: Buscar vídeos com hashtags do nicho no título e extrair canais - AUMENTADO PARA 50 VÍDEOS
    if (topHashtags.length > 0) {
      console.log(`🎯 Estratégia 5: Buscando vídeos que contenham hashtags do nicho no título`);
      
      const channelsFromHashtagVideos = new Set<string>();
      
      // Buscar por cada hashtag como termo de busca em vídeos
      for (const hashtag of topHashtags.slice(0, 8)) { // Aumentado de 5 para 8 hashtags
        try {
          const hashtagVideoQuery = `#${hashtag}`;
          const videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(hashtagVideoQuery)}&maxResults=50${languageParams}&key=${YOUTUBE_API_KEY}`;
          const videoSearchResponse = await fetch(videoSearchUrl);
          const videoSearchData = await videoSearchResponse.json();
          
          if (videoSearchResponse.ok && videoSearchData.items) {
            // Filtrar apenas vídeos que realmente têm a hashtag no título
            const videosWithHashtag = videoSearchData.items.filter((video: any) => {
              const title = video.snippet?.title?.toLowerCase() || '';
              return title.includes(`#${hashtag}`) || title.includes(hashtag);
            });
            
            videosWithHashtag.forEach((video: any) => {
              const chId = video.snippet?.channelId;
              if (chId && chId !== channelId) {
                channelsFromHashtagVideos.add(chId);
              }
            });
            
            console.log(`   ✓ Hashtag "#${hashtag}": ${videosWithHashtag.length} vídeos com hashtag no título`);
          }
        } catch (error) {
          console.error(`   ✗ Erro na busca de vídeos por hashtag ${hashtag}:`, error);
        }
      }
      
      if (channelsFromHashtagVideos.size > 0) {
        const channelObjects = Array.from(channelsFromHashtagVideos).map(id => ({
          id: { channelId: id }
        }));
        allChannels = [...allChannels, ...channelObjects];
        console.log(`✅ Estratégia 5: ${channelsFromHashtagVideos.size} canais encontrados através de vídeos com hashtags (total: ${allChannels.length})`);
      }
    }
    
    // ✅ ESTRATÉGIA 7 COM PAGINAÇÃO
    if (allChannels.length < 400) {
      console.log(`📋 Estratégia 7: Buscando vídeos relacionados para extrair canais (COM PAGINAÇÃO)`);
      const baseUrl7 = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(`${nicheTerms.slice(0, 2).join(' ')} ${formatTerm}`.trim())}&maxResults=50${languageParams}`;
      const videos = await fetchWithPagination(baseUrl7, YOUTUBE_API_KEY, 8); // 8 páginas = até 400 vídeos
      
      const channelIdsFromVideos = [...new Set(
        videos
          .map((v: any) => v.snippet.channelId)
          .filter((id: string) => id !== channelId)
      )];
      
      console.log(`✅ Estratégia 7: ${channelIdsFromVideos.length} canais únicos extraídos de ${videos.length} vídeos`);
      
      const channelObjects = channelIdsFromVideos.map((id: string) => ({
        id: { channelId: id }
      }));
      
      allChannels = [...allChannels, ...channelObjects];
    }

    // ✅ ESTRATÉGIA 8 COM PAGINAÇÃO
    if (allChannels.length < 500) {
      const titleWords = targetChannel.snippet.title.split(' ');
      if (titleWords.length > 0) {
        const variedQuery = `${titleWords[0]} ${nicheTerms[0]} canal`.trim();
        console.log(`📋 Estratégia 8: Buscando com variação - "${variedQuery}" (COM PAGINAÇÃO)`);
        
        const baseUrl8 = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(variedQuery)}&maxResults=50${languageParams}`;
        const variedChannels = await fetchWithPagination(baseUrl8, YOUTUBE_API_KEY, 5);
        
        allChannels = [...allChannels, ...variedChannels];
        console.log(`✅ Estratégia 8 adicionou: ${variedChannels.length} canais (total: ${allChannels.length})`);
      }
    }

    // Remover duplicados e canal alvo com extração robusta de IDs
    const extractChannelId = (item: any): string | null => {
      if (!item) return null;
      
      // Caso 1: item.id é um objeto com channelId
      if (item.id && typeof item.id === 'object' && item.id.channelId) {
        return item.id.channelId;
      }
      
      // Caso 2: item.id é uma string diretamente
      if (typeof item.id === 'string') {
        return item.id;
      }
      
      // Caso 3: item é uma string diretamente (ID do canal)
      if (typeof item === 'string') {
        return item;
      }
      
      return null;
    };

    const uniqueChannelIds = [...new Set(
      allChannels
        .map(extractChannelId)
        .filter((id: string | null): id is string => typeof id === 'string' && id.length > 0 && id !== channelId)
    )];

    // Validar e limpar IDs dos canais antes de buscar detalhes
    const isValidChannelId = (id: string): boolean => {
      // IDs do YouTube devem ter 24 caracteres e conter apenas: letras, números, - e _
      return /^[A-Za-z0-9_-]{24}$/.test(id);
    };

    const validChannelIds = uniqueChannelIds.filter((id): id is string => {
      if (typeof id !== 'string') return false;
      const valid = isValidChannelId(id);
      if (!valid) {
        console.log(`⚠️ ID inválido removido: "${id}" (length: ${id.length})`);
      }
      return valid;
    });

    console.log(`📊 Total após remover duplicados: ${uniqueChannelIds.length} canais únicos`);
    console.log(`✅ IDs válidos após validação: ${validChannelIds.length}`);
    
    if (validChannelIds.length > 0) {
      console.log(`🔍 Primeiros 5 IDs extraídos:`, validChannelIds.slice(0, 5));
    }

    // ✅ BUSCAR TODOS OS CANAIS VÁLIDOS ENCONTRADOS (SEM LIMITE ARTIFICIAL)
    const channelsToFetch = validChannelIds; // SEM .slice()!
    const channelIds = channelsToFetch.join(',');
    console.log(`🚀 Buscando detalhes de TODOS os ${channelsToFetch.length} canais encontrados (sem limite de maxChannels)`);

    if (!channelIds || validChannelIds.length === 0) {
      console.log('⚠️ Nenhum canal encontrado após todas as estratégias');
      console.log(`Debug info:
        - Canal alvo: ${targetChannel.snippet.title}
        - Keywords: ${targetKeywords}
        - Descrição (primeiras 200 chars): ${targetDescription.substring(0, 200)}
        - Total de resultados brutos: ${allChannels.length}
      `);
      
      return new Response(JSON.stringify({ 
        channels: [],
        debug: {
          targetChannel: targetChannel.snippet.title,
          searchKeywords,
          descriptionPreview: targetDescription.substring(0, 200),
          totalRawResults: allChannels.length,
          message: 'Nenhum canal similar encontrado. Tente um canal com mais conteúdo público ou descrição mais detalhada.'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Iniciando busca em lotes dos detalhes de ${validChannelIds.length} canais (SEM LIMITE ARTIFICIAL)`);

    // A API do YouTube limita a 50 IDs por requisição
    // Precisamos dividir em lotes (batches)
    const batchSize = 50;
    const batches: string[][] = [];
    
    // Buscar TODOS os canais válidos encontrados (não limitar mais a maxChannels aqui)
    for (let i = 0; i < channelsToFetch.length; i += batchSize) {
      batches.push(channelsToFetch.slice(i, i + batchSize));
    }
    
    console.log(`📦 Dividindo em ${batches.length} lotes de até ${batchSize} IDs cada`);

    // Buscar detalhes de todos os lotes
    const allChannelsDetails: any[] = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const channelIds = batch.join(',');
      
      console.log(`🔄 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} IDs)`);
      
      const channelsDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
      const channelsDetailsResponse = await fetch(channelsDetailsUrl);
      const channelsDetailsData = await channelsDetailsResponse.json();

      if (!channelsDetailsResponse.ok) {
        console.error(`❌ Erro ao buscar lote ${batchIndex + 1}:`, {
          status: channelsDetailsResponse.status,
          error: channelsDetailsData.error,
          batchSize: batch.length,
          firstFewIds: batch.slice(0, 3)
        });
        
        // Detectar erro 403 (quota exceeded) e tentar rotacionar
        if (channelsDetailsResponse.status === 403 || channelsDetailsData.error?.code === 403) {
          console.log(`⚠️ API Key ${currentKeyId} esgotada no lote ${batchIndex + 1}. Tentando rotacionar...`);
          
          const rotated = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
          
          if (rotated) {
            console.log(`✅ Rotacionado para nova chave: ${rotated.keyId}`);
            YOUTUBE_API_KEY = rotated.key;
            currentKeyId = rotated.keyId;
            
            // Reprocessar este lote com a nova chave
            console.log(`🔄 Reprocessando lote ${batchIndex + 1} com nova chave...`);
            batchIndex--; // Voltar um índice para reprocessar este lote
            continue;
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'YOUTUBE_QUOTA_EXCEEDED',
                message: `❌ Todas as suas API Keys do YouTube esgotaram a quota diária.\n\nPara continuar:\n1. Vá em Configurações\n2. Adicione uma nova API Key do YouTube\n3. Ou aguarde até amanhã para a quota resetar`
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
        throw new Error(`Erro ao obter detalhes dos canais (lote ${batchIndex + 1}): ${channelsDetailsData.error?.message || 'Erro desconhecido'}`);
      }
      
      if (channelsDetailsData.items && channelsDetailsData.items.length > 0) {
        allChannelsDetails.push(...channelsDetailsData.items);
        console.log(`✅ Lote ${batchIndex + 1}: ${channelsDetailsData.items.length} canais retornados`);
      }
    }
    
    console.log(`✅ Total de canais com detalhes: ${allChannelsDetails.length}`);
    
    if (allChannelsDetails.length === 0) {
      console.log('⚠️ YouTube API retornou 0 canais após processar todos os lotes');
      return new Response(JSON.stringify({ 
        channels: [],
        debug: {
          message: 'Nenhum detalhe de canal retornado pela API do YouTube',
          requestedIds: validChannelIds.length,
          batchesProcessed: batches.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular data de criação e filtrar canais (incluindo FILTRO DE IDIOMA RIGOROSO)
    const now = new Date();
    const maxDaysOld = daysFilter;
    const maxSubscribers = subscribersFilter;

    // 🌍 MAPEAMENTO DE IDIOMAS PARA PAÍSES
    const languageToCountries: Record<string, string[]> = {
      'en-US': ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'IN'],
      'pt-BR': ['BR'],
      'pt-PT': ['PT', 'AO', 'MZ'],
      'es-ES': ['ES'],
      'es-MX': ['MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'],
      'es-AR': ['AR', 'UY'],
      'fr-FR': ['FR', 'BE', 'CH', 'CA', 'LU'],
      'de-DE': ['DE', 'AT', 'CH'],
      'it-IT': ['IT', 'CH'],
      'ja-JP': ['JP'],
      'ko-KR': ['KR'],
      'zh-CN': ['CN', 'TW', 'HK', 'SG'],
      'en-CA': ['CA'],
      'en-AU': ['AU', 'NZ'],
    };

    console.log(`🌍 Aplicando filtro de idioma rigoroso: ${languageFilter}`);
    console.log(`🌍 Filtro de países específicos: ${countryFilter.length > 0 ? countryFilter.join(', ') : 'Todos os países do idioma'}`);
    console.log(`⏱️ Duração mínima dos vídeos: ${minVideoDuration} minutos`);
    console.log(`📅 Idade máxima dos vídeos: ${maxVideoAgeDays} dias`);
    
    // Se o usuário selecionou países específicos, usar APENAS esses países (não aceitar por idioma)
    const acceptedCountries = languageFilter !== 'any' 
      ? (countryFilter.length > 0 ? countryFilter : (languageToCountries[languageFilter] || []))
      : [];
    
    const filteredChannels = allChannelsDetails.filter((channel: any) => {
      const publishedAt = new Date(channel.snippet.publishedAt);
      const daysOld = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
      const subscriberCount = parseInt(channel.statistics.subscriberCount || '0');

      // Filtro de data e inscritos (máximo)
      if (daysOld > maxDaysOld || subscriberCount > maxSubscribers) {
        filterStats.rejectedByDateOrSubs++;
        return false;
      }

      // NOVO: Validar mínimo de inscritos (para monetização)
      if (subscriberCount < minSubscribers) {
        console.log(`🚫 Canal "${channel.snippet.title}" rejeitado: ${subscriberCount} inscritos < ${minSubscribers} (mínimo para monetização)`);
        filterStats.rejectedByMinSubscribers++;
        return false;
      }

      // Filtro de idioma e país SUPER RIGOROSO (apenas se não for 'any')
      if (languageFilter !== 'any') {
        const channelCountry = channel.snippet.country || '';
        const channelLanguage = channel.snippet.defaultLanguage || '';
        
        // Se tem filtro de país específico, aceitar SOMENTE se o país do canal está na lista
        // NÃO aceitar por idioma quando há filtro de país
        if (countryFilter.length > 0) {
          if (!countryFilter.includes(channelCountry)) {
            console.log(`🚫 Canal "${channel.snippet.title}" rejeitado: país=${channelCountry} não está em ${countryFilter.join(', ')}`);
            filterStats.rejectedByCountry++;
            return false;
          }
        } else {
          // Se não tem filtro de país específico, aceitar se: país do canal está na lista do idioma OU idioma padrão bate
          const countryMatch = acceptedCountries.includes(channelCountry);
          const languageMatch = languageFilter.startsWith(channelLanguage);
          
          if (!countryMatch && !languageMatch) {
            console.log(`🚫 Canal "${channel.snippet.title}" rejeitado: país=${channelCountry}, idioma=${channelLanguage}, esperado=${languageFilter}`);
            filterStats.rejectedByCountry++;
            return false;
          }
        }
      }

      return true;
    }) || [];
    
    filterStats.totalFound = allChannelsDetails.length;

    console.log(`✅ ${filteredChannels.length} canais após filtros (data, inscritos)`);
    console.log(`🎯 Formato do canal alvo: ${targetContentType}`);

    // Buscar vídeos recentes de cada canal para calcular métricas + FILTRAR POR FORMATO
    const channelsWithMetrics = await Promise.all(
      filteredChannels.map(async (channel: any) => {
        try {
          // Buscar vídeos recentes do canal (50 para melhor precisão)
          const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
          const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
          const videosResponse = await fetch(videosUrl);
          const videosData = await videosResponse.json();

          if (!videosResponse.ok || !videosData.items) {
            return null;
          }

          const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId).join(',');
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
          const videoDetailsResponse = await fetch(videoDetailsUrl);
          const videoDetailsData = await videoDetailsResponse.json();

          if (!videoDetailsResponse.ok || !videoDetailsData.items) {
            return null;
          }

          // 🔥 FILTRO CRÍTICO: Detectar formato do canal (Shorts vs Longos) + DURAÇÃO E IDADE
          const videoDetails: { duration: number; ageInDays: number }[] = [];
          
          for (const video of videoDetailsData.items) {
            const duration = video.contentDetails.duration;
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = parseInt(match?.[1] || '0');
            const minutes = parseInt(match?.[2] || '0');
            const seconds = parseInt(match?.[3] || '0');
            const durationInMinutes = hours * 60 + minutes + (seconds / 60);
            
            // Calcular idade do vídeo
            const videoPublishedAt = videosData.items.find((v: any) => v.contentDetails.videoId === video.id)?.contentDetails?.videoPublishedAt;
            const videoAgeInDays = videoPublishedAt 
              ? Math.floor((now.getTime() - new Date(videoPublishedAt).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            
            videoDetails.push({
              duration: durationInMinutes,
              ageInDays: videoAgeInDays
            });
          }
          
          // Filtrar vídeos por duração mínima e idade máxima
          const filteredVideos = videoDetails.filter(v => 
            v.duration >= minVideoDuration && v.ageInDays <= maxVideoAgeDays
          );
          
          // ✅ NOVA LÓGICA: Aceitar canal se pelo menos 20% dos vídeos atendem critérios (mais flexível)
          const percentageMatch = videoDetails.length > 0 ? filteredVideos.length / videoDetails.length : 0;
          
          if (minVideoDuration > 0 && percentageMatch < 0.2) { // pelo menos 20% dos vídeos
            console.log(`⚠️ Canal "${channel.snippet.title}" rejeitado: apenas ${(percentageMatch * 100).toFixed(1)}% dos vídeos atendem critérios (mínimo 20%)`);
            filterStats.rejectedByVideoDuration++;
            return null;
          }
          
          console.log(`✅ Canal "${channel.snippet.title}": ${filteredVideos.length}/${videoDetails.length} vídeos atendem critérios de filtro`);
          
          const durations = videoDetails.map(v => v.duration * 60); // converter para segundos
          const shortsCount = durations.filter((d: number) => d <= 60).length;
          const isChannelShorts = shortsCount / durations.length > 0.7; // 70% ou mais são Shorts
          
          // ⚠️ APLICAR FILTRO DE FORMATO ESCOLHIDO PELO USUÁRIO
          if (formatFilter === 'shorts' && !isChannelShorts) {
            console.log(`🚫 Canal "${channel.snippet.title}" rejeitado: é Longos, mas filtro exige Shorts`);
            filterStats.rejectedByFormat++;
            return null;
          }
          
          if (formatFilter === 'long' && isChannelShorts) {
            console.log(`🚫 Canal "${channel.snippet.title}" rejeitado: é Shorts, mas filtro exige Longos`);
            filterStats.rejectedByFormat++;
            return null;
          }
          
          // Se filtro = 'all', aceitar qualquer formato (não rejeitar)
          if (formatFilter === 'all') {
            // Não rejeitar, aceitar qualquer formato
          }

          // Calcular VPH (Views Por Hora) para cada vídeo e média do canal
          let totalVPH = 0;
          let vphCount = 0;
          
          for (const video of videoDetailsData.items) {
            const videoPublishedAt = videosData.items.find((v: any) => v.contentDetails.videoId === video.id)?.contentDetails?.videoPublishedAt;
            if (videoPublishedAt) {
              const videoAge = now.getTime() - new Date(videoPublishedAt).getTime();
              const hoursOld = videoAge / (1000 * 60 * 60);
              if (hoursOld > 0) {
                const vph = parseInt(video.statistics.viewCount || '0') / hoursOld;
                totalVPH += vph;
                vphCount++;
              }
            }
          }
          
          const avgVPH = vphCount > 0 ? Math.round(totalVPH / vphCount) : 0;

          // Calcular métricas usando statistics totais do canal (mais preciso)
          const totalChannelViews = parseInt(channel.statistics.viewCount || '0');
          const videoCount = parseInt(channel.statistics.videoCount || '0');
          const avgViewsPerVideo = videoCount > 0 ? Math.floor(totalChannelViews / videoCount) : 0;

          const publishedAt = new Date(channel.snippet.publishedAt);
          const daysOld = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calcular uploads/mês com precisão (30.44 dias = média real de dias por mês)
          const monthsOld = daysOld / 30.44;
          const avgUploadsPerMonth = monthsOld > 0 ? parseFloat((videoCount / monthsOld).toFixed(1)) : 0;
          const isNewChannel = daysOld < 60;

          // Último upload com formatação completa (horas, dias, meses, anos)
          let lastUpload = 'Desconhecido';
          let lastUploadDays = 0;
          if (videosData.items.length > 0) {
            const lastVideoId = videosData.items[0].contentDetails.videoId;
            const lastVideo = videoDetailsData.items.find((v: any) => v.id === lastVideoId);
            if (lastVideo) {
              const lastPublishedAt = new Date(videosData.items[0].contentDetails.videoPublishedAt);
              const hoursSince = Math.floor((now.getTime() - lastPublishedAt.getTime()) / (1000 * 60 * 60));
              const daysSince = Math.floor(hoursSince / 24);
              lastUploadDays = daysSince;
              
              if (hoursSince < 1) {
                lastUpload = 'Há menos de 1 hora';
              } else if (hoursSince < 24) {
                lastUpload = `${hoursSince}h atrás`;
              } else if (daysSince < 30) {
                lastUpload = `${daysSince} dia${daysSince > 1 ? 's' : ''} atrás`;
              } else if (daysSince < 365) {
                const monthsSince = Math.floor(daysSince / 30.44);
                lastUpload = `${monthsSince} mês${monthsSince > 1 ? 'es' : ''} atrás`;
              } else {
                const yearsSince = Math.floor(daysSince / 365);
                lastUpload = `${yearsSince} ano${yearsSince > 1 ? 's' : ''} atrás ⚠️`;
              }
            }
          }

          // Detectar dados ocultos
          const subscriberCount = parseInt(channel.statistics.subscriberCount || '0');
          const subscribersHidden = channel.statistics.hiddenSubscriberCount === true;
          
          // Calcular flags de "explosivo"
          const viewSubRatio = subscriberCount > 0 ? totalChannelViews / subscriberCount : 0;
          const isChannelExplosive = avgVPH > 500 || viewSubRatio > 2;
          const isChannelNew = daysOld < 30;
          const isChannelActive = lastUploadDays < 7;

          // Calcular confiabilidade dos dados (0-100%)
          let dataQuality = 100;
          if (subscribersHidden) dataQuality -= 20;
          if (videoCount < 5) dataQuality -= 15;
          if (daysOld < 30) dataQuality -= 10;
          if (lastUploadDays > 180) dataQuality -= 15;
          if (videoCount === 0) dataQuality -= 30;
          dataQuality = Math.max(0, dataQuality);

          console.log(`Canal ${channel.snippet.title}: ${videoCount} vídeos, ${totalChannelViews} views, média ${avgViewsPerVideo} views/vídeo`);

          return {
            id: channel.id,
            name: channel.snippet.title,
            url: `https://youtube.com/channel/${channel.id}`,
            thumbnail: channel.snippet.thumbnails?.default?.url || '',
            subscribers: subscriberCount,
            subscribersHidden,
            totalViews: totalChannelViews,
            avgViewsPerVideo,
            avgVPH,
            isChannelExplosive,
            isChannelNew,
            isChannelActive,
            viewSubRatio: parseFloat(viewSubRatio.toFixed(2)),
            daysOld,
            avgUploadsPerMonth,
            isNewChannel,
            lastUpload,
            lastUploadDays,
            description: channel.snippet.description,
            videoCount,
            dataQuality,
          };
        } catch (error) {
          console.error('Erro ao processar canal:', error);
          return null;
        }
      })
    );

    const validChannels = channelsWithMetrics.filter((c) => c !== null);
    console.log(`📊 Canais antes do filtro de formato: ${filteredChannels.length}`);
    console.log(`✅ Canais após filtro de formato (${targetContentType}): ${validChannels.length}`);

    // Usar Gemini para calcular similaridade
    const channelsWithSimilarity = await Promise.all(
      validChannels.map(async (channel: any) => {
        try {
          // Criar prompt enriquecido com análise de IA e idioma
          const nicheInfo = detectedNiche 
            ? `\nANÁLISE DE NICHO (via IA): ${nicheAnalysis}` 
            : '';
          
          // Detectar idioma do canal comparado
          const channelLanguage = channel.description ? 
            (channel.description.match(/[а-яА-Я]/) ? 'ru' :
             channel.description.match(/[一-龠ぁ-ゔァ-ヴー々〆〤]/) ? 'ja' :
             channel.description.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/) ? 'ko' :
             channel.description.match(/[à-ÿÀ-Ÿ]/) ? (
               channel.description.match(/[áéíóúñ¿¡]/) ? 'es' :
               channel.description.match(/[àâçéèêëïôùûü]/) ? 'fr' :
               channel.description.match(/[äöüß]/) ? 'de' :
               channel.description.match(/[àèéìòù]/) ? 'it' :
               'pt'
             ) : 'en') 
            : detectedLanguage;
          
          const prompt = `Analise a similaridade entre estes dois canais do YouTube e retorne APENAS um número de 0 a 100 representando o percentual de similaridade.

Canal Alvo:
Título: ${targetChannelName}
Descrição: ${targetDescription.substring(0, 500)}
Palavras-chave: ${targetKeywords}
Formato: ${targetContentType} (duração média: ${Math.round(avgVideoDuration)}s)
Termos do nicho: ${nicheTerms.join(', ')}
Idioma: ${detectedLanguage}${nicheInfo}

Canal Comparado:
Título: ${channel.name}
Descrição: ${channel.description.substring(0, 500)}
Idioma: ${channelLanguage}

CRITÉRIOS DE AVALIAÇÃO (ordem de importância):
0. **IDIOMA** (OBRIGATÓRIO): Ambos devem estar no mesmo idioma. Se idiomas diferentes = similaridade máxima 20
1. **NICHO/TEMA** (40%): Ambos abordam o mesmo tema/categoria? ${detectedNiche ? `O canal alvo é de: ${detectedNiche}` : '(ex: curiosidades, gaming, educação)'}
2. **FORMATO** (30%): Mesmo formato de conteúdo? ${isTargetShortsChannel ? 'PRIORIZE canais de Shorts (vídeos curtos < 60s)' : 'PRIORIZE canais de vídeos longos (> 1 minuto)'}
3. **ESTILO** (20%): Estilo de comunicação similar? ${contentStyle ? `O canal alvo tem estilo: ${contentStyle}` : '(informativo, entretenimento, educativo)'}
4. **PÚBLICO-ALVO** (10%): Mesmo tipo de audiência?

IMPORTANTE: 
- Se idiomas diferentes = similaridade máxima 20
- Se ambos fazem ${targetContentType} sobre o mesmo tema no idioma ${detectedLanguage} = alta similaridade (70-100)
- Se o formato for diferente (um Shorts, outro vídeos longos) = similaridade máxima de 50
- Se o nicho for diferente = similaridade máxima de 30
${detectedNiche ? `- O canal alvo faz conteúdo sobre: ${detectedNiche}. PRIORIZE canais com o mesmo tema/nicho!` : ''}

Retorne APENAS o número (exemplo: 85)`;

          console.log(`🤖 Calculando similaridade para: ${channel.name} (idioma: ${channelLanguage})`);
          
          // ✅ CORREÇÃO: Usar Lovable AI com modelo atualizado
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { 
                  role: 'user', 
                  content: prompt + '\n\nRetorne APENAS o número de 0 a 100, sem texto adicional.'
                }
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`❌ Lovable AI error (${aiResponse.status}):`, errorText);
            // ✅ FALLBACK: Em vez de rejeitar, atribuir similaridade padrão
            console.log(`⚠️ Usando similaridade padrão (60) para "${channel.name}" devido a erro na API`);
            filterStats.similarityErrors++;
            return {
              ...channel,
              similarity: 60,
              language: channelLanguage,
              similarityError: true
            };
          }

          const aiData = await aiResponse.json();
          const responseText = aiData.choices?.[0]?.message?.content || '50';
          const similarity = parseInt(responseText.match(/\d+/)?.[0] || '50');
          
          console.log(`✅ Similaridade calculada: ${similarity}% para ${channel.name} (idioma: ${channelLanguage})`);

          return {
            ...channel,
            similarity: Math.min(100, Math.max(0, similarity)),
            language: channelLanguage
          };
        } catch (error) {
          console.error(`❌ Erro ao calcular similaridade para ${channel.name}:`, error);
          // ✅ FALLBACK: Atribuir similaridade padrão em vez de descartar
          console.log(`⚠️ Usando similaridade padrão (60) para "${channel.name}" devido a exceção`);
          filterStats.similarityErrors++;
          return {
            ...channel,
            similarity: 60,
            language: detectedLanguage,
            similarityError: true
          };
        }
      })
    );

    // Ordenar por similaridade e limitar ao máximo solicitado
    const sortedChannels = channelsWithSimilarity.sort((a, b) => b.similarity - a.similarity).slice(0, maxChannels);
    
    filterStats.finalCount = sortedChannels.length;

    console.log(`✅ Retornando ${sortedChannels.length} canais (limite: ${maxChannels})`);
    
    // 📊 RESUMO FINAL DA BUSCA (melhorado)
    console.log('\n📊 ========== RESUMO DA BUSCA ==========');
    console.log(`✅ Total encontrado: ${filterStats.totalFound}`);
    console.log(`🚫 Rejeitado por país/idioma: ${filterStats.rejectedByCountry}`);
    console.log(`🚫 Rejeitado por data/máx. inscritos: ${filterStats.rejectedByDateOrSubs}`);
    console.log(`🚫 Rejeitado por mín. inscritos: ${filterStats.rejectedByMinSubscribers}`);
    console.log(`🚫 Rejeitado por duração vídeos: ${filterStats.rejectedByVideoDuration}`);
    console.log(`🚫 Rejeitado por formato: ${filterStats.rejectedByFormat}`);
    console.log(`⚠️ Erros ao calcular similaridade: ${filterStats.similarityErrors}`);
    console.log(`✅ Total final (após filtros): ${filterStats.finalCount}`);
    console.log(`📈 Taxa de aprovação: ${filterStats.totalFound > 0 ? ((filterStats.finalCount / filterStats.totalFound) * 100).toFixed(1) : 0}%`);
    console.log('========================================\n');

    // Registrar uso de quota
    const searchQueriesCount = 3; // Busca inicial + canais relacionados
    const channelDetailsBatches = Math.ceil(sortedChannels.length / 50);
    const quotaUsed = Math.ceil((searchQueriesCount * 100) + (channelDetailsBatches * 1));
    
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/quota_usage`, {
        method: 'POST',
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: 'similar-channels',
          quota_used: quotaUsed,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      console.error('Erro ao registrar quota:', error);
    }

    // Calcular buscas restantes
    const today = new Date().toISOString().split('T')[0];
    const quotaCheckUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/quota_usage?feature=eq.similar-channels&timestamp=gte.${today}T00:00:00&select=quota_used`;
    const quotaCheckRes = await fetch(quotaCheckUrl, {
      headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '' }
    });
    const quotaData = await quotaCheckRes.json();
    const totalUsedToday = quotaData.reduce((sum: number, item: any) => sum + item.quota_used, 0);
    const searchesRemaining = Math.max(0, 10 - Math.floor(totalUsedToday / 1000));

    return new Response(JSON.stringify({ 
      channels: sortedChannels,
      targetChannelInfo: {
        name: targetChannelName,
        thumbnail: targetChannelThumbnail,
      },
      quotaInfo: {
        searchesRemaining,
        lastReset: today,
        quotaUsed: totalUsedToday,
      },
      filterStats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro na função find-similar-channels:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
