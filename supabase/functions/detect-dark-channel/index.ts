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

    // Construir prompt UNIVERSAL para QUALQUER nicho faceless
    const prompt = `Você é um especialista em identificar CANAIS FACELESS no YouTube.

DADOS DO CANAL:
- Nome: ${channelData.name}
- Descrição: ${channelData.description || 'Não disponível'}
- Títulos recentes: ${channelData.recentTitles?.join(' | ') || 'Não disponível'}

⚠️ DEFINIÇÃO UNIVERSAL DE FACELESS:

Um canal é FACELESS quando o CRIADOR/APRESENTADOR MODERNO não aparece na tela.

✅ É FACELESS (aceite qualquer um destes formatos):

**NARRAÇÃO + IMAGENS (QUALQUER QUANTIDADE):**
- 1 imagem estática + narração
- Múltiplas imagens rotativas + narração
- Dezenas de fotos em slideshow + narração
- Mix de imagens estáticas e clipes curtos + narração
- Infográficos animados + narração
- Texto animado + narração

**NARRAÇÃO + FOOTAGE:**
- Stock footage (natureza, espaço, oceano) + narração
- Footage HISTÓRICO (soldados WW2, batalhas antigas) + narração
- Documentários APENAS com narração (SEM apresentador moderno)
- Compilações de vídeos de arquivo + narração

**NARRAÇÃO + ANIMAÇÕES:**
- Motion graphics + narração
- Animações 2D/3D + narração
- Whiteboard animations + narração
- Text-to-speech + slides

**GAMING SEM FACECAM:**
- Gameplay puro (SEM webcam do jogador)
- Walkthroughs (SEM facecam)
- Screen recordings (SEM webcam)

**NICHOS ESPECÍFICOS (todos são FACELESS):**
- História/WW2: narração + footage histórico (MESMO com pessoas nas imagens)
- True Crime: narração + fotos de suspeitos (MESMO com pessoas nas fotos)
- Finanças: narração + gráficos de ações/empresas
- Ciência/Espaço: narração + footage de planetas/astronautas
- Psicologia: narração + diagramas/estudos
- Gaming: gameplay SEM facecam
- Horror Stories: narração + imagens assustadoras
- Documentários: APENAS narração (SEM apresentador moderno)
- Make Money Online: narração + screen recording
- Geopolítica: narração + mapas/análise militar
- Negócios: narração + análise de empresas

❌ NÃO É FACELESS (rejeite APENAS estes):
- Vlogger/YouTuber aparecendo na câmera
- Entrevistas com pessoas VISÍVEIS (falando na tela)
- Gameplay COM facecam/webcam
- React videos (criador reagindo na tela)
- Podcasts com vídeo dos apresentadores
- "Talking head" (pessoa MODERNA falando para câmera)
- Qualquer vídeo onde o CRIADOR MODERNO aparece

🎯 REGRA DE OURO:
- Se o canal usa NARRAÇÃO + qualquer quantidade de imagens/vídeos → FACELESS ✅
- Se o CRIADOR/APRESENTADOR MODERNO aparece NA TELA → NÃO-FACELESS ❌
- Pessoas em FOTOS HISTÓRICAS ou FOOTAGE DE ARQUIVO → FACELESS ✅

Na dúvida, considere FACELESS (melhor false positive que false negative).

Responda APENAS com JSON:
{
  "isDarkChannel": true/false,
  "confidence": 0-100,
  "primaryType": "narration" | "stock_footage" | "animation" | "gaming" | "screen_recording" | "compilation" | "documentary" | "not_faceless",
  "indicators": ["palavras-chave encontradas nos títulos/descrição"],
  "reasoning": "Explicação de 1 linha"
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
