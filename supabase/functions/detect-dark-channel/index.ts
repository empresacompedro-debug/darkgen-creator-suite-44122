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

    // Construir prompt detalhado para análise
    const prompt = `Analise se este canal do YouTube é um "Canal Dark" (canal sem rosto/faceless channel).

DADOS DO CANAL:
- Nome: ${channelData.name}
- Descrição: ${channelData.description || 'Não disponível'}
- Títulos recentes dos vídeos: ${channelData.recentTitles?.slice(0, 5).join(', ') || 'Não disponível'}
- Tipo de conteúdo (se visível): ${channelData.contentType || 'Desconhecido'}

CRITÉRIOS PARA CANAL DARK:
Um canal dark/faceless é identificado por:
1. **Narração com Imagens**: Usa voz em off + imagens estáticas, slides, fotos de arquivo
2. **Vídeos de Arquivo (Stock Videos)**: Usa apenas vídeos de stock sem aparecer pessoa
3. **Animações/Motion Graphics**: Usa apenas animações, texto animado, gráficos
4. **IA/Texto-para-Voz**: Usa voz gerada por IA ou robótica com imagens
5. **Compilações**: Compilações de clipes sem apresentador visível
6. **Tutoriais de Tela**: Screen recordings sem aparecer o criador

CONTRA-INDICADORES (NÃO é dark):
- Vlogs pessoais
- Aparições do criador
- Entrevistas em vídeo
- Gameplay com webcam
- Reacts com o criador visível

Baseado nos dados fornecidos, responda APENAS com um JSON neste formato exato:
{
  "isDarkChannel": true/false,
  "confidence": 0-100,
  "primaryType": "narration_images" | "stock_videos" | "animations" | "ai_voice" | "compilations" | "screen_recording" | "unknown" | "not_dark",
  "indicators": ["lista", "de", "indicadores", "encontrados"],
  "reasoning": "Explicação breve de 1-2 linhas"
}`;

    console.log('Sending request to Lovable AI...');
    
    const modelToUse = aiModel || 'google/gemini-2.5-flash';

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
