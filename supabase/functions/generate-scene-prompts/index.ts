import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

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
    const body = await req.json();
    
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

    console.log('👤 [generate-scene-prompts] User ID:', userId);
    
    // Validate inputs
    const errors = [
      ...validateString(body.script, 'script', { required: true, maxLength: 1000000 }),
      ...validateString(body.generationMode, 'generationMode', { required: true, maxLength: 50 }),
      ...validateString(body.sceneStyle, 'sceneStyle', { required: true, maxLength: 100 }),
      ...validateString(body.optimizeFor, 'optimizeFor', { required: true, maxLength: 100 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    
    // Validate characters (accept array or string)
    if (body.characters !== undefined && body.characters !== null) {
      if (Array.isArray(body.characters)) {
        if (body.characters.length > 20) {
          errors.push({ field: 'characters', message: 'maximum 20 characters allowed' });
        }
      } else if (typeof body.characters === 'string') {
        if (body.characters.length > 10000) {
          errors.push({ field: 'characters', message: 'characters string too long (max 10000)' });
        }
      } else {
        errors.push({ field: 'characters', message: 'characters must be an array or string' });
      }
    }
    
    validateOrThrow(errors);
    
    const script = sanitizeString(body.script);
    const generationMode = body.generationMode;
    const sceneStyle = body.sceneStyle;
    const characters = body.characters; // Array de objetos estruturados
    const optimizeFor = body.optimizeFor;
    const language = body.language;
    const includeText = body.includeText;
    const aiModel = body.aiModel;

    console.log('🎯 [generate-scene-prompts] Modelo selecionado:', aiModel);

    const styleMap: Record<string, string> = {
      'photorealistic': 'fotorrealista com alta fidelidade',
      'cinematic': 'cinematográfico com iluminação dramática',
      'anime': 'estilo anime japonês',
      'fantasy': 'fantasia épica',
      'stick-figure': 'desenho de palitos simples',
      'cartoon': 'desenho animado colorido',
      'whiteboard': 'animação de quadro branco',
      'modern-documentary': 'documentário moderno',
      'viral-vibrant': 'estilo viral vibrante',
      'tech-minimalist': 'minimalista tecnológico',
      'analog-horror': 'terror analógico VHS',
      'cinematic-narrative': 'narrativa cinematográfica',
      'cartoon-premium': 'cartoon premium de alta qualidade',
      'neo-spiritual': 'neo-realismo espiritual',
      'psychological-surrealism': 'surrealismo psicológico',
      'fragmented-memory': 'memória fragmentada',
      'dark-theater': 'teatro sombrio',
      'naturalist-drama': 'drama naturalista',
      'vhs-nostalgic': 'VHS nostálgico anos 80/90',
      'spiritual-minimalist': 'minimalismo espiritual',
      'fragmented-narrative': 'narrativa fragmentada',
      'dream-real': 'sonho-real onírico',
      'reflexive-monologue': 'monólogo reflexivo intimista'
    };

    // Model-specific optimizations
    const modelOptimizations: Record<string, {
      description: string;
      formatRules: string[];
      strengths: string[];
      tips: string[];
    }> = {
      // Pollinations - Flux Models
      'flux': {
        description: 'Flux universal model - balances speed and quality',
        formatRules: [
          'Use natural language descriptions',
          'Emphasize lighting and composition',
          'Include camera angles and framing'
        ],
        strengths: ['Realistic renders', 'Fast generation', 'Natural scenes'],
        tips: [
          'Start with subject, then environment, then technical details',
          'Use cinematic vocabulary for best results',
          'Specify exact lighting (golden hour, studio, natural)'
        ]
      },
      'flux-realism': {
        description: 'Flux Realism - specialized in photorealistic imagery',
        formatRules: [
          'Prioritize photographic realism terms',
          'Include specific camera and lens details',
          'Mention skin texture, materials, fabric details'
        ],
        strengths: ['Ultra-realistic portraits', 'Product photography', 'Architectural renders'],
        tips: [
          'Use photography terminology: "85mm portrait", "f/1.4 bokeh", "natural lighting"',
          'Describe materials precisely: "weathered leather", "polished chrome", "soft cotton"',
          'Include environmental details for depth: "dust particles", "lens flare", "depth haze"'
        ]
      },
      'flux-anime': {
        description: 'Flux Anime - optimized for anime and manga styles',
        formatRules: [
          'Use anime-specific terminology',
          'Reference animation studios or artists when relevant',
          'Emphasize character expressions and poses'
        ],
        strengths: ['Character art', 'Manga panels', 'Studio Ghibli style'],
        tips: [
          'Mention anime tropes: "sparkle eyes", "dramatic shading", "speed lines"',
          'Reference styles: "Studio Ghibli aesthetic", "modern anime", "90s anime style"',
          'Describe emotions dramatically: "determined expression", "gentle smile", "shocked face"'
        ]
      },
      'flux-3d': {
        description: 'Flux 3D - specialized in 3D renders and modeling',
        formatRules: [
          'Use 3D rendering terminology',
          'Specify render engine aesthetic if desired',
          'Include material properties and lighting setup'
        ],
        strengths: ['Product visualization', 'Architectural renders', 'Character modeling'],
        tips: [
          'Mention render style: "octane render", "unreal engine", "blender cycles"',
          'Describe materials: "PBR materials", "subsurface scattering", "metallic roughness"',
          'Include technical details: "ambient occlusion", "global illumination", "ray tracing"'
        ]
      },
      'turbo': {
        description: 'Turbo - ultra-fast generation, simpler prompts',
        formatRules: [
          'Keep prompts concise and direct',
          'Focus on main subject first',
          'Avoid overly complex descriptions'
        ],
        strengths: ['Quick iterations', 'Simple concepts', 'Prototyping'],
        tips: [
          'Be direct: "woman, red dress, garden, sunset"',
          'Prioritize key elements over details',
          'Use fewer adjectives for faster processing'
        ]
      },
      
      // HuggingFace Models
      'flux-schnell': {
        description: 'FLUX.1 Schnell - fast realistic image generation',
        formatRules: [
          'Natural language descriptions work best',
          'Balance detail with brevity',
          'Include composition and lighting'
        ],
        strengths: ['Realistic portraits', 'Natural scenes', 'Quick turnaround'],
        tips: [
          'Use photographic terms for realism',
          'Specify mood and atmosphere clearly',
          'Mention time of day for natural lighting'
        ]
      },
      'flux-dev': {
        description: 'FLUX.1 Dev - highest quality ultra-realistic generation',
        formatRules: [
          'Maximize detail in descriptions',
          'Include technical photography details',
          'Specify textures and materials precisely'
        ],
        strengths: ['Professional photography', 'Ultra-detailed renders', 'Complex scenes'],
        tips: [
          'Use full sentences with rich descriptions',
          'Include camera specs: "shot on Canon 5D Mark IV, 85mm f/1.2"',
          'Describe every visible detail: textures, reflections, ambient details'
        ]
      },
      'sdxl': {
        description: 'Stable Diffusion XL - versatile for art and concepts',
        formatRules: [
          'Use comma-separated keyword style',
          'Start with quality tags',
          'Include art style references'
        ],
        strengths: ['Concept art', 'Illustrations', 'Artistic styles'],
        tips: [
          'Begin with: "masterpiece, best quality, highly detailed"',
          'Use artist references: "in the style of Artgerm", "Greg Rutkowski style"',
          'Add negative prompts mentally: avoid "blurry, low quality"'
        ]
      },
      'sd-21': {
        description: 'Stable Diffusion 2.1 - fast and efficient',
        formatRules: [
          'Keep prompts moderate length',
          'Use clear descriptive keywords',
          'Structure: subject, style, details'
        ],
        strengths: ['Quick tests', 'Digital art', 'Versatile output'],
        tips: [
          'Be specific about style: "digital art", "oil painting", "watercolor"',
          'Include art keywords: "trending on artstation", "highly detailed"',
          'Describe composition: "centered", "dynamic pose", "close-up"'
        ]
      },
      'sd-15': {
        description: 'Stable Diffusion 1.5 - classic versatile model',
        formatRules: [
          'Comma-separated tags work best',
          'Include style descriptors early',
          'Mention medium (digital art, photo, painting)'
        ],
        strengths: ['Cartoon style', 'Stylized art', 'Community-trained concepts'],
        tips: [
          'Use booru-style tags for best results',
          'Mention art medium: "cartoon", "anime", "digital illustration"',
          'Add quality boosters: "high quality", "detailed", "sharp focus"'
        ]
      },
      
      // Other Models
      'dall-e-3': {
        description: 'DALL-E 3 - OpenAI\'s advanced image generator',
        formatRules: [
          'Use natural conversational language',
          'Full sentences and detailed narratives work best',
          'Emphasize mood and atmosphere'
        ],
        strengths: ['Understanding complex prompts', 'Text in images', 'Creative interpretation'],
        tips: [
          'Write like you\'re describing to a human artist',
          'Include context and story: "A scene where..."',
          'Be specific about text placement if including text',
          'Mention artistic style at the end: "in the style of impressionism"'
        ]
      },
      'stable-diffusion': {
        description: 'Generic Stable Diffusion - community standard',
        formatRules: [
          'Use keyword-based descriptions',
          'Structure: main subject, modifiers, style, quality',
          'Separate concepts with commas'
        ],
        strengths: ['Versatile output', 'Wide style range', 'Community support'],
        tips: [
          'Format: "subject, adjectives, setting, lighting, style, quality"',
          'Use common tags: "4k", "unreal engine", "trending on artstation"',
          'Specify negative aspects mentally: avoid "ugly, blurry, deformed"'
        ]
      }
    };

    // Construir seção de personagens estruturada
    let characterSection = '';
    if (characters && Array.isArray(characters) && characters.length > 0) {
      characterSection = `
⚠️ PERSONAGENS - CONSISTÊNCIA VISUAL OBRIGATÓRIA ⚠️

${characters.map((char: any, index: number) => `
PERSONAGEM ${index + 1}: ${char.name}
- Age: ${char.age}
- Face Shape: ${char.faceShape}
- Eyes: ${char.eyes}
${char.nose ? `- Nose: ${char.nose}` : ''}
${char.mouth ? `- Mouth: ${char.mouth}` : ''}
- Hair: ${char.hair}
- Physique: ${char.physique}
${char.height ? `- Height: ${char.height}` : ''}
- Skin Tone: ${char.skinTone}
${char.distinctiveMarks ? `- Distinctive Marks: ${char.distinctiveMarks}` : ''}
- Clothing: ${char.clothing}
${char.accessories ? `- Accessories: ${char.accessories}` : ''}
${char.posture ? `- Typical Posture/Expression: ${char.posture}` : ''}
`).join('\n')}

🔴 REGRA CRÍTICA DE CONSISTÊNCIA:
Para CADA cena onde um personagem aparecer, você DEVE incluir NO PROMPT EM INGLÊS:
1. Nome completo do personagem
2. TODAS as características físicas listadas acima (idade, face, olhos, nariz, boca, cabelo, físico, altura, pele, marcas, vestuário)
3. Expressão facial apropriada para a cena
4. Postura específica para o momento

FORMATO OBRIGATÓRIO para descrever personagens no prompt:
"[Nome], [idade], [tom de pele/etnia], [formato do rosto], [cor e formato dos olhos], [nariz], [boca], [cabelo: cor, comprimento, estilo], [compleição física], [altura], [marcas distintivas], [vestuário atual], [postura/expressão nesta cena]"

EXEMPLO ULTRA-DETALHADO CORRETO:
"Colonel Augusto, 52-year-old Brazilian military officer, olive-toned weathered skin, stern rectangular face with pronounced jawline, piercing dark brown eyes beneath thick grey eyebrows, prominent aquiline nose with slight leftward bend, thin downturned lips partially hidden by meticulously groomed bushy grey mustache, silver-streaked dark hair slicked back with pomade revealing high forehead, broad-shouldered muscular build showing signs of aging, tall imposing stature approximately 6'2\", visible thin white scar running from left cheekbone to jaw, wearing formal 1850s Brazilian Imperial military uniform with golden epaulettes, red silk sash across chest, multiple medal ribbons, high-collared navy blue jacket with brass buttons, standing rigidly behind mahogany desk with both hands pressed flat on surface, leaning forward in dominant posture, expression of barely controlled fury with furrowed brow and clenched jaw"

❌ EXEMPLO ERRADO (muito vago):
"Colonel Augusto stands in the room"
`;
    } else if (typeof characters === 'string' && characters.trim()) {
      // Compatibilidade com versão antiga (string livre)
      characterSection = `CONSISTENT CHARACTERS (FREE TEXT):\n${sanitizeString(characters)}\n`;
    }

    // Get model-specific optimization info
    const modelInfo = modelOptimizations[optimizeFor] || {
      description: 'Image generation model',
      formatRules: ['Use clear descriptive language'],
      strengths: ['General purpose image generation'],
      tips: ['Describe the scene clearly and in detail']
    };

    const prompt = `You are an expert at creating ultra-detailed prompts for ${optimizeFor}.

📋 MODEL-SPECIFIC INFORMATION:
${modelInfo.description}

🎯 FORMAT RULES FOR ${optimizeFor.toUpperCase()}:
${modelInfo.formatRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

💪 THIS MODEL EXCELS AT:
${modelInfo.strengths.map(s => `• ${s}`).join('\n')}

✨ OPTIMIZATION TIPS FOR ${optimizeFor.toUpperCase()}:
${modelInfo.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

SCRIPT:
${script}

${characterSection}

SETTINGS:
- Mode: ${generationMode === 'auto' ? 'Automatically generate scenes' : 'Split by keywords'}
- Style: ${styleMap[sceneStyle] || sceneStyle}
- Target Platform: ${optimizeFor}
- Language: ${language}
${includeText ? '- Include text in images' : ''}

DETAILED INSTRUCTIONS:
1. Analyze the script and identify main scenes
2. For EACH scene:
   a. Identify WHICH characters appear
   b. COPY complete physical characteristics of each character present
   c. Add visual context of the scene (location, lighting, atmosphere)
   d. Describe specific actions and emotions of characters IN THIS SCENE
   e. Add technical photography/cinematography details
   f. **APPLY ${optimizeFor.toUpperCase()} OPTIMIZATION RULES from above**

3. MANDATORY STRUCTURE for each prompt:

--- SCENE X: [Title in 3-5 words] ---

[Visual style]. [Scene type - Int/Ext]. [Location] - [Time of day].

[COMPLETE physical description of Character 1 with ALL facial, body, and clothing characteristics].
[Character 1's action/posture in this scene].
[Character 1's emotion/facial expression].

[If Character 2 exists, repeat same level of detail].

[Environmental context: objects, lighting, atmosphere, dominant colors].
[Technical details: camera angle, depth of field, lighting style].
**[Apply ${optimizeFor} specific format and keywords]**

4. ULTRA-DETAILED EXAMPLE (adapted for ${optimizeFor}):

--- SCENE 5: Office confrontation ---

Cinematic still, dramatic lighting. Int. Colonial manor office - Late afternoon golden hour.

Colonel Augusto, 52-year-old Brazilian military officer, olive-toned weathered skin, stern rectangular face with pronounced jawline, piercing dark brown eyes beneath thick grey eyebrows, prominent aquiline nose with slight leftward bend, thin downturned lips partially hidden by meticulously groomed bushy grey mustache, silver-streaked dark hair slicked back with pomade revealing high forehead, broad-shouldered muscular build showing signs of aging, tall imposing stature approximately 6'2", visible thin white scar running from left cheekbone to jaw, wearing formal 1850s Brazilian Imperial military uniform with golden epaulettes, red silk sash across chest, multiple medal ribbons, high-collared navy blue jacket with brass buttons, standing rigidly behind ornate mahogany desk with both hands pressed flat on surface, leaning forward in dominant posture, expression of barely controlled fury with furrowed brow and clenched jaw.

Facing him across desk, Dona Esperança, 28-year-old, pale porcelain skin with light freckles across nose and cheeks, delicate heart-shaped face, luminous emerald green eyes with long dark lashes, small upturned nose, full rose-colored lips, long flowing jet-black hair cascading past shoulders in loose waves with natural shine, slender graceful build, petite frame approximately 5'4", wearing elegant 1850s emerald green silk dress with fitted bodice and full skirt, white lace collar, pearl necklace at throat, sitting upright in leather chair with hands folded in lap, maintaining composed dignified posture despite visible tension, expression of quiet defiance with raised chin and steady gaze meeting Colonel's eyes directly.

Environment: Rich mahogany paneling, floor-to-ceiling bookshelves filled with leather-bound volumes, large window behind Colonel casting dramatic backlight creating silhouette effect, golden afternoon sunlight streaming through creating dust motes in air, oil paintings of military battles on walls, ornate globe stand in corner, papers scattered on desk surface.

Technical: Medium shot, shallow depth of field keeping both characters in sharp focus while softening background, Rembrandt lighting creating strong contrast between light and shadow on faces, warm color palette dominated by golden browns and deep reds, cinematic aspect ratio 2.39:1.

5. Use style "${styleMap[sceneStyle] || sceneStyle}" in ALL scenes
6. **CRITICAL: Apply ${optimizeFor} specific syntax and format rules from the optimization tips above**
7. Prompt language: ALWAYS in ENGLISH for best compatibility with generators
8. Format: Use separator "--- SCENE X: [title] ---" before each prompt
9. DO NOT include "Original:" or "PROMPT:" - go straight to the English prompt optimized for ${optimizeFor}

GENERATE THE PROMPTS NOW following this structure RIGOROUSLY and applying ${optimizeFor.toUpperCase()} optimizations:`;

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (aiModel.startsWith('claude')) {
      console.log('🔑 [generate-scene-prompts] Buscando API key ANTHROPIC_API_KEY');
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      
      if (!apiKey) {
        console.error('❌ [generate-scene-prompts] ANTHROPIC_API_KEY não encontrada');
        throw new Error('API key não configurada para Claude');
      }
      
      console.log('✅ [generate-scene-prompts] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [generate-scene-prompts] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
      requestBody = {
        model: finalModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      };
    } else if (aiModel.startsWith('gemini')) {
      apiKey = Deno.env.get('GEMINI_API_KEY') || '';
      const modelMap: Record<string, string> = {
        'gemini-2.5-pro': 'gemini-2.0-flash-exp',
        'gemini-2.5-flash': 'gemini-2.0-flash-exp',
        'gemini-2.5-flash-lite': 'gemini-1.5-flash'
      };
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelMap[aiModel] || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
      };
    } else if (aiModel.startsWith('gpt')) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      const isReasoningModel = aiModel.startsWith('gpt-5') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(aiModel);
      console.log(`📦 [generate-scene-prompts] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel}`);
      
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
          console.error('❌ [generate-scene-prompts] Erro ao buscar chaves OpenAI do usuário:', error);
          return null;
        }
        if (!keys || keys.length === 0) return null;
        const k = keys[0];
        const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
          p_encrypted: k.api_key_encrypted,
          p_user_id: userId,
        });
        if (decErr || !decrypted) {
          console.error('❌ [generate-scene-prompts] Erro ao descriptografar chave OpenAI:', decErr);
          throw new Error('Falha ao descriptografar API Key do usuário');
        }
        return { key: decrypted as string, id: k.id };
      };

      const envOpenAIKey = Deno.env.get('OPENAI_API_KEY');
      let currentKeyInfo: { key: string; id: string } | null = null;
      let lastErrorText: string | null = null;
      let prompts = '';

      // Retry loop with key rotation
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (!currentKeyInfo) {
          try {
            currentKeyInfo = await getUserOpenAIKey();
          } catch (e) {
            console.error('❌ [generate-scene-prompts] Erro ao obter chave do usuário:', e);
          }
        }

        const openaiKeyToUse = currentKeyInfo?.key || envOpenAIKey;
        if (!openaiKeyToUse) {
          throw new Error('OPENAI_API_KEY não configurada');
        }

        console.log(`🔑 [generate-scene-prompts] Tentativa ${attempt} - Usando ${currentKeyInfo ? 'chave do usuário' : 'chave global'}`);

        requestBody = {
          model: aiModel,
          messages: [{ role: 'user', content: prompt }],
          ...(isReasoningModel 
            ? { max_completion_tokens: maxTokens }
            : { max_tokens: maxTokens }
          )
        };

        console.log('🚀 [generate-scene-prompts] Enviando requisição para:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKeyToUse}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📨 [generate-scene-prompts] Status da resposta:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          lastErrorText = errorData;
          console.error('❌ [generate-scene-prompts] Erro da API:', errorData);

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
              console.log('🔄 [generate-scene-prompts] Chave marcada como esgotada, tentando próxima...');
              currentKeyInfo = null;
              continue; // tentar novamente com próxima chave
            } catch (rotErr) {
              console.error('❌ [generate-scene-prompts] Erro ao rotacionar chave:', rotErr);
            }
          }

          throw new Error(`API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        prompts = data.choices[0].message.content;

        if (!prompts) {
          console.error('❌ [generate-scene-prompts] OpenAI não retornou conteúdo:', data);
          throw new Error('OpenAI não retornou conteúdo válido');
        }

        // Atualiza uso da chave do usuário
        if (currentKeyInfo) {
          await supabase
            .from('user_api_keys')
            .update({ last_used_at: new Date().toISOString(), is_current: true })
            .eq('id', currentKeyInfo.id);
        }

        console.log('✅ [generate-scene-prompts] Resposta recebida com sucesso');
        
        return new Response(JSON.stringify({ prompts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Se chegou aqui, todas as tentativas falharam
      throw new Error(lastErrorText || 'Falha ao obter resposta do OpenAI após 3 tentativas');
    }

    if (!apiKey) {
      throw new Error(`API key não configurada para ${aiModel}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (aiModel.startsWith('claude')) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (aiModel.startsWith('gpt')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log('🚀 [generate-scene-prompts] Enviando requisição para:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [generate-scene-prompts] Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-scene-prompts] Erro da API:', errorData);
      console.error('❌ [generate-scene-prompts] Status:', response.status);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let prompts = '';

    if (aiModel.startsWith('claude')) {
      prompts = data.content[0].text;
    } else if (aiModel.startsWith('gemini')) {
      prompts = data.candidates[0].content.parts[0].text;
    }

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof ValidationException) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
