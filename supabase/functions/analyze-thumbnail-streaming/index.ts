import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 [Analyze Streaming] Request received');

    const { imageBase64, modelingLevel, aiModel, customInstructions, includeText, desiredText } = await req.json();

    if (!imageBase64) throw new Error('imageBase64 is required');
    if (!modelingLevel) throw new Error('modelingLevel is required');

    console.log(`🎨 [Analyze Streaming] Config:`, {
      aiModel,
      modelingLevel,
      includeText: includeText ?? true,
      hasDesiredText: !!desiredText,
      hasCustomInstructions: !!customInstructions,
      imageSize: imageBase64.length
    });

    // Determinar provider e buscar API key globalmente
    let provider: 'claude' | 'gemini' | 'openai' = 'gemini';
    let model = 'gemini-2.0-flash-exp';
    let apiKey = '';
    
    if (aiModel.includes('claude')) {
      provider = 'claude';
      model = aiModel === 'claude-sonnet-4.5' ? 'claude-sonnet-4-20250514' : 'claude-sonnet-4-20250318';
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
    } else if (aiModel.includes('gpt')) {
      provider = 'openai';
      model = 'gpt-4o';
      apiKey = Deno.env.get('OPENAI_API_KEY') || '';
    } else if (aiModel.includes('gemini')) {
      provider = 'gemini';
      model = aiModel === 'gemini-2.5-pro' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-exp';
      apiKey = Deno.env.get('GEMINI_API_KEY') || '';
    }

    // Fallback: tentar outros providers se o selecionado não tiver API key
    if (!apiKey) {
      console.warn(`⚠️ No API key for ${provider}, trying fallback...`);
      
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      const claudeKey = Deno.env.get('ANTHROPIC_API_KEY');
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (geminiKey) {
        provider = 'gemini';
        model = 'gemini-2.0-flash-exp';
        apiKey = geminiKey;
        console.log('🔄 Fallback to Gemini');
      } else if (claudeKey) {
        provider = 'claude';
        model = 'claude-sonnet-4-20250514';
        apiKey = claudeKey;
        console.log('🔄 Fallback to Claude');
      } else if (openaiKey) {
        provider = 'openai';
        model = 'gpt-4o';
        apiKey = openaiKey;
        console.log('🔄 Fallback to OpenAI');
      } else {
        throw new Error('No API keys configured for any provider');
      }
    }

    console.log(`✅ API key obtained for provider: ${provider}`);

    // Criar prompt simplificado para testes (temporário)
    const masterSystemPrompt = "Você é um especialista em análise de thumbnails do YouTube. Analise esta imagem e gere um prompt técnico detalhado para recriá-la em ferramentas de geração de imagem. RETORNE em formato JSON: { \"prompt_com_texto\": \"descrição completa incluindo texto\", \"prompt_sem_texto\": \"mesma descrição sem texto\", \"metadata\": { \"tema\": \"string\", \"estilo\": \"string\", \"paleta_cores\": [\"cor1\", \"cor2\"], \"quantidade_pessoas\": number } }";

    const systemPrompts = {
      identical: `${masterSystemPrompt}\n\nNÍVEL: IDÊNTICO - Descreva tudo com máximo detalhe.`,
      similar: `${masterSystemPrompt}\n\nNÍVEL: SIMILAR - Foque no estilo geral.`,
      concept: `${masterSystemPrompt}\n\nNÍVEL: CONCEITUAL - Capture a ideia principal.`
    };

    let analysisPrompt = systemPrompts[modelingLevel as keyof typeof systemPrompts];
    
    // Adicionar texto desejado se fornecido
    if (desiredText?.trim()) {
      analysisPrompt += `\n\n🎯 TEXTO OBRIGATÓRIO NA IMAGEM GERADA:\nO usuário deseja que a thumbnail contenha o seguinte texto: "${desiredText.trim()}"\nIncorpore este texto exato no prompt de forma destacada, especificando fonte, tamanho, cor, posição e efeitos apropriados para máximo impacto visual.`;
    }
    
    if (customInstructions?.trim()) {
      analysisPrompt += `\n\n📌 INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:\n${customInstructions}`;
    }

    // Criar streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Claude streaming
          if (provider === 'claude') {
            console.log('📡 [Claude] Starting streaming request...');
            console.log('🔑 [Claude] API key present:', !!apiKey);
            
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
              console.error('❌ [Claude] API error:', response.status, errorText);
              throw new Error(`Claude API error: ${response.status} - ${errorText}`);
            }
            
            console.log('✅ [Claude] Response received, starting stream read...');

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let chunkCount = 0;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log(`✅ [Claude] Stream complete. Total chunks: ${chunkCount}`);
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
                      chunkCount++;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data.delta.text })}\n\n`));
                      if (chunkCount % 10 === 0) {
                        console.log(`📦 [Claude] Sent ${chunkCount} chunks`);
                      }
                    }
                  } catch (e) {
                    console.error('❌ [Claude] Error parsing SSE:', e);
                  }
                }
              }
            }
          }
          // Gemini (simulação de streaming)
          else if (provider === 'gemini') {
            console.log('📡 [Gemini] Starting request...');
            console.log('🔑 [Gemini] API key present:', !!apiKey);
            
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
              console.error('❌ [Gemini] API error:', response.status, errorText);
              throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ [Gemini] Response received');
            const data = await response.json();
            let fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!fullText) {
              console.error('❌ [Gemini] No text in response');
              throw new Error('No text generated from Gemini');
            }
            
            console.log(`📝 [Gemini] Generated text length: ${fullText.length} chars`);

            // Tentar extrair JSON da resposta
            let jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsedJson = JSON.parse(jsonMatch[0]);
                // Se temos JSON válido, enviar como estrutura
                fullText = JSON.stringify(parsedJson, null, 2);
              } catch (e) {
                console.warn('⚠️ Failed to parse JSON from response, sending as-is');
              }
            }

            // Simular streaming por sentenças (mais rápido e natural)
            const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
            console.log(`📦 [Gemini] Streaming ${sentences.length} chunks`);
            
            for (let i = 0; i < sentences.length; i++) {
              const chunk = sentences[i];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              if (i % 5 === 0) {
                console.log(`📦 [Gemini] Sent chunk ${i + 1}/${sentences.length}`);
              }
              await new Promise(r => setTimeout(r, 50)); // 50ms entre sentenças
            }
            
            console.log('✅ [Gemini] Streaming complete');
          }
          // OpenAI streaming
          else if (provider === 'openai') {
            console.log('📡 [OpenAI] Starting streaming request...');
            console.log('🔑 [OpenAI] API key present:', !!apiKey);
            
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
              console.error('❌ [OpenAI] API error:', response.status, errorText);
              throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ [OpenAI] Response received, starting stream read...');
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let chunkCount = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log(`✅ [OpenAI] Stream complete. Total chunks: ${chunkCount}`);
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
                      chunkCount++;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                      if (chunkCount % 10 === 0) {
                        console.log(`📦 [OpenAI] Sent ${chunkCount} chunks`);
                      }
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
