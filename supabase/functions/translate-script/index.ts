import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, validateArray, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

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
      ...validateString(body.script, 'script', { required: true, maxLength: 50000 }),
      ...validateArray(body.targetLanguages, 'targetLanguages', { required: true, minLength: 1, maxLength: 20 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const script = sanitizeString(body.script);
    const { targetLanguages, aiModel } = body;

    console.log('🎯 [translate-script] Modelo selecionado:', aiModel);
    console.log('🌍 [translate-script] Idiomas alvo:', targetLanguages);

    const languageNames: Record<string, string> = {
      pt: 'Português Brasileiro',
      en: 'English (US)',
      es: 'Español (España)',
      fr: 'Français (France)',
      de: 'Deutsch (Alemanha)',
      it: 'Italiano (Italia)',
      ja: '日本語 (Japão)',
      ko: '한국어 (Coréia do Sul)',
      ro: 'Română (România)',
      pl: 'Polski (Polska)'
    };

    const translations: Record<string, string> = {};

    for (const targetLang of targetLanguages) {
      const prompt = `Você é um tradutor profissional especializado em roteiros de YouTube.

Traduza o seguinte roteiro para ${languageNames[targetLang] || targetLang}.

REGRAS IMPORTANTES:
- Mantenha o tom, emoção e intenção original
- Adapte expressões idiomáticas para o idioma alvo (não traduza literalmente)
- Preserve formatações como [marcações de tempo], [sugestões visuais]
- Mantenha a estrutura e quebras de parágrafo
- Use linguagem natural e fluente, não robótica
- Adapte culturalmente quando necessário

ROTEIRO ORIGINAL:
${script}

TRADUÇÃO PARA ${languageNames[targetLang] || targetLang}:`;

      let apiUrl = '';
      let apiKey = '';
      let requestBody: any = {};

      if (aiModel.startsWith('claude')) {
        console.log(`🔑 [translate-script] Buscando API key ANTHROPIC_API_KEY para ${targetLang}`);
        apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
        
        if (!apiKey) {
          console.error('❌ [translate-script] ANTHROPIC_API_KEY não encontrada');
          throw new Error('API key não configurada para Claude');
        }
        
        console.log('✅ [translate-script] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
        
        apiUrl = 'https://api.anthropic.com/v1/messages';
        const modelMap: Record<string, string> = {
          'claude-sonnet-4-5': 'claude-sonnet-4-20250514',
          'claude-sonnet-4.5': 'claude-sonnet-4-20250514',
          'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
          'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514'
        };
        const finalModel = modelMap[aiModel] || 'claude-sonnet-4-20250514';
        console.log(`🤖 [translate-script] Modelo mapeado: ${aiModel} → ${finalModel}`);
        const maxTokens = getMaxTokensForModel(finalModel);
        console.log(`📦 [translate-script] Usando ${maxTokens} max_tokens para ${finalModel} (${targetLang})`);
        
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
        console.log(`📦 [translate-script] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel} (${targetLang})`);
        
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

      console.log(`🚀 [translate-script] Enviando requisição para ${targetLang}:`, apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      console.log(`📨 [translate-script] Status da resposta (${targetLang}):`, response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ [translate-script] Erro da API (${targetLang}):`, errorData);
        console.error(`❌ [translate-script] Status (${targetLang}):`, response.status);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      if (aiModel.startsWith('claude')) {
        translations[targetLang] = data.content[0].text;
      } else if (aiModel.startsWith('gemini')) {
        translations[targetLang] = data.candidates[0].content.parts[0].text;
      } else if (aiModel.startsWith('gpt')) {
        translations[targetLang] = data.choices[0].message.content;
      }
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ [translate-script] Erro:', error.name);
    console.error('❌ [translate-script] Mensagem:', error.message);
    console.error('❌ [translate-script] Stack:', error.stack);
    
    // Handle validation errors
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Return detailed error for debugging
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while translating script',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
