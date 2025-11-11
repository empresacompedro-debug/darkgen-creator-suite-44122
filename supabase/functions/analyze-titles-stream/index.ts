import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mapModelToProvider } from '../_shared/model-mapper.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';
import { getApiKey } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { rawData, aiModel = 'claude-sonnet-4-5' } = await req.json();

    console.log('[analyze-titles-stream] Received request with model:', aiModel);
    console.log('[analyze-titles-stream] Raw data length:', rawData?.length);

    if (!rawData || rawData.trim().length === 0) {
      throw new Error('Dados vazios. Por favor, cole os dados do YouTube.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const { provider, model } = mapModelToProvider(aiModel);
    console.log(`[analyze-titles-stream] Mapped ${aiModel} → provider: ${provider}, model: ${model}`);

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

    let apiKey: string | undefined;
    let streamUrl: string;
    let requestBody: any;
    let headers: Record<string, string>;

    if (provider === 'claude') {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada');
      }

      streamUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      requestBody = {
        model: model,
        max_tokens: 8192,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      };
    } else if (provider === 'gemini') {
      apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }

      streamUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: { temperature: 0.8, topP: 0.95 }
      };
    } else if (provider === 'openai') {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada');
      }

      streamUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      requestBody = {
        model: model,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      };
    } else if (provider === 'vertex-ai') {
      console.log('[analyze-titles-stream] Getting Vertex AI key from database');
      const keyData = await getApiKey(userId || undefined, 'vertex-ai', supabase);
      
      if (!keyData) {
        throw new Error('Nenhuma chave Vertex AI configurada');
      }

      const vertexRequest = await buildGeminiOrVertexRequest(
        { key: keyData.key, provider: 'vertex-ai', vertexConfig: keyData.vertexConfig },
        model,
        prompt,
        true // streaming = true
      );

      streamUrl = vertexRequest.url;
      headers = vertexRequest.headers;
      requestBody = vertexRequest.body;
    } else {
      throw new Error(`Provider não suportado para streaming: ${provider}`);
    }

    console.log(`[analyze-titles-stream] Starting streaming with ${provider}`);

    const aiResponse = await fetch(streamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[analyze-titles-stream] ${provider} API error:`, errorText);
      throw new Error(`${provider} API error: ${aiResponse.status}`);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = aiResponse.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;

              if (provider === 'claude') {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                    }
                  } catch (e) {
                    console.error('[analyze-titles-stream] Error parsing Claude chunk:', e);
                  }
                }
              } else if (provider === 'gemini' || provider === 'vertex-ai') {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch (e) {
                    console.error(`[analyze-titles-stream] Error parsing ${provider} chunk:`, e);
                  }
                }
              } else if (provider === 'openai') {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch (e) {
                    console.error('[analyze-titles-stream] Error parsing OpenAI chunk:', e);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('[analyze-titles-stream] Stream error:', error);
          controller.error(error);
        }
      },
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
    console.error('[analyze-titles-stream] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
