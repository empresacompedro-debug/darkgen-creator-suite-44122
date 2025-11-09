import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getMaxTokensForModel(model: string): number {
  if (model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
    return 32000;
  }
  if (model.includes('gpt-4')) return 16384;
  if (model.includes('opus')) return 16384;
  if (model.includes('claude')) return 8192;
  if (model.includes('gemini')) return 8192;
  return 8192;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, scenePrompts, aiModel, srtContent, imagesPerScene = 1 } = await req.json();

    // Get Supabase client for user API keys
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

    console.log('👤 [generate-editing-guide] User ID:', userId);
    console.log('🎯 [generate-editing-guide] Modelo selecionado:', aiModel);
    console.log('📊 [generate-editing-guide] Imagens por cena:', imagesPerScene);
    console.log('📝 [generate-editing-guide] SRT fornecido:', srtContent ? 'Sim' : 'Não');

    // Parse SRT to extract timecodes and narration
    const srtData = srtContent ? parseSRT(srtContent) : null;
    const totalDuration = srtData ? srtData[srtData.length - 1]?.endSeconds || 0 : 0;
    
    console.log('⏱️ [generate-editing-guide] Duração total do vídeo:', totalDuration ? `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toFixed(0).padStart(2, '0')}` : 'N/A');

    // Parse scene prompts into structured array
    const scenes = parseScenePrompts(scenePrompts);
    console.log('🎬 [generate-editing-guide] Cenas encontradas:', scenes.length);
    scenes.forEach((scene, idx) => {
      console.log(`📝 [generate-editing-guide] Cena ${idx + 1} - Tamanho do prompt: ${scene.visualPrompt.length} caracteres`);
    });

    // If we have SRT data, map it to scenes and distribute images
    if (srtData && srtData.length > 0) {
      const scenesWithTiming = mapSRTToScenes(scenes, srtData, totalDuration, imagesPerScene);
      
      // Calculate per-scene image counts for diagnostics
      const perSceneCounts = scenesWithTiming.map(s => s.images.length);
      const totalImages = perSceneCounts.reduce((sum, count) => sum + count, 0);
      
      console.log('📊 [generate-editing-guide] Imagens por cena:', perSceneCounts);
      
      // Generate guide by scenes (each scene as separate string for reliability)
      const guidesByScene = scenesWithTiming.map((scene, idx) => {
        const sceneHeader = `**CENA ${idx + 1} (${scene.startTime} - ${scene.endTime}):**\n\n`;
        
        const images = scene.images.map((img, imgIdx) => {
          return `📸 **IMAGEM ${imgIdx + 1} (${img.startTime} → ${img.endTime})**
├─ PROMPT: ${scene.visualPrompt}
└─ NARRAÇÃO: ${img.narration}\n`;
        }).join('\n');
        
        return sceneHeader + images + '\n──────────────────────────────────────\n';
      });
      
      // Join all scenes into single guide (but return both formats)
      const guide = guidesByScene.join('\n');
      
      console.log('📏 [generate-editing-guide] Tamanho da resposta (chars):', guide.length);
      console.log('📝 [generate-editing-guide] Últimos 100 chars:', guide.slice(-100));

      // Validation with per-scene counts
      const validation = {
        totalDuration,
        totalScenes: scenes.length,
        imagesPerScene,
        totalImagesGenerated: totalImages,
        perSceneCounts, // Add per-scene diagnostics
        hasSRT: true,
        scriptWordCount: script.split(/\s+/).length
      };

      console.log('✅ [generate-editing-guide] Validação:', validation);

      return new Response(JSON.stringify({ 
        guide, 
        guidesByScene, // Return scenes separately for local assembly
        structured: scenesWithTiming, // Full structured data for reconstruction
        validation,
        totalDuration 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: no SRT data - use old prompt structure
    const prompt = `Crie um guia de edição detalhado combinando o roteiro com os prompts de cena.

ROTEIRO:
${script}

PROMPTS DE CENA:
${scenePrompts}

CONFIGURAÇÃO:
- Imagens por cena: ${imagesPerScene}
- Calcular baseado em ~150 palavras/minuto

Crie um guia no seguinte formato para cada cena:

**CENA X (MM:SS - MM:SS):**

${imagesPerScene > 1 ? `📸 **IMAGEM 1 (MM:SS → MM:SS)**
├─ PROMPT: [Descrição detalhada do prompt visual desta cena]
└─ NARRAÇÃO: [Texto exato da narração neste intervalo]

[Continuar até ${imagesPerScene} imagens para esta cena]

──────────────────────────────────────
` : `**IMAGEM:** [Descrição detalhada do prompt visual]
**NARRAÇÃO:** [Texto da narração correspondente do roteiro]
`}

INSTRUÇÕES CRÍTICAS:
- As cenas devem ser numeradas SEQUENCIALMENTE de 1 em diante
- Mantenha a ordem CRONOLÓGICA do roteiro
- Calcule os timecodes baseado em ~150 palavras por minuto de narração
- TODO o conteúdo do roteiro deve estar presente no guia
${imagesPerScene > 1 ? `- Cada cena tem ${imagesPerScene} imagens - divida o tempo da cena igualmente entre elas
- O mesmo prompt visual da cena é usado para todas as ${imagesPerScene} imagens daquela cena` : ''}`;

    const guide = await callAI(prompt, aiModel, supabase, userId);

    // Calculate validation metrics
    const validation = {
      totalDuration: totalDuration || null,
      estimatedScenes: scenes.length,
      imagesPerScene,
      totalImagesNeeded: scenes.length * imagesPerScene,
      hasSRT: false,
      scriptWordCount: script.split(/\s+/).length
    };

    console.log('✅ [generate-editing-guide] Validação:', validation);

    return new Response(JSON.stringify({ 
      guide, 
      validation,
      totalDuration 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callAI(prompt: string, model: string, supabase: any, userId: string | null): Promise<string> {
  if (model.startsWith('claude')) {
    console.log('🔑 [generate-editing-guide] Buscando API key ANTHROPIC_API_KEY');
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      console.error('❌ [generate-editing-guide] ANTHROPIC_API_KEY não encontrada');
      throw new Error('API key não configurada para Claude');
    }
    
    console.log('✅ [generate-editing-guide] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
    
    const modelMap: Record<string, string> = {
      'claude-sonnet-4.5': 'claude-sonnet-4-5',
      'claude-sonnet-4': 'claude-sonnet-4-0',
      'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
      'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
    };
    const finalModel = modelMap[model] || 'claude-sonnet-4-5';
    console.log('📦 [generate-editing-guide] Modelo da API:', finalModel);

    console.log('🚀 [generate-editing-guide] Enviando requisição para Anthropic API');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalModel,
        max_tokens: getMaxTokensForModel(finalModel),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('📨 [generate-editing-guide] Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-editing-guide] Erro da API:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [generate-editing-guide] Resposta recebida com sucesso');
    return data.content[0].text;
  } else if (model.startsWith('gemini')) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const modelMap: Record<string, string> = {
      'gemini-2.5-pro': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash-lite': 'gemini-1.5-flash'
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelMap[model] || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } else {
    // Helper to fetch and decrypt user's OpenAI key
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
        console.error('❌ [generate-editing-guide] Erro ao buscar chaves OpenAI do usuário:', error);
        return null;
      }
      if (!keys || keys.length === 0) return null;
      const k = keys[0];
      const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
        p_encrypted: k.api_key_encrypted,
        p_user_id: userId,
      });
      if (decErr || !decrypted) {
        console.error('❌ [generate-editing-guide] Erro ao descriptografar chave OpenAI:', decErr);
        throw new Error('Falha ao descriptografar API Key do usuário');
      }
      return { key: decrypted as string, id: k.id };
    };

    const envOpenAIKey = Deno.env.get('OPENAI_API_KEY');
    let currentKeyInfo: { key: string; id: string } | null = null;
    let lastErrorText: string | null = null;

    // Retry loop with key rotation
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (!currentKeyInfo) {
        try {
          currentKeyInfo = await getUserOpenAIKey();
        } catch (e) {
          console.error('❌ [generate-editing-guide] Erro ao obter chave do usuário:', e);
        }
      }

      const openaiKeyToUse = currentKeyInfo?.key || envOpenAIKey;
      if (!openaiKeyToUse) {
        throw new Error('OPENAI_API_KEY não configurada');
      }

      console.log(`🔑 [generate-editing-guide] Tentativa ${attempt} - Usando ${currentKeyInfo ? 'chave do usuário' : 'chave global'}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKeyToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          ...(model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')
            ? { max_completion_tokens: getMaxTokensForModel(model) }
            : { max_tokens: getMaxTokensForModel(model) }
          )
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastErrorText = errorText;
        console.error('❌ [generate-editing-guide] OpenAI API error:', response.status, errorText);

        // Se for erro de quota/rate limit e estivermos usando chave do usuário, rotacionar
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
            console.log('🔄 [generate-editing-guide] Chave marcada como esgotada, tentando próxima...');
            currentKeyInfo = null;
            continue; // tentar novamente com próxima chave
          } catch (rotErr) {
            console.error('❌ [generate-editing-guide] Erro ao rotacionar chave:', rotErr);
          }
        }

        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      if (!content) {
        console.error('❌ [generate-editing-guide] OpenAI não retornou conteúdo:', data);
        throw new Error('OpenAI não retornou conteúdo válido');
      }

      // Atualiza uso da chave do usuário
      if (currentKeyInfo) {
        await supabase
          .from('user_api_keys')
          .update({ last_used_at: new Date().toISOString(), is_current: true })
          .eq('id', currentKeyInfo.id);
      }

      console.log('✅ [generate-editing-guide] Resposta recebida com sucesso');
      return content;
    }

    // Se chegou aqui, todas as tentativas falharam
    throw new Error(lastErrorText || 'Falha ao obter resposta do OpenAI após 3 tentativas');
  }
}

// Parse scene prompts separated by "---" or by double newlines
function parseScenePrompts(scenePrompts: string): Array<{ sceneNum: number; visualPrompt: string }> {
  let scenes: string[];
  
  // Try first the pattern "--- SCENE X:"
  if (scenePrompts.includes('--- SCENE') || scenePrompts.includes('---SCENE')) {
    scenes = scenePrompts.split(/---\s*SCENE\s*\d+:/i).filter(s => s.trim());
  } 
  // Fallback 1: Detect blocks starting with "Photorealistic with high fidelity"
  else if ((scenePrompts.match(/Photorealistic with high fidelity/gi)?.length || 0) > 1) {
    scenes = scenePrompts
      .split(/(?=Photorealistic with high fidelity)/gi)
      .filter(s => s.trim().length > 100);
  }
  // Fallback 2: Split by double newlines
  else {
    scenes = scenePrompts
      .split(/\n\n+/)
      .filter(s => s.trim().length > 50);
  }
  
  return scenes.map((prompt, idx) => {
    // Clean lines that start with ---
    const lines = prompt.trim().split('\n');
    const cleanedPrompt = lines.filter(line => !line.trim().startsWith('---')).join('\n').trim();
    
    return {
      sceneNum: idx + 1,
      visualPrompt: cleanedPrompt || prompt.trim()
    };
  });
}

// Map SRT entries to scenes and distribute images uniformly
function mapSRTToScenes(
  scenes: Array<{ sceneNum: number; visualPrompt: string }>,
  srtData: Array<{ index: number; startTime: string; endTime: string; startSeconds: number; endSeconds: number; text: string }>,
  totalDuration: number,
  imagesPerScene: number
) {
  const sceneDuration = totalDuration / scenes.length;
  
  return scenes.map((scene, idx) => {
    const sceneStartSeconds = idx * sceneDuration;
    const sceneEndSeconds = (idx + 1) * sceneDuration;
    
    // Get SRT entries for this scene
    const sceneSRTEntries = srtData.filter(
      entry => entry.startSeconds >= sceneStartSeconds && entry.startSeconds < sceneEndSeconds
    );
    
    // Distribute images uniformly within scene duration
    const imageDuration = sceneDuration / imagesPerScene;
    const images = Array.from({ length: imagesPerScene }, (_, imgIdx) => {
      const imgStartSeconds = sceneStartSeconds + (imageDuration * imgIdx);
      const imgEndSeconds = sceneStartSeconds + (imageDuration * (imgIdx + 1));
      
      // Get narration for this image's time range
      const imgNarration = sceneSRTEntries
        .filter(entry => 
          // Inclui se a entrada SRT se sobrepõe ao intervalo da imagem
          entry.startSeconds < imgEndSeconds && entry.endSeconds > imgStartSeconds
        )
        .map(entry => entry.text)
        .join(' ');
      
      return {
        startTime: formatTime(imgStartSeconds),
        endTime: formatTime(imgEndSeconds),
        narration: imgNarration || '[Sem narração neste intervalo]'
      };
    });
    
    return {
      sceneNum: scene.sceneNum,
      visualPrompt: scene.visualPrompt,
      startTime: formatTime(sceneStartSeconds),
      endTime: formatTime(sceneEndSeconds),
      images
    };
  });
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Parse SRT file to extract timecodes and text
function parseSRT(srt: string): Array<{
  index: number;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}> {
  const blocks = srt.trim().split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    
    const index = parseInt(lines[0]);
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) return null;
    
    const [_, startTime, endTime] = timeMatch;
    const text = lines.slice(2).join(' ').trim();
    
    return {
      index,
      startTime: startTime.replace(',', '.').substring(0, 8), // MM:SS format
      endTime: endTime.replace(',', '.').substring(0, 8),
      startSeconds: timeToSeconds(startTime),
      endSeconds: timeToSeconds(endTime),
      text
    };
  }).filter(Boolean) as any[];
}

function timeToSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(':');
  const [secs, ms] = seconds.split(',');
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms || '0') / 1000;
}
