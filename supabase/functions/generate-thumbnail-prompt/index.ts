import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

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
      ...validateString(body.videoTitle, 'videoTitle', { required: true, maxLength: 500 }),
      ...validateString(body.platform, 'platform', { required: true, maxLength: 100 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const videoTitle = sanitizeString(body.videoTitle);
    const platform = body.platform;
    const language = body.language;
    const includePhrase = body.includePhrase;
    const aiModel = body.aiModel;

    console.log('🎯 [generate-thumbnail-prompt] Modelo selecionado:', aiModel);

    const prompt = `Você é um especialista em criar prompts para thumbnails de YouTube otimizados para ${platform}.

TÍTULO DO VÍDEO: ${videoTitle}

CONFIGURAÇÕES:
- Plataforma: ${platform}
- Idioma: ${language}
${includePhrase ? '- Incluir frase impactante na imagem' : ''}

INSTRUÇÕES:
1. Crie um prompt EXTREMAMENTE DETALHADO para gerar uma thumbnail atraente
2. O prompt deve ser escrito EM INGLÊS, independente do idioma escolhido
3. A thumbnail deve ser visualmente impactante e chamar atenção
4. Use cores vibrantes e contrastes fortes
5. Otimize para ${platform}
6. Seja muito específico sobre: composição, iluminação, cores, estilo visual, elementos gráficos
7. Descreva detalhes de textura, profundidade, perspectiva e atmosfera
${includePhrase ? '8. Inclua sugestão de texto/frase para adicionar na imagem' : ''}

IMPORTANTE: O prompt final deve ser EM INGLÊS e com descrições visuais ricas e detalhadas.

Gere o prompt agora:`;

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (aiModel.startsWith('claude')) {
      console.log('🔑 [generate-thumbnail-prompt] Buscando API key ANTHROPIC_API_KEY');
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      
      if (!apiKey) {
        console.error('❌ [generate-thumbnail-prompt] ANTHROPIC_API_KEY não encontrada');
        throw new Error('API key não configurada para Claude');
      }
      
      console.log('✅ [generate-thumbnail-prompt] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [generate-thumbnail-prompt] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
      requestBody = {
        model: finalModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      };
    } else if (aiModel.startsWith('gemini')) {
      apiKey = Deno.env.get('GEMINI_API_KEY') || '';
      const modelMap: Record<string, string> = {
        'gemini-2.5-pro': 'gemini-2.0-flash-exp',
        'gemini-2.5-flash': 'gemini-2.0-flash-exp',
        'gemini-2.5-flash-lite': 'gemini-1.5-flash'
      };
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelMap[aiModel] || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
      };
    } else if (aiModel.startsWith('gpt')) {
      apiKey = Deno.env.get('OPENAI_API_KEY') || '';
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      const isReasoningModel = aiModel.startsWith('gpt-5') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(aiModel);
      console.log(`📦 [generate-thumbnail-prompt] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel}`);
      
      requestBody = {
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        ...(isReasoningModel 
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }
        )
      };
    }

    if (!apiKey) {
      throw new Error(`API key não configurada para ${aiModel}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (aiModel.startsWith('claude')) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (aiModel.startsWith('gpt')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log('🚀 [generate-thumbnail-prompt] Enviando requisição para:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [generate-thumbnail-prompt] Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-thumbnail-prompt] Erro da API:', errorData);
      console.error('❌ [generate-thumbnail-prompt] Status:', response.status);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let promptResult = '';

    if (aiModel.startsWith('claude')) {
      promptResult = data.content[0].text;
    } else if (aiModel.startsWith('gemini')) {
      promptResult = data.candidates[0].content.parts[0].text;
    } else if (aiModel.startsWith('gpt')) {
      promptResult = data.choices[0].message.content;
    }

    return new Response(JSON.stringify({ prompt: promptResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof ValidationException) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
