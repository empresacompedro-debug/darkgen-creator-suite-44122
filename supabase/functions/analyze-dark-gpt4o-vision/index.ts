import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisInput {
  thumbnailUrl: string;
  videoTitle: string;
  channelName: string;
  videoDescription?: string;
  videoId?: string;
  channelId?: string;
}

interface AnalysisResult {
  isDark: boolean;
  confidence: number;
  hasFace: boolean;
  faceSize: 'none' | 'small' | 'medium' | 'large';
  contentType: string;
  reason: string;
  indicators?: any;
  method: 'gpt-4o-vision' | 'keywords' | 'cache';
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const input: AnalysisInput = await req.json();

    // PASSO 1: Verificar cache
    const { data: cached } = await supabaseClient
      .from('dark_analysis_cache')
      .select('*')
      .eq('thumbnail_url', input.thumbnailUrl)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit:', input.thumbnailUrl);
      return new Response(
        JSON.stringify({
          isDark: cached.is_dark,
          confidence: cached.confidence,
          hasFace: cached.has_face,
          faceSize: cached.face_size,
          contentType: cached.content_type,
          reason: cached.reason,
          indicators: cached.indicators,
          method: 'cache',
          timestamp: cached.analyzed_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 2: Análise por keywords (fallback rápido)
    const keywordResult = analyzeByKeywords(
      input.videoTitle,
      input.channelName,
      input.videoDescription
    );

    if (keywordResult.certainty === 'high') {
      console.log('⚡ Keywords com certeza alta:', keywordResult.reason);
      
      const result: AnalysisResult = {
        isDark: keywordResult.isDark!,
        confidence: keywordResult.score,
        hasFace: !keywordResult.isDark,
        faceSize: keywordResult.isDark ? 'none' : 'large',
        contentType: keywordResult.isDark ? 'documentary' : 'vlog',
        reason: keywordResult.reason,
        method: 'keywords',
        timestamp: new Date().toISOString(),
      };

      // Salvar no cache
      await saveToCache(supabaseClient, input, result);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 3: Usar GPT-4o Vision
    console.log('🤖 Chamando GPT-4o Vision...');
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = buildGPT4oPrompt(input);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em identificar canais YouTube dark/faceless (sem rosto). Responda SEMPRE em JSON válido.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: input.thumbnailUrl,
                  detail: 'low', // Economizar custo
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from GPT-4o');
    }

    const analysis = JSON.parse(content);

    const result: AnalysisResult = {
      isDark: analysis.isDark,
      confidence: analysis.confidence,
      hasFace: analysis.hasFace,
      faceSize: analysis.faceSize,
      contentType: analysis.contentType,
      reason: analysis.reason,
      indicators: analysis.indicators,
      method: 'gpt-4o-vision',
      timestamp: new Date().toISOString(),
    };

    // Salvar no cache
    await saveToCache(supabaseClient, input, result);

    console.log('✅ Análise GPT-4o completa:', result.isDark, result.confidence);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in analyze-dark-gpt4o-vision:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isDark: false,
        confidence: 0,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ===== FUNÇÕES AUXILIARES =====

function buildGPT4oPrompt(input: AnalysisInput): string {
  return `Você é um especialista em identificar CANAIS FACELESS no YouTube.

INFORMAÇÕES DO VÍDEO:
- Título: "${input.videoTitle}"
- Canal: "${input.channelName}"
- Descrição: "${input.videoDescription?.substring(0, 200) || 'N/A'}"

DEFINIÇÃO DE DARK/FACELESS:
Um canal é DARK/FACELESS quando o CRIADOR/APRESENTADOR MODERNO não aparece na tela.

✅ É FACELESS:
- Narração + imagens/slideshows/stock footage
- Documentários narrados (MESMO com pessoas em footage histórico)
- True Crime com fotos de suspeitos + narração
- Gaming SEM facecam/webcam
- Animações/Motion Graphics + narração
- Screen recording SEM webcam
- Qualquer formato onde o CRIADOR não aparece

❌ NÃO É FACELESS:
- Vlogs com pessoa falando para câmera
- React videos com webcam visível
- Gameplay COM facecam
- Podcasts com apresentador em vídeo
- Entrevistas com pessoas visíveis
- "Talking head" (criador moderno aparecendo)

ANALISE A THUMBNAIL fornecida:
1. Tem rosto de CRIADOR MODERNO visível?
2. Se sim, qual o tamanho/protagonismo?
3. É claramente vlog/react ou documentário/narração?
4. Considere título e nome do canal como contexto

IMPORTANTE:
- Rosto em foto histórica/arquivo → FACELESS ✅
- Rosto do criador moderno → NÃO FACELESS ❌
- Na dúvida → FACELESS ✅

Responda APENAS em JSON:
{
  "isDark": boolean,
  "confidence": number (0-100),
  "hasFace": boolean,
  "faceSize": "none" | "small" | "medium" | "large",
  "contentType": "documentary" | "narration" | "vlog" | "gaming" | "react" | "compilation" | "tutorial" | "other",
  "reason": "explicação clara e concisa em português (1 linha)",
  "indicators": {
    "thumbnail": "o que vê na thumbnail",
    "title": "análise do título",
    "overall": "conclusão"
  }
}`;
}

function analyzeByKeywords(
  videoTitle: string,
  channelName: string,
  description?: string
): { certainty: 'high' | 'low'; isDark: boolean | null; reason: string; score: number } {
  
  const text = `${videoTitle} ${channelName} ${description || ''}`.toLowerCase();

  // CERTEZA ALTA que NÃO é dark
  const excludeKeywords = ['vlog', 'react', 'reação', 'meu dia', 'comigo', 'facecam', 'ao vivo', 'live', 'entrevista'];
  
  for (const kw of excludeKeywords) {
    if (text.includes(kw)) {
      return {
        certainty: 'high',
        isDark: false,
        reason: `Contém "${kw}" - forte indicação de conteúdo com rosto`,
        score: 5,
      };
    }
  }

  // CERTEZA ALTA que É dark
  const darkKeywords = ['faceless', 'sem rosto', 'narração', 'documentário', 'documentary', 'ww2', 'wwii', 'world war', 'true crime', 'horror stories', 'mystery', 'história'];
  
  for (const kw of darkKeywords) {
    if (text.includes(kw)) {
      return {
        certainty: 'high',
        isDark: true,
        reason: `Contém "${kw}" - forte indicação de faceless`,
        score: 90,
      };
    }
  }

  // Não sabe
  return {
    certainty: 'low',
    isDark: null,
    reason: 'Não foi possível determinar por keywords',
    score: 50,
  };
}

async function saveToCache(supabaseClient: any, input: AnalysisInput, result: AnalysisResult) {
  try {
    await supabaseClient
      .from('dark_analysis_cache')
      .insert({
        thumbnail_url: input.thumbnailUrl,
        video_id: input.videoId,
        channel_id: input.channelId,
        is_dark: result.isDark,
        confidence: result.confidence,
        has_face: result.hasFace,
        face_size: result.faceSize,
        content_type: result.contentType,
        reason: result.reason,
        indicators: result.indicators,
        analysis_method: result.method,
      });
    console.log('💾 Salvo no cache');
  } catch (error) {
    console.error('⚠️ Erro ao salvar cache (pode já existir):', error);
  }
}
