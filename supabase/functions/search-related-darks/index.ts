import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchConfig {
  searchId: string;
  searchTerm: string;
  minDuration: number;
  darkDetectionMethod: string;
  currentIteration: number;
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

    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const { action, searchId, searchTerm, minDuration, darkDetectionMethod } = await req.json();

    // AÇÃO: INICIAR NOVA BUSCA
    if (action === 'start') {
      const { data: searchRecord, error: searchError } = await supabaseClient
        .from('related_searches')
        .insert({
          user_id: userId,
          search_term: searchTerm,
          min_duration: minDuration || 1200,
          dark_detection_method: darkDetectionMethod || 'lovable-ai',
          status: 'searching',
          current_iteration: 0,
        })
        .select()
        .single();

      if (searchError) throw searchError;

      console.log(`🚀 Nova busca iniciada: ${searchRecord.id}`);

      const initialResults = await performInitialSearch({
        searchId: searchRecord.id,
        searchTerm,
        minDuration: minDuration || 1200,
        darkDetectionMethod: darkDetectionMethod || 'lovable-ai',
        userId,
        supabaseClient,
      });

      return new Response(
        JSON.stringify({
          success: true,
          searchId: searchRecord.id,
          iteration: 0,
          videosFound: initialResults.videosFound,
          facelessFound: initialResults.facelessFound,
          quotaUsed: initialResults.quotaUsed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AÇÃO: CONTINUAR ITERAÇÃO
    if (action === 'continue') {
      const continuationResults = await performIteration({
        searchId,
        userId,
        supabaseClient,
      });

      return new Response(
        JSON.stringify({
          success: true,
          iteration: continuationResults.iteration,
          videosFound: continuationResults.videosFound,
          facelessFound: continuationResults.facelessFound,
          quotaUsed: continuationResults.quotaUsed,
          hasMore: continuationResults.hasMore,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AÇÃO: PARAR BUSCA
    if (action === 'stop') {
      await supabaseClient
        .from('related_searches')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
        })
        .eq('id', searchId);

      return new Response(
        JSON.stringify({ success: true, message: 'Busca pausada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação inválida');

  } catch (error: any) {
    console.error('❌ Erro em search-related-darks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==================== FUNÇÕES AUXILIARES ====================

async function performInitialSearch(config: any) {
  const { searchId, searchTerm, minDuration, darkDetectionMethod, userId, supabaseClient } = config;
  
  let quotaUsed = 0;
  let videosFound = 0;
  let facelessFound = 0;
  
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key não configurada');
  }

  console.log(`🔍 ITERAÇÃO 0: Busca inicial para "${searchTerm}"`);

  const MAX_PAGES = 10;
  let allVideos = [];
  let nextPageToken = '';
  let pagesSearched = 0;

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&type=video&maxResults=50&order=viewCount&key=${YOUTUBE_API_KEY}`;

  while (pagesSearched < MAX_PAGES) {
    const url = nextPageToken ? `${searchUrl}&pageToken=${nextPageToken}` : searchUrl;
    
    const response = await fetch(url);
    quotaUsed += 100;
    
    if (!response.ok) {
      console.warn(`⚠️ Erro na busca: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    allVideos.push(...(data.items || []));
    videosFound += data.items?.length || 0;
    
    nextPageToken = data.nextPageToken;
    pagesSearched++;
    
    console.log(`📦 Página ${pagesSearched}: +${data.items?.length || 0} vídeos (total: ${allVideos.length})`);
    
    if (!nextPageToken) break;
  }

  console.log(`🎯 TOTAL DA BUSCA INICIAL: ${allVideos.length} vídeos encontrados`);

  const BATCH_SIZE = 10;
  let batchNumber = 0;
  
  for (let i = 0; i < allVideos.length; i += BATCH_SIZE) {
    const batch = allVideos.slice(i, i + BATCH_SIZE);
    batchNumber++;
    
    console.log(`📊 Processando lote ${batchNumber} (${batch.length} vídeos)...`);
    
    const videoIds = batch.map((v: any) => v.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    quotaUsed += 1;
    
    if (!detailsResponse.ok) continue;
    
    const detailsData = await detailsResponse.json();
    
    for (const video of detailsData.items || []) {
      const duration = parseDuration(video.contentDetails.duration);
      
      if (duration < minDuration) {
        console.log(`⏩ Vídeo "${video.snippet.title}" rejeitado (duração: ${duration}s < ${minDuration}s)`);
        continue;
      }
      
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${video.snippet.channelId}&key=${YOUTUBE_API_KEY}`;
      const channelResponse = await fetch(channelUrl);
      quotaUsed += 1;
      
      if (!channelResponse.ok) continue;
      
      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];
      if (!channel) continue;
      
      const channelCreatedAt = new Date(channel.snippet.publishedAt);
      const channelAgeDays = Math.floor((Date.now() - channelCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const isFaceless = await detectFacelessChannel({
        video,
        channel,
        method: darkDetectionMethod,
        supabaseClient,
      });
      
      if (!isFaceless.isFaceless) {
        console.log(`❌ Vídeo "${video.snippet.title}" rejeitado (não é faceless)`);
        continue;
      }
      
      console.log(`✅ FACELESS ENCONTRADO: "${video.snippet.title}" (Score: ${isFaceless.score})`);
      facelessFound++;
      
      await supabaseClient
        .from('related_videos')
        .insert({
          search_id: searchId,
          youtube_video_id: video.id,
          title: video.snippet.title,
          thumbnail_url: video.snippet.thumbnails.high.url,
          duration_seconds: duration,
          view_count: parseInt(video.statistics.viewCount || '0'),
          published_at: video.snippet.publishedAt,
          channel_id: video.snippet.channelId,
          channel_title: video.snippet.channelTitle,
          channel_thumbnail: channel.snippet.thumbnails.default.url,
          subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
          channel_created_at: channel.snippet.publishedAt,
          channel_age_days: channelAgeDays,
          vph: calculateVPH(parseInt(video.statistics.viewCount || '0'), new Date(video.snippet.publishedAt)),
          view_sub_ratio: parseInt(video.statistics.viewCount || '0') / Math.max(parseInt(channel.statistics.subscriberCount || '1'), 1),
          is_dark: true,
          dark_score: isFaceless.score,
          dark_method: darkDetectionMethod,
          dark_analysis: isFaceless.analysis,
          iteration: 0,
          batch_number: batchNumber,
        });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await supabaseClient
    .from('related_searches')
    .update({
      total_videos_found: videosFound,
      total_videos_analyzed: videosFound,
      total_faceless_found: facelessFound,
      quota_used: quotaUsed,
      current_iteration: 0,
    })
    .eq('id', searchId);

  console.log(`🎉 ITERAÇÃO 0 COMPLETA: ${facelessFound} canais faceless de ${allVideos.length} analisados`);

  return { videosFound, facelessFound, quotaUsed };
}

async function performIteration(config: any) {
  const { searchId, userId, supabaseClient } = config;
  
  const { data: searchRecord } = await supabaseClient
    .from('related_searches')
    .select('*')
    .eq('id', searchId)
    .single();
  
  if (!searchRecord) throw new Error('Busca não encontrada');
  
  const nextIteration = searchRecord.current_iteration + 1;
  console.log(`🔄 ITERAÇÃO ${nextIteration}: Buscando relacionados...`);
  
  const { data: previousVideos } = await supabaseClient
    .from('related_videos')
    .select('youtube_video_id')
    .eq('search_id', searchId)
    .eq('iteration', searchRecord.current_iteration)
    .eq('is_dark', true);
  
  if (!previousVideos || previousVideos.length === 0) {
    console.log('⚠️ Nenhum vídeo da iteração anterior');
    return {
      iteration: nextIteration,
      videosFound: 0,
      facelessFound: 0,
      quotaUsed: 0,
      hasMore: false,
    };
  }
  
  console.log(`📹 Processando ${previousVideos.length} vídeos da iteração anterior`);
  
  let quotaUsed = 0;
  let videosFound = 0;
  let facelessFound = 0;
  
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) throw new Error('YouTube API key não configurada');
  
  for (const prevVideo of previousVideos) {
    console.log(`🔗 Buscando relacionados de: ${prevVideo.youtube_video_id}`);
    
    const relatedUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${prevVideo.youtube_video_id}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`;
    
    const relatedResponse = await fetch(relatedUrl);
    quotaUsed += 100;
    
    if (!relatedResponse.ok) {
      console.warn(`⚠️ Erro ao buscar relacionados: ${relatedResponse.status}`);
      if (relatedResponse.status === 403) {
        await supabaseClient
          .from('related_searches')
          .update({ status: 'quota_exhausted' })
          .eq('id', searchId);
        
        throw new Error('YOUTUBE_QUOTA_EXCEEDED');
      }
      continue;
    }
    
    const relatedData = await relatedResponse.json();
    const relatedVideos = relatedData.items || [];
    
    console.log(`  📦 ${relatedVideos.length} relacionados encontrados`);
    
    for (const relatedVideo of relatedVideos) {
      const { data: existing } = await supabaseClient
        .from('related_videos')
        .select('id')
        .eq('search_id', searchId)
        .eq('youtube_video_id', relatedVideo.id.videoId)
        .single();
      
      if (existing) {
        console.log(`  ⏩ Vídeo já processado`);
        continue;
      }
      
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${relatedVideo.id.videoId}&key=${YOUTUBE_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      quotaUsed += 1;
      
      if (!detailsResponse.ok) continue;
      
      const detailsData = await detailsResponse.json();
      const video = detailsData.items?.[0];
      if (!video) continue;
      
      videosFound++;
      
      const duration = parseDuration(video.contentDetails.duration);
      if (duration < searchRecord.min_duration) continue;
      
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${video.snippet.channelId}&key=${YOUTUBE_API_KEY}`;
      const channelResponse = await fetch(channelUrl);
      quotaUsed += 1;
      
      if (!channelResponse.ok) continue;
      
      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];
      if (!channel) continue;
      
      const isFaceless = await detectFacelessChannel({
        video,
        channel,
        method: searchRecord.dark_detection_method,
        supabaseClient,
      });
      
      if (!isFaceless.isFaceless) continue;
      
      console.log(`  ✅ FACELESS RELACIONADO: "${video.snippet.title}"`);
      facelessFound++;
      
      const channelCreatedAt = new Date(channel.snippet.publishedAt);
      const channelAgeDays = Math.floor((Date.now() - channelCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      await supabaseClient
        .from('related_videos')
        .insert({
          search_id: searchId,
          youtube_video_id: video.id,
          title: video.snippet.title,
          thumbnail_url: video.snippet.thumbnails.high.url,
          duration_seconds: duration,
          view_count: parseInt(video.statistics.viewCount || '0'),
          published_at: video.snippet.publishedAt,
          channel_id: video.snippet.channelId,
          channel_title: video.snippet.channelTitle,
          channel_thumbnail: channel.snippet.thumbnails.default.url,
          subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
          channel_created_at: channel.snippet.publishedAt,
          channel_age_days: channelAgeDays,
          vph: calculateVPH(parseInt(video.statistics.viewCount || '0'), new Date(video.snippet.publishedAt)),
          view_sub_ratio: parseInt(video.statistics.viewCount || '0') / Math.max(parseInt(channel.statistics.subscriberCount || '1'), 1),
          is_dark: true,
          dark_score: isFaceless.score,
          dark_method: searchRecord.dark_detection_method,
          dark_analysis: isFaceless.analysis,
          iteration: nextIteration,
          parent_video_id: prevVideo.youtube_video_id,
        });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  await supabaseClient
    .from('related_searches')
    .update({
      current_iteration: nextIteration,
      total_videos_found: searchRecord.total_videos_found + videosFound,
      total_videos_analyzed: searchRecord.total_videos_analyzed + videosFound,
      total_faceless_found: searchRecord.total_faceless_found + facelessFound,
      quota_used: searchRecord.quota_used + quotaUsed,
    })
    .eq('id', searchId);
  
  console.log(`🎉 ITERAÇÃO ${nextIteration} COMPLETA: +${facelessFound} novos faceless`);
  
  return {
    iteration: nextIteration,
    videosFound,
    facelessFound,
    quotaUsed,
    hasMore: facelessFound > 0,
  };
}

async function detectFacelessChannel(config: any): Promise<{ isFaceless: boolean; score: number; analysis: any }> {
  const { video, channel, method, supabaseClient } = config;
  
  if (method === 'lovable-ai') {
    const { data, error } = await supabaseClient.functions.invoke('detect-dark-channel', {
      body: {
        channelData: {
          name: channel.snippet.title,
          description: channel.snippet.description || '',
          contentType: 'video',
        },
      },
    });
    
    if (error || !data) {
      return { isFaceless: false, score: 0, analysis: null };
    }
    
    return {
      isFaceless: data.isDarkChannel,
      score: data.confidence,
      analysis: data,
    };
  }
  
  return { isFaceless: false, score: 0, analysis: { method, error: 'Not implemented' } };
}

function parseDuration(isoDuration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

function calculateVPH(views: number, publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  return Math.round(views / Math.max(hoursAgo, 1));
}
