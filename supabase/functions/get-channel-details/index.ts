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

    // Buscar API Key (prioriza chaves do usuário)
    const youtubeKeyResult = await getApiKey(userId, 'youtube', supabaseClient);
    if (!youtubeKeyResult) {
      throw new Error('YouTube API key não configurada');
    }
    let YOUTUBE_API_KEY = youtubeKeyResult.key;
    let currentKeyId = youtubeKeyResult.keyId;

    const { channelId } = await req.json();

    
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    console.log('Fetching channel details for:', channelId);

    // 1. Buscar detalhes do canal
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelResponse = await fetch(channelUrl);
    
    if (!channelResponse.ok) {
      const channelData = await channelResponse.json();
      
      // Detectar erro 403 (quota exceeded) e tentar rotacionar
      if (channelResponse.status === 403 || channelData.error?.code === 403) {
        console.log(`⚠️ API Key ${currentKeyId} esgotada. Tentando rotacionar...`);
        
        const rotated = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
        
        if (rotated) {
          return new Response(
            JSON.stringify({
              error: 'YOUTUBE_QUOTA_EXCEEDED_ROTATED',
              message: `🔄 API Key esgotada. Trocada automaticamente. Tente novamente.`,
              rotated: true,
              description: '',
              keywords: '',
              recentTitles: [],
              hasData: false
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              error: 'YOUTUBE_QUOTA_EXCEEDED',
              message: 'Todas as API Keys do YouTube esgotaram. Adicione novas em Configurações.',
              description: '',
              keywords: '',
              recentTitles: [],
              hasData: false
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      throw new Error(`YouTube API error: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = channelData.items[0];
    const description = channel.snippet.description || '';
    const keywords = channel.brandingSettings?.channel?.keywords || '';

    console.log('Channel found:', channel.snippet.title);

    // 2. Buscar últimos vídeos do canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const searchData = await searchResponse.json();
      
      // Detectar erro 403 (quota exceeded) na segunda chamada também
      if (searchResponse.status === 403 || searchData.error?.code === 403) {
        console.log(`⚠️ API Key ${currentKeyId} esgotada na busca de vídeos. Tentando rotacionar...`);
        
        const rotated = await markApiKeyAsExhaustedAndRotate(userId, currentKeyId, 'youtube', supabaseClient);
        
        if (rotated) {
          return new Response(
            JSON.stringify({
              error: 'YOUTUBE_QUOTA_EXCEEDED_ROTATED',
              message: `🔄 API Key esgotada. Trocada automaticamente. Tente novamente.`,
              rotated: true,
              description: '',
              keywords: '',
              recentTitles: [],
              hasData: false
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      throw new Error(`YouTube Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const recentTitles = searchData.items?.map((item: any) => item.snippet.title) || [];

    console.log('Found recent videos:', recentTitles.length);

    return new Response(
      JSON.stringify({
        description,
        keywords,
        recentTitles,
        channelTitle: channel.snippet.title,
        hasData: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-channel-details:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        description: '',
        keywords: '',
        recentTitles: [],
        hasData: false
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
