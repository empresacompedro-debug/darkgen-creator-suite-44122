import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey } from '../_shared/get-api-key.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Extract userId from JWT
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log('No authenticated user, using global key');
      }
    }

    // Get YouTube API Key (prioritizes user's key)
    const apiKeyResult = await getApiKey(userId, 'youtube', supabaseClient);
    if (!apiKeyResult) {
      throw new Error('YouTube API key not configured');
    }
    
    const apiKey = apiKeyResult.key;
    const keyPrefix = apiKey.substring(0, 12);

    console.log('Testing YouTube API key:', keyPrefix + '...');

    // Make a simple YouTube API call to test
    const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('API test error:', data);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: data.error?.message || 'API key invalid',
          keyPrefix 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('API key valid');

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'API key is working correctly!',
        keyPrefix
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in test-youtube-api:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
