import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateString, validateArray, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';
import { getApiKey, getApiKeyWithHierarchicalFallback, updateApiKeyUsage } from '../_shared/get-api-key.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getMaxTokensForModel(model: string): number {
  if (model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
    return 32000;
  }
  if (model.includes('gpt-4-turbo') || model.includes('gpt-4.1')) return 4096;
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

  const encoder = new TextEncoder();

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

    // Get Supabase client for user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    console.log('🎯 [translate-script] Modelo selecionado:', aiModel);
    console.log('🌍 [translate-script] Idiomas alvo:', targetLanguages);
    console.log('👤 [translate-script] User ID:', userId);

    // Use aiModel directly - get-api-key handles provider detection
    const modelToUse = aiModel;

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

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const targetLang of targetLanguages) {
            // Send language start marker
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, status: 'start' })}\n\n`));
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

            if (modelToUse.startsWith('claude')) {
              console.log(`🔑 [translate-script] Buscando API key Anthropic para ${targetLang}`);
              
              const keyData = await getApiKey(userId, 'claude', supabase);
              if (!keyData) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: 'API key não configurada para Claude' })}\n\n`));
                continue;
              }
              
              apiKey = keyData.key;
              console.log('✅ [translate-script] API key encontrada');
              
              apiUrl = 'https://api.anthropic.com/v1/messages';
              const modelMap: Record<string, string> = {
                'claude-sonnet-4-5': 'claude-sonnet-4-20250514',
                'claude-sonnet-4.5': 'claude-sonnet-4-20250514',
                'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
                'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514'
              };
              const finalModel = modelMap[modelToUse] || 'claude-sonnet-4-20250514';
              console.log(`🤖 [translate-script] Modelo mapeado: ${modelToUse} → ${finalModel}`);
              const maxTokens = getMaxTokensForModel(finalModel);
              console.log(`📦 [translate-script] Usando ${maxTokens} max_tokens para ${finalModel} (${targetLang})`);
              
              requestBody = {
                model: finalModel,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }],
                stream: true
              };
            } else if (modelToUse.startsWith('gemini')) {
              console.log(`🔑 [translate-script] Buscando API key Gemini com fallback hierárquico para ${targetLang}`);
              
              const keyData = await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabase);
              if (!keyData) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: 'API key não configurada para Gemini/Vertex AI' })}\n\n`));
                continue;
              }
              
              const { url: apiUrl, headers: apiHeaders, body: apiBody } = await buildGeminiOrVertexRequest(
                keyData,
                modelToUse.replace('gemini-', 'gemini-2.0-flash-exp'),
                prompt,
                true // streaming
              );
              
              console.log(`🤖 [translate-script] Usando ${keyData.provider} para ${targetLang}`);
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: apiHeaders,
                body: JSON.stringify(apiBody)
              });
            } else if (modelToUse.startsWith('gpt')) {
              console.log(`🔑 [translate-script] Buscando API key OpenAI para ${targetLang}`);
              
              // Buscar chave do usuário diretamente (como analyze-titles faz)
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
                    console.log(`✅ [translate-script] Usando chave do usuário`);
                  }
                }
              }
              
              // Fallback para chave global
              if (!apiKey) {
                const globalKey = Deno.env.get('OPENAI_API_KEY');
                if (globalKey) {
                  apiKey = globalKey;
                  console.log(`✅ [translate-script] Usando chave global`);
                }
              }
              
              if (!apiKey) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: 'API key não configurada para OpenAI' })}\n\n`));
                continue;
              }
              
              apiUrl = 'https://api.openai.com/v1/chat/completions';
              
              // Usar modelo EXATAMENTE como veio (sem mapeamento) e max_tokens fixo como analyze-titles
              console.log(`🤖 [translate-script] Usando modelo: ${modelToUse}`);
              
              requestBody = {
                model: modelToUse,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
                max_tokens: 8192
              };
            }

            if (!apiKey) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: `API key não configurada para ${modelToUse}` })}\n\n`));
              continue;
            }

            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };

            if (modelToUse.startsWith('claude')) {
              headers['x-api-key'] = apiKey;
              headers['anthropic-version'] = '2023-06-01';
            } else if (modelToUse.startsWith('gpt')) {
              headers['Authorization'] = `Bearer ${apiKey}`;
            }

            console.log(`🚀 [translate-script] Enviando requisição streaming para ${targetLang}:`, apiUrl);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            });

            console.log(`📨 [translate-script] Status da resposta (${targetLang}):`, response.status);

            if (!response.ok) {
              const errorData = await response.text();
              console.error(`❌ [translate-script] Erro da API (${targetLang}):`, errorData);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: `API Error: ${response.status}` })}\n\n`));
              continue;
            }

            // Process streaming response
            if (!response.body) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, error: 'No response body' })}\n\n`));
              continue;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.trim() || line.startsWith(':')) continue;
                
                if (modelToUse.startsWith('claude')) {
                  // Claude SSE format
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, text: parsed.delta.text })}\n\n`));
                      }
                    } catch (e) {
                      console.error('Error parsing Claude chunk:', e);
                    }
                  }
                } else if (modelToUse.startsWith('gpt')) {
                  // OpenAI SSE format
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content;
                      if (content) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, text: content })}\n\n`));
                      }
                    } catch (e) {
                      console.error('Error parsing GPT chunk:', e);
                    }
                  }
                } else if (modelToUse.startsWith('gemini')) {
                  // Gemini SSE format
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, text })}\n\n`));
                      }
                    } catch (e) {
                      console.error('Error parsing Gemini chunk:', e);
                    }
                  }
                }
              }
            }

            // Send language completion marker
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ language: targetLang, status: 'done' })}\n\n`));
          }

          // Send final done marker
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error: any) {
          console.error('❌ [translate-script] Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
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
