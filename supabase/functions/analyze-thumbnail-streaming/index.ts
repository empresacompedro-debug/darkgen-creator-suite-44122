import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getApiKey } from "../_shared/get-api-key.ts";

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
    if (!authHeader) throw new Error('No authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { imageBase64, modelingLevel, aiModel, customInstructions } = await req.json();

    if (!imageBase64) throw new Error('imageBase64 is required');
    if (!modelingLevel) throw new Error('modelingLevel is required');

    console.log(`🎨 [Analyze Streaming] Starting analysis with ${aiModel} at level ${modelingLevel}`);

    // Determinar provider
    let provider: 'claude' | 'gemini' | 'openai' = 'gemini';
    let model = 'gemini-2.0-flash-exp';
    
    if (aiModel.includes('claude')) {
      provider = 'claude';
      model = aiModel === 'claude-sonnet-4.5' ? 'claude-sonnet-4-20250514' : 'claude-sonnet-4-20250318';
    } else if (aiModel.includes('gpt')) {
      provider = 'openai';
      model = 'gpt-4o';
    } else if (aiModel.includes('gemini')) {
      provider = 'gemini';
      model = aiModel === 'gemini-2.5-pro' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-exp';
    }

    // Obter API key
    const apiKeyResult = await getApiKey(user.id, provider, supabaseClient);
    if (!apiKeyResult) throw new Error(`No ${provider} API key found`);
    const apiKey = apiKeyResult.key;

    // Criar prompts baseados no nível
    const systemPrompts = {
      identical: `Você é um especialista em análise visual de thumbnails. Analise a imagem fornecida e crie um prompt EXTREMAMENTE DETALHADO para replicá-la de forma IDÊNTICA.

INSTRUÇÕES CRÍTICAS:
- Descreva TODOS os elementos visuais com precisão fotográfica
- Especifique cores exatas (tons, saturação, brilho)
- Detalhe posicionamento preciso de CADA elemento
- Descreva expressões faciais, ângulos de câmera, iluminação
- Inclua TODOS os textos visíveis (fontes, tamanhos, cores, efeitos)
- Mencione estilo artístico, técnicas de composição
- Detalhe texturas, sombras, profundidade
- Especifique resolução e qualidade esperadas

FORMATO: Crie um único prompt contínuo, sem seções, extremamente detalhado (mínimo 500 palavras).`,

      similar: `Você é um especialista em análise visual de thumbnails. Analise a imagem e crie um prompt DETALHADO que capture o ESTILO e ESSÊNCIA visual.

INSTRUÇÕES:
- Identifique e descreva o estilo visual dominante
- Capture a paleta de cores principal
- Descreva o layout e composição geral
- Identifique padrões visuais e elementos recorrentes
- Mencione técnicas artísticas utilizadas
- Descreva mood, atmosfera e impacto visual
- Inclua tipo de conteúdo (pessoa, objeto, paisagem, etc)
- Especifique elementos de design (tipografia, efeitos, filtros)

FORMATO: Prompt detalhado (300-400 palavras) focando em ESTILO, não em replicação exata.`,

      concept: `Você é um especialista em análise conceitual de thumbnails. Analise a imagem e extraia o CONCEITO CENTRAL para reimaginação criativa.

INSTRUÇÕES:
- Identifique o conceito/ideia principal transmitida
- Capture a emoção e mensagem central
- Descreva o tema e narrativa visual
- Mencione elementos simbólicos e metafóricos
- Analise o impacto psicológico da composição
- Identifique arquétipos visuais utilizados
- Sugira direções criativas para reimaginação
- Foque em "O QUE" a imagem comunica, não "COMO"

FORMATO: Prompt conceitual (200-300 palavras) focando na IDEIA CENTRAL e possibilidades criativas.`
    };

    let analysisPrompt = systemPrompts[modelingLevel as keyof typeof systemPrompts];
    
    if (customInstructions?.trim()) {
      analysisPrompt += `\n\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${customInstructions}`;
    }

    // Criar streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Claude streaming
          if (provider === 'claude') {
            console.log('📡 [Claude] Starting streaming request...');
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model,
                max_tokens: 4000,
                stream: true,
                messages: [{
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                      }
                    },
                    {
                      type: 'text',
                      text: analysisPrompt
                    }
                  ]
                }]
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Claude API error: ${response.status} - ${errorText}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

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
                    console.error('Error parsing Claude SSE:', e);
                  }
                }
              }
            }
          }
          // Gemini (simulação de streaming)
          else if (provider === 'gemini') {
            console.log('📡 [Gemini] Starting request...');
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                      }
                    },
                    { text: analysisPrompt }
                  ]
                }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 4000,
                }
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!fullText) throw new Error('No text generated from Gemini');

            // Simular streaming palavra por palavra
            const words = fullText.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              await new Promise(r => setTimeout(r, 30)); // 30ms delay
            }
          }
          // OpenAI streaming
          else if (provider === 'openai') {
            console.log('📡 [OpenAI] Starting streaming request...');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model,
                stream: true,
                messages: [{
                  role: 'user',
                  content: [
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                      }
                    },
                    {
                      type: 'text',
                      text: analysisPrompt
                    }
                  ]
                }]
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

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
                    console.error('Error parsing OpenAI SSE:', e);
                  }
                }
              }
            }
          }

          // Enviar sinal de conclusão
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          console.log('✅ [Analyze Streaming] Completed successfully');

        } catch (error: any) {
          console.error('❌ [Analyze Streaming] Error:', error);
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
    console.error('❌ [Analyze Streaming] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
