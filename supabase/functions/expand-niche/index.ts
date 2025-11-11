import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeWithKeyRotation } from '../_shared/get-api-key.ts';
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';
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
    const body = await req.json();
    
    // Validate inputs
    const errors = [
      ...validateString(body.mainNiche, 'mainNiche', { required: true, maxLength: 200 }),
      ...validateString(body.language, 'language', { maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const mainNiche = sanitizeString(body.mainNiche);
    const language = body.language || 'Português';
    let aiModel = body.aiModel || 'claude-sonnet-4.5';
    
    // Validação: força modelos válidos (apenas Claude Sonnet 4.5, 4, 3.7, Gemini e GPT-4o)
    const validModels = ['claude-sonnet-4.5', 'claude-sonnet-4', 'claude-sonnet-3.7', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gpt-4o'];
    if (!validModels.includes(aiModel)) {
      console.warn(`⚠️ Modelo inválido recebido: ${aiModel}. Usando padrão: claude-sonnet-4.5`);
      aiModel = 'claude-sonnet-4.5';
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    let userId: string | undefined;
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.log('No authenticated user');
    }

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Expanding niche: "${mainNiche}" in ${language}`);

    const prompt = `Você é um especialista em análise de nichos para YouTube.
...
Retorne em formato JSON VÁLIDO (sem markdown):
{
  "nivel_detectado": "amplo|sub-nicho|micro-nicho",
  "lista_1": {
    "titulo": "Nichos|Micro-nichos|Ultra-específicos",
    "descricao": "Breve descrição do que essa lista representa",
    "items": ["Item 1", "Item 2", ... 200 items]
  },
  "lista_2": {
    "titulo": "Micro-nichos|Ultra-específicos|Ângulos únicos",
    "descricao": "Breve descrição do que essa lista representa",
    "items": ["Item 1", "Item 2", ... 200 items]
  }
}`;

    const { provider: providerKey, model: actualModel } = mapModelToProvider(aiModel);

    const result = await executeWithKeyRotation(
      userId,
      providerKey,
      supabaseClient,
      async (apiKey) => {
        let apiUrl = '';
        let requestBody: any = {};

        if (providerKey === 'claude') {
          apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
        'claude-sonnet-4': 'claude-sonnet-4-20250514',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
          const finalModel = modelMap[actualModel] || 'claude-sonnet-4-5';
          const maxTokens = getMaxTokensForModel(finalModel);
          console.log(`📦 [expand-niche] Usando ${maxTokens} max_tokens para ${finalModel}`);
          
          requestBody = {
            model: finalModel,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
          };
        } else if (providerKey === 'gemini' || providerKey === 'vertex-ai') {
          // Modelos Gemini: usar API v1 para 2.5 e v1beta com -latest para 1.5
          let geminiModel: string;
          
          if (actualModel === 'gemini-2.5-pro' || actualModel === 'gemini-2.5-flash') {
            // Modelos 2.5: usar API v1
            geminiModel = actualModel;
            apiUrl = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`;
            console.log(`🔄 Usando API v1 para ${actualModel}`);
          } else {
            // Modelos 1.5: usar API v1beta com sufixo -latest
            const modelMap: Record<string, string> = {
              'gemini-2.5-flash-lite': 'gemini-1.5-flash-8b-latest'
            };
            geminiModel = modelMap[actualModel] || 'gemini-1.5-flash-latest';
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
            console.log(`🔄 Usando API v1beta para ${actualModel} → ${geminiModel}`);
          }
          
          requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 16000
            }
          };
        } else if (providerKey === 'openai') {
          apiUrl = 'https://api.openai.com/v1/chat/completions';
          const isReasoningModel = actualModel.startsWith('gpt-5') || actualModel.startsWith('o3-') || actualModel.startsWith('o4-');
          const maxTokens = getMaxTokensForModel(actualModel);
          console.log(`📦 [expand-niche] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${actualModel}`);
          
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

        const aiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            throw { status: 429, message: 'Quota exceeded' };
          }
          
          throw new Error(`Erro na API de IA: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let resultText = '';

        if (providerKey === 'claude') {
          resultText = aiData.content[0].text;
        } else if (providerKey === 'gemini' || providerKey === 'vertex-ai') {
          resultText = aiData.candidates[0].content.parts[0].text;
        } else if (providerKey === 'openai') {
          resultText = aiData.choices[0].message.content;
        }
        
        resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(resultText);
      }
    );

    if (!result.nivel_detectado || !result.lista_1 || !result.lista_2) {
      throw new Error('Resposta da IA em formato inválido');
    }

    if (!Array.isArray(result.lista_1.items) || !Array.isArray(result.lista_2.items)) {
      throw new Error('Listas devem ser arrays');
    }

    console.log(`Generated ${result.lista_1.items.length} + ${result.lista_2.items.length} items`);

    await supabaseClient.from('niche_expansions').insert({
      user_id: userId,
      main_niche: mainNiche,
      nivel_detectado: result.nivel_detectado,
      lista_1: result.lista_1,
      lista_2: result.lista_2,
      language,
      ai_model: aiModel,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expand-niche:', error instanceof Error ? error.name : 'Unknown');
    
    // Handle validation errors
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generic error for security
    return new Response(
      JSON.stringify({ error: 'An error occurred while expanding niche' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});