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
      ...validateString(body.theme, 'theme', { required: true, maxLength: 500 }),
      ...validateString(body.generationType, 'generationType', { required: true, maxLength: 50 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const theme = sanitizeString(body.theme);
    const generationType = body.generationType;
    const language = body.language;
    const aiModel = body.aiModel;

    console.log('🎯 [generate-titles] Modelo selecionado:', aiModel);
    console.log('📝 [generate-titles] Tipo de geração:', generationType);

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

    let prompt = '';

    if (generationType === 'structure') {
      prompt = `Você é um especialista em títulos virais do YouTube com foco em CTR (Click-Through Rate) e retenção.

Tema: "${theme}"
Idioma: ${languageNames[language] || language}

Gere 10 ESTRUTURAS de títulos otimizadas para viralização. Cada estrutura deve:
- Usar TÉCNICAS COMPROVADAS de copywriting (curiosidade, urgência, controvérsia, benefício claro)
- Incluir [VARIÁVEIS] onde o criador pode personalizar
- Ser adaptável para diferentes nichos
- Maximizar CTR e engajamento

ESTRATÉGIAS PARA CRIAÇÃO DE TÍTULOS:

ESTRATÉGIA 01 - ALTERAR O PERSONAGEM OU ADICIONAR UM ADJETIVO
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu sobras de porco — então o fazendeiro milionário a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu sobras de porco — então o Capataz a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 02 - CRIAR UMA VARIANTE DO TÍTULO MANTENDO A ESTRUTURA
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu água do poço — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 03 - CRIAR UM TÍTULO NOVO FUNDINDO AS DUAS ESTRATÉGIAS
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu água do poço — então o Capataz a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 04 - CRIAR UM TÍTULO NOVO E INÉDITO DO ZERO

Formato: Liste 10 estruturas numeradas, uma por linha.

Exemplo:
1. [NÚMERO CHOCANTE] [COISA SURPREENDENTE] que [RESULTADO INESPERADO]
2. Por que [AUTORIDADE] nunca [AÇÃO COMUM] (A verdade revelada)`;
    } else {
      prompt = `Você é um especialista em títulos virais do YouTube com foco em CTR (Click-Through Rate) e retenção.

Tema: "${theme}"
Idioma: ${languageNames[language] || language}

Gere 15 TÍTULOS PRONTOS altamente clickáveis e otimizados para este tema específico.

TÉCNICAS OBRIGATÓRIAS:
- Ganchos emocionais (curiosidade, medo, desejo, raiva, surpresa)
- Números e listas quando relevante
- Palavras de poder (revelado, segredo, nunca, finalmente, chocante)
- Promessa de valor clara
- Evite clickbait enganoso - seja intrigante mas honesto

ESTRATÉGIAS PARA CRIAÇÃO DE TÍTULOS:

ESTRATÉGIA 01 - ALTERAR O PERSONAGEM OU ADICIONAR UM ADJETIVO
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu sobras de porco — então o fazendeiro milionário a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu sobras de porco — então o Capataz a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 02 - CRIAR UMA VARIANTE DO TÍTULO MANTENDO A ESTRUTURA
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu água do poço — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 03 - CRIAR UM TÍTULO NOVO FUNDINDO AS DUAS ESTRATÉGIAS
Exemplo:
"Ela só pediu sobras de porco — então o fazendeiro a seguiu até em casa. O que ele viu mudou tudo."
"Ela só pediu água do poço — então o Capataz a seguiu até em casa. O que ele viu mudou tudo."

ESTRATÉGIA 04 - CRIAR UM TÍTULO NOVO E INÉDITO DO ZERO

Formato: Liste 15 títulos numerados, um por linha, SEM aspas ou formatação extra.`;
    }

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (aiModel.startsWith('claude')) {
      console.log('🔑 [generate-titles] Buscando API key ANTHROPIC_API_KEY');
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      
      if (!apiKey) {
        console.error('❌ [generate-titles] ANTHROPIC_API_KEY não encontrada');
        throw new Error('API key não configurada para Claude');
      }
      
      console.log('✅ [generate-titles] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [generate-titles] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
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
      console.log(`📦 [generate-titles] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel}`);
      
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

    console.log('🚀 [generate-titles] Enviando requisição para:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [generate-titles] Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-titles] Erro da API:', errorData);
      console.error('❌ [generate-titles] Status:', response.status);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ [generate-titles] Resposta recebida com sucesso');
    
    let titles: string[] = [];

    if (aiModel.startsWith('claude')) {
      const text = data.content[0].text;
      titles = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    } else if (aiModel.startsWith('gemini')) {
      const text = data.candidates[0].content.parts[0].text;
      titles = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    } else if (aiModel.startsWith('gpt')) {
      const text = data.choices[0].message.content;
      titles = text.split('\n').filter((line: string) => line.trim().match(/^\d+\./)).map((line: string) => line.trim());
    }

    return new Response(JSON.stringify({ titles }), {
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
