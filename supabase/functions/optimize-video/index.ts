import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, validateUrl, validateOrThrow, ValidationException } from '../_shared/validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getApiKey, getApiKeyWithHierarchicalFallback } from '../_shared/get-api-key.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getMaxTokensForModel(model: string): number {
  if (model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
    return 32000;
  }
  if (model.includes('gpt-4')) return 16384;
  if (model.includes('opus')) return 16384;
  if (model.includes('claude')) return 8192;
  if (model.includes('gemini')) return 8192;
  return 8192;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [optimize-video] Iniciando análise de vídeo');
    
    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    const userId = user?.id;
    console.log('👤 [optimize-video] User ID:', userId || 'não autenticado');
    
    const body = await req.json();
    
    // Validate inputs
    const errors = [
      ...validateUrl(body.videoUrl, 'videoUrl', true),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const videoUrl = body.videoUrl;
    const aiModel = body.aiModel;
    console.log('📝 [optimize-video] URL:', videoUrl, '| Modelo:', aiModel);

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.error('❌ [optimize-video] YOUTUBE_API_KEY não encontrada');
      throw new Error('YouTube API key não configurada');
    }
    console.log('✅ [optimize-video] YouTube API key encontrada');

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.error('❌ [optimize-video] URL inválida:', videoUrl);
      throw new Error('URL do YouTube inválida');
    }
    console.log('🎬 [optimize-video] Video ID extraído:', videoId);

    console.log('📡 [optimize-video] Buscando dados do vídeo no YouTube...');
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${youtubeApiKey}`
    );
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('❌ [optimize-video] Erro YouTube API:', videoResponse.status, errorText);
      throw new Error(`YouTube API Error: ${videoResponse.status}`);
    }
    
    const videoData = await videoResponse.json();
    console.log('✅ [optimize-video] Dados do vídeo recebidos');

    if (!videoData.items || videoData.items.length === 0) {
      console.error('❌ [optimize-video] Vídeo não encontrado');
      throw new Error('Vídeo não encontrado');
    }

    const video = videoData.items[0];
    const originalTitle = video.snippet.title;
    const originalDescription = video.snippet.description;
    const originalTags = video.snippet.tags || [];
    console.log('📊 [optimize-video] Título:', originalTitle.substring(0, 50));

    const prompt = `Analise este vídeo do YouTube e forneça sugestões de otimização para SEO:

Título: ${originalTitle}
Descrição: ${originalDescription}
Tags: ${originalTags.join(', ')}

Forneça:
1. Pontuação original (título, descrição, tags) de 0-100
2. Título otimizado com palavras-chave
3. Descrição otimizada completa com palavras-chave
4. Lista de tags sugeridas (pelo menos 20)
5. Sugestões de thumbnail
6. Nova pontuação após otimizações

Formato JSON:
{
  "original": {
    "title": "",
    "description": "",
    "score": 0,
    "titleScore": 0,
    "descriptionScore": 0,
    "tagsScore": 0
  },
  "optimized": {
    "title": "",
    "description": "",
    "tags": [],
    "thumbnailSuggestions": [],
    "score": 0,
    "titleScore": 0,
    "descriptionScore": 0,
    "tagsScore": 0
  }
}`;

    console.log('🤖 [optimize-video] Chamando IA para análise...');
    const aiResponse = await callAI(prompt, aiModel, userId, supabaseClient);
    console.log('✅ [optimize-video] Resposta da IA recebida');
    
    const start = aiResponse.indexOf('{');
    const end = aiResponse.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      console.error('❌ [optimize-video] JSON inválido na resposta');
      throw new Error('Resposta da IA não retornou JSON válido');
    }
    const jsonStr = aiResponse.slice(start, end + 1);
    const result = JSON.parse(jsonStr);
    
    result.original.title = originalTitle;
    result.original.description = originalDescription;

    console.log('✅ [optimize-video] Análise concluída com sucesso');
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof ValidationException) {
      console.error('❌ [optimize-video] Erro de validação:', error.errors);
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('❌ [optimize-video] Erro geral:', error.message, error.stack);
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

async function callAI(prompt: string, model: string, userId: string | undefined, supabaseClient: any): Promise<string> {
  if (model.startsWith('claude')) {
    console.log('🔑 [optimize-video] Buscando API key do Claude...');
    
    // Tenta buscar do banco de dados do usuário
    let apiKey: string | null = null;
    if (userId) {
      const userKeyData = await getApiKey(userId, 'claude', supabaseClient);
      if (userKeyData) {
        apiKey = userKeyData.key;
        console.log('✅ [optimize-video] Usando chave do usuário do banco de dados');
      }
    }
    
    // Se não encontrar no banco, usa o secret do ambiente
    if (!apiKey) {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || null;
      if (apiKey) {
        console.log('✅ [optimize-video] Usando chave do secret do Supabase');
      }
    }
    
    if (!apiKey) {
      console.error('❌ [optimize-video] Nenhuma API key encontrada para Claude');
      throw new Error('API key não configurada para Claude. Por favor, adicione uma chave nas Configurações.');
    }
    
    console.log('✅ [optimize-video] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
    
    const modelMap: Record<string, string> = {
      'claude-sonnet-4.5': 'claude-sonnet-4-5',
      'claude-sonnet-4': 'claude-sonnet-4-0',
      'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
      'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
    };
    const finalModel = modelMap[model] || 'claude-sonnet-4-5';
    console.log('📦 [optimize-video] Modelo da API:', finalModel);

    console.log('🚀 [optimize-video] Enviando requisição para Anthropic API');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalModel,
        max_tokens: getMaxTokensForModel(finalModel),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('📨 [optimize-video] Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [optimize-video] Erro da API:', errorData);
      
      // Tratamento específico para erro 401 (chave inválida)
      if (response.status === 401) {
        throw new Error('A chave API do Claude é inválida ou expirou. Por favor, verifique a chave nas configurações ou use outro modelo de IA (Gemini ou GPT).');
      }
      
      // Tratamento específico para erro 429 (rate limit/quota)
      if (response.status === 429) {
        let errorMessage = 'A chave API do Claude atingiu o limite de requisições ou quota esgotada.';
        
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message) {
            errorMessage += ` Detalhes: ${errorJson.error.message}`;
          }
        } catch {
          // Se não conseguir parsear, usa a mensagem padrão
        }
        
        errorMessage += ' Por favor, tente novamente em alguns minutos ou use outro modelo de IA (Gemini ou GPT).';
        throw new Error(errorMessage);
      }
      
      throw new Error(`Claude API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [optimize-video] Resposta recebida com sucesso');
    return data.content[0].text;
  } else if (model.startsWith('gemini')) {
    console.log('🔑 [optimize-video] Buscando API key do Gemini com fallback hierárquico...');
    
    let keyData = null;
    if (userId) {
      keyData = await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabaseClient);
    }
    
    if (!keyData) {
      const globalKey = Deno.env.get('GEMINI_API_KEY');
      if (globalKey) {
        keyData = { key: globalKey, provider: 'gemini', keyId: 'global' };
        console.log('✅ [optimize-video] Usando chave global Gemini');
      }
    }
    
    if (!keyData) {
      console.error('❌ [optimize-video] Nenhuma API key encontrada para Gemini');
      throw new Error('API key não configurada para Gemini. Por favor, adicione uma chave nas Configurações.');
    }

    console.log(`✅ [optimize-video] Usando ${keyData.provider}`);
    
    const { url, headers, body } = await buildGeminiOrVertexRequest(
      keyData,
      model.replace('gemini-', 'gemini-2.0-flash-exp'), // Map model
      prompt,
      false
    );

    console.log('🚀 [optimize-video] Enviando requisição para', keyData.provider);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    console.log('📨 [optimize-video] Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [optimize-video] Erro da API:', errorData);
      
      // Tratamento específico para erro 401 (chave inválida)
      if (response.status === 401 || response.status === 403) {
        throw new Error('A chave API do Gemini é inválida ou expirou. Por favor, verifique a chave nas configurações ou use outro modelo de IA (Claude ou GPT).');
      }
      
      // Tratamento específico para erro 429 (rate limit/quota)
      if (response.status === 429) {
        let errorMessage = 'A chave API do Gemini atingiu o limite de requisições ou quota esgotada.';
        
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message) {
            errorMessage += ` Detalhes: ${errorJson.error.message}`;
          }
        } catch {
          // Se não conseguir parsear, usa a mensagem padrão
        }
        
        errorMessage += ' Por favor, tente novamente em alguns minutos ou use outro modelo de IA (Claude ou GPT).';
        throw new Error(errorMessage);
      }
      
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [optimize-video] Resposta recebida com sucesso');
    return data.candidates[0].content.parts[0].text;
  } else {
    console.log('🔑 [optimize-video] Buscando API key do OpenAI...');
    
    // Tenta buscar do banco de dados do usuário
    let apiKey: string | null = null;
    if (userId) {
      const userKeyData = await getApiKey(userId, 'openai', supabaseClient);
      if (userKeyData) {
        apiKey = userKeyData.key;
        console.log('✅ [optimize-video] Usando chave do usuário do banco de dados');
      }
    }
    
    // Se não encontrar no banco, usa o secret do ambiente
    if (!apiKey) {
      apiKey = Deno.env.get('OPENAI_API_KEY') || null;
      if (apiKey) {
        console.log('✅ [optimize-video] Usando chave do secret do Supabase');
      }
    }
    
    if (!apiKey) {
      console.error('❌ [optimize-video] Nenhuma API key encontrada para OpenAI');
      throw new Error('API key não configurada para OpenAI. Por favor, adicione uma chave nas Configurações.');
    }
    console.log('✅ [optimize-video] OpenAI API key encontrada');
    console.log('📦 [optimize-video] Modelo:', model);

    console.log('🚀 [optimize-video] Enviando requisição para OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        ...(model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')
          ? { max_completion_tokens: getMaxTokensForModel(model) }
          : { max_tokens: getMaxTokensForModel(model) }
        )
      })
    });

    console.log('📨 [optimize-video] Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [optimize-video] Erro da API:', errorData);
      
      // Tratamento específico para erro 401 (chave inválida)
      if (response.status === 401) {
        throw new Error('A chave API do OpenAI é inválida ou expirou. Por favor, verifique a chave nas configurações ou use outro modelo de IA (Claude ou Gemini).');
      }
      
      // Tratamento específico para erro 429 (rate limit/quota)
      if (response.status === 429) {
        let errorMessage = 'A chave API do OpenAI atingiu o limite de requisições ou quota esgotada.';
        
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message) {
            errorMessage += ` Detalhes: ${errorJson.error.message}`;
          }
        } catch {
          // Se não conseguir parsear, usa a mensagem padrão
        }
        
        errorMessage += ' Por favor, tente novamente em alguns minutos ou use outro modelo de IA (Claude ou Gemini).';
        throw new Error(errorMessage);
      }
      
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [optimize-video] Resposta recebida com sucesso');
    return data.choices[0].message.content;
  }
}
