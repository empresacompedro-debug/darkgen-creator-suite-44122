import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair userId do header Authorization
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }
    
    console.log(`👤 [brainstorm-ideas] User ID: ${userId || 'Nenhum'}`);
    
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
      console.log(`🔑 [brainstorm-ideas] Buscando API key Anthropic`);
      
      // Buscar chave do usuário primeiro
      if (userId) {
        const { data: keys } = await supabase
          .from('user_api_keys')
          .select('id, api_key_encrypted')
          .eq('user_id', userId)
          .eq('api_provider', 'anthropic')
          .eq('is_active', true)
          .order('is_current', { ascending: false })
          .limit(1);
        
        if (keys && keys.length > 0) {
          const { data: decrypted } = await supabase.rpc('decrypt_api_key', {
            p_encrypted: keys[0].api_key_encrypted,
            p_user_id: userId,
          });
          if (decrypted) {
            apiKey = decrypted as string;
            console.log(`✅ [brainstorm-ideas] Usando chave do usuário`);
          }
        }
      }
      
      // Fallback para chave global
      if (!apiKey) {
        apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
        if (apiKey) console.log(`✅ [brainstorm-ideas] Usando chave global`);
      }
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      console.log(`🤖 [brainstorm-ideas] Usando modelo: ${aiModel}`);
      
      requestBody = {
        model: aiModel,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }]
      };
    } else if (aiModel.startsWith('gemini')) {
      console.log(`🔑 [brainstorm-ideas] Buscando API key Google`);
      
      // Buscar chave do usuário primeiro
      if (userId) {
        const { data: keys } = await supabase
          .from('user_api_keys')
          .select('id, api_key_encrypted')
          .eq('user_id', userId)
          .eq('api_provider', 'google')
          .eq('is_active', true)
          .order('is_current', { ascending: false })
          .limit(1);
        
        if (keys && keys.length > 0) {
          const { data: decrypted } = await supabase.rpc('decrypt_api_key', {
            p_encrypted: keys[0].api_key_encrypted,
            p_user_id: userId,
          });
          if (decrypted) {
            apiKey = decrypted as string;
            console.log(`✅ [brainstorm-ideas] Usando chave do usuário`);
          }
        }
      }
      
      // Fallback para chave global
      if (!apiKey) {
        apiKey = Deno.env.get('GEMINI_API_KEY') || '';
        if (apiKey) console.log(`✅ [brainstorm-ideas] Usando chave global`);
      }
      
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      console.log(`🤖 [brainstorm-ideas] Usando modelo: ${aiModel}`);
      
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
      };
    } else if (aiModel.startsWith('gpt')) {
      console.log(`🔑 [brainstorm-ideas] Buscando API key OpenAI`);
      
      // Buscar chave do usuário primeiro
      if (userId) {
        const { data: keys } = await supabase
          .from('user_api_keys')
          .select('id, api_key_encrypted')
          .eq('user_id', userId)
          .eq('api_provider', 'openai')
          .eq('is_active', true)
          .order('is_current', { ascending: false })
          .order('priority', { ascending: true })
          .limit(1);
        
        if (keys && keys.length > 0) {
          const { data: decrypted } = await supabase.rpc('decrypt_api_key', {
            p_encrypted: keys[0].api_key_encrypted,
            p_user_id: userId,
          });
          if (decrypted) {
            apiKey = decrypted as string;
            console.log(`✅ [brainstorm-ideas] Usando chave do usuário`);
          }
        }
      }
      
      // Fallback para chave global
      if (!apiKey) {
        const globalKey = Deno.env.get('OPENAI_API_KEY');
        if (globalKey) {
          apiKey = globalKey;
          console.log(`✅ [brainstorm-ideas] Usando chave global`);
        }
      }
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      console.log(`🤖 [brainstorm-ideas] Usando modelo: ${aiModel}`);
      
      requestBody = {
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8192
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
