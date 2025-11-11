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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      throw new Error('Supabase configuration is missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { imageBase64, modelingLevel, aiModel, customInstructions } = await req.json();

    if (!imageBase64) throw new Error('imageBase64 is required');
    if (!modelingLevel) throw new Error('modelingLevel is required');

    console.log(`🎨 [Analyze Streaming] Config:`, {
      aiModel,
      modelingLevel,
      hasCustomInstructions: !!customInstructions,
      imageSize: imageBase64.length
    });

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
      identical: `Analise cuidadosamente esta imagem com extremo requinte de detalhes.

Gere um prompt EXTREMAMENTE DETALHADO para recriar esta thumbnail de forma IDÊNTICA, incluindo:

📌 TEMA E CONTEXTO NARRATIVO:
- Sobre o que a imagem comunica (época, local, tipo de vídeo: histórico, curioso, educacional, etc.)

📌 COMPOSIÇÃO VISUAL:
- Número exato e posição precisa de pessoas ou objetos
- Perspectiva, enquadramento, tipo de plano (close, plano médio, plano geral)
- Fundo detalhado (cenário, elementos, profundidade)
- Cores dominantes com especificações (tons exatos, saturação, temperatura)
- Iluminação (direção, intensidade, sombras, contraste, hora do dia)

📌 ESTILO ARTÍSTICO/FOTOGRÁFICO:
- Especifique: cinematográfico, vintage, digital painting, retrato realista, flat design, documental, hiper-realista, ilustração 3D, etc.

📌 ATMOSFERA EMOCIONAL:
- Sentimento transmitido: mistério, impacto, humor, tensão, curiosidade, esperança, nostalgia, drama, ação, etc.

📌 TEXTO E TIPOGRAFIA (SE HOUVER):
- Palavras EXATAS visíveis na imagem
- Posição do texto (canto superior, centralizado, rodapé, etc.)
- Tamanho relativo (grande, médio, pequeno)
- Estilo da fonte (bold, serif, sans-serif, manuscrita, display)
- Cores do texto
- Efeitos aplicados: glow, sombra, outline, gradiente, 3D, neon

📌 DETALHES TÉCNICOS:
- Tipo de lente/perspectiva (grande angular, teleobjetiva, normal)
- Proporção: 16:9 (YouTube thumbnail)
- Nível de realismo (fotográfico, semi-realista, estilizado)
- Contraste (alto, médio, baixo)
- Textura e granulação (lisa, texturizada, vintage, grão de filme)
- Saturação das cores
- Nitidez e foco

FORMATO FINAL OBRIGATÓRIO:
Após analisar todos esses elementos, reescreva TUDO como um único prompt fluido e direto para geração de imagem (formato Midjourney/Leonardo AI), unindo todos os elementos em uma descrição coesa.

FINALIZE COM OS PARÂMETROS:
--ar 16:9 --style cinematic --v 6 --quality 2 --chaos 5

EXEMPLO DE FORMATO ESPERADO:
"Create a cinematic YouTube thumbnail showing [descrição completa da cena, pessoas, objetos, ação], featuring [estilos visuais], with [iluminação], [cores dominantes], [atmosfera emocional]. Text overlay '[texto exato]' in [estilo de fonte] with [efeitos]. [Detalhes técnicos adicionais]. --ar 16:9 --style cinematic --v 6 --quality 2 --chaos 5"`,

      similar: `Analise cuidadosamente esta imagem com extremo requinte de detalhes.

Gere um prompt DETALHADO que capture o ESTILO e ESSÊNCIA visual desta thumbnail, incluindo:

📌 TEMA E CONTEXTO:
- Tipo de conteúdo e narrativa geral

📌 COMPOSIÇÃO VISUAL:
- Layout geral e elementos principais
- Paleta de cores dominante
- Tipo de iluminação e atmosfera

📌 ESTILO ARTÍSTICO:
- Estilo visual dominante (cinematográfico, vintage, moderno, etc.)
- Técnicas artísticas identificadas

📌 ATMOSFERA EMOCIONAL:
- Mood e impacto visual desejado

📌 TEXTO E TIPOGRAFIA:
- Estilo geral de texto (se houver)
- Posicionamento e efeitos

📌 DETALHES TÉCNICOS:
- Proporção: 16:9
- Nível de estilização
- Qualidade visual

FORMATO FINAL OBRIGATÓRIO:
Reescreva como um prompt único e fluido para Midjourney/Leonardo AI, focando em capturar o ESTILO mais do que detalhes exatos.

FINALIZE COM:
--ar 16:9 --style cinematic --v 6 --quality 2 --chaos 5`,

      concept: `Analise cuidadosamente esta imagem com extremo requinte de detalhes.

Gere um prompt CONCEITUAL que extraia a IDEIA CENTRAL e permita reimaginação criativa, incluindo:

📌 CONCEITO CENTRAL:
- Ideia principal e mensagem transmitida

📌 NARRATIVA VISUAL:
- Tema e história contada
- Elementos simbólicos

📌 ATMOSFERA E EMOÇÃO:
- Sentimento principal
- Impacto psicológico

📌 DIREÇÃO CRIATIVA:
- Arquétipos visuais
- Possibilidades de reimaginação

📌 ELEMENTOS ESSENCIAIS:
- O que DEVE estar presente
- O que pode ser reinterpretado

FORMATO FINAL OBRIGATÓRIO:
Reescreva como um prompt único e fluido para Midjourney/Leonardo AI, focando no CONCEITO e permitindo liberdade criativa na execução.

FINALIZE COM:
--ar 16:9 --style cinematic --v 6 --quality 2 --chaos 5`
    };

    let analysisPrompt = systemPrompts[modelingLevel as keyof typeof systemPrompts];
    
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
            let fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!fullText) throw new Error('No text generated from Gemini');

            // Validar e adicionar parâmetros Midjourney se ausentes
            if (!fullText.includes('--ar 16:9')) {
              console.warn('⚠️ Generated prompt missing Midjourney parameters, adding them...');
              fullText += '\n\n--ar 16:9 --style cinematic --v 6 --quality 2 --chaos 5';
            }

            // Simular streaming por sentenças (mais rápido e natural)
            const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
            for (let i = 0; i < sentences.length; i++) {
              const chunk = sentences[i];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              await new Promise(r => setTimeout(r, 50)); // 50ms entre sentenças
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
