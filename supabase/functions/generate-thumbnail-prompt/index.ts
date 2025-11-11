import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getMaxTokensForModel(model: string, detailLevel: string): number {
  const isExpertMode = detailLevel === 'expert';
  
  if (model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
    return isExpertMode ? 64000 : 32000;
  }
  if (model.includes('gpt-4')) return isExpertMode ? 32000 : 16384;
  if (model.includes('opus')) return isExpertMode ? 32000 : 16384;
  if (model.includes('claude')) return isExpertMode ? 16384 : 8192;
  if (model.includes('gemini')) return isExpertMode ? 16384 : 8192;
  return isExpertMode ? 16384 : 8192;
}

function buildPromptTemplate(params: {
  videoTitle: string;
  platform: string;
  language: string;
  includePhrase: boolean;
  thumbnailType: string;
  detailLevel: string;
  includeColorPsychology: boolean;
  includeTypographyStack: boolean;
}): string {
  const { videoTitle, platform, language, includePhrase, thumbnailType, detailLevel, includeColorPsychology, includeTypographyStack } = params;
  
  if (detailLevel === 'expert') {
    return `Você é um especialista em análise e criação de thumbnails para YouTube/social media.

TÍTULO DO VÍDEO: ${videoTitle}
TIPO DE THUMBNAIL: ${thumbnailType === 'auto' ? 'Analisar e escolher o melhor tipo' : thumbnailType}
PLATAFORMA: ${platform}
IDIOMA: ${language}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANÁLISE COMPLETA E GERAÇÃO DE PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CATEGORIA E ESTRATÉGIA:
   ═══════════════════════
   Nicho: [Identificar o nicho do vídeo baseado no título]
   Sub-nicho: [Especificar sub-categoria]
   Estética: [Descrever estilo visual apropriado]
   Estratégia: [O que atrai cliques neste nicho específico]
   ${thumbnailType === 'faceless' ? 'TIPO: Thumbnail FACELESS (sem rosto humano)' : ''}
   ${thumbnailType === 'with-face' ? 'TIPO: Thumbnail COM ROSTO (expressão facial impactante)' : ''}

2. COMPOSIÇÃO:
   ═══════════════
   Layout: [Descrever divisão exata de espaço, ex: split 40/60, centralizado, etc]
   
   Grid 3x3 (mapear elementos em cada quadrante):
   - Quadrante superior-esquerdo (1): [elemento]
   - Quadrante superior-centro (2): [elemento]
   - Quadrante superior-direito (3): [elemento]
   - Quadrante central-esquerdo (4): [elemento]
   - Quadrante central-centro (5): [elemento - geralmente ponto focal]
   - Quadrante central-direito (6): [elemento]
   - Quadrante inferior-esquerdo (7): [elemento]
   - Quadrante inferior-centro (8): [elemento]
   - Quadrante inferior-direito (9): [elemento]
   
   Ponto focal: [Onde o olho deve ir primeiro - coordenadas aproximadas]
   Peso visual: [Como os elementos estão balanceados]
   Profundidade: [Quantas camadas visuais, o que vai em cada - ex: 3 camadas: texto frente, imagem meio, fundo escuro]

${includePhrase && includeTypographyStack ? `3. TIPOGRAFIA:
   ═══════════
   
   TEXTO PRINCIPAL:
   ────────────────
   Conteúdo: [Frase de impacto de 2-4 palavras relevante ao título]
   Tamanho: [Percentual da altura da thumbnail, ex: 60%, 85%]
   Posição: [Localização exata com terços, ex: terço superior, centralizado verticalmente no terço esquerdo]
   
   ESTILO DA FONTE:
   - Categoria: [Tipo de fonte, ex: Sans-serif Display Ultra-Bold, Serif Clássica, etc]
   - Peso: [Bold, Black (900), Regular, etc]
   - Largura: [Extended, Condensed, Normal]
   - Características: [Descritivas, ex: Geométrico, massivo, industrial, elegante, moderno]
   - Similar a: [Exemplos de fontes conhecidas]
   
   STACK DE EFEITOS (ordem de aplicação):
   
   Layer 1 - Base:
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   
   Layer 2 - First Stroke:
   - Tipo: Outer stroke / Inner stroke
   - Espessura: [valor]px
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   
   Layer 3 - Second Stroke (opcional):
   - Tipo: Outer stroke (além do primeiro)
   - Espessura: [valor]px total
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   
   Layer 4 - Drop Shadow:
   - Offset X: [valor]px
   - Offset Y: [valor]px
   - Blur: [valor]px
   - Spread: [valor]px
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   
   Layer 5 - Outer Glow (opcional):
   - Raio: [valor]px
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   - Spread: Soft / Medium / Hard
   
   Layer 6 - Inner Shadow (opcional):
   - Offset: [valores]
   - Blur: [valor]px
   - Cor: [nome] ([hex code])
   - Opacidade: [percentual]%
   
   Layer 7 - Texture Overlay (opcional):
   - Tipo: [Grunge, scratches, noise, etc]
   - Intensidade: [Baixa/Média/Alta] ([percentual]%)
   - Modo blend: [Multiply, Overlay, etc]
   - Cor: [tons predominantes]
   
   POSICIONAMENTO:
   - Localização: [Grid específico, ex: quadrantes 1, 4, 7]
   - Alinhamento: [Centro vertical, topo, base]
   - Rotação: [graus, ex: 0°, -5°, 15°]
   - Perspectiva: [Se houver 3D, descrever]
   
   INTEGRAÇÃO:
   - Relação com fundo: [Como o texto interage com o fundo]
   - Sombra projetada sobre a imagem: [Sim/Não, como]
   
   ${includePhrase ? `TEXTO SECUNDÁRIO (se aplicável):
   ────────────────────────────────
   Conteúdo: [Descritor ou frase complementar]
   Fonte: [Tipo de fonte, ex: Sans-serif bold condensada]
   Tamanho: [Percentual comparado ao principal]
   Posição: [Localização]
   Cor: [nome] ([hex code])
   Efeitos: [Lista de efeitos aplicados]
   Fundo: [Se tem barra ou shape, descrever]` : ''}
` : '3. TIPOGRAFIA:\n   [Descrever tipografia de forma resumida]\n'}

${includeColorPsychology ? `4. CORES:
   ════════
   
   COR 1: [Nome descritivo] ([#HEXCODE])
   - Área: [Percentual aproximado de cobertura, ex: 35%]
   - Localização: [Onde aparece na composição]
   - Função: [Propósito visual desta cor]
   - Psicologia: [Emoção ou sensação que evoca]
   
   COR 2: [Nome descritivo] ([#HEXCODE])
   - Área: [Percentual]%
   - Localização: [Onde aparece]
   - Função: [Propósito visual]
   - Psicologia: [Emoção que evoca]
   
   COR 3: [Nome descritivo] ([#HEXCODE])
   - Área: [Percentual]%
   - Localização: [Onde aparece]
   - Função: [Propósito visual]
   - Psicologia: [Emoção que evoca]
   
   COR 4: [Nome descritivo] ([#HEXCODE])
   - Área: [Percentual]%
   - Localização: [Onde aparece]
   - Função: [Propósito visual]
   - Psicologia: [Emoção que evoca]
   
   COR 5 (opcional): [Nome descritivo] ([#HEXCODE])
   - Área: [Percentual]%
   - Localização: [Detalhes, acentos]
   - Função: [Propósito visual]
   
   ESQUEMA DE CORES: [Tipo, ex: Split-complementar, Análogo, Triádico, Monocromático]
   TEMPERATURA: [Fria dominante / Quente dominante / Mista equilibrada]
   SATURAÇÃO GERAL: [Nível geral, ex: Baixa 20-30% / Média 50-60% / Alta 80-100%]
   CONTRASTE: [Escala de 1-10] - [descrição, ex: Extremo entre preto e branco]
` : '4. CORES:\n   [Descrever paleta de cores de forma resumida com hex codes]\n'}

5. ELEMENTOS VISUAIS:
   ═══════════════════
   
   ELEMENTO PRINCIPAL:
   ───────────────────
   Tipo: [Fotografia / Ilustração / 3D render / Ícone gigante / etc]
   Descrição detalhada: [Descrever o elemento principal em detalhes]
   - Características visuais: [detalhes específicos]
   - Material/textura: [se aplicável]
   - Condição/estado: [se aplicável]
   - Iluminação: [como a luz incide]
   
   Posição: [Quadrantes do grid 3x3]
   Escala: [Percentual da thumbnail]
   Ângulo: [Perspectiva, ex: frontal, 3/4, baixo para cima]
   Estilo: [Realista, estilizado, cartoon, etc]
   
   ${thumbnailType === 'faceless' ? `ELEMENTOS GRÁFICOS (crucial para faceless):
   ────────────────────────────────────────
   - Números/textos gigantes: [se aplicável]
   - Formas geométricas: [círculos, setas, etc]
   - Ícones: [descrição e função]
   - Símbolos: [significado]` : ''}
   
   PARTÍCULAS/EFEITOS ATMOSFÉRICOS (se aplicável):
   ────────────────────────────────────────────────
   Tipo: [Poeira, sparkles, fumaça, etc]
   Quantidade: [Escassa / Moderada / Abundante + número aproximado]
   Cor: [hex code]
   Localização: [Onde aparecem]
   Tamanho: [Variado / Uniforme - range]
   Movimento: [Direção ou feeling de movimento]
   
   ELEMENTOS DECORATIVOS:
   ──────────────────────
   - [Badges, selos, ribbons, frames, etc]
   - Posição e estilo de cada

6. ESTILO E TÉCNICA:
   ═════════════════
   
   CATEGORIA: [Estilo artístico principal, ex: Mixed Media, Photorealistic, Flat Design, 3D Render, Illustrated, Cinematic]
   Subcategoria: [Estilo mais específico, ex: Cinematic Dark, Modern Minimalist, Retro Gaming, etc]
   
   QUALIDADE: [Nível de produção, ex: Professional AAA, High-end, Polished, Indie]
   Nível de detalhe: [Baixo / Médio / Alto / Extremo]
   Limpeza: [Limpo / Com texturas intencionais / Grunge]
   
   ILUMINAÇÃO:
   ────────────
   - Tipo: [Dramatic low-key / High-key bright / Natural / Studio / etc]
   - Contraste: [Muito baixo / Baixo / Médio / Alto / Muito alto]
   - Sombras: [Suaves e difusas / Duras e pronunciadas / Inexistentes]
   - Highlights: [Como são tratados os pontos de luz]
   - Temperatura: [Fria (azulada) / Neutra / Quente (amarelada/alaranjada)]
   - Direção: [De onde vem a luz principal]
   
   EFEITOS APLICADOS (marcar com [X]):
   ────────────────────────────────────
   [ ] Vignette: [Intensidade e cor]
   [ ] God rays / Light shafts: [Descrição]
   [ ] Particles: [Tipo e características]
   [ ] Outer glow: [Em qual elemento, cor]
   [ ] Color grading: [Esquema, ex: Teal & Orange, Bleach Bypass]
   [ ] Film grain: [Intensidade]
   [ ] Blur: [Tipo, ex: Depth of field, Motion blur, Gaussian]
   [ ] Texture overlay: [Tipo e onde]
   [ ] Chromatic aberration: [Se aplicável]
   [ ] Lens flares: [Se aplicável]
   [ ] Outros: [Especificar]

7. ATMOSFERA:
   ═══════════
   
   Energia: [Escala 1-10 com descrição]
   Tom emocional: [Lista de emoções principais que a thumbnail evoca]
   Mood: [Descrição da vibe geral, ex: Dark e misterioso, Vibrante e energético, Calmo e sereno]
   Temperatura emocional: [Fria e distante / Neutra / Quente e convidativa]
   Impacto psicológico: [Reação esperada do viewer, ex: Curiosidade forte, Admiração, Urgência, Diversão]

8. ESTRATÉGIAS ${thumbnailType.toUpperCase()}:
   ══════════════════════════════════════
   
   ${thumbnailType === 'faceless' ? `ESTRATÉGIAS FACELESS:
   [ ] Elemento principal não-humano de grande escala
   [ ] Número gigante ou texto massivo como anchor
   [ ] Fotografia dramática de objeto/local/conceito
   [ ] Elementos de mistério, intriga ou impacto visual
   [ ] Contraste extremo para chamar atenção
   [ ] Atmosfera específica que evoca curiosidade
   [ ] Efeitos visuais épicos (god rays, particles, glow)
   [ ] Badges de autoridade ou urgência
   [ ] Símbolos ou ícones universalmente reconhecíveis
   
   Narrativa visual: [Descrever a história que a thumbnail conta sem usar rostos]
   ` : thumbnailType === 'with-face' ? `ESTRATÉGIAS COM ROSTO:
   [ ] Expressão facial extrema e clara
   [ ] Rosto ocupando 40-60% da thumbnail
   [ ] Contraste máximo entre rosto e fundo
   [ ] Elementos gráficos de suporte (setas, círculos, textos)
   [ ] Direção do olhar estratégica
   [ ] Iluminação dramática no rosto
   [ ] Texto complementar que amplifica a emoção
   [ ] Background que não compete com o rosto
   
   Expressão escolhida: [Choque, Surpresa, Medo, Alegria extrema, etc]
   Razão: [Por que esta expressão funciona para este vídeo]
   ` : `ESTRATÉGIAS GERAIS:
   [ ] Ponto focal claro e imediato
   [ ] Hierarquia visual bem definida
   [ ] Contraste para visibilidade em tamanho pequeno
   [ ] Elementos que contam uma história visual
   [ ] Uso estratégico de cores para emoção
   [ ] Balance entre informação e simplicidade
   `}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT FINAL EM INGLÊS (otimizado para ${platform}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Agora gere o prompt técnico final EM INGLÊS, extremamente detalhado e denso, seguindo este formato narrativo estruturado:

"[Type] YouTube thumbnail in [style] style, [category/niche]:

COMPOSITION: [layout description with percentages and grid positions], [depth layers], [focal point location]

${includePhrase ? `MAIN TYPOGRAPHY: [text content] in [font description with weight, width, characteristics], [size as % of height], positioned [exact location], [base color with hex] with complex effect stack: [list all 7 layers with exact specifications - stroke thickness/colors, shadow offsets/blur/colors, glow radius/colors, etc], [positioning details including grid, alignment, rotation, perspective], [integration with background]` : ''}

${includePhrase ? `SECONDARY TEXT: [content], [font type], [size relative to main], positioned [location], [color hex] with [effects], [background if any]\n\n` : ''}

MAIN VISUAL: [detailed description of primary element - type, characteristics, materials, condition, lighting], positioned [grid quadrants], [scale %], [angle/perspective], [style - realistic/stylized/etc]

${includeColorPsychology ? `COLOR PALETTE: dominated by [color name] ([hex]) [area %] ([location and function creating psychological effect]), [repeat for all 5 colors with exact hex codes, percentages, locations, functions, and psychology], [color scheme type], [temperature description], [contrast level X/10], [saturation details with percentages]` : `COLOR PALETTE: [list main colors with hex codes and their purposes]`}

BACKGROUND: [description of background elements and their relationship to foreground]

LIGHTING: [lighting type] setup, [contrast level], [shadow type], [highlight treatment], [color temperature], [direction]

VISUAL EFFECTS: [list all checked effects with detailed specifications - vignette intensity/color, god rays characteristics, particles count/color/movement, glows, color grading scheme, grain, blur types, textures]

${thumbnailType === 'faceless' ? `GRAPHIC ELEMENTS: [badges, numbers, icons with exact positions, styles, colors]\n\n` : ''}

MOOD & ATMOSPHERE: energy level [X/10] [description], primary emotions [list], [aesthetic vibe], [emotional temperature], psychological impact of [reaction]

${thumbnailType === 'faceless' ? `FACELESS STRATEGIES: [list applied strategies - massive non-human element, dramatic photography, mystery elements, extreme contrast, god rays, authority badges, etc]` : thumbnailType === 'with-face' ? `WITH-FACE STRATEGIES: [extreme facial expression], [face occupies X%], [contrast with background], [supporting graphic elements], [strategic gaze direction], [dramatic lighting], [complementary text], chosen expression [emotion] because [reason]` : ''}

TECHNICAL: [production quality level], [detail level], [style category and subcategory], optimized for ${platform}, 16:9 aspect ratio]

IMPORTANTES:
- TODO o prompt final deve ser EM INGLÊS
- Incluir TODAS as especificações técnicas com valores exatos
- Usar formato narrativo denso mas estruturado
- SEMPRE incluir cores em hexadecimal (#RRGGBB)
- SEMPRE especificar percentuais e medidas precisas (px, %, etc)
- Descrever todas as camadas de efeitos em ordem de aplicação
- Mencionar mood, atmosfera e impacto psicológico
- Ser extremamente específico sobre posicionamento (usar grid 3x3 como referência)
- Focar em detalhes técnicos que um gerador de imagem pode interpretar
`;
  } else if (detailLevel === 'advanced') {
    return `Você é um especialista em criar prompts para thumbnails de YouTube otimizados para ${platform}.

TÍTULO DO VÍDEO: ${videoTitle}
TIPO: ${thumbnailType}
PLATAFORMA: ${platform}

INSTRUÇÕES AVANÇADAS:
1. Analise o título e identifique o nicho e estratégia visual apropriada
2. Crie um prompt MUITO DETALHADO em INGLÊS
3. Inclua: composição específica, tipografia (se aplicável), paleta de cores com hex codes, elementos visuais, iluminação, efeitos, e mood
4. Use cores vibrantes e contrastes fortes
5. ${thumbnailType === 'faceless' ? 'Foque em elementos gráficos impactantes SEM rostos humanos' : thumbnailType === 'with-face' ? 'Foque em expressão facial extrema e clara' : 'Escolha o melhor approach'}
6. Seja específico sobre tamanhos, posições e percentuais
7. Otimize para ${platform}

${includePhrase ? 'IMPORTANTE: Inclua texto impactante de 2-4 palavras relevante ao vídeo' : ''}

Gere o prompt agora em INGLÊS:`;
  } else {
    // basic
    return `Você é um especialista em criar prompts para thumbnails de YouTube otimizados para ${platform}.

TÍTULO DO VÍDEO: ${videoTitle}

INSTRUÇÕES:
1. Crie um prompt DETALHADO para gerar uma thumbnail atraente
2. O prompt deve ser escrito EM INGLÊS
3. A thumbnail deve ser visualmente impactante e chamar atenção
4. Use cores vibrantes e contrastes fortes
5. Otimize para ${platform}
6. Seja específico sobre: composição, iluminação, cores, estilo visual
${includePhrase ? '7. Inclua sugestão de texto/frase para adicionar na imagem' : ''}

Gere o prompt agora:`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate inputs
    const errors = [
      ...validateString(body.videoTitle, 'videoTitle', { required: true, maxLength: 500 }),
      ...validateString(body.platform, 'platform', { required: true, maxLength: 100 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
      ...validateString(body.thumbnailType, 'thumbnailType', { required: false, maxLength: 20 }),
      ...validateString(body.detailLevel, 'detailLevel', { required: false, maxLength: 20 }),
    ];
    validateOrThrow(errors);
    
    const videoTitle = sanitizeString(body.videoTitle);
    const platform = body.platform;
    const language = body.language;
    const includePhrase = body.includePhrase;
    const aiModel = body.aiModel;
    const thumbnailType = body.thumbnailType || 'auto';
    const detailLevel = body.detailLevel || 'expert';
    const includeColorPsychology = body.includeColorPsychology !== false;
    const includeTypographyStack = body.includeTypographyStack !== false;

    console.log('🎯 [generate-thumbnail-prompt] Modelo selecionado:', aiModel, 'Detalhe:', detailLevel);

    const prompt = buildPromptTemplate({
      videoTitle,
      platform,
      language,
      includePhrase,
      thumbnailType,
      detailLevel,
      includeColorPsychology,
      includeTypographyStack
    });

    console.log('📝 [generate-thumbnail-prompt] Prompt template construído');

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (aiModel.startsWith('claude')) {
      console.log('🔑 [generate-thumbnail-prompt] Buscando API key ANTHROPIC_API_KEY');
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      
      if (!apiKey) {
        console.error('❌ [generate-thumbnail-prompt] ANTHROPIC_API_KEY não encontrada');
        throw new Error('API key não configurada para Claude');
      }
      
      console.log('✅ [generate-thumbnail-prompt] API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel, detailLevel);
      console.log(`📦 [generate-thumbnail-prompt] Usando ${maxTokens} max_tokens para ${finalModel} (detail: ${detailLevel})`);
      
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
      apiKey = Deno.env.get('OPENAI_API_KEY') || '';
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      const isReasoningModel = aiModel.startsWith('gpt-5') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(aiModel, detailLevel);
      console.log(`📦 [generate-thumbnail-prompt] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel} (detail: ${detailLevel})`);
      
      requestBody = {
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        ...(isReasoningModel 
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }
        )
      };
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

    console.log('🚀 [generate-thumbnail-prompt] Enviando requisição para:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [generate-thumbnail-prompt] Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [generate-thumbnail-prompt] Erro da API:', errorData);
      console.error('❌ [generate-thumbnail-prompt] Status:', response.status);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let promptResult = '';

    if (aiModel.startsWith('claude')) {
      promptResult = data.content[0].text;
    } else if (aiModel.startsWith('gemini')) {
      promptResult = data.candidates[0].content.parts[0].text;
    } else if (aiModel.startsWith('gpt')) {
      promptResult = data.choices[0].message.content;
    }

    return new Response(JSON.stringify({ prompt: promptResult }), {
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
