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
      ...validateString(body.niche, 'niche', { required: true, maxLength: 200 }),
      ...validateString(body.subNiche, 'subNiche', { maxLength: 200 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const niche = sanitizeString(body.niche);
    const subNiche = body.subNiche ? sanitizeString(body.subNiche) : undefined;
    const language = body.language;
    const aiModel = body.aiModel;

    const languageNames: Record<string, string> = {
      pt: 'português brasileiro',
      en: 'English',
      es: 'español',
      fr: 'français',
      de: 'Deutsch',
      it: 'italiano',
      ja: '日本語',
      ko: '한국어',
      ro: 'română',
      pl: 'polski'
    };

    const prompt = `Você é um especialista em criação de conteúdo viral para YouTube. 

Gere 10 ideias de vídeos ALTAMENTE VIRAIS e envolventes para um canal de YouTube no nicho: "${niche}"${subNiche ? `, com foco em: "${subNiche}"` : ''}.

REQUISITOS:
- Cada ideia deve ser ÚNICA e ESPECÍFICA
- Foque em temas que geram ALTA RETENÇÃO e ENGAJAMENTO
- Use títulos curiosos, controversos ou intrigantes
- Adapte para o idioma: ${languageNames[language] || language}
- Pense em temas que as pessoas PRECISAM clicar para descobrir

Formato: Liste as 10 ideias numeradas (1-10), uma por linha, sem explicações adicionais.`;

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (aiModel.startsWith('claude')) {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [brainstorm-ideas] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
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
      console.log(`📦 [brainstorm-ideas] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel}`);
      
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let ideas: string[] = [];

    if (aiModel.startsWith('claude')) {
      const text = data.content[0].text;
      ideas = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    } else if (aiModel.startsWith('gemini')) {
      const text = data.candidates[0].content.parts[0].text;
      ideas = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    } else if (aiModel.startsWith('gpt')) {
      const text = data.choices[0].message.content;
      ideas = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    }

    return new Response(JSON.stringify({ ideas }), {
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
