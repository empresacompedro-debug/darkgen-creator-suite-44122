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
      ...validateString(body.title, 'title', { required: true, maxLength: 500 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const title = sanitizeString(body.title);
    const language = body.language;
    const aiModel = body.aiModel;
    const includeCTA = body.includeCTA;

    console.log('🎯 [optimize-description] Modelo selecionado:', aiModel);

    const languageMap: Record<string, string> = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (US)',
      'es-ES': 'Español (España)',
      'fr-FR': 'Français (France)',
      'de-DE': 'Deutsch (Deutschland)',
      'it-IT': 'Italiano (Italia)',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'ro-RO': 'Română',
      'pl-PL': 'Polski'
    };

    const prompt = `Otimize este título de vídeo para SEO do YouTube:

Título: ${title}
Idioma: ${languageMap[language]}
${includeCTA ? 'Incluir CTA na descrição' : ''}

Forneça uma otimização completa incluindo:
1. Análise de potencial (pontuações de 0-100):
   - SEO Score
   - Potencial de Alcance
   - Potencial de Engajamento

2. Descrição otimizada (estruturada com tópicos, perguntas frequentes, ${includeCTA ? 'CTA,' : ''} aviso legal)

3. Tags recomendadas (pelo menos 20 tags relevantes)

4. Frases para thumbnail (5 opções com pontuação CTR de 0-100 cada)

Formato JSON:
{
  "seoScore": 0,
  "reachPotential": 0,
  "engagementPotential": 0,
  "description": "",
  "tags": [],
  "thumbnailPhrases": [
    {"text": "", "ctrScore": 0}
  ]
}`;

    const resultText = await callAI(prompt, aiModel);
    const start = resultText.indexOf('{');
    const end = resultText.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('Resposta da IA não retornou JSON válido');
    }
    const jsonStr = resultText.slice(start, end + 1);
    const parsedResult = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsedResult), {
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

async function callAI(prompt: string, model: string): Promise<string> {
  if (model.startsWith('claude')) {
    console.log('🔑 [optimize-description] Buscando API key ANTHROPIC_API_KEY');
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      console.error('❌ [optimize-description] ANTHROPIC_API_KEY não encontrada');
      throw new Error('API key não configurada para Claude');
    }
    
    console.log('✅ [optimize-description] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
    
    const modelMap: Record<string, string> = {
      'claude-sonnet-4.5': 'claude-sonnet-4-5',
      'claude-sonnet-4': 'claude-sonnet-4-0',
      'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
      'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
    };
    const finalModel = modelMap[model] || 'claude-sonnet-4-5';
    console.log('📦 [optimize-description] Modelo da API:', finalModel);

    console.log('🚀 [optimize-description] Enviando requisição para Anthropic API');
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

    console.log('📨 [optimize-description] Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [optimize-description] Erro da API:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [optimize-description] Resposta recebida com sucesso');
    return data.content[0].text;
  } else if (model.startsWith('gemini')) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const modelMap: Record<string, string> = {
      'gemini-2.5-pro': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash-lite': 'gemini-1.5-flash'
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelMap[model] || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } else {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
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

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
