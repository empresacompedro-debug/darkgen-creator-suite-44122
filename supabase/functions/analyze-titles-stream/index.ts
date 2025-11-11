import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData, aiModel = 'gemini-2.5-flash' } = await req.json();

    console.log('📨 [Analyze Titles Stream] Request received');
    console.log('🎯 [Analyze Titles Stream] Model:', aiModel);
    console.log('📊 [Analyze Titles Stream] Raw data length:', rawData?.length);

    if (!rawData || rawData.trim().length === 0) {
      throw new Error('Dados vazios. Por favor, cole os dados do YouTube.');
    }

    // Determinar provider baseado no prefixo do modelo
    let provider: 'gemini' | 'vertex-ai' | 'claude' | 'openai';
    let model = aiModel;

    if (aiModel.startsWith('gemini-')) {
      provider = 'gemini';
    } else if (aiModel.startsWith('vertex-')) {
      provider = 'vertex-ai';
      model = aiModel.replace('vertex-', ''); // Remove prefix
    } else if (aiModel.startsWith('claude')) {
      provider = 'claude';
    } else if (aiModel.startsWith('gpt') || aiModel.startsWith('o1') || aiModel.startsWith('o3')) {
      provider = 'openai';
    } else {
      provider = 'gemini'; // Default
    }

    console.log(`🔄 [Analyze Titles Stream] Provider: ${provider}, Model: ${model}`);

    // Build comprehensive markdown prompt
    const prompt = `CONTEXTO:
Você é um especialista em análise de performance de conteúdo no YouTube, especializado em identificar padrões virais em títulos de vídeos de qualquer nicho/subnicho e microsubnicho.

TAREFA:
Analise os títulos fornecidos e crie uma resposta seguindo RIGOROSAMENTE este modelo:

# 🏆 **TEMA CAMPEÃO ABSOLUTO**
[Identificar o tema principal de maior sucesso combinando 3 elementos: CONTEXTO + CONFLITO + RESULTADO]

## **🔑 TOP 10 PALAVRAS-CHAVE MAIS REPETIDAS**
1. **"[Palavra/Frase]"** - [Nº vezes]x (média [X]K views)
2. **"[Palavra/Frase]"** - [Nº vezes]x (média [X]K views)
[Continue até 10...]

## **📊 5 SUBNICHOS CAMPEÕES**
1. **[Nome do Subnicho]** - Média [X]K views
2. **[Nome do Subnicho]** - Média [X]K views
[Continue até 5...]

## **🎯 10 MICRONICHOS CAMPEÕES**
1. **"[Descrição Específica do Micronicho]"** - [X]K média
2. **"[Descrição Específica do Micronicho]"** - [X]K média
[Continue até 10...]

## **✨ 50 NOVOS TÍTULOS BASEADOS NOS 5 CAMPEÕES**

### **BASEADOS NO CAMPEÃO 1 ([X]K views):**
**"[Título original completo]"**
1. [Nova variação mantendo estrutura mas mudando detalhes]
2. [Nova variação mantendo estrutura mas mudando detalhes]
[Continue até 10...]

### **BASEADOS NO CAMPEÃO 2 ([X]K views):**
**"[Título original completo]"**
11. [Nova variação mantendo estrutura mas mudando detalhes]
12. [Nova variação mantendo estrutura mas mudando detalhes]
[Continue até 20...]

[Repetir para Campeões 3, 4 e 5 até completar 50 títulos]

## 💡 **8 ELEMENTOS-CHAVE PARA REPLICAR**
1. **[Elemento]** (sempre incluir exemplo)
2. **[Elemento]** (sempre incluir exemplo)
[Continue até 8...]

## 🚀 **MICRONICHOS PARA REPLICAR**

### **PRIORIDADE 1 (FAZER IMEDIATAMENTE):**
- [Micronicho 1 com descrição]
- [Micronicho 2 com descrição]
- [Micronicho 3 com descrição]

### **PRIORIDADE 2 (ALTA PERFORMANCE):**
- [Micronicho 4 com descrição]
- [Micronicho 5 com descrição]
- [Micronicho 6 com descrição]

### **PRIORIDADE 3 (BOA PERFORMANCE):**
- [Micronicho 7 com descrição]
- [Micronicho 8 com descrição]
- [Micronicho 9 com descrição]

## ⭐ **10 TÍTULOS FINAIS COM MAIOR POTENCIAL**

**1. MICRONICHO: [Nome do Micronicho] [Potencial: XXK+ views]**
\`\`\`
[Título completo de 15-20 palavras seguindo a fórmula identificada]
\`\`\`

**2. MICRONICHO: [Nome do Micronicho] [Potencial: XXK+ views]**
\`\`\`
[Título completo de 15-20 palavras seguindo a fórmula identificada]
\`\`\`

[Repetir para 10 títulos]

=== DADOS DE ENTRADA ===
${rawData}

IMPORTANTE: 
- NÃO adicione seções extras
- NÃO mude a ordem das seções
- MANTENHA exatamente a formatação mostrada
- USE os mesmos emojis indicados
- SEMPRE baseie as variações nos 5 campeões identificados
- Retorne APENAS o markdown formatado, sem explicações adicionais`;

    // Criar streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // GEMINI GRATUITO - nunca consulta user_api_keys
          if (provider === 'gemini') {
            console.log('📡 [Gemini Free] Starting request...');
            
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) {
              throw new Error('GEMINI_API_KEY não configurada');
            }

            console.log('🔑 [Gemini Free] Using global key');

            // Usar helper para construir request com stream
            const { url, headers, body } = await buildGeminiOrVertexRequest(
              { key: apiKey },
              model,
              prompt,
              true // stream = true
            );

            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [Gemini Free] API error:', response.status, errorText);
              throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ [Gemini Free] Response received, starting stream...');

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('✅ [Gemini Free] Stream complete');
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue;

                  try {
                    const data = JSON.parse(jsonStr);
                    const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (chunk) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                    }
                  } catch (e) {
                    console.error('❌ [Gemini Free] Error parsing SSE:', e);
                  }
                }
              }
            }
          }
          // VERTEX AI - exige chave do usuário, SEM FALLBACK
          else if (provider === 'vertex-ai') {
            console.log('📡 [Vertex AI] Starting request...');

            // Get Supabase client
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Get user from auth header
            const authHeader = req.headers.get('Authorization');
            let userId: string | null = null;
            
            if (authHeader) {
              const token = authHeader.replace('Bearer ', '');
              const { data: { user }, error: authError } = await supabase.auth.getUser(token);
              if (!authError && user) {
                userId = user.id;
              }
            }

            if (!userId) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Autenticação necessária para usar Vertex AI' })}\n\n`));
              controller.close();
              return;
            }

            console.log('👤 [Vertex AI] User ID:', userId);

            // Buscar chave Vertex AI do usuário
            const { data: keyData, error: keyError } = await supabase
              .from('user_api_keys')
              .select('api_key_encrypted, vertex_config')
              .eq('user_id', userId)
              .eq('api_provider', 'vertex-ai')
              .eq('is_active', true)
              .order('priority', { ascending: true })
              .limit(1)
              .single();

            if (keyError || !keyData) {
              console.error('❌ [Vertex AI] Nenhuma chave encontrada para o usuário');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Configure sua chave Vertex AI nas configurações' })}\n\n`));
              controller.close();
              return;
            }

            // Descriptografar chave
            const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
              p_encrypted: keyData.api_key_encrypted,
              p_user_id: userId,
            });

            if (decErr || !decrypted) {
              console.error('❌ [Vertex AI] Erro ao descriptografar chave');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro ao descriptografar chave Vertex AI' })}\n\n`));
              controller.close();
              return;
            }

            console.log('🔑 [Vertex AI] Key decrypted successfully');

            const keyInfo = {
              key: decrypted as string,
              provider: 'vertex-ai' as const,
              vertexConfig: keyData.vertex_config
            };

            // Construir requisição com stream
            const { url, headers, body } = await buildGeminiOrVertexRequest(
              keyInfo,
              model,
              prompt,
              true // stream = true
            );

            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [Vertex AI] API error:', response.status, errorText);
              
              if (response.status === 429) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Limite de taxa excedido. Aguarde alguns minutos.' })}\n\n`));
              } else if (response.status === 402) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Créditos insuficientes no Vertex AI.' })}\n\n`));
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Vertex AI error: ${response.status}` })}\n\n`));
              }
              controller.close();
              return;
            }

            console.log('✅ [Vertex AI] Response received, starting stream...');

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('✅ [Vertex AI] Stream complete');
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue;

                  try {
                    const data = JSON.parse(jsonStr);
                    const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (chunk) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                    }
                  } catch (e) {
                    console.error('❌ [Vertex AI] Error parsing SSE:', e);
                  }
                }
              }
            }
          }
          // CLAUDE - streaming nativo
          else if (provider === 'claude') {
            console.log('📡 [Claude] Starting streaming request...');
            
            const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
            if (!apiKey) {
              throw new Error('ANTHROPIC_API_KEY não configurada');
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model: model,
                max_tokens: 8192,
                stream: true,
                messages: [{ role: 'user', content: prompt }]
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [Claude] API error:', response.status, errorText);
              throw new Error(`Claude API error: ${response.status} - ${errorText}`);
            }
            
            console.log('✅ [Claude] Response received, starting stream read...');

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('✅ [Claude] Stream complete');
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue;

                  try {
                    const data = JSON.parse(jsonStr);
                    if (data.type === 'content_block_delta' && data.delta?.text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data.delta.text })}\n\n`));
                    }
                  } catch (e) {
                    console.error('❌ [Claude] Error parsing SSE:', e);
                  }
                }
              }
            }
          }
          // OPENAI - streaming nativo
          else if (provider === 'openai') {
            console.log('📡 [OpenAI] Starting streaming request...');
            
            const apiKey = Deno.env.get('OPENAI_API_KEY');
            if (!apiKey) {
              throw new Error('OPENAI_API_KEY não configurada');
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: model,
                stream: true,
                messages: [{ role: 'user', content: prompt }]
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [OpenAI] API error:', response.status, errorText);
              throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ [OpenAI] Response received, starting stream read...');
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('✅ [OpenAI] Stream complete');
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n').filter(l => l.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === '[DONE]') break;
                  
                  try {
                    const data = JSON.parse(jsonStr);
                    const chunk = data.choices?.[0]?.delta?.content;
                    if (chunk) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                    }
                  } catch (e) {
                    console.error('❌ [OpenAI] Error parsing SSE:', e);
                  }
                }
              }
            }
          }

          // Enviar sinal de conclusão
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          console.log('✅ [Analyze Titles Stream] Completed successfully');

        } catch (error: any) {
          console.error('❌ [Analyze Titles Stream] Error:', error);
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
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('❌ [Analyze Titles Stream] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
