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
    // Obter o token do Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar cliente Supabase com o token do usuário
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Validar o usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message || 'User not found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', user.id);

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

    // Criar prompts baseados no nível e modo de texto
    const masterSystemPrompt = `🧠 PROMPT MESTRE — Interpretação e Modelagem de Thumbnails

Você é um sistema especializado em interpretação visual de thumbnails de YouTube e geração de prompts técnicos detalhados para recriá-las em ferramentas de geração de imagem (Hugging Face, Pollinations, Stable Diffusion, Leonardo AI ou Midjourney).

Sua tarefa é analisar e retornar um prompt técnico descritivo, completo e reproduzível, contendo:

📌 TEMA E CONTEXTO — tipo de vídeo (histórico, curioso, emocional, educativo, etc.) e mensagem geral da thumbnail.

📌 COMPOSIÇÃO VISUAL — número e posição das pessoas ou objetos, enquadramento, fundo, perspectiva e iluminação.

📌 ESTILO ARTÍSTICO OU FOTOGRÁFICO — (cinematográfico, vintage, digital painting, hiper-realista, flat, etc.).

📌 CORES E ATMOSFERA — paleta dominante, contraste, brilho e sensação visual.

📌 TEXTO (SE HOUVER) — conteúdo exato do texto, cor, fonte, tamanho e posição (inferior, central, lateral).

📌 OUTROS DETALHES TÉCNICOS — textura, tipo de lente, qualidade da imagem, profundidade de campo, ruído, e proporção recomendada (16:9).

O estilo do texto deve ser técnico e objetivo, ideal para modelos como Hugging Face, Pollinations e Stable Diffusion, priorizando descrições concretas e evitando linguagem poética ou subjetiva.

Importante: foque no que está visível, não no significado simbólico da imagem.

RETORNE a análise em formato JSON com a seguinte estrutura:
{
  "prompt_com_texto": "descrição detalhada incluindo todo o texto presente",
  "prompt_sem_texto": "a mesma descrição, mas omitindo qualquer texto",
  "metadata": {
    "tema": "string",
    "estilo": "string",
    "emocao": "string",
    "paleta_cores": ["cor1", "cor2", "cor3"],
    "quantidade_pessoas": number,
    "plano": "string (close, médio, geral, etc)",
    "epoca": "string",
    "ambiente": "string"
  }
}`;

    const systemPrompts = {
      identical: `${masterSystemPrompt}

NÍVEL: IDÊNTICO - Recriação pixel-perfect

Analise cuidadosamente esta imagem com extremo requinte de detalhes.

ANÁLISE REQUERIDA:
- Descreva TODOS os elementos visuais com precisão fotográfica
- Especifique cores exatas (tons, saturação, brilho)
- Detalhe posicionamento preciso de CADA elemento
- Descreva expressões faciais, ângulos de câmera, iluminação
- Para prompt_com_texto: Inclua TODOS os textos visíveis (fontes, tamanhos, cores, efeitos, posição exata)
- Para prompt_sem_texto: Omita completamente qualquer menção a texto
- Mencione estilo artístico, técnicas de composição
- Detalhe texturas, sombras, profundidade
- Especifique resolução e qualidade esperadas

FORMATO DOS PROMPTS:
Cada prompt (com_texto e sem_texto) deve ser um parágrafo fluido e técnico de 300-500 palavras, descrevendo a imagem de forma precisa e reproduzível para modelos de geração de imagem.

RETORNE APENAS O JSON, sem texto adicional antes ou depois.`,

      similar: `${masterSystemPrompt}

NÍVEL: SIMILAR - Captura de estilo e essência

Analise cuidadosamente esta imagem focando no ESTILO VISUAL DOMINANTE.

ANÁLISE REQUERIDA:
- Identifique e descreva o estilo visual dominante
- Capture a paleta de cores principal
- Descreva o layout e composição geral
- Identifique padrões visuais e elementos recorrentes
- Mencione técnicas artísticas utilizadas
- Descreva mood, atmosfera e impacto visual
- Inclua tipo de conteúdo (pessoa, objeto, paisagem, etc)
- Para prompt_com_texto: Descreva o estilo geral e posicionamento do texto
- Para prompt_sem_texto: Omita completamente qualquer menção a texto
- Especifique elementos de design (efeitos, filtros)

FORMATO DOS PROMPTS:
Cada prompt deve ser um parágrafo fluido e técnico de 200-300 palavras, focando em ESTILO, não em replicação exata.

RETORNE APENAS O JSON, sem texto adicional antes ou depois.`,

      concept: `${masterSystemPrompt}

NÍVEL: CONCEITUAL - Ideia central e reimaginação

Analise esta imagem focando no CONCEITO e MENSAGEM CENTRAL.

ANÁLISE REQUERIDA:
- Identifique o conceito/ideia principal transmitida
- Capture a emoção e mensagem central
- Descreva o tema e narrativa visual
- Mencione elementos simbólicos visuais (não metafóricos)
- Analise o impacto visual da composição
- Identifique arquétipos visuais utilizados
- Sugira direções criativas para reimaginação
- Para prompt_com_texto: Mencione o papel do texto na mensagem geral
- Para prompt_sem_texto: Omita completamente qualquer menção a texto
- Foque em "O QUE" a imagem comunica visualmente

FORMATO DOS PROMPTS:
Cada prompt deve ser um parágrafo fluido e técnico de 150-250 palavras, focando na IDEIA CENTRAL e possibilidades criativas.

RETORNE APENAS O JSON, sem texto adicional antes ou depois.`
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
