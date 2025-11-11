import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey, updateApiKeyUsage, markApiKeyAsExceeded, getApiKeyWithHierarchicalFallback } from '../_shared/get-api-key.ts';
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';
import { mapModelToProvider } from '../_shared/model-mapper.ts';

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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    let userId: string | undefined;
    try {
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    } catch (error) {
      console.log('No authenticated user');
    }

    const body = await req.json();
    
    // Validate inputs - aumentado para suportar roteiros muito longos (11+ horas)
    const errors = [
      ...validateString(body.script, 'script', { required: true, maxLength: 500000 }),
      ...validateString(body.niche, 'niche', { required: true, maxLength: 200 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const script = sanitizeString(body.script);
    const niche = sanitizeString(body.niche);
    const aiModel = body.aiModel;

    console.log('🎯 Analisando roteiro com modelo:', aiModel);

    const prompt = `Você é um analista especializado em conteúdo viral do YouTube. Analise o roteiro abaixo e forneça uma avaliação detalhada.

NICHO: ${niche}

ROTEIRO:
${script}

Avalie o roteiro nos seguintes critérios e retorne APENAS um JSON válido (sem markdown, sem \`\`\`json):
{
  "overall": 85,
  "retention": 88,
  "clarity": 90,
  "viral": 82,
  "weaknesses": [
    {"part": "Parte 2", "issue": "Falta gancho emocional forte", "suggestion": "Adicione uma história pessoal ou estatística impactante"}
  ],
  "improvements": "Texto com sugestões gerais de melhoria"
}

Critérios:
- overall (0-100): Pontuação geral do roteiro
- retention (0-100): Potencial de retenção (ganchos, storytelling, ritmo)
- clarity (0-100): Clareza da mensagem
- viral (0-100): Potencial viral baseado no nicho
- weaknesses: Array de pontos fracos com parte específica, problema e sugestão
- improvements: Texto com sugestões gerais

Retorne SOMENTE o JSON, sem nenhum texto adicional.`;

    // Usar helper para mapear modelo → provider
    const { provider: providerKey, model: actualModel } = mapModelToProvider(aiModel);

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};
    let provider: 'gemini' | 'claude' | 'openai' | 'vertex-ai' = providerKey;

    if (providerKey === 'claude') {
      const apiKeyResult = await getApiKey(userId, 'claude', supabaseClient);
      if (!apiKeyResult || !apiKeyResult.key) {
        throw new Error('API key não configurada para Claude');
      }
      apiKey = apiKeyResult.key;
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4-5': 'claude-sonnet-4-5',
        'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-4': 'claude-sonnet-4-20250514',
        'claude-sonnet-3.5': 'claude-sonnet-4-5'
      };
      const finalModel = modelMap[actualModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [analyze-script] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
      requestBody = {
        model: finalModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      };
    } else if (providerKey === 'gemini' || providerKey === 'vertex-ai') {
      const apiKeyResult = providerKey === 'vertex-ai'
        ? await getApiKey(userId, 'vertex-ai', supabaseClient)
        : await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabaseClient);
      
      if (!apiKeyResult) {
        throw new Error('API key não configurada para Gemini/Vertex AI');
      }
      
      const { url, headers: apiHeaders, body } = await buildGeminiOrVertexRequest(apiKeyResult, actualModel, prompt, false);
      apiUrl = url;
      requestBody = body;
      
      // Se for Gemini normal, extrair a key da URL
      if (providerKey === 'gemini') {
        apiKey = apiKeyResult.key;
      }
      
      console.log(`📦 [analyze-script] Usando ${providerKey === 'vertex-ai' ? 'Vertex AI' : 'Gemini'} - modelo: ${actualModel}`);
    } else if (providerKey === 'openai') {
      const apiKeyResult = await getApiKey(userId, 'openai', supabaseClient);
      if (!apiKeyResult || !apiKeyResult.key) {
        throw new Error('API key não configurada para OpenAI');
      }
      apiKey = apiKeyResult.key;
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      const isReasoningModel = actualModel.startsWith('gpt-5') || actualModel.startsWith('o3-') || actualModel.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(actualModel);
      console.log(`📦 [analyze-script] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${actualModel}`);
      
      requestBody = {
        model: actualModel,
        messages: [{ role: 'user', content: prompt }],
        ...(isReasoningModel 
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }
        )
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (providerKey === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (providerKey === 'openai') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro da API:', errorData);
      
      if (response.status === 429) {
        await markApiKeyAsExceeded(userId, provider, supabaseClient);
        return new Response(
          JSON.stringify({ error: 'Quota esgotada' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let analysis = '';

    if (providerKey === 'claude') {
      analysis = data.content[0].text;
    } else if (providerKey === 'gemini' || providerKey === 'vertex-ai') {
      analysis = data.candidates[0].content.parts[0].text;
    } else if (providerKey === 'openai') {
      analysis = data.choices[0].message.content;
    }

    // Limpar markdown se existir
    analysis = analysis.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('📄 Resposta bruta do Claude:', analysis.substring(0, 500));

    await updateApiKeyUsage(userId, provider, supabaseClient);

    // Tentar parsear o JSON com melhor tratamento de erro
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError: any) {
      console.error('❌ Erro ao parsear JSON:', parseError.message);
      console.error('📄 Conteúdo recebido:', analysis);
      return new Response(JSON.stringify({ 
        error: 'Falha ao processar resposta da IA',
        details: `A IA retornou texto inválido. Por favor, tente novamente.`,
        rawResponse: analysis.substring(0, 200)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ analysis: parsedAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof ValidationException) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('❌ ERRO:', error);
    console.error('❌ Stack trace:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
