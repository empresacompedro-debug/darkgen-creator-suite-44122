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
    
    // Validar apenas prompt livre
    const errors = [
      ...validateString(body.prompt, 'prompt', { required: true, maxLength: 2000 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const userPrompt = sanitizeString(body.prompt);
    const aiModel = body.aiModel;

    console.log('Processing prompt:', { aiModel, promptLength: userPrompt.length });

    // System prompt conversacional
    const systemPrompt = `Você é um especialista em criação de conteúdo viral para YouTube e descoberta de nichos lucrativos.

Sua tarefa é responder às perguntas do usuário de forma detalhada, fornecendo insights valiosos sobre nichos, micronichos, tendências e estratégias de conteúdo.

DIRETRIZES:
- Seja específico e prático nas suas respostas
- Se o usuário pedir uma lista (ex: 100 nichos), forneça EXATAMENTE a quantidade solicitada
- Numere as listas quando apropriado
- Inclua informações sobre CPM estimado quando relevante
- Foque em nichos lucrativos e com potencial de engajamento
- Use exemplos concretos sempre que possível

Responda de forma clara, organizada e valiosa.`;

    const fullPrompt = `${systemPrompt}\n\nPERGUNTA DO USUÁRIO:\n${userPrompt}`;

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
        messages: [{ role: 'user', content: fullPrompt }],
        stream: true
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
      
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
      console.log(`🤖 [brainstorm-ideas] Usando modelo: ${aiModel}`);
      
      requestBody = {
        contents: [{ parts: [{ text: fullPrompt }] }]
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
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 8192,
        stream: true
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

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('API Error Response:', errorData);
      throw new Error(`API Error: ${apiResponse.status} - ${errorData}`);
    }

    // Retornar stream SSE
    const stream = new ReadableStream({
      async start(controller) {
        const reader = apiResponse.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;

              let content = '';

              // Parse baseado no provider
              if (aiModel.startsWith('claude')) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta') {
                      content = parsed.delta?.text || '';
                    }
                  } catch (e) {
                    console.error('Error parsing Claude chunk:', e);
                  }
                }
              } else if (aiModel.startsWith('gemini')) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  } catch (e) {
                    console.error('Error parsing Gemini chunk:', e);
                  }
                }
              } else if (aiModel.startsWith('gpt')) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    content = parsed.choices?.[0]?.delta?.content || '';
                  } catch (e) {
                    console.error('Error parsing OpenAI chunk:', e);
                  }
                }
              }

              if (content) {
                const sseData = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
