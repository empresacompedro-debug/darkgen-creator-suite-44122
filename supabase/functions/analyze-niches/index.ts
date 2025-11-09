import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateNicheMetrics, type Video, type NicheAnalysis } from '../_shared/niche-analyzer.ts';

// Helper para determinar maxTokens baseado no modelo
function getMaxTokensForModel(model: string): number {
  // Gemini Pro - contexto de 2M tokens, limitamos output para qualidade
  if (model.includes('gemini-2.5-pro')) {
    return 16384;  // Output tokens para resposta JSON detalhada
  }
  // Gemini Flash e Flash Lite - contexto de 1M tokens
  if (model.includes('gemini')) {
    return 8192;
  }
  // Claude Sonnet 4.5 - contexto de 200K tokens
  if (model.includes('claude-sonnet-4-5')) {
    return 16384;
  }
  // Claude 3.7 e outros - contexto de 200K tokens
  if (model.includes('claude')) {
    return 8192;
  }
  // GPT modelos
  if (model.includes('gpt')) {
    return 8192;
  }
  return 8192; // fallback
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { videos, granularity = 'standard', aiModel = 'gemini-2.5-flash' } = await req.json() as { videos: Video[], granularity?: 'micro' | 'standard', aiModel?: string };

    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ niches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxTokens = getMaxTokensForModel(aiModel);
    
    // Determinar limite seguro baseado no modelo (usa o que vier do youtube-search)
    const getModelSafeLimit = (model: string): number => {
      if (model.includes('gemini-2.5-pro')) return 800;
      if (model.includes('gemini-2.5-flash-lite')) return 400;
      if (model.includes('gemini-2.5-flash')) return 600;
      if (model.includes('claude')) return 800;
      if (model.includes('gpt')) return 600;
      return 600;
    };

    const safeLimit = getModelSafeLimit(aiModel);
    const videosForAnalysis = videos.slice(0, Math.min(videos.length, safeLimit));
    
    console.log(`🤖 Usando ${aiModel} com ${maxTokens} max tokens`);
    console.log(`📦 Vídeos recebidos: ${videos.length}`);
    console.log(`🎯 Limite do modelo: ${safeLimit}`);
    console.log(`✅ Analisando ${videosForAnalysis.length} vídeos`);
    
    const videoTitles = videosForAnalysis.map((v, i) => `${i + 1}. [ID:${v.id}] ${v.title}`).join('\n');

    const isUltraSpecific = granularity === 'micro';
    
    const prompt = `Você é um especialista em descobrir MICRO-SUBNICHOS ultra-específicos no YouTube para canais "DARK" (sem rosto).

${isUltraSpecific ? `
⚡ MODO MICRO-SUBNICHO ATIVADO - Seja o mais GRANULAR possível!

🎯 IMPORTANTE: Você NÃO deve identificar categorias amplas ou sub-nichos. 
Identifique TÓPICOS ESPECÍFICOS DE VÍDEOS que formam um padrão repetível.

📚 EXEMPLOS DE MICRO-SUBNICHOS (nível de especificidade desejado):
✅ CORRETO: "As 10 armas mais aterrorizantes da Segunda Guerra"
✅ CORRETO: "Meditação guiada de 10 minutos para acalmar crise de ansiedade"
✅ CORRETO: "Como criar planilha de orçamento pessoal do zero no Excel"
✅ CORRETO: "Histórias de vingança no ambiente de trabalho (Reddit)"
✅ CORRETO: "Sons de chuva e piano para dormir profundamente (8h)"
✅ CORRETO: "A vida diária de um gladiador: Realidade vs. Ficção"
✅ CORRETO: "Como a Enigma Machine foi decifrada na Segunda Guerra"
✅ CORRETO: "Tesouro Direto vs. CDB: Onde seu dinheiro rende mais?"
✅ CORRETO: "10 sites que te pagam em dólar para fazer tarefas simples"
✅ CORRETO: "Meu chefe roubou minha ideia, então eu fiz ele ser demitido"

❌ ERRADO: "História da Segunda Guerra Mundial" (muito amplo)
❌ ERRADO: "Meditação" (muito genérico)
❌ ERRADO: "Tutoriais de Excel" (ainda é um sub-nicho)
❌ ERRADO: "Histórias do Reddit" (ainda é categoria)
❌ ERRADO: "Finanças Pessoais" (ainda é nicho amplo)

🎬 CONTEXTO: Esses vídeos são adequados para canais "DARK" (sem rosto):
- Narração sobre imagens de arquivo (stock footage)
- Animações simples e texto na tela
- Tutoriais com gravação de tela (screen recording)
- Compilados e listas Top 10
- Sons ambiente e música para relaxamento
- Histórias e curiosidades narradas

📋 SUA TAREFA:
Agrupe vídeos que compartilham o mesmo TÓPICO ULTRA-ESPECÍFICO.
Cada micro-subnicho deve ser um "tema de vídeo" que você poderia fazer 10-20 vídeos sobre.
Cada micro-subnicho deve ter um público-alvo MUITO BEM DEFINIDO e uma promessa CLARA.

IMPORTANTE: Prefira criar MAIS micro-subnichos (10-15) com poucos vídeos cada (3-8 vídeos) 
do que poucos nichos amplos com muitos vídeos.
` : `
🔍 CONTEXTO: Estes vídeos vêm de MÚLTIPLAS CATEGORIAS do YouTube.
Seu trabalho é identificar PADRÕES ESPECÍFICOS e TENDÊNCIAS que conectam vídeos similares.

📋 TAREFA: Identifique nichos ESPECÍFICOS (não categorias amplas).
Exemplos de especificidade adequada:
✅ "Tutoriais Blender 3D para Arquitetos Iniciantes"
✅ "Meditação Guiada para Alívio de Ansiedade"
✅ "Histórias de Terror do Reddit (r/nosleep)"
`}

📋 PARA CADA NICHO IDENTIFICADO, FORNEÇA:
1. **Nome ultra-específico** - Seja DESCRITIVO, não genérico
2. **Descrição em 1 frase** - Público-alvo + benefício/promessa
3. **Lista de IDs dos vídeos** (use [ID:xxx] dos títulos abaixo)
4. **3-5 palavras-chave principais**
5. **Especificidade**: ${isUltraSpecific ? '"micro-niche" (SEMPRE)' : '"broad", "sub-niche", ou "micro-niche"'}

🎯 CRITÉRIOS DE AGRUPAMENTO:
- Vídeos com TEMA/PÚBLICO/FORMATO similar = MESMO MICRO-SUBNICHO
- Identifique entre ${isUltraSpecific ? '10 a 15' : '5 a 12'} nichos distintos
- Priorize micro-subnichos com ALTO POTENCIAL (muitas views, poucos canais únicos)
- NUNCA use termos genéricos como "vídeos", "canal", "conteúdo"
- Agrupe por INTENÇÃO ESPECÍFICA do espectador

📊 CRITÉRIOS DE OPORTUNIDADE (priorize estes):
- Micro-subnichos com muitas views mas poucos canais diferentes
- Temas recorrentes e ESPECÍFICOS com alta performance
- Padrões de títulos que funcionam bem e são REPLICÁVEIS

Vídeos para análise:
${videoTitles}

Retorne APENAS JSON válido (sem markdown, sem \`\`\`json):
{
  "niches": [
    {
      "name": "Nome Ultra-Específico do Micro-Subnicho",
      "description": "Descrição clara focada no público e benefício",
      "videoIds": ["id1", "id2", "id3"],
      "keywords": ["palavra1", "palavra2", "palavra3"],
      "specificity": "micro-niche"
    }
  ]
}`;

    // Detectar provider baseado no modelo
    const isGemini = aiModel.includes('gemini');
    const isClaude = aiModel.includes('claude');

    let aiResponse = '';

    if (isGemini) {
      // ===== GEMINI =====
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      // Detectar qual modelo Gemini (pro, flash, lite)
      const geminiModel = aiModel.includes('pro') ? 'gemini-2.5-pro' :
                          aiModel.includes('lite') ? 'gemini-2.5-flash-lite' :
                          'gemini-2.5-flash';

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;

      console.log(`📦 Chamando ${geminiModel} com ${maxTokens} maxOutputTokens`);

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: maxTokens,
          }
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (isClaude) {
      // ===== CLAUDE (Anthropic) =====
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      console.log(`📦 Chamando ${aiModel} com ${maxTokens} max_tokens`);

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiModel,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error('Claude API error:', errorText);
        throw new Error(`Claude API error: ${claudeResponse.status}`);
      }

      const claudeData = await claudeResponse.json();
      aiResponse = claudeData.content?.[0]?.text || '';

    } else {
      throw new Error(`Modelo não suportado: ${aiModel}`);
    }

    console.log(`🤖 AI Response (${aiResponse.length} chars):`, aiResponse.substring(0, 500));

    // Parse AI response com robustez
    let parsedNiches;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Tentar extrair JSON com regex se parse direto falhar
      try {
        parsedNiches = JSON.parse(cleanedResponse);
      } catch {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedNiches = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!parsedNiches.niches || !Array.isArray(parsedNiches.niches)) {
      throw new Error('Invalid AI response format');
    }
    
    // FALLBACK: Se IA retornou 0 nichos, tentar novamente com prompt mais assertivo
    if (parsedNiches.niches.length === 0 && videos.length >= 20) {
      console.log('⚠️ IA retornou 0 nichos. Tentando novamente com prompt mais assertivo...');
      
      const fallbackPrompt = `IMPORTANTE: Você DEVE encontrar no mínimo 8 micro-subnichos ultra-específicos.
      
Agrupe vídeos similares em temas MUITO ESPECÍFICOS (3+ vídeos por grupo).

Vídeos:
${videosForAnalysis.map((v, i) => `${i + 1}. [ID:${v.id}] ${v.title}`).join('\n')}

Retorne APENAS JSON válido:
{
  "niches": [
    {
      "name": "Nome Ultra-Específico",
      "description": "Descrição clara",
      "videoIds": ["id1", "id2", "id3"],
      "keywords": ["palavra1", "palavra2"],
      "specificity": "micro-niche"
    }
  ]
}`;

      // Usar mesma lógica de API baseada no modelo
      let fallbackAI = '';
      
      if (isGemini) {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
        
        const geminiModel = aiModel.includes('pro') ? 'gemini-2.5-pro' :
                            aiModel.includes('lite') ? 'gemini-2.5-flash-lite' :
                            'gemini-2.5-flash';
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
        
        const fallbackResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fallbackPrompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: maxTokens,
            }
          })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          fallbackAI = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        
      } else if (isClaude) {
        const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
        if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
        
        const fallbackResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: aiModel,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: fallbackPrompt }]
          })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          fallbackAI = fallbackData.content?.[0]?.text || '';
        }
      }

      if (fallbackAI) {
        try {
          let cleanFallback = fallbackAI.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          try {
            parsedNiches = JSON.parse(cleanFallback);
          } catch {
            const jsonMatch = cleanFallback.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsedNiches = JSON.parse(jsonMatch[0]);
          }
          console.log(`✅ Fallback bem-sucedido: ${parsedNiches.niches?.length || 0} nichos detectados`);
        } catch (e) {
          console.error('Fallback parsing failed:', e);
        }
      }
    }

    // Build video map for quick lookup
    const videoMap = new Map<string, Video>();
    videos.forEach(v => videoMap.set(v.id, v));

    // Calculate metrics for each niche
    const nicheAnalyses: NicheAnalysis[] = parsedNiches.niches.map((niche: any, index: number) => {
      // Normalizar videoIds - remover prefixos, espaços, caracteres inválidos
      const nicheVideos = niche.videoIds
        .map((id: string) => {
          // Limpar: remover "ID:", espaços, colchetes, caracteres não-alfanuméricos
          const cleanId = id
            .replace(/^ID:/i, '')
            .replace(/[\[\]\s]/g, '')
            .trim();
          return videoMap.get(cleanId);
        })
        .filter((v: Video | undefined): v is Video => v !== undefined);

      if (nicheVideos.length === 0) {
        console.warn(`Niche "${niche.name}" has no matching videos after ID cleaning`);
        return null;
      }

      const metrics = calculateNicheMetrics(nicheVideos);

      return {
        id: `niche-${index + 1}`,
        name: niche.name,
        description: niche.description,
        videoIds: nicheVideos.map((v: Video) => v.id),
        keywords: niche.keywords || [],
        specificity: niche.specificity || 'sub-niche',
        metrics,
      };
    }).filter((n: NicheAnalysis | null): n is NicheAnalysis => n !== null);

    console.log(`Detected ${nicheAnalyses.length} niches`);

    return new Response(JSON.stringify({ niches: nicheAnalyses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-niches:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
