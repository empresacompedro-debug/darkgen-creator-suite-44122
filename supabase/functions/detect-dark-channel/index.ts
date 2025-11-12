import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelData, aiModel } = await req.json();
    
    if (!channelData) {
      throw new Error('Channel data is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Construir prompt aprimorado focando em canais FACELESS
    const prompt = `Analise se este canal do YouTube é um "CANAL FACELESS" (sem pessoas reais aparecendo).

DADOS DO CANAL:
- Nome: ${channelData.name}
- Descrição: ${channelData.description || 'Não disponível'}
- Títulos recentes: ${channelData.recentTitles?.slice(0, 5).join(', ') || 'Não disponível'}

⚠️ CRÍTICO - DEFINIÇÃO DE FACELESS:
Um canal FACELESS é aquele onde NUNCA aparecem pessoas reais na tela. Exemplos:

✅ É FACELESS:
1. **Narração com 1 IMAGEM o vídeo todo** (ex: foto de WW2 + voz narrando)
2. **Banco de vídeos/fotos de arquivo** (stock footage, historical footage, clips históricos)
3. **Animações/Motion Graphics** (texto animado, gráficos, sem pessoas)
4. **IA Voice-over com slides/imagens** (voz robótica + apresentação de slides)
5. **Compilações editadas SEM apresentador** (apenas clipes, sem webcam)
6. **Screen recordings** (tutoriais de tela, sem rosto visível)
7. **Documentários narrados** (apenas voz + imagens/vídeos de arquivo)

❌ NÃO É FACELESS (REJEITAR):
- Vlogs (criador aparece na câmera)
- Entrevistas (pessoas visíveis)
- Gameplay com WEBCAM/FACECAM
- Reacts (criador na tela)
- Podcasts com vídeo dos apresentadores
- "Talking head" (pessoa falando para câmera)
- Qualquer formato onde pessoas reais aparecem

FOCO ESPECIAL:
- Canais de História/WW2/True Crime geralmente SÃO faceless (narração + imagens)
- Canais de ciência/documentário geralmente SÃO faceless (voz + vídeos de arquivo)
- Gaming SEM facecam é faceless
- Tutoriais de software SEM webcam são faceless

Baseado nos dados, responda APENAS com JSON:
{
  "isDarkChannel": true/false,
  "confidence": 0-100,
  "primaryType": "narration_images" | "stock_videos" | "animations" | "ai_voice" | "compilations" | "screen_recording" | "not_faceless",
  "indicators": ["indicadores encontrados"],
  "reasoning": "Explicação de 1-2 linhas focando em PRESENÇA ou AUSÊNCIA de pessoas reais"
}`;

    console.log('Sending request to Lovable AI...');
    
    // Normalize and validate model; default to supported Gemini if invalid
    const aliasMap: Record<string, string> = {
      'gemini-2.5-flash': 'google/gemini-2.5-flash',
      'gemini-2.5-pro': 'google/gemini-2.5-pro',
      'gpt-5': 'openai/gpt-5',
      'gpt-5-mini': 'openai/gpt-5-mini',
      'gpt-5-nano': 'openai/gpt-5-nano',
      'claude-sonnet-4.5': 'google/gemini-2.5-flash', // hard fallback
      'claude-sonnet-4': 'google/gemini-2.5-flash',
      'claude-sonnet-3.5': 'google/gemini-2.5-flash'
    };

    const allowedModels = new Set([
      'openai/gpt-5-mini',
      'openai/gpt-5',
      'openai/gpt-5-nano',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash-image'
    ]);

    const normalized = aiModel ? (aliasMap[aiModel] || aiModel) : undefined;
    const modelToUse = normalized && allowedModels.has(normalized) ? normalized : 'google/gemini-2.5-flash';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are an expert YouTube channel analyst specialized in identifying faceless/dark channels. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      // Tratamento específico para erro 402 (sem créditos)
      if (response.status === 402) {
        console.warn('⚠️ Lovable AI sem créditos. Análise de dark channel desabilitada temporariamente.');
        return new Response(
          JSON.stringify({ 
            error: 'NO_CREDITS',
            isDarkChannel: false,
            confidence: 0,
            primaryType: 'unknown',
            indicators: [],
            reasoning: 'Análise indisponível (sem créditos Lovable AI)',
            hasEnoughData: false
          }),
          { 
            status: 200, // Retorna 200 para não quebrar o cliente
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // Tratamento para erro 429 (rate limit)
      if (response.status === 429) {
        console.warn('⚠️ Rate limit do Lovable AI atingido.');
        return new Response(
          JSON.stringify({ 
            error: 'RATE_LIMIT',
            isDarkChannel: false,
            confidence: 0,
            primaryType: 'unknown',
            indicators: [],
            reasoning: 'Análise temporariamente indisponível (rate limit)',
            hasEnoughData: false
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response:', data);

    let analysisText = data.choices[0].message.content;
    
    // Limpar markdown se presente
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Invalid JSON response from AI');
    }

    // Validar estrutura da resposta (aceita null para isDarkChannel)
    if (analysis.isDarkChannel === null || analysis.isDarkChannel === undefined) {
      analysis.isDarkChannel = false;
      analysis.hasEnoughData = false;
    } else {
      analysis.hasEnoughData = true;
    }
    
    if (typeof analysis.confidence !== 'number' || !analysis.primaryType) {
      throw new Error('Invalid analysis structure');
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in detect-dark-channel:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        isDarkChannel: false,
        confidence: 0,
        primaryType: 'unknown',
        indicators: [],
        reasoning: 'Erro na análise'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
