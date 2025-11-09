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

    // Buscar YouTube API Key (prioriza chave do usuário)
    const apiKeyResult = await getApiKey(userId, 'youtube', supabaseClient);
    if (!apiKeyResult) {
      throw new Error('YouTube API key não configurada');
    }
    
    const YOUTUBE_API_KEY = apiKeyResult.key;
    const currentKeyId = apiKeyResult.keyId;
    console.log('YouTube API Key detectada:', YOUTUBE_API_KEY.substring(0, 10) + '...');

    const requestData = await req.json();
    const {
      keyword = '',
      viralScore = 3.5,
      country = 'any',
      language = 'any',
      videoDuration = 'any',
      maxPages = 10,
      topN = 100,
      allowPartial = true,
      granularity = 'standard',
      aiModel = 'gemini-2.5-flash',
    } = requestData;

    // Verificar se estamos em "Modo de Descoberta"
    const isDiscoveryMode = !keyword || keyword.trim().length === 0;
    
    // CRÍTICO: No modo descoberta, usar filtros ULTRA-ABERTOS para permitir análise de centenas de vídeos
    // Os filtros restritivos devem ser aplicados APENAS pela IA na análise de nichos
    const maxChannelVideos = isDiscoveryMode ? 10000 : (requestData.maxChannelVideos || 500);
    const minViews = isDiscoveryMode ? 0 : (requestData.minViews || 5000);
    const minEngagement = isDiscoveryMode ? 0 : (requestData.minEngagement || 0.001);
    const maxVideoAge = isDiscoveryMode ? 365 : (requestData.maxVideoAge || 14);
    const maxSubscribers = isDiscoveryMode ? 10000000 : (requestData.maxSubscribers || 100000);
    const minSubscribers = isDiscoveryMode ? 0 : (requestData.minSubscribers || 1000);
    const maxChannelAge = isDiscoveryMode ? null : (requestData.maxChannelAge || null);
    const minViewSubRatio = isDiscoveryMode ? 0 : (requestData.minViewSubRatio || 0);

    console.log(isDiscoveryMode 
      ? '🔍 MODO DE DESCOBERTA ATIVADO - Buscando por categorias populares'
      : `Iniciando busca com parâmetros: ${keyword}, minViews: ${minViews}, maxVideoAge: ${maxVideoAge}`
    );

    // Calcular data de publicação baseada na idade máxima do vídeo
    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - maxVideoAge);

    // CATEGORIAS DARK - sem Sports/Gaming/Music/Pets/Autos para canais dark (sem rosto)
    const darkCategories = [
      '27', // Education - História, Ciência, Filosofia
      '22', // People & Blogs - True Crime, Mistérios, Biografias
      '24', // Entertainment - Storytelling, Resumos
      '28', // Science & Technology - Ciência, Futuro
      '25', // News & Politics - Geopolítica, Economia
      '1',  // Film & Animation - Resumos, Análises
      '29', // Nonprofits - Documentários, Causas
      '26', // Howto & Style - Tutoriais específicos (se >20min)
    ];

    // Termos universais para EXCLUIR em canais dark
    const darkExcludeTerms = [
      'ao vivo', 'live', 'stream', 'podcast', 
      'episódio', 'episodio', 'ep.', 'react', 'reagindo', 'reacting',
      'highlights', 'melhores momentos', 'rodada',
      'futebol', 'football', 'soccer', 'nba', 'nfl',
      'kings cup', 'desimpedidos', 'loud', 'iem',
      'cs2', 'valorant', 'fortnite', 'minecraft', 'roblox',
      'pitstop', 'blogueiras', 'reality', 'bbb',
      'gameplay', 'playthrough', 'walkthrough',
      'chengdu', 'sports', 'gaming', 'esports'
    ];

    // Ajustar categorias baseado na granularidade (SEMPRE usar darkCategories)
    let categoriesToSearch = darkCategories;
    
    console.log(`📂 Usando ${categoriesToSearch.length} categorias dark (sem Sports/Gaming/Music)`);
    console.log(`🚫 Filtros de exclusão: ${darkExcludeTerms.length} termos`);

    let allSearchResults: any[] = [];
    let allVideoDetails: any[] = [];
    let quotaHit = false;
    
    // Helper para parsear duração ISO8601
    const parseISO8601Duration = (duration: string): number => {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    if (isDiscoveryMode) {
      // ===== MODO DE DESCOBERTA - Usar videos.list (Trending por categoria) =====
      console.log(`🔍 DESCOBERTA: Coletando vídeos trending em ${categoriesToSearch.length} categorias (${granularity})...`);
      
      const videosPerCategory = 50;
      let collectedByCategory = 0;
      
      // Ajustar ordem de regiões baseado na granularidade
      let tryRegions: string[];
      if (country !== 'any') {
        tryRegions = [country, 'BR', ''];
      } else {
        // Micro: priorizar mercados globais nichados (US, GB, CA)
        // Sub: priorizar Brasil primeiro
        tryRegions = granularity === 'micro' ? ['US', 'GB', 'CA', ''] : ['BR', 'US', ''];
      }
      console.log(`Regiões tentadas (${granularity}): ${tryRegions.join(' → ') || 'global'}`);
      
      for (const categoryId of categoriesToSearch) {
        console.log(`📂 Categoria ${categoryId}: Buscando trending...`);
        
        const videoParams = new URLSearchParams({
          part: 'snippet,contentDetails,statistics',
          chart: 'mostPopular',
          videoCategoryId: categoryId,
          maxResults: videosPerCategory.toString(),
          key: YOUTUBE_API_KEY,
        });

        let categorySuccess = false;

        for (const region of tryRegions) {
          if (categorySuccess) break;
          
          const params = new URLSearchParams(videoParams);
          if (region) params.set('regionCode', region);

          try {
            const videoResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?${params}`
            );

            if (!videoResponse.ok) {
              const videoData = await videoResponse.json();
              if (videoResponse.status === 403 || videoData.error?.code === 403) {
                console.log(`Quota atingida na categoria ${categoryId}`);
                quotaHit = true;
                break;
              }
              continue;
            }

            const videoData = await videoResponse.json();
            
            if (videoData.items && videoData.items.length > 0) {
              collectedByCategory = videoData.items.length;
              
              // Filtrar por duração conforme preferência do cliente
              const mediumMin = 480; // 8+ min (conforme solicitado)
              const longThreshold = 1200; // >= 20min
              const filterByDuration = (v: any) => {
                if (!videoDuration || videoDuration === 'any') return true;
                const durationSeconds = parseISO8601Duration(v.contentDetails.duration);
                if (videoDuration === 'long') return durationSeconds >= mediumMin; // 8+ min
                if (videoDuration === 'medium') return durationSeconds >= mediumMin && durationSeconds < longThreshold;
                if (videoDuration === 'short') return durationSeconds < mediumMin;
                return true;
              };

              const durationFiltered = videoData.items.filter(filterByDuration);
              console.log(`   → ${collectedByCategory} coletados, ${durationFiltered.length} após filtro "${videoDuration || 'any'}"`);
              
              // Filtrar: apenas vídeos dos últimos maxVideoAge dias
              const recentVideos = durationFiltered.filter((v: any) => {
                const publishedAt = new Date(v.snippet.publishedAt);
                return publishedAt >= publishedAfter;
              });
              
              console.log(`   → ${recentVideos.length} após filtro "≤${maxVideoAge} dias"`);
              
              if (recentVideos.length > 0) {
                allVideoDetails.push(...recentVideos);
                console.log(`✅ Categoria ${categoryId} (${region || 'global'}): +${recentVideos.length} vídeos (Total: ${allVideoDetails.length})`);
                categorySuccess = true;
              }
            }
            
          } catch (error) {
            console.error(`Erro na categoria ${categoryId} (region: ${region}):`, error);
            continue;
          }
        }
        
        if (quotaHit) break;
      }
      
      console.log(`🎯 DESCOBERTA concluído: ${allVideoDetails.length} vídeos (${videoDuration || 'any'}) + ≤${maxVideoAge}dias de ${categoriesToSearch.length} categorias`);
      
      // Aplicar filtro universal de exclusão para canais dark
      const beforeExclude = allVideoDetails.length;
      allVideoDetails = allVideoDetails.filter((v: any) => {
        const title = (v.snippet.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const desc = (v.snippet.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        const hasExcludedTerm = darkExcludeTerms.some(term => 
          title.includes(term) || desc.includes(term)
        );
        
        return !hasExcludedTerm;
      });
      
      console.log(`🚫 Filtro dark aplicado: ${beforeExclude} → ${allVideoDetails.length} vídeos (removidos ${beforeExclude - allVideoDetails.length})`);
      
    } else {
      // ===== MODO NORMAL - Buscar por palavra-chave =====
      const searchQuery = keyword;
      let nextPageToken: string | undefined;
      const maxPagesToFetch = Math.min(Number(maxPages) || 10, 20);
      
      console.log(`Configurado para buscar até ${maxPagesToFetch} páginas (${maxPagesToFetch * 50} vídeos no máximo)`);
      
      for (let page = 0; page < maxPagesToFetch; page++) {
        const searchParams = new URLSearchParams({
          part: 'snippet',
          maxResults: '50',
          order: 'date',
          publishedAfter: publishedAfter.toISOString(),
          type: 'video',
          key: YOUTUBE_API_KEY,
        });

        if (searchQuery) searchParams.append('q', searchQuery);
        if (country !== 'any') searchParams.append('regionCode', country);
        if (language !== 'any') searchParams.append('relevanceLanguage', language);
        if (videoDuration !== 'any') searchParams.append('videoDuration', videoDuration);
        if (nextPageToken) {
          searchParams.append('pageToken', nextPageToken);
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
        console.log(`Buscando página ${page + 1} de vídeos (${allSearchResults.length} vídeos até agora)`);

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
          console.error('Erro na busca YouTube:', searchData);
          console.error('Status:', searchResponse.status);
          console.error('API Key usada:', YOUTUBE_API_KEY.substring(0, 10) + '...');
          const msg = searchData.error?.message || 'Erro ao buscar vídeos';
          
          // Detectar erro 403 (quota exceeded) e tentar rotacionar
          if (searchResponse.status === 403 || searchData.error?.code === 403) {
            console.log(`API Key ${currentKeyId} esgotada. Tentando rotacionar...`);
            
            const rotated = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
            
            if (rotated) {
              return new Response(
                JSON.stringify({
                  success: false,
                  rotated: true,
                  message: `🔄 API Key esgotada. Automaticamente trocada para a próxima da lista (Priority ${rotated.keyId}). Tente novamente.`,
                  newKeyId: rotated.keyId
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              throw new Error('YOUTUBE_QUOTA_EXCEEDED: Todas as suas API Keys do YouTube esgotaram. Adicione novas keys em Configurações.');
            }
          }
          
          // Se for erro de quota e allowPartial estiver ativo, retornar o que temos
          if (allowPartial && String(msg).toLowerCase().includes('quota')) {
            quotaHit = true;
            console.warn('Quota atingida durante busca. Retornando resultados parciais.');
            break;
          }
          
          // Para outros erros, lançar exceção
          throw new Error(msg);
        }

        if (searchData.items && searchData.items.length > 0) {
          allSearchResults = [...allSearchResults, ...searchData.items];
        }

        // Otimização: Parar cedo se já temos resultados suficientes
        // Isso economiza quota da API
        if (allSearchResults.length >= topN * 3) {
          console.log(`Parando cedo: já temos ${allSearchResults.length} vídeos (suficiente para ${topN} resultados)`);
          break;
        }

        // Se não há mais páginas, parar
        if (!searchData.nextPageToken) {
          console.log('Não há mais páginas disponíveis');
          break;
        }
        
        nextPageToken = searchData.nextPageToken;
      }
    }

    console.log(`Total de vídeos encontrados na busca: ${allSearchResults.length}`);

    if (allSearchResults.length === 0 && !isDiscoveryMode) {
      // Retornar informações de quota mesmo quando não há resultados
      return new Response(JSON.stringify({ 
        videos: [], 
        partial: quotaHit, 
        totalAnalyzed: 0, 
        totalFound: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar detalhes dos vídeos em lotes (apenas se NÃO for modo Descoberta)
    if (!isDiscoveryMode && allSearchResults.length > 0) {
      const videoIds = allSearchResults.map((item: any) => item.id.videoId);
    
      for (let i = 0; i < videoIds.length; i += 50) {
        const batchIds = videoIds.slice(i, i + 50).join(',');
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${batchIds}&key=${YOUTUBE_API_KEY}`;
        
        console.log(`Buscando detalhes dos vídeos (lote ${Math.floor(i/50) + 1})`);
        const videoDetailsResponse = await fetch(videoDetailsUrl);
        const videoDetailsData = await videoDetailsResponse.json();

        if (!videoDetailsResponse.ok) {
          console.error('Erro ao buscar detalhes:', videoDetailsData);
          const msg = videoDetailsData.error?.message || 'Erro ao buscar detalhes dos vídeos';
          
          // Detectar erro 403 (quota exceeded)
          if (videoDetailsResponse.status === 403 || videoDetailsData.error?.code === 403) {
            throw new Error('YOUTUBE_QUOTA_EXCEEDED: Sua API Key do YouTube esgotou a quota diária. Troque a API Key nas configurações para continuar.');
          }
          
          if (allowPartial && String(msg).toLowerCase().includes('quota')) {
            quotaHit = true;
            console.warn('Quota atingida nos detalhes de vídeos. Seguindo com parciais.');
            break;
          }
          continue; // Continuar com o próximo lote se houver erro
        }

        if (videoDetailsData.items) {
          allVideoDetails.push(...videoDetailsData.items);
        }
      }
    }

    console.log(`Total de detalhes de vídeos obtidos: ${allVideoDetails.length}`);

    // Buscar detalhes dos canais em lotes
    const allChannelDetails: any[] = [];
    const uniqueChannelIds = [...new Set(allVideoDetails.map((item: any) => item.snippet.channelId))];
    
    for (let i = 0; i < uniqueChannelIds.length; i += 50) {
      const batchIds = uniqueChannelIds.slice(i, i + 50).join(',');
      const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${batchIds}&key=${YOUTUBE_API_KEY}`;
      
      console.log(`Buscando detalhes dos canais (lote ${Math.floor(i/50) + 1})`);
      const channelDetailsResponse = await fetch(channelDetailsUrl);
      const channelDetailsData = await channelDetailsResponse.json();

      if (!channelDetailsResponse.ok) {
        console.error('Erro ao buscar canais:', channelDetailsData);
        const msg = channelDetailsData.error?.message || 'Erro ao buscar canais';
        
        // Detectar erro 403 (quota exceeded)
        if (channelDetailsResponse.status === 403 || channelDetailsData.error?.code === 403) {
          throw new Error('YOUTUBE_QUOTA_EXCEEDED: Sua API Key do YouTube esgotou a quota diária. Troque a API Key nas configurações para continuar.');
        }
        
        if (allowPartial && String(msg).toLowerCase().includes('quota')) {
          quotaHit = true;
          console.warn('Quota atingida nos detalhes de canais. Seguindo com parciais.');
          break;
        }
        continue;
      }

      if (channelDetailsData.items) {
        allChannelDetails.push(...channelDetailsData.items);
      }
    }

    console.log(`Total de canais obtidos: ${allChannelDetails.length}`);

    // Mapear canais por ID
    const channelsMap = new Map();
    allChannelDetails.forEach((channel: any) => {
      channelsMap.set(channel.id, {
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        subscriberHidden: !!channel.statistics.hiddenSubscriberCount,
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        country: channel.snippet.country,
        defaultLanguage: channel.snippet.defaultLanguage,
        createdAt: channel.snippet.publishedAt,
      });
    });

    // Processar vídeos (mapear dados)
    const now = new Date();
    const mappedVideos = allVideoDetails.map((video: any) => {
      const channelData = channelsMap.get(video.snippet.channelId);
      const viewCount = parseInt(video.statistics.viewCount || '0');
      const likeCount = parseInt(video.statistics.likeCount || '0');
      const commentCount = parseInt(video.statistics.commentCount || '0');
      const publishedAt = new Date(video.snippet.publishedAt);
      const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
      const ageInDays = ageInHours / 24;
      const vph = ageInHours > 0 ? viewCount / ageInHours : 0;
      const engagement = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
      const calculatedViralScore = (vph * viralScore) + (engagement * 1000);
      
      // Calcular CPM e ganhos estimados
      const estimatedCPM = engagement > 0.05 ? 4.5 : engagement > 0.03 ? 3.0 : 2.0;
      const estimatedEarnings = (viewCount / 1000) * estimatedCPM;
      
      // Extrair data de criação do canal
      const channelCreatedAt = channelData?.createdAt || null;
      const channelAgeInDays = channelCreatedAt 
        ? Math.floor((now.getTime() - new Date(channelCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Calcular ratio views/inscritos
      const viewSubRatio = channelData?.subscriberCount > 0 ? viewCount / channelData.subscriberCount : 0;

      return {
        id: video.id,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        viewCount,
        likeCount,
        subscriberCount: channelData?.subscriberCount || 0,
        subscriberHidden: channelData?.subscriberHidden || false,
        videoCount: channelData?.videoCount || 0,
        publishedAt: video.snippet.publishedAt,
        ageInDays: Math.round(ageInDays),
        vph: vph,
        engagement,
        viralScore: calculatedViralScore,
        thumbnail: video.snippet.thumbnails.high.url,
        channelCountry: channelData?.country,
        defaultAudioLanguage: video.snippet.defaultAudioLanguage,
        defaultLanguage: video.snippet.defaultLanguage,
        estimatedCPM,
        estimatedEarnings,
        channelCreatedAt,
        channelAgeInDays,
        viewSubRatio,
      };
    });

    // Telemetria de filtros
    const discardReasons = {
      belowMinViews: 0,
      belowMinEngagement: 0,
      tooOldVideo: 0,
      belowMinSubs: 0,
      aboveMaxSubs: 0,
      aboveMaxChannelVideos: 0,
      aboveMaxChannelAge: 0,
      belowMinViewSubRatio: 0,
    };

    // Filtrar vídeos com telemetria
    const applyFilters = (vids: any[], params: any) => {
      return vids.filter((video: any) => {
        // Filtros básicos
        if (video.viewCount < params.minViews) {
          discardReasons.belowMinViews++;
          return false;
        }
        if (video.engagement < params.minEngagement) {
          discardReasons.belowMinEngagement++;
          return false;
        }
        if (video.ageInDays > params.maxVideoAge) {
          discardReasons.tooOldVideo++;
          return false;
        }
        
        // Filtros de canal
        if (!video.subscriberHidden && video.subscriberCount < params.minSubscribers) {
          discardReasons.belowMinSubs++;
          return false;
        }

        if (!video.subscriberHidden && params.maxSubscribers !== 'any') {
          const maxSubs = typeof params.maxSubscribers === 'number' ? params.maxSubscribers : parseInt(params.maxSubscribers);
          if (!isNaN(maxSubs) && video.subscriberCount > maxSubs) {
            discardReasons.aboveMaxSubs++;
            return false;
          }
        }
        
        // Filtro de quantidade de vídeos do canal - handle 'any' or null
        if (params.maxChannelVideos && params.maxChannelVideos !== 'any' && video.videoCount > params.maxChannelVideos) {
          discardReasons.aboveMaxChannelVideos++;
          return false;
        }

        // Filtro de idade do canal - handle 'any' or null
        if (params.maxChannelAge && params.maxChannelAge !== 'any' && video.channelAgeInDays && video.channelAgeInDays > params.maxChannelAge) {
          discardReasons.aboveMaxChannelAge++;
          return false;
        }
        
        // Filtro de ratio views/inscritos
        if (params.minViewSubRatio > 0 && video.viewSubRatio < params.minViewSubRatio) {
          discardReasons.belowMinViewSubRatio++;
          return false;
        }

        return true;
      });
    };

    // Aplicar filtros iniciais
    let filteredVideos = applyFilters(mappedVideos, {
      minViews,
      minEngagement,
      maxVideoAge,
      minSubscribers,
      maxSubscribers,
      maxChannelVideos,
      maxChannelAge,
      minViewSubRatio,
    });

    console.log(`Filtros aplicados — minViews: ${discardReasons.belowMinViews}, engagement: ${discardReasons.belowMinEngagement}, vídeo>${maxVideoAge}d: ${discardReasons.tooOldVideo}, subs<${minSubscribers}: ${discardReasons.belowMinSubs}, subs>${maxSubscribers}: ${discardReasons.aboveMaxSubs}, canal>${maxChannelVideos}vídeos: ${discardReasons.aboveMaxChannelVideos}, canal>${maxChannelAge}d: ${discardReasons.aboveMaxChannelAge}, viewSubRatio<${minViewSubRatio}: ${discardReasons.belowMinViewSubRatio}`);
    
    // Calcular teto de inscritos - ultra-aberto para descoberta
    const allowedMaxSubs = maxSubscribers === 'any' ? 10000000 : Math.min(Number(maxSubscribers) || 10000000, 10000000);
    
    console.log(`Granularidade: ${granularity}, Teto de inscritos: ${allowedMaxSubs}`);

    // Sistema progressivo de fallbacks (A → B → C → D)
    let fallbackApplied: string | null = null;
    
    // FALLBACK A: Relaxar engagement e viewSubRatio
    if (filteredVideos.length < 20) {
      console.log(`⚠️ Apenas ${filteredVideos.length} vídeos após filtros. Aplicando FALLBACK A...`);
      fallbackApplied = 'A';
      
      Object.keys(discardReasons).forEach(k => discardReasons[k as keyof typeof discardReasons] = 0);
      
      filteredVideos = applyFilters(mappedVideos, {
        minViews,
        minEngagement: Math.max(0.002, minEngagement / 2),
        maxVideoAge,
        minSubscribers,
        maxSubscribers: allowedMaxSubs,
        maxChannelVideos,
        maxChannelAge,
        minViewSubRatio: 0,
      });
      
      console.log(`🔁 Fallback A aplicado: ${filteredVideos.length} vídeos (relaxou engagement e viewSubRatio)`);
      console.log(`Fallback A — minViews: ${discardReasons.belowMinViews}, engagement: ${discardReasons.belowMinEngagement}, vídeo>${maxVideoAge}d: ${discardReasons.tooOldVideo}, subs<${minSubscribers}: ${discardReasons.belowMinSubs}, canal>${maxChannelVideos}vídeos: ${discardReasons.aboveMaxChannelVideos}, canal>${maxChannelAge}d: ${discardReasons.aboveMaxChannelAge}`);
    }
    
    // FALLBACK B: Relaxar maxChannelAge
    if (filteredVideos.length < 20 && isDiscoveryMode) {
      console.log(`⚠️ Ainda ${filteredVideos.length} vídeos. Aplicando FALLBACK B...`);
      fallbackApplied = 'B';
      
      const fallbackChannelAge = maxChannelAge === 'any' ? null : 730;
      
      Object.keys(discardReasons).forEach(k => discardReasons[k as keyof typeof discardReasons] = 0);
      
      filteredVideos = applyFilters(mappedVideos, {
        minViews,
        minEngagement: Math.max(0.002, minEngagement / 2),
        maxVideoAge,
        minSubscribers,
        maxSubscribers: allowedMaxSubs,
        maxChannelVideos,
        maxChannelAge: fallbackChannelAge,
        minViewSubRatio: 0,
      });
      
      console.log(`🔁 Fallback B aplicado: ${filteredVideos.length} vídeos (relaxou maxChannelAge→${fallbackChannelAge}d para ${granularity})`);
      console.log(`Fallback B — minViews: ${discardReasons.belowMinViews}, engagement: ${discardReasons.belowMinEngagement}, vídeo>${maxVideoAge}d: ${discardReasons.tooOldVideo}, subs<${minSubscribers}: ${discardReasons.belowMinSubs}, canal>${maxChannelVideos}vídeos: ${discardReasons.aboveMaxChannelVideos}, canal>${fallbackChannelAge}d: ${discardReasons.aboveMaxChannelAge}`);
    }
    
    // FALLBACK C: Relaxar maxChannelVideos
    if (filteredVideos.length < 20 && isDiscoveryMode) {
      console.log(`⚠️ Ainda ${filteredVideos.length} vídeos. Aplicando FALLBACK C...`);
      fallbackApplied = 'C';
      
      const fallbackChannelVideos = maxChannelVideos === 'any' ? 10000 : 1000;
      
      Object.keys(discardReasons).forEach(k => discardReasons[k as keyof typeof discardReasons] = 0);
      
      filteredVideos = applyFilters(mappedVideos, {
        minViews,
        minEngagement: Math.max(0.002, minEngagement / 2),
        maxVideoAge,
        minSubscribers,
        maxSubscribers: allowedMaxSubs,
        maxChannelVideos: fallbackChannelVideos,
        maxChannelAge,
        minViewSubRatio: 0,
      });
      
      console.log(`🔁 Fallback C aplicado: ${filteredVideos.length} vídeos (relaxou maxChannelVideos→${fallbackChannelVideos} para ${granularity})`);
      console.log(`Fallback C — minViews: ${discardReasons.belowMinViews}, engagement: ${discardReasons.belowMinEngagement}, vídeo>${maxVideoAge}d: ${discardReasons.tooOldVideo}, subs<${minSubscribers}: ${discardReasons.belowMinSubs}, canal>${fallbackChannelVideos}vídeos: ${discardReasons.aboveMaxChannelVideos}, canal>${maxChannelAge}d: ${discardReasons.aboveMaxChannelAge}`);
    }
    
    // FALLBACK D: Máxima relaxação - ultra-aberto
    if (filteredVideos.length < 20 && isDiscoveryMode) {
      console.log(`⚠️ Ainda ${filteredVideos.length} vídeos. Aplicando FALLBACK D (último recurso)...`);
      fallbackApplied = 'D';
      
      const fallbackChannelAge = maxChannelAge === 'any' ? null : 730;
      const fallbackChannelVideos = maxChannelVideos === 'any' ? 10000 : (granularity === 'micro' ? 2000 : 1000);
      const fallbackMaxSubs = 10000000;
      
      Object.keys(discardReasons).forEach(k => discardReasons[k as keyof typeof discardReasons] = 0);
      
      filteredVideos = applyFilters(mappedVideos, {
        minViews,
        minEngagement: Math.max(0.002, minEngagement / 2),
        maxVideoAge,
        minSubscribers,
        maxSubscribers: fallbackMaxSubs,
        maxChannelVideos: fallbackChannelVideos,
        maxChannelAge: fallbackChannelAge,
        minViewSubRatio: 0,
      });
      
      console.log(`🔁 Fallback D aplicado: ${filteredVideos.length} vídeos (relaxou maxChannelAge→${fallbackChannelAge}d + maxChannelVideos→${fallbackChannelVideos} para ${granularity})`);
      console.log(`Fallback D — minViews: ${discardReasons.belowMinViews}, engagement: ${discardReasons.belowMinEngagement}, vídeo>${maxVideoAge}d: ${discardReasons.tooOldVideo}, subs<${minSubscribers}: ${discardReasons.belowMinSubs}, canal>${fallbackChannelVideos}vídeos: ${discardReasons.aboveMaxChannelVideos}, canal>${fallbackChannelAge}d: ${discardReasons.aboveMaxChannelAge}`);
    }

    // Ordenar por viral score
    filteredVideos.sort((a: any, b: any) => b.viralScore - a.viralScore);
    
    // Determinar limite de vídeos baseado no modelo de IA
    const getModelVideoLimit = (model: string): number => {
      if (model.includes('gemini-2.5-pro')) return 800;
      if (model.includes('gemini-2.5-flash-lite')) return 400;
      if (model.includes('gemini-2.5-flash')) return 600;
      if (model.includes('claude-sonnet-4-5')) return 800;
      if (model.includes('claude-3-7')) return 600;
      if (model.includes('gpt-4.1')) return 600;
      if (model.includes('gpt-4o-mini')) return 500;
      return 600; // fallback seguro
    };

    const videoLimit = getModelVideoLimit(aiModel);
    const analysisVideos = filteredVideos.slice(0, videoLimit);
    const clientVideos = filteredVideos.slice(0, topN);
    
    console.log(`📊 Enviando ${analysisVideos.length} vídeos para ${aiModel} (limite: ${videoLimit})`);

    console.log(`Retornando ${clientVideos.length} vídeos ao cliente, enviando ${analysisVideos.length} para IA`);

    // Se nenhuma keyword foi fornecida, fazer análise de nichos
    let nicheAnalysis = null;
    if (!keyword || keyword.trim().length === 0) {
      console.log(`Calling niche analysis with granularity: ${granularity}, aiModel: ${aiModel}...`);
      try {
        const { data: nicheData, error: nicheError } = await supabaseClient.functions.invoke('analyze-niches', {
          body: { videos: analysisVideos, granularity, aiModel }
        });

        if (nicheError) {
          console.error('Error calling analyze-niches:', nicheError);
        } else {
          nicheAnalysis = nicheData;
          console.log(`Niche analysis completed: ${nicheData?.niches?.length || 0} niches detected`);
        }
      } catch (error) {
        console.error('Error in niche analysis:', error);
      }
    }

    // Registrar uso de quota
    // Para Discovery Mode: 15 categorias * 100 = 1500
    // Para Modo Normal: calculado com base nas páginas
    const calculatedQuota = isDiscoveryMode 
      ? 1500 
      : Math.ceil((Math.min(Number(maxPages) || 10, 20) * 100) + (Math.ceil(allVideoDetails.length / 50) * 1) + (Math.ceil(uniqueChannelIds.length / 50) * 1));
    const quotaUsed = calculatedQuota;
    
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/quota_usage`, {
        method: 'POST',
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: 'niche-finder',
          quota_used: quotaUsed,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      console.error('Erro ao registrar quota:', error);
    }

    // Calcular buscas restantes
    const today = new Date().toISOString().split('T')[0];
    const quotaCheckUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/quota_usage?feature=eq.niche-finder&timestamp=gte.${today}T00:00:00&select=quota_used`;
    const quotaCheckRes = await fetch(quotaCheckUrl, {
      headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '' }
    });
    const quotaData = await quotaCheckRes.json();
    const totalUsedToday = quotaData.reduce((sum: number, item: any) => sum + item.quota_used, 0);
    const searchesRemaining = Math.max(0, 8 - Math.floor(totalUsedToday / 3000));
    
    // Ajustar totalFound para Discovery mode
    const totalFound = isDiscoveryMode ? allVideoDetails.length : allSearchResults.length;

    return new Response(JSON.stringify({ 
      videos: clientVideos,
      ...(nicheAnalysis && { nicheAnalysis }),
      partial: quotaHit, 
      totalAnalyzed: allVideoDetails.length, 
      totalFound,
      totalFiltered: filteredVideos.length,
      fallbackInfo: fallbackApplied,
      discardReasons,
      apiKeyPrefix: YOUTUBE_API_KEY.substring(0, 12),
      quotaInfo: {
        searchesRemaining,
        lastReset: today,
        quotaUsed: totalUsedToday,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro na função youtube-search:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
