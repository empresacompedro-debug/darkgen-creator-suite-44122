import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiKey, updateApiKeyUsage, getApiKeyWithHierarchicalFallback } from "../_shared/get-api-key.ts";
import { buildGeminiOrVertexRequest } from "../_shared/vertex-helpers.ts";
import { mapModelToProvider } from "../_shared/model-mapper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader ?? "" } },
      }
    );

    // Try to get user (optional - function is public)
    let userId: string | undefined;
    try {
      const token = authHeader?.replace("Bearer ", "");
      console.log(`[generate-scene-prompts-v2] 🔐 Auth header present: ${!!authHeader}`);
      console.log(`[generate-scene-prompts-v2] 🔐 Token extracted: ${token?.substring(0, 20)}...`);
      
      if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError) {
          console.log(`[generate-scene-prompts-v2] ⚠️ Error getting user:`, userError);
        }
        userId = user?.id;
        console.log(`[generate-scene-prompts-v2] 👤 User ID: ${userId || 'undefined'}`);
      } else {
        console.log(`[generate-scene-prompts-v2] 🔑 Token is anon key, skipping user auth`);
      }
    } catch (e) {
      console.log(`[generate-scene-prompts-v2] ⚠️ Auth error:`, e);
      console.log("No authenticated user, using global keys");
    }

    const { 
      script, 
      generationMode = 'automatic',
      sceneStyle = 'realistic',
      characters = [],
      optimizeFor = 'midjourney',
      language = 'pt-BR',
      includeText = false,
      aiModel = 'claude-3-5-sonnet-20241022'
    } = await req.json();

    if (!script) {
      return new Response(
        JSON.stringify({ error: "Script é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-scene-prompts-v2] Iniciando - Modelo: ${aiModel}, Script: ${script.length} chars, Personagens: ${Array.isArray(characters) ? characters.length : 0}`);

    // Usar helper para mapear modelo → provider
    const { provider: providerKey, model: actualModel } = mapModelToProvider(aiModel);

    // Get API key
    const keyData = providerKey === 'vertex-ai'
      ? await getApiKey(userId, 'vertex-ai', supabaseClient)
      : providerKey === 'gemini'
      ? await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabaseClient)
      : await getApiKey(userId, providerKey, supabaseClient);
    
    if (!keyData) {
      return new Response(
        JSON.stringify({ error: `Nenhuma chave de API encontrada para ${providerKey}. Configure em Configurações.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { key: apiKey, keyId } = keyData;

    // Build prompt
    const styleMap: Record<string, string> = {
      realistic: "estilo fotográfico realista",
      cinematic: "estilo cinematográfico épico",
      animated: "estilo de animação 3D",
      artistic: "estilo artístico pintado",
      comic: "estilo de quadrinhos/graphic novel"
    };

    const modelOptimizations: Record<string, string> = {
      midjourney: "Otimizado para Midjourney v6",
      flux: "Otimizado para Flux.1 Dev/Pro",
      dalle: "Otimizado para DALL-E 3",
      stable: "Otimizado para Stable Diffusion XL"
    };

    let characterSection = "";
    if (Array.isArray(characters) && characters.length > 0) {
      characterSection = "\n\n## PERSONAGENS FIXOS:\n";
      characters.forEach((char: any, idx: number) => {
        characterSection += `\n### Personagem ${idx + 1}: ${char.name}\n`;
        characterSection += `- Aparência: ${char.appearance}\n`;
        if (char.clothing) characterSection += `- Roupa: ${char.clothing}\n`;
        if (char.characteristics) characterSection += `- Características: ${char.characteristics}\n`;
      });
      characterSection += "\n**IMPORTANTE**: Use exatamente estas descrições em TODAS as cenas onde os personagens aparecem para manter consistência visual.\n";
    }

    const prompt = `Você é um especialista em criar prompts detalhados para geração de imagens com IA.

${characterSection}

# TAREFA
Analise o roteiro abaixo e gere prompts para cada cena visual importante.

# ESTILO VISUAL
${styleMap[sceneStyle] || styleMap.realistic}

# OTIMIZAÇÃO
${modelOptimizations[optimizeFor] || modelOptimizations.midjourney}

# MODO DE GERAÇÃO
${generationMode === 'automatic' ? 'Identifique automaticamente as cenas visuais chave' : 'Crie um prompt para CADA fala/narração'}

# IDIOMA DOS PROMPTS
${language === 'pt-BR' ? 'Português brasileiro' : 'Inglês'}

# INCLUIR TEXTO NA IMAGEM
${includeText ? 'SIM - Especifique textos que devem aparecer na imagem usando aspas' : 'NÃO - Sem texto nas imagens'}

# ROTEIRO
${script}

# FORMATO DA RESPOSTA
Para cada cena, retorne:

**Cena [número]: [título breve]**
[Prompt detalhado em ${language === 'pt-BR' ? 'português' : 'inglês'}]

REGRAS:
- Seja extremamente descritivo (iluminação, ângulo, composição, cores)
- Mantenha personagens consistentes usando as descrições fornecidas
- ${includeText ? 'Especifique textos entre aspas quando necessário' : 'Não inclua texto nas imagens'}
- Use termos técnicos de fotografia/cinema
- Cada prompt deve ter 50-150 palavras`;

    // Prepare streaming
    let apiUrl: string;
    let requestBody: any;
    let requestHeaders: Record<string, string>;

    if (providerKey === "claude") {
      apiUrl = "https://api.anthropic.com/v1/messages";
      requestHeaders = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };
      requestBody = {
        model: actualModel,
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      };
    } else if (providerKey === "gemini" || providerKey === "vertex-ai") {
      const { url, headers: apiHeaders, body } = await buildGeminiOrVertexRequest(keyData, actualModel, prompt, true);
      apiUrl = url;
      requestHeaders = apiHeaders;
      requestBody = body;
    } else {
      // OpenAI
      apiUrl = "https://api.openai.com/v1/chat/completions";
      requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      };
      
      const isNewerModel = actualModel.includes("gpt-4.1") || 
                          actualModel.includes("gpt-5") || 
                          actualModel.includes("o3-") || 
                          actualModel.includes("o4-");
      
      if (isNewerModel) {
        requestBody = {
          model: actualModel,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 4096,
          stream: true,
        };
        console.log(`[generate-scene-prompts-v2] Using newer model parameters (max_completion_tokens, no temperature)`);
      } else {
        requestBody = {
          model: actualModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        };
        console.log(`[generate-scene-prompts-v2] Using legacy model parameters (max_tokens, temperature)`);
      }
    }

    console.log(`[generate-scene-prompts-v2] Chamando ${providerKey} API...`);

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[generate-scene-prompts-v2] Erro API ${providerKey}:`, apiResponse.status, errorText);
      
      // Handle specific errors
      if (apiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos ou adicione outra chave de API em Configurações." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (providerKey === "gemini" && errorText.includes("safety")) {
        return new Response(
          JSON.stringify({ error: "Conteúdo bloqueado por políticas de segurança. Tente ajustar o roteiro ou usar outro modelo (Claude/GPT)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro ao chamar ${providerKey}: ${errorText}` }),
        { status: apiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = apiResponse.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        let totalChunks = 0;

        console.log(`[generate-scene-prompts-v2] ✅ Iniciando streaming de ${providerKey}...`);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`[generate-scene-prompts-v2] 🏁 Stream do ${providerKey} concluído. Total de chunks enviados: ${totalChunks}`);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine.startsWith(":")) continue;

              if (providerKey === "claude") {
                if (trimmedLine.startsWith("data: ")) {
                  const data = trimmedLine.slice(6);
                  if (data === "[DONE]") continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                      const textChunk = parsed.delta.text;
                      const message = `data: ${JSON.stringify({ text: textChunk })}\n\n`;
                      controller.enqueue(encoder.encode(message));
                      totalChunks++;
                      console.log(`[generate-scene-prompts-v2] 📤 Claude chunk #${totalChunks}: "${textChunk.substring(0, 50)}${textChunk.length > 50 ? '...' : ''}"`);
                    }
                  } catch (e) {
                    console.error("[generate-scene-prompts-v2] ❌ Parse error (Claude):", e);
                  }
                }
              } else if (providerKey === "gemini" || providerKey === "vertex-ai") {
                if (trimmedLine.startsWith("data: ")) {
                  const data = trimmedLine.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      const message = `data: ${JSON.stringify({ text })}\n\n`;
                      controller.enqueue(encoder.encode(message));
                      totalChunks++;
                      console.log(`[generate-scene-prompts-v2] 📤 Gemini chunk #${totalChunks}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                    }
                  } catch (e) {
                    console.error("[generate-scene-prompts-v2] ❌ Parse error (Gemini):", e);
                  }
                }
              } else {
                // OpenAI
                if (trimmedLine.startsWith("data: ")) {
                  const data = trimmedLine.slice(6);
                  if (data === "[DONE]") continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) {
                      const message = `data: ${JSON.stringify({ text })}\n\n`;
                      controller.enqueue(encoder.encode(message));
                      totalChunks++;
                      console.log(`[generate-scene-prompts-v2] 📤 OpenAI chunk #${totalChunks}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                    }
                  } catch (e) {
                    console.error("[generate-scene-prompts-v2] ❌ Parse error (OpenAI):", e);
                  }
                }
              }
            }
          }

          const doneMessage = encoder.encode(`data: [DONE]\n\n`);
          controller.enqueue(doneMessage);
          console.log(`[generate-scene-prompts-v2] ✅ Enviado [DONE]`);
          
          // Update API key usage
          if (userId && keyId && keyId !== 'global') {
            await updateApiKeyUsage(userId, providerKey, supabaseClient, keyId);
          }
          
          controller.close();
          console.log(`[generate-scene-prompts-v2] ✅ Stream finalizado com sucesso - ${totalChunks} chunks enviados`);
        } catch (error) {
          console.error(`[generate-scene-prompts-v2] ❌ Erro no streaming:`, error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[generate-scene-prompts-v2] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
