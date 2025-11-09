import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { rawData, aiModel = 'claude-sonnet-4-5' } = await req.json();

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

    // Get API key based on model
    let apiKey: string | undefined;
    let apiUrl: string;
    let requestBody: any;

    if (aiModel.includes('claude')) {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      apiUrl = 'https://api.anthropic.com/v1/messages';
      
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada');
      }
    } else if (aiModel.includes('gemini')) {
      apiKey = Deno.env.get('GEMINI_API_KEY');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }
    } else if (aiModel.includes('gpt')) {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada. Por favor, configure a chave da OpenAI.');
      }
    } else {
      throw new Error(`Modelo não suportado: ${aiModel}`);
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

    let analysis: AnalysisResult;

    // Make API request based on model
    if (aiModel.includes('claude')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: aiModel,
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
      
    } else if (aiModel.includes('gemini')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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
        throw new Error('Gemini não retornou texto (possível bloqueio de segurança). Tente ajustar o prompt ou reduzir os dados.');
      }
      
      analysis = { markdownReport };
      
    } else if (aiModel.includes('gpt')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
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
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenAI response received');
      
      const markdownReport = data.choices?.[0]?.message?.content;
      if (!markdownReport) {
        console.error('OpenAI response missing content:', data);
        throw new Error('OpenAI não retornou conteúdo válido');
      }
      analysis = { markdownReport };

    } else {
      throw new Error('Modelo não suportado');
    }

    console.log('Analysis parsed successfully');

    // Save to database if user is authenticated
    if (userId) {
      console.log('Saving analysis to database...');
      
      const { error: insertError } = await supabase
        .from('title_analyses')
        .insert({
          user_id: userId,
          raw_data: rawData,
          ai_model: aiModel,
          analysis_result: analysis,
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
