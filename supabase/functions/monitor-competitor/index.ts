import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey, markApiKeyAsExhaustedAndRotate } from '../_shared/get-api-key.ts';
import { validateUrl, validateString, validateOrThrow, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    let YOUTUBE_API_KEY = await getApiKey(userId, 'youtube', supabaseClient);
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key não configurada');
    }

    // Helper function to handle quota errors and rotate keys
    const handleQuotaError = async (error: any, currentKeyId: string) => {
      console.log('🔄 Quota exceeded, attempting key rotation...');
      const rotateResult = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
      
      if (rotateResult && rotateResult.rotated) {
        console.log('✅ Successfully rotated to new API key');
        return { key: rotateResult.key, keyId: rotateResult.keyId };
      } else {
        console.log('❌ No more API keys available');
        throw new Error('Todas as chaves YouTube excederam a cota. Por favor, adicione mais chaves ou aguarde a renovação da cota.');
      }
    };

    // Helper function to fetch with retry on quota error
    const fetchWithRetry = async (url: string, maxRetries = 1): Promise<{ response: Response; data: any }> => {
      let currentKey = YOUTUBE_API_KEY;
      if (!currentKey) {
        throw new Error('YouTube API key não configurada');
      }
      
      let attempts = 0;
      
      while (attempts <= maxRetries) {
        try {
          const response = await fetch(url.replace('YOUTUBE_API_KEY', currentKey.key));
          const data = await response.json();
          
          if (!response.ok && data.error?.message?.includes('quota')) {
            if (attempts < maxRetries) {
              const rotatedKey = await handleQuotaError(data.error, currentKey.keyId);
              currentKey = rotatedKey;
              YOUTUBE_API_KEY = rotatedKey; // Update global key reference
              attempts++;
              continue;
            }
            throw new Error(data.error.message);
          }
          
          if (!response.ok) {
            throw new Error(data.error?.message || 'Erro desconhecido');
          }
          
          return { response, data };
        } catch (error) {
          if (attempts >= maxRetries) throw error;
          attempts++;
        }
      }
      
      throw new Error('Falha após múltiplas tentativas');
    };

    let body: any = {};
    try {
      body = await req.json();
      console.log('📥 Request body:', JSON.stringify(body));
      console.log('📋 Method:', req.method);
    } catch (e) {
      console.error('❌ Erro ao fazer parse do body:', e);
      return new Response(
        JSON.stringify({ error: 'Body inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // POST - Adicionar concorrente
    if (req.method === 'POST' && body.channelUrl) {
      console.log('➡️ Rota: Adicionar concorrente');
      
      // Validate inputs
      const errors = [
        ...validateUrl(body.channelUrl, 'channelUrl', true),
        ...validateString(body.nicheId, 'nicheId', { maxLength: 100 }),
      ];
      validateOrThrow(errors);
      
      const { channelUrl, nicheId } = body;

      // Extrair channel ID da URL (limpar query params e trailing slashes)
      const cleanUrl = channelUrl.split('?')[0].replace(/\/$/, '');
      let channelId = '';
      
      console.log('🔍 URL original:', channelUrl);
      console.log('🧹 URL limpa:', cleanUrl);
      
      if (cleanUrl.includes('/@')) {
        const username = cleanUrl.split('/@')[1].split('/')[0];
        console.log('👤 Buscando por username:', username);
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YOUTUBE_API_KEY.key}`
        );
        const searchData = await searchResponse.json();
        console.log('📊 Resposta da busca:', JSON.stringify(searchData).substring(0, 200));
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        }
      } else if (cleanUrl.includes('/channel/')) {
        channelId = cleanUrl.split('/channel/')[1].split('/')[0].split('?')[0];
        console.log('🆔 Channel ID extraído:', channelId);
      } else if (cleanUrl.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
        // É um channel ID direto
        channelId = cleanUrl;
        console.log('🆔 Channel ID direto:', channelId);
      }

      if (!channelId) {
        console.error('❌ Não conseguiu extrair channel ID da URL:', channelUrl);
        throw new Error('Não foi possível extrair o ID do canal');
      }
      
      console.log('✅ Channel ID final:', channelId);

      // Verificar se canal já existe
      const { data: existingMonitor } = await supabaseClient
        .from('competitor_monitors')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (existingMonitor) {
        return new Response(
          JSON.stringify({ error: 'Canal já está sendo monitorado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar metadados do canal
      console.log('📡 Buscando detalhes do canal:', channelId);
      const channelResult = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=YOUTUBE_API_KEY`
      );
      const channelData = channelResult.data;
      console.log('📊 Status da resposta:', channelResult.response.status);

      if (!channelData.items || channelData.items.length === 0) {
        console.error('❌ Canal não encontrado. Response:', JSON.stringify(channelData));
        throw new Error('Canal não encontrado. Verifique se o canal existe.');
      }

      const channel = channelData.items[0];
      const channelInfo = {
        channel_id: channelId,
        channel_title: channel.snippet.title,
        channel_url: channelUrl,
        channel_thumbnail: channel.snippet.thumbnails.default.url,
        subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
        video_count: parseInt(channel.statistics.videoCount || '0'),
        user_id: userId,
        niche_id: nicheId || null,
      };

      // Salvar canal
      const { data: monitor, error: monitorError } = await supabaseClient
        .from('competitor_monitors')
        .insert(channelInfo)
        .select()
        .single();

      if (monitorError) throw monitorError;

      console.log(`✅ Canal cadastrado: ${channel.snippet.title}`);

      // Buscar últimos 50 vídeos
      const videosResult = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=50&key=YOUTUBE_API_KEY`
      );
      const videosData = videosResult.data;

      if (!videosData.items || videosData.items.length === 0) {
        return new Response(
          JSON.stringify({ channel: monitor, explosiveVideos: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      const videoDetailsResult = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=YOUTUBE_API_KEY`
      );
      const videoDetailsData = videoDetailsResult.data;

      // Helper function: Critérios adaptativos baseados no tamanho do canal
      const getExplosiveCriteria = (subscriberCount: number) => {
        if (subscriberCount < 10000) {
          return { minVph: 50, minViews: 2500, viewsToSubsRatio: 1.0, label: 'Micro' };
        } else if (subscriberCount < 100000) {
          return { minVph: 200, minViews: 10000, viewsToSubsRatio: 0.5, label: 'Pequeno' };
        } else if (subscriberCount < 500000) {
          return { minVph: 500, minViews: 50000, viewsToSubsRatio: 0.3, label: 'Médio' };
        } else if (subscriberCount < 1000000) {
          return { minVph: 1000, minViews: 100000, viewsToSubsRatio: 0.2, label: 'Grande' };
        } else {
          return { minVph: 2000, minViews: 250000, viewsToSubsRatio: 0.15, label: 'Mega' };
        }
      };

      const criteria = getExplosiveCriteria(monitor.subscriber_count);
      console.log(`📊 Critérios adaptativos para canal ${criteria.label}: VPH min=${criteria.minVph}, Views min=${criteria.minViews}`);

      const explosiveVideos = [];
      const now = Date.now();

      for (const video of videoDetailsData.items) {
        const publishedAt = new Date(video.snippet.publishedAt);
        const hoursOld = (now - publishedAt.getTime()) / (1000 * 60 * 60);
        const daysOld = Math.floor(hoursOld / 24);
        const viewCount = parseInt(video.statistics.viewCount || '0');
        const vph = Math.round(viewCount / hoursOld);

        // Critérios adaptativos: VPH, Views, ou Razão Views/Inscritos
        const meetsVph = vph > criteria.minVph;
        const meetsViews = viewCount > criteria.minViews && daysOld < 7;
        const meetsRatio = (viewCount / monitor.subscriber_count) > criteria.viewsToSubsRatio;
        
        const isExplosive = meetsVph || meetsViews || meetsRatio;
        
        // Determinar motivo
        let explosiveReason = '';
        if (meetsVph) explosiveReason = `VPH ${vph} (mín: ${criteria.minVph})`;
        else if (meetsViews) explosiveReason = `${viewCount.toLocaleString()} views em ${daysOld} dias`;
        else if (meetsRatio) explosiveReason = `${((viewCount / monitor.subscriber_count) * 100).toFixed(1)}% dos inscritos`;

        if (isExplosive) {
          explosiveVideos.push({
            monitor_id: monitor.id,
            video_id: video.id,
            title: video.snippet.title,
            thumbnail_url: video.snippet.thumbnails.high.url,
            published_at: publishedAt.toISOString(),
            view_count: viewCount,
            like_count: parseInt(video.statistics.likeCount || '0'),
            comment_count: parseInt(video.statistics.commentCount || '0'),
            vph: vph,
            days_since_upload: daysOld,
            is_explosive: true,
            explosive_reason: explosiveReason,
            user_id: userId,
          });
        }
      }

      if (explosiveVideos.length > 0) {
        await supabaseClient
          .from('monitored_videos')
          .insert(explosiveVideos);
      }

      console.log(`🔥 ${explosiveVideos.length} vídeos explosivos encontrados`);

      return new Response(
        JSON.stringify({ channel: monitor, explosiveVideos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST com monitorId - Atualizar concorrente
    if (req.method === 'POST' && body.monitorId && !body.channelUrl) {
      console.log('➡️ Rota: Atualizar concorrente');
      
      // Validate inputs
      const errors = validateString(body.monitorId, 'monitorId', { required: true, maxLength: 100 });
      validateOrThrow(errors);
      
      const { monitorId } = body;

      const { data: monitor, error: monitorError } = await supabaseClient
        .from('competitor_monitors')
        .select('*')
        .eq('id', monitorId)
        .single();

      if (monitorError || !monitor) {
        throw new Error('Concorrente não encontrado');
      }

      console.log(`🔄 Atualizando canal: ${monitor.channel_title}`);

      // Buscar vídeos dos últimos 30 dias
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const videosResult = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${monitor.channel_id}&order=date&type=video&publishedAfter=${thirtyDaysAgo}&maxResults=50&key=YOUTUBE_API_KEY`
      );
      const videosData = videosResult.data;

      if (!videosData.items || videosData.items.length === 0) {
        return new Response(
          JSON.stringify({ newVideosCount: 0, updatedVideos: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      const videoDetailsResult = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=YOUTUBE_API_KEY`
      );
      const videoDetailsData = videoDetailsResult.data;

      // Helper function: Critérios adaptativos baseados no tamanho do canal
      const getExplosiveCriteria = (subscriberCount: number) => {
        if (subscriberCount < 10000) {
          return { minVph: 50, minViews: 2500, viewsToSubsRatio: 1.0, label: 'Micro' };
        } else if (subscriberCount < 100000) {
          return { minVph: 200, minViews: 10000, viewsToSubsRatio: 0.5, label: 'Pequeno' };
        } else if (subscriberCount < 500000) {
          return { minVph: 500, minViews: 50000, viewsToSubsRatio: 0.3, label: 'Médio' };
        } else if (subscriberCount < 1000000) {
          return { minVph: 1000, minViews: 100000, viewsToSubsRatio: 0.2, label: 'Grande' };
        } else {
          return { minVph: 2000, minViews: 250000, viewsToSubsRatio: 0.15, label: 'Mega' };
        }
      };

      const criteria = getExplosiveCriteria(monitor.subscriber_count);
      console.log(`📊 Critérios adaptativos para canal ${criteria.label}: VPH min=${criteria.minVph}, Views min=${criteria.minViews}`);

      const newExplosiveVideos = [];
      const now = Date.now();

      for (const video of videoDetailsData.items) {
        const publishedAt = new Date(video.snippet.publishedAt);
        const hoursOld = (now - publishedAt.getTime()) / (1000 * 60 * 60);
        const daysOld = Math.floor(hoursOld / 24);
        const viewCount = parseInt(video.statistics.viewCount || '0');
        const vph = Math.round(viewCount / hoursOld);

        // Critérios adaptativos: VPH, Views, ou Razão Views/Inscritos
        const meetsVph = vph > criteria.minVph;
        const meetsViews = viewCount > criteria.minViews && daysOld < 7;
        const meetsRatio = (viewCount / monitor.subscriber_count) > criteria.viewsToSubsRatio;
        
        const isExplosive = meetsVph || meetsViews || meetsRatio;
        
        // Determinar motivo
        let explosiveReason = '';
        if (meetsVph) explosiveReason = `VPH ${vph} (mín: ${criteria.minVph})`;
        else if (meetsViews) explosiveReason = `${viewCount.toLocaleString()} views em ${daysOld} dias`;
        else if (meetsRatio) explosiveReason = `${((viewCount / monitor.subscriber_count) * 100).toFixed(1)}% dos inscritos`;

        const videoData = {
          monitor_id: monitorId,
          video_id: video.id,
          title: video.snippet.title,
          thumbnail_url: video.snippet.thumbnails.high.url,
          published_at: publishedAt.toISOString(),
          view_count: viewCount,
          like_count: parseInt(video.statistics.likeCount || '0'),
          comment_count: parseInt(video.statistics.commentCount || '0'),
          vph: vph,
          days_since_upload: daysOld,
          is_explosive: isExplosive,
          explosive_reason: isExplosive ? explosiveReason : null,
          user_id: userId,
        };

        if (isExplosive) {
          newExplosiveVideos.push(videoData);
        }

        // Upsert (insert ou update)
        await supabaseClient
          .from('monitored_videos')
          .upsert(videoData, { onConflict: 'monitor_id,video_id' });
      }

      // Atualizar last_updated_at
      await supabaseClient
        .from('competitor_monitors')
        .update({ last_updated_at: new Date().toISOString() })
        .eq('id', monitorId);

      console.log(`✅ Atualizado: ${newExplosiveVideos.length} vídeos explosivos`);

      return new Response(
        JSON.stringify({ newVideosCount: newExplosiveVideos.length, updatedVideos: newExplosiveVideos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('❌ Nenhuma rota correspondente encontrada');
    console.log('Body recebido:', JSON.stringify(body));
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado', receivedBody: body }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-competitor:', error instanceof Error ? error.name : 'Unknown');
    
    // Handle validation errors
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generic error for security
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
