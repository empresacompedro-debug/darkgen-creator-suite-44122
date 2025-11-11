import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mapModelToProvider } from '../_shared/model-mapper.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  markdownReport: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { rawData, aiModel = 'claude-sonnet-4-5' } = await req.json();

    // Map old/invalid model names to valid ones
    const modelMapping: Record<string, string> = {
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5',
      'claude-3-opus-20240229': 'claude-opus-4-1-20250805',
      'claude-3-sonnet-20240229': 'claude-sonnet-4-5',
    };
    
    if (modelMapping[aiModel]) {
      console.log(`Mapping old model ${aiModel} to ${modelMapping[aiModel]}`);
      aiModel = modelMapping[aiModel];
    }

    console.log('Received request with model:', aiModel);
    console.log('Raw data length:', rawData?.length);

    if (!rawData || rawData.trim().length === 0) {
      throw new Error('Dados vazios. Por favor, cole os dados do YouTube.');
    }

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

    console.log('User ID:', userId);

    // Map AI model to provider
    const { provider, model } = mapModelToProvider(aiModel);
    console.log(`🔄 [analyze-titles] Mapped ${aiModel} → provider: ${provider}, model: ${model}`);

    // Get API key based on provider
    let apiKey: string | undefined;
    let apiUrl: string;
    let requestBody: any;

    if (provider === 'claude') {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      apiUrl = 'https://api.anthropic.com/v1/messages';
      
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada');
      }
    } else if (provider === 'gemini' || provider === 'vertex-ai') {
      // Para Gemini ou Vertex AI, precisamos buscar a chave do usuário
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar chave Gemini ou Vertex AI do usuário
      const apiProvider = provider === 'vertex-ai' ? 'vertex-ai' : 'gemini';
      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted, vertex_config')
        .eq('user_id', userId)
        .eq('api_provider', apiProvider)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single();

      if (keyError || !keyData) {
        throw new Error(`Nenhuma chave ${apiProvider.toUpperCase()} configurada para este usuário`);
      }

      // Descriptografar chave
      const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
        p_encrypted: keyData.api_key_encrypted,
        p_user_id: userId,
      });

      if (decErr || !decrypted) {
        throw new Error(`Falha ao descriptografar chave ${apiProvider.toUpperCase()}`);
      }

      apiKey = decrypted as string;

      // Se for Vertex AI, preparar configuração especial
      if (provider === 'vertex-ai' && keyData.vertex_config) {
        // A URL será construída pelo buildGeminiOrVertexRequest
        apiUrl = ''; // Será sobrescrito
      } else {
        // API Gemini gratuita
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      }
    } else if (provider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
    } else {
      throw new Error(`Provider não suportado: ${provider}`);
    }

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

    console.log('Sending request to AI model...');

    let analysis: AnalysisResult = { markdownReport: '' };

    // Make API request based on provider
    if (provider === 'claude') {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 8192,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Claude response received');
      
      const markdownReport = data.content[0].text;
      analysis = { markdownReport };
      
    } else if (provider === 'gemini' || provider === 'vertex-ai') {
      // Buscar configuração completa para Vertex AI
      let keyInfo: any = { key: apiKey };
      
      if (provider === 'vertex-ai' && userId) {
        const { data: vertexKey } = await supabase
          .from('user_api_keys')
          .select('vertex_config')
          .eq('user_id', userId)
          .eq('api_provider', 'vertex-ai')
          .eq('is_active', true)
          .single();
        
        if (vertexKey?.vertex_config) {
          keyInfo = {
            key: apiKey,
            provider: 'vertex-ai',
            vertexConfig: vertexKey.vertex_config
          };
        }
      }

      // Construir requisição usando helper
      const { url, headers, body } = await buildGeminiOrVertexRequest(
        keyInfo,
        model,
        prompt,
        false
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const providerName = provider === 'vertex-ai' ? 'Vertex AI' : 'Gemini';
        console.error(`${providerName} API error:`, errorText);
        throw new Error(`${providerName} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response received:', JSON.stringify(data, null, 2));
      
      const candidate = data?.candidates?.[0];
      if (!candidate) {
        console.error('Invalid Gemini response structure:', data);
        throw new Error('Invalid Gemini API response: missing candidates');
      }

      let markdownReport = '';
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        markdownReport = parts
          .map((p: any) => (typeof p === 'string' ? p : (p?.text ?? p?.inlineData?.data ?? '')))
          .join('');
      } else if (typeof (candidate as any).text === 'string') {
        markdownReport = (candidate as any).text;
      }
      if (!markdownReport && typeof (data as any).text === 'string') {
        markdownReport = (data as any).text;
      }

      if (!markdownReport || !markdownReport.trim()) {
        const finishReason = (candidate as any)?.finishReason ?? data?.promptFeedback?.blockReason ?? 'unknown';
        const safety = (candidate as any)?.safetyRatings ?? data?.promptFeedback?.safetyRatings;
        console.error('Gemini missing text. finishReason:', finishReason, 'safety:', safety);

        // Retry with a compact prompt using the SAME model (no fallback)
        try {
          const compactHeader = `MODO COMPACTO:\n- Mantenha as MESMAS seções e a mesma ordem\n- Limite para: 20 títulos no total (4 por campeão) e 5 títulos finais\n- Seja objetivo e direto\n`;
          const compactPrompt = compactHeader +
            prompt
              .replace('## **✨ 50 NOVOS TÍTULOS BASEADOS NOS 5 CAMPEÕES**', '## **✨ 20 NOVOS TÍTULOS BASEADOS NOS 5 CAMPEÕES**')
              .replace('Repetir para Campeões 3, 4 e 5 até completar 50 títulos', 'Repetir para Campeões 3, 4 e 5 até completar 20 títulos')
              .replace('## ⭐ **10 TÍTULOS FINAIS COM MAIOR POTENCIAL**', '## ⭐ **5 TÍTULOS FINAIS COM MAIOR POTENCIAL**');

          console.log('Retrying with compact prompt');
          const { url: retryUrl, headers: retryHeaders, body: retryBody } = await buildGeminiOrVertexRequest(
            keyInfo,
            model,
            compactPrompt,
            false
          );
          
          const retryResp = await fetch(retryUrl, {
            method: 'POST',
            headers: retryHeaders,
            body: JSON.stringify(retryBody),
          });

          if (retryResp.ok) {
            const rdata = await retryResp.json();
            const rcand = rdata?.candidates?.[0];
            let rmd = '';
            const rparts = rcand?.content?.parts;
            if (Array.isArray(rparts) && rparts.length > 0) {
              rmd = rparts.map((p: any) => (typeof p === 'string' ? p : (p?.text ?? p?.inlineData?.data ?? ''))).join('');
            } else if (typeof (rcand as any)?.text === 'string') {
              rmd = (rcand as any).text;
            }
            if (!rmd && typeof (rdata as any).text === 'string') rmd = (rdata as any).text;
            if (rmd && rmd.trim()) {
              analysis = { markdownReport: rmd };
              console.log('Gemini compact retry succeeded');
            }
          } else {
            console.error('Gemini compact retry error:', await retryResp.text());
          }
        } catch (retryErr) {
          console.error('Compact retry failed:', retryErr);
        }

        if (!analysis.markdownReport) {
          throw new Error('Gemini não retornou texto (possível bloqueio de segurança ou limite). Tente reduzir os dados ou refazer a análise em partes.');
        }
      } else {
        analysis = { markdownReport };
      }
    } else if (provider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      // OpenAI request with user-specific key retrieval and simple rotation
      // Helper to fetch and decrypt the user's current OpenAI key
      const getUserOpenAIKey = async (): Promise<{ key: string; id: string } | null> => {
        if (!userId) return null;
        const { data: keys, error } = await supabase
          .from('user_api_keys')
          .select('id, api_key_encrypted, is_active, priority, is_current')
          .eq('user_id', userId)
          .eq('api_provider', 'openai')
          .eq('is_active', true)
          .order('is_current', { ascending: false })
          .order('priority', { ascending: true })
          .limit(1);
        if (error) {
          console.error('Erro ao buscar chaves OpenAI do usuário:', error);
          return null;
        }
        if (!keys || keys.length === 0) return null;
        const k = keys[0];
        const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
          p_encrypted: k.api_key_encrypted,
          p_user_id: userId,
        });
        if (decErr || !decrypted) {
          console.error('Erro ao descriptografar chave OpenAI do usuário:', decErr);
          throw new Error('Falha ao descriptografar API Key do usuário');
        }
        return { key: decrypted as string, id: k.id };
      };

      const envOpenAIKey = Deno.env.get('OPENAI_API_KEY');

      let currentKeyInfo: { key: string; id: string } | null = null;
      let lastErrorText: string | null = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (!currentKeyInfo) {
          try {
            currentKeyInfo = await getUserOpenAIKey();
          } catch (e) {
            console.error('Erro ao obter chave do usuário:', e);
          }
        }

        const openaiKeyToUse = currentKeyInfo?.key || envOpenAIKey;
        if (!openaiKeyToUse) {
          throw new Error('OPENAI_API_KEY não configurada');
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKeyToUse}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 8192,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastErrorText = errorText;
          console.error('OpenAI API error:', response.status, errorText);

          // Se for erro de quota/rate limit e estivermos usando chave do usuário, tentar rotacionar
          if (response.status === 429 && currentKeyInfo) {
            try {
              await supabase
                .from('user_api_keys')
                .update({
                  is_active: false,
                  is_current: false,
                  quota_status: { exceeded: true, exceeded_at: new Date().toISOString() },
                })
                .eq('id', currentKeyInfo.id);
              console.log('Chave marcada como esgotada, tentando próxima...');
              currentKeyInfo = null;
              continue; // tentar novamente com próxima chave
            } catch (rotErr) {
              console.error('Erro ao rotacionar chave:', rotErr);
            }
          }

          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('OpenAI response received');

        const markdownReport = data.choices?.[0]?.message?.content;
        if (!markdownReport) {
          console.error('OpenAI response missing content:', data);
          throw new Error('OpenAI não retornou conteúdo válido');
        }

        // Atualiza uso da chave do usuário
        if (currentKeyInfo) {
          await supabase
            .from('user_api_keys')
            .update({ last_used_at: new Date().toISOString(), is_current: true })
            .eq('id', currentKeyInfo.id);
        }

        analysis = { markdownReport };
        break;
      }

      if (!analysis.markdownReport) {
        throw new Error(lastErrorText || 'Falha ao obter resposta do OpenAI');
      }
      
    } else {
      throw new Error(`Modelo não suportado: ${aiModel}`);
    }

    console.log('Analysis parsed successfully');

    // Save to database if user is authenticated
    if (userId) {
      console.log('Saving analysis to database...');
      
      // Count videos in rawData (simple heuristic: count "visualizações" occurrences)
      const videosCount = (rawData.match(/visualizações/gi) || []).length;
      console.log(`Contados ${videosCount} vídeos no rawData`);
      
      const { error: insertError } = await supabase
        .from('title_analyses')
        .insert({
          user_id: userId,
          raw_data: rawData,
          ai_model: aiModel,
          analysis_result: analysis,
          videos_count: videosCount,
        });

      if (insertError) {
        console.error('Error saving to database:', insertError);
        // Don't throw, just log - we still want to return the analysis
      } else {
        console.log('Analysis saved to database successfully');
      }
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-titles function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar análise';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
