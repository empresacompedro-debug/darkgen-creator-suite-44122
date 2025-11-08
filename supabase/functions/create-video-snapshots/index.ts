import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Não autenticado');
    }

    const { monitorId } = await req.json();

    if (!monitorId) {
      throw new Error('monitorId é obrigatório');
    }

    // Buscar vídeos monitorados do concorrente
    const { data: videos, error: videosError } = await supabaseClient
      .from('monitored_videos')
      .select('*')
      .eq('monitor_id', monitorId)
      .eq('user_id', user.id);

    if (videosError) throw videosError;

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum vídeo encontrado para snapshot' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar snapshots para cada vídeo
    const snapshots = videos.map(video => ({
      video_id: video.video_id,
      monitor_id: video.monitor_id,
      user_id: user.id,
      view_count: video.view_count,
      like_count: video.like_count,
      comment_count: video.comment_count,
      vph: video.vph,
      snapshot_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseClient
      .from('video_snapshots')
      .insert(snapshots);

    if (insertError) throw insertError;

    console.log(`✅ ${snapshots.length} snapshots criados para monitor ${monitorId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        snapshotsCreated: snapshots.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-video-snapshots:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
