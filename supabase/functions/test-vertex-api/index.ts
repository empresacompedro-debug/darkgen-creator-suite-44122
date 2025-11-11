import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getVertexAccessToken } from '../_shared/vertex-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceAccountJson, projectId, location } = await req.json();

    if (!serviceAccountJson || !projectId || !location) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Service Account JSON, Project ID e Location são obrigatórios',
          errorType: 'missing_params'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🧪 [Test Vertex AI] Testando credenciais para projeto: ${projectId}`);

    // 1. Tentar gerar access token
    let accessToken: string;
    try {
      accessToken = await getVertexAccessToken(serviceAccountJson);
      console.log('✅ [Test Vertex AI] Access token gerado com sucesso');
    } catch (error: any) {
      console.error('❌ [Test Vertex AI] Erro ao gerar access token:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: `Erro de autenticação: ${error.message}`,
          errorType: 'auth_error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 2. Fazer chamada de teste ao Vertex AI (listar modelos disponíveis)
    const testUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
    
    console.log(`🔍 [Test Vertex AI] Fazendo chamada de teste para: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Test Vertex AI] Erro na chamada de teste (${response.status}):`, errorText);

      // Análise detalhada do erro
      let errorMessage = 'Erro ao validar credenciais';
      let errorType = 'api_error';

      if (response.status === 403) {
        errorMessage = 'Permissões insuficientes. Verifique se a API Vertex AI está habilitada e se o Service Account tem permissões adequadas.';
        errorType = 'permission_denied';
      } else if (response.status === 404) {
        errorMessage = 'Projeto ou região não encontrados. Verifique o Project ID e Location.';
        errorType = 'not_found';
      } else if (response.status === 401) {
        errorMessage = 'Credenciais inválidas. Verifique o Service Account JSON.';
        errorType = 'invalid_credentials';
      }

      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: errorMessage,
          errorType,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const data = await response.json();
    console.log('✅ [Test Vertex AI] Credenciais validadas com sucesso');
    console.log(`📊 [Test Vertex AI] Modelos disponíveis: ${data.models?.length || 0}`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Credenciais Vertex AI válidas e funcionando!',
        modelsCount: data.models?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [Test Vertex AI] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: `Erro inesperado: ${error.message}`,
        errorType: 'unexpected_error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
