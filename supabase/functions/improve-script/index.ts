import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeWithKeyRotation } from '../_shared/get-api-key.ts';
import { validateString, validateArray, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Validate inputs
    const errors = [
      ...validateString(body.script, 'script', { required: true, maxLength: 50000 }),
      ...validateArray(body.weaknesses, 'weaknesses', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const script = sanitizeString(body.script);
    const weaknesses = body.weaknesses;
    const aiModel = body.aiModel;

    console.log('🔧 Melhorando roteiro com modelo:', aiModel);

    const weaknessesList = weaknesses.map((w: any) => 
      `- ${w.part}: ${w.issue} (Sugestão: ${w.suggestion})`
    ).join('\n');

    const prompt = `Você é um roteirista profissional especializado em conteúdo viral do YouTube.

ROTEIRO ORIGINAL:
${script}

PONTOS FRACOS IDENTIFICADOS:
${weaknessesList}

TAREFA: Reescreva SOMENTE as partes mencionadas acima, corrigindo os problemas identificados e aplicando as sugestões.

REGRAS:
- Mantenha a estrutura geral do roteiro
- Reescreva APENAS as partes problemáticas
- Use técnicas de alta retenção e storytelling
- Mantenha o mesmo tom e estilo do roteiro original
- Retorne o roteiro COMPLETO com as partes melhoradas integradas

Retorne o roteiro completo melhorado:`;

    let provider: 'gemini' | 'claude' | 'openai' = 'claude';
    if (aiModel.startsWith('gemini')) provider = 'gemini';
    if (aiModel.startsWith('gpt')) provider = 'openai';

    const improvedScript = await executeWithKeyRotation(
      userId,
      provider,
      supabaseClient,
      async (apiKey) => {
        let apiUrl = '';
        let requestBody: any = {};

        if (aiModel.startsWith('claude')) {
          apiUrl = 'https://api.anthropic.com/v1/messages';
          const modelMap: Record<string, string> = {
            'claude-sonnet-4-5': 'claude-sonnet-4-5',
            'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
            'claude-sonnet-4': 'claude-sonnet-4-20250514',
            'claude-sonnet-3.5': 'claude-sonnet-4-5'
          };
          requestBody = {
            model: modelMap[aiModel] || 'claude-sonnet-4-5',
            max_tokens: 16000,
            messages: [{ role: 'user', content: prompt }]
          };
        } else if (aiModel.startsWith('gemini')) {
          const modelMap: Record<string, string> = {
            'gemini-2.5-pro': 'gemini-2.0-flash-exp',
            'gemini-2.5-flash': 'gemini-2.0-flash-exp',
            'gemini-2.5-flash-lite': 'gemini-1.5-flash'
          };
          const finalModel = modelMap[aiModel] || 'gemini-2.0-flash-exp';
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`;
          requestBody = {
            contents: [{ parts: [{ text: prompt }] }]
          };
        } else if (aiModel.startsWith('gpt')) {
          apiUrl = 'https://api.openai.com/v1/chat/completions';
          requestBody = {
            model: aiModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 16000
          };
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
          console.error('❌ Erro da API:', errorData);
          
          if (response.status === 429) {
            throw { status: 429, message: 'Quota exceeded' };
          }
          
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (aiModel.startsWith('claude')) {
          return data.content[0].text;
        } else if (aiModel.startsWith('gemini')) {
          return data.candidates[0].content.parts[0].text;
        } else {
          return data.choices[0].message.content;
        }
      }
    );

    return new Response(JSON.stringify({ improvedScript }), {
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
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
