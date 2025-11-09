import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiKey, updateApiKeyUsage } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface VideoData {
  title: string;
  views: number;
  publishedAgo: string;
  vph: number;
}

interface VideoInNiche {
  title: string;
  views: number;
}

interface MicroNicheRanking {
  rank: number;
  name: string;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo: number;
  description: string;
  videos: VideoInNiche[];
  isChampion?: boolean;
}

function parseCompetitorData(text: string): VideoData[] {
  let videos: VideoData[] = [];
  
  // ESTRATÉGIA 1: Tenta parsing em bloco (formato completo do YouTube com timestamps)
  const hasTimestamps = text.match(/\d+:\d+/);
  const hasTocandoAgora = text.includes('Tocando agora');
  
  if (hasTimestamps && hasTocandoAgora) {
    console.log('🎯 Estratégia 1: Formato completo do YouTube com timestamps');
    const blocks = text.split(/(?=\d+:\d+)/g).filter(b => b.trim().length > 0);
    console.log(`📦 Detectados ${blocks.length} blocos potenciais`);
    
    for (const block of blocks) {
      if (!block.includes('Tocando agora')) continue;
      
      const titleMatch = block.match(/Tocando agora\s*\n\s*(.+?)(?=\n\d)/s);
      if (!titleMatch) continue;
      
      let title = titleMatch[1]
        .replace(/^(▶|👁️|🚫|✨|📸|📷)\s*/g, '')
        .replace(/\n/g, ' ')
        .trim();
      
      const viewsMatch = block.match(/(\d+(?:[,\.]\d+)*)\s*(mil|k|mi|thousand|visualizações|views)/i);
      let views = 0;
      if (viewsMatch) {
        const numStr = viewsMatch[1].replace(/\./g, '').replace(',', '.');
        const num = parseFloat(numStr);
        const multiplier = viewsMatch[2].toLowerCase().match(/(mil|k|mi|thousand)/) ? 1000 : 1;
        views = num * multiplier;
      }
      
      const vphMatch = block.match(/(\d+)\s*VPH/i);
      const vph = vphMatch ? parseInt(vphMatch[1]) : 0;
      
      const timeMatch = block.match(/há\s+(\d+)\s+(hora|horas|dia|dias|semana|semanas|mês)/i);
      const publishedAgo = timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : '';
      
      if (title.length > 10) {
        videos.push({ title, views, publishedAgo, vph });
      }
    }
    
    console.log(`✅ Estratégia 1 resultou em ${videos.length} vídeos`);
  }
  
  // ESTRATÉGIA 2: Fallback para lista simples de títulos (linha por linha)
  if (videos.length === 0) {
    console.log('🎯 Estratégia 2: Lista simples de títulos (linha por linha)');
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Pula linhas vazias ou muito curtas
      if (trimmedLine.length < 10) continue;
      
      // Pula linhas que são apenas números/símbolos
      if (/^[\d\s:x\.▶👁️🚫✨📸📷]+$/.test(trimmedLine)) continue;
      
      // Pula headers e ruído comum
      if (/^(Mais recentes|Em alta|Mais antigo|Sort by|Tocando agora|Remix)$/i.test(trimmedLine)) continue;
      
      // Limpa emojis iniciais e espaços
      let title = trimmedLine.replace(/^(▶|👁️|🚫|✨|📸|📷)\s*/g, '').trim();
      
      // Se ainda tem conteúdo substancial, é um título válido
      if (title.length >= 10) {
        videos.push({ 
          title, 
          views: 0,
          publishedAgo: '', 
          vph: 0 
        });
      }
    }
    
    console.log(`✅ Estratégia 2 resultou em ${videos.length} títulos`);
  }
  
  return videos;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('🚀 Iniciando análise de títulos...');
    let { competitorData, aiModel = 'claude-sonnet-4.5' } = await req.json();
    
    console.log(`🎯 Modelo recebido: "${aiModel}"`);
    
    // Validação: força modelos válidos (Claude, Gemini, GPT)
    const validModels = [
      'claude-sonnet-4.5', 'claude-sonnet-4', 'claude-sonnet-3.7', 
      'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
      'gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07',
      'gpt-4.1-2025-04-14', 'gpt-4.1-mini-2025-04-14',
      'o3-2025-04-16', 'o4-mini-2025-04-16',
      'gpt-4o', 'gpt-4o-mini'
    ];
    if (!validModels.includes(aiModel)) {
      console.warn(`⚠️ Modelo inválido recebido: ${aiModel}. Usando padrão: claude-sonnet-4.5`);
      aiModel = 'claude-sonnet-4.5';
    }
    
    console.log(`✅ Modelo validado: "${aiModel}"`);
    
    if (!competitorData) {
      throw new Error('competitorData é obrigatório');
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    let userId: string | undefined;
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.log('No authenticated user');
    }

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const videos = parseCompetitorData(competitorData);
    
    // LOG CRÍTICO: Mostrar os primeiros 5 títulos parseados
    console.log(`📊 Total de vídeos parseados: ${videos.length}`);
    console.log('📋 Primeiros 5 títulos detectados:');
    videos.slice(0, 5).forEach((v, i) => {
      console.log(`  ${i + 1}. "${v.title}" (${v.views} views, ${v.vph} VPH)`);
    });
    
    if (videos.length === 0) {
      console.error('❌ ERRO: Nenhum vídeo foi parseado!');
      console.log('📄 Primeiros 500 chars do texto recebido:', competitorData.slice(0, 500));
      throw new Error('Nenhum vídeo detectado nos dados fornecidos. Verifique o formato dos dados.');
    }

    // Helper: Define limite de vídeos baseado na capacidade do modelo
    function getMaxVideosForModel(model: string): number {
      // Gemini 2.5: Usa "thinking tokens" internos, então precisa de limite muito menor
      // Com 68 vídeos, usou 15,999 thinking tokens + 4,453 prompt = 20,452 total
      if (model.includes('gemini-2.5')) {
        return 40;  // Limite reduzido drasticamente por causa dos thinking tokens
      }
      
      // Claude Sonnet, GPT-5, O3, O4: 200K tokens = ~600 vídeos
      if (model.includes('claude-sonnet') || model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
        return 600;
      }
      
      // Kimi K2: Limite reduzido para 30 vídeos para evitar crash da edge function
      // REMOVIDO - Kimi não é mais suportado
      
      // GPT-4.1, GPT-4o: 128K tokens = ~450 vídeos
      if (model.includes('gpt-4')) {
        return 450;
      }
      
      // Fallback seguro
      return 450;
    }

    const maxVideosForPrompt = getMaxVideosForModel(aiModel);
    console.log(`📊 Limite de vídeos para modelo "${aiModel}": ${maxVideosForPrompt}`);

    let videosToAnalyze = videos;

    if (videos.length > maxVideosForPrompt) {
      console.log(`⚠️ Total de ${videos.length} vídeos excede limite de ${maxVideosForPrompt} do modelo "${aiModel}"`);
      console.log(`📊 Selecionando top ${maxVideosForPrompt} vídeos por views para análise otimizada`);
      
      // Ordena por views (maior para menor) e pega os top N
      videosToAnalyze = [...videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, maxVideosForPrompt);
      
      console.log(`✅ Análise será feita com ${videosToAnalyze.length} vídeos`);
    } else {
      console.log(`✅ Processando todos os ${videos.length} vídeos (dentro do limite de ${maxVideosForPrompt})`);
    }

    const prompt = `Você é um especialista ULTRA-ESPECIALIZADO em análise de nichos de conteúdo no YouTube.

DADOS DOS VÍDEOS (${videosToAnalyze.length} vídeos${videos.length > videosToAnalyze.length ? ` - top ${videosToAnalyze.length} de ${videos.length} total` : ''}):
${videosToAnalyze.map((v, i) => `${i + 1}. "${v.title}" | ${v.views.toLocaleString()} views`).join('\n')}

═══════════════════════════════════════════════════════════════
🏆 DESTAQUE: PALAVRAS-CHAVE CAMPEÃS (APARECE PRIMEIRO!)
═══════════════════════════════════════════════════════════════

OBJETIVO: Identificar as palavras-chave/frases que se repetem nos títulos de MAIOR SUCESSO.

ANÁLISE REQUERIDA:
1. Extrair n-gramas (1-3 palavras) de todos os títulos
2. Ranquear por frequência E correlação com views/VPH
3. Identificar TOP 10 palavras-chave campeãs
4. Para cada palavra-chave, calcular:
   - Número de aparições
   - Média de views dos vídeos que a contêm
   - Média de VPH dos vídeos que a contêm (se disponível)
   - Melhor título que a utiliza
5. Gerar observação detalhada (100-150 palavras) explicando:
   - Por que essas palavras funcionam
   - Padrões temáticos identificados
   - Recomendações de uso

FORMATO JSON (incluir no início da resposta):
{
  "palavras_chave_campeas": {
    "ranking": [
      {
        "keyword": "My Parents",
        "occurrences": 23,
        "avgViews": 4200,
        "avgVPH": 43,
        "bestTitle": "Título completo aqui",
        "bestTitleViews": 15000
      }
    ],
    "observacao_detalhada": "Análise de 100-150 palavras sobre os padrões identificados..."
  }
}

═══════════════════════════════════════════════════════════════
SUA MISSÃO: CRIAR 3 RESUMOS COMPLEMENTARES
═══════════════════════════════════════════════════════════════

RESUMO 1 - ESTRUTURA HIERÁRQUICA DO CONTEÚDO (COMPACTO)
─────────────────────────────────────────────────────────────

OBJETIVO: Visão geral do conteúdo do canal.

1. NICHO PRINCIPAL (categoria ampla - 1 linha)
2. 3 SUB-NICHOS (nome + descrição curta de 5 palavras cada)
3. 3-4 MICRO-SUB-NICHOS (nome + descrição 10 palavras + 2 exemplos + estrutura compacta)

EXEMPLO DE ESTRUTURA:

NICHO: "Curiosidades Históricas Obscuras"

SUB-NICHOS (3-4):
1. "Fotografias históricas proibidas"
2. "Crimes e escândalos em entretenimento clássico"
3. "Casos macabros de famílias"

MICRO-SUB-NICHOS (4 grupos):
1. "Fotos banidas da Segunda Guerra revelando atrocidades"
   - Exemplos: "120 BANNED Photos...", "FORBIDDEN Images..."
   - Estrutura DETALHADA: [NUMBER] + BANNED/FORBIDDEN + "Photos" + contexto revelação (That Reveal/Never Meant to Be Seen)
   
2. "Escândalos sexuais em novelas brasileiras vintage"
   - Exemplos: "Escrava Izaura estuprada...", "Torturas sofridas..."
   - Estrutura DETALHADA: [Nome Personagem/Novela] + [verbo impactante: estuprada/torturada/abusada] + contexto específico

═══════════════════════════════════════════════════════════════
RESUMO 2 - RANKING DE PERFORMANCE (FOCO NOS CAMPEÕES) 🏆
─────────────────────────────────────────────────────────────

⭐ OBJETIVO PRINCIPAL: Identificar o MÁXIMO de micro-nichos CAMPEÕES possível!

Liste os TOP 25 micro-subnichos (ordem DECRESCENTE de views totais).

🏆 CRITÉRIO DE CAMPEÃO:
- Marque como CAMPEÃO (isChampion: true) os TOP 10 micro-nichos de melhor performance
- Use critérios: alta média de views/vídeo + bom volume total + padrão replicável
- Campeões são aqueles com MAIOR POTENCIAL de sucesso garantido

⚠️ REGRAS:
- TOP 5 vídeos por micro-nicho
- Descrição: máx 10 palavras
- Estrutura: compacta (ex: [NUM] [ADJ] TRUE [THEME] Stories)

EXEMPLO DE FORMATO:

#1) Família proibida - 61.8K views (6 vídeos) - 10.3K/vídeo ⭐ CAMPEÃO
Top 5: "Título 1" (15.2K), "Título 2" (12.5K), "Título 3" (11.1K), "Título 4" (9.8K), "Título 5" (7.6K)

#2) Histórias de terror reais - 58.4K views (8 vídeos) - 7.3K/vídeo ⭐ CAMPEÃO
Top 5: "Título 1" (14K), "Título 2" (11K), "Título 3" (9.5K), "Título 4" (8K), "Título 5" (7K)

⭐ REGRAS CRÍTICAS PARA CAMPEÕES:
- Identifique até 10 CAMPEÕES (os melhores micro-nichos)
- Campeões devem ter: alta média de views + volume significativo + estrutura clara
- Marque TODOS os campeões com "isChampion": true
- Os demais (#11 em diante) têm "isChampion": false
- FOCO MÁXIMO: Queremos o MAIOR NÚMERO possível de campeões viáveis (até 10)!

═══════════════════════════════════════════════════════════════
RESUMO 3 - O QUE NUNCA FAZER (COMPACTO)
─────────────────────────────────────────────────────────────

OBJETIVO: Padrões que falharam.

Liste os 8 PIORES micro-subnichos (menor média de views).

Para cada falha:
- Rank + nome + descrição (máx 8 palavras)
- Métricas (total views, qtd vídeos, média)
- 2 exemplos de títulos ruins
- Estrutura compacta
- Motivo da falha (máx 30 palavras - direto ao ponto)

═══════════════════════════════════════════════════════════════
FORMATO DE RESPOSTA JSON:
═══════════════════════════════════════════════════════════════

Retorne APENAS JSON VÁLIDO (sem markdown, sem explicações):

{
  "palavras_chave_campeas": {
    "ranking": [
      {
        "keyword": "My Parents",
        "occurrences": 23,
        "avgViews": 4200,
        "avgVPH": 43,
        "bestTitle": "Título completo",
        "bestTitleViews": 15000
      }
    ],
    "observacao_detalhada": "Análise 100-150 palavras"
  },
  "resumo_1": {
    "nicho_principal": "Nome do nicho (1 linha)",
    "sub_nichos": [
      {"nome": "Sub 1", "descricao": "Desc 5 palavras"}
    ],
    "micro_sub_nichos": [
      {
        "nome": "Micro 1",
        "descricao": "Desc 10 palavras",
        "exemplos_titulos": ["Ex1", "Ex2"],
        "estruturas_titulos": ["[NUM] [ADJ] TRUE [THEME] Stories"]
      }
    ]
  },
  "resumo_2": {
    "micro_nichos_ranking": [
      {
        "rank": 1,
        "name": "Nome",
        "totalViews": 61800,
        "videoCount": 6,
        "avgViewsPerVideo": 10300,
        "description": "Desc 10 palavras",
        "titleStructure": "[NUM] [ADJ] TRUE [THEME] Stories",
        "videos": [
          {"title": "Título 1", "views": 15200}
          // TOP 5
        ],
        "isChampion": true
      }
      // ... até #15
    ],
    "analise_campeao": "20 palavras max"
  },
  "resumo_3": {
    "micro_nichos_que_falharam": [
      {
        "rank": 1,
        "name": "Nome",
        "totalViews": 850,
        "videoCount": 12,
        "avgViewsPerVideo": 71,
        "description": "Desc 8 palavras",
        "titleStructure": "[Ação] + Termo + Tutorial",
        "failedTitles": ["Ex 1", "Ex 2"],
        "motivoFalha": "30 palavras: direto ao ponto sobre por que falhou"
      }
      // ... até #8
    ]
  },
  "sub_nichos": [
    {
      "nome": "Nome",
      "justificativa": "Just curta",
      "exemplos": ["Ex1", "Ex2"],
      "palavras_chave": ["kw1", "kw2"],
      "formula_titulo": "Formula",
      "gancho_emocional": "Gancho",
      "potencial": "alto",
      "vph_medio": 123,
      "nivel_especificidade": 8
    }
  ],
  "insights": "Análise geral (max 40 palavras)"
}

⚠️ REGRAS FINAIS:
- Use APENAS títulos fornecidos
- Agrupe em 3-4 grupos
- RESUMO 2: TOP 25 micro-nichos (maior views) → Identifique até 10 CAMPEÕES ⭐
- RESUMO 3: TOP 8 piores (menor média)
- TOP 10 melhores têm "isChampion": true (FOCO NOS CAMPEÕES!)
- TOP 5 vídeos/micro-nicho (R2)
- 2 títulos ruins/micro-nicho (R3)
- Descrições CURTAS (5-10 palavras)
- Estruturas DETALHADAS (incluir titleStructure em todos)
- Motivo falha: 30 palavras
- JSON compacto e válido`;

    let resultText: string = '';
    let provider: 'claude' | 'openai' | 'gemini' = 'claude';

    // 1. CLAUDE (API Key do Usuário)
    if (aiModel.startsWith('claude')) {
      provider = 'claude';
      console.log('🔍 Usando API Key do Claude do usuário');
      
      const apiKeyResult = await getApiKey(userId, provider, supabaseClient);
      if (!apiKeyResult) {
        throw new Error('❌ API Key do Claude não configurada. Configure em Configurações → API Keys.');
      }

      const apiKey = apiKeyResult.key;
      console.log(`✅ Usando chave do usuário para Claude`);

      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelMap[aiModel] || 'claude-sonnet-4-5',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro Claude API:', errorText);
        
        if (response.status === 401) {
          throw new Error('❌ API Key do Claude inválida. Verifique sua chave em Configurações.');
        }
        if (response.status === 429) {
          throw new Error('❌ Limite de uso da API do Claude excedido.');
        }
        throw new Error(`Claude API Error: ${response.status} - ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      resultText = data.content[0].text;

    // 2. Gemini (API Key do Usuário)
    } else if (aiModel.startsWith('gemini')) {
      provider = 'gemini';
      console.log('🔍 Usando API Key do Gemini do usuário');
      
      const apiKeyResult = await getApiKey(userId, provider, supabaseClient);
      if (!apiKeyResult) {
        throw new Error('❌ API Key do Gemini não configurada. Configure em Configurações → API Keys.');
      }

      const apiKey = apiKeyResult.key;
      console.log(`✅ Usando chave do usuário para Gemini`);

      // Modelos Gemini: usar API v1 para 2.5 e v1beta com -latest para 1.5
      console.log(`🔍 Verificando modelo Gemini recebido: "${aiModel}"`);
      let geminiApiUrl: string;
      let geminiModel: string;
      
      if (aiModel === 'gemini-2.5-pro' || aiModel === 'gemini-2.5-flash') {
        // Modelos 2.5: usar API v1
        geminiModel = aiModel; // gemini-2.5-pro ou gemini-2.5-flash
        geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`;
        console.log(`✅ USANDO API v1 para ${aiModel} - URL: ${geminiApiUrl.replace(apiKey, 'API_KEY')}`);
      } else {
        // Modelos 1.5: usar API v1beta com sufixo -latest
        const modelMap: Record<string, string> = {
          'gemini-2.5-flash-lite': 'gemini-1.5-flash-8b-latest'
        };
        geminiModel = modelMap[aiModel] || 'gemini-1.5-flash-latest';
        geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
        console.log(`✅ USANDO API v1beta para ${aiModel} → ${geminiModel} - URL: ${geminiApiUrl.replace(apiKey, 'API_KEY')}`);
      }

      // Retry logic for 503 errors (service overloaded)
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const waitTime = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`⏳ Tentativa ${attempt}/${maxRetries} após aguardar ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 32000  // Alto para acomodar thinking tokens + output real
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro Gemini API:', errorText);
            console.error('🔍 Status:', response.status);
            console.error('🔍 Headers:', JSON.stringify([...response.headers.entries()]));
            
            if (response.status === 401) {
              throw new Error('❌ API Key do Gemini inválida. Verifique sua chave em Configurações.');
            }
            if (response.status === 403) {
              const errorData = JSON.parse(errorText || '{}');
              if (errorData.error?.message?.includes('has not been used') || errorData.error?.message?.includes('disabled')) {
                throw new Error('❌ A API Generative Language do Google não está habilitada no seu projeto. Acesse https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com e habilite a API, ou use outro modelo de IA.');
              }
              throw new Error('❌ API Key do Gemini sem permissão. Verifique suas credenciais em Configurações.');
            }
            if (response.status === 429) {
              throw new Error('❌ Limite de uso da API do Gemini excedido. Aguarde alguns minutos e tente novamente.');
            }
            if (response.status === 503) {
              // Service overloaded - retry
              if (attempt < maxRetries) {
                console.log(`⚠️ API do Gemini sobrecarregada (503). Tentando novamente...`);
                lastError = new Error('RETRY_503');
                continue;
              }
              throw new Error('⚠️ A API do Gemini está temporariamente sobrecarregada. Por favor, aguarde alguns segundos e tente novamente.');
            }
            if (response.status === 400) {
              throw new Error(`❌ Erro na requisição ao Gemini: ${errorText.slice(0, 300)}`);
            }
            throw new Error(`Gemini API Error ${response.status}: ${errorText.slice(0, 300)}`);
          }

          const data = await response.json();
          console.log('📦 Resposta completa do Gemini:', JSON.stringify(data).slice(0, 500));
          
          // VALIDAÇÃO: Verificar finish reason
          if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
            console.error('⚠️ ATENÇÃO: Resposta truncada! O modelo atingiu o limite de tokens.');
            console.error('💡 Considere: 1) Reduzir a quantidade de vídeos ou 2) Usar um prompt mais conciso');
          }
          
          // VALIDAÇÃO: Verificar se a resposta contém os dados esperados
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Resposta do Gemini sem estrutura esperada:', JSON.stringify(data));
            throw new Error('Resposta inválida da API do Gemini. Estrutura de dados não encontrada.');
          }
          
          // VALIDAÇÃO: Verificar se há content.parts (pode estar vazio se MAX_TOKENS)
          if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            console.error('❌ Resposta do Gemini sem conteúdo (parts vazio):', JSON.stringify(data));
            
            if (data.candidates[0].finishReason === 'MAX_TOKENS') {
              throw new Error('⚠️ A análise foi interrompida por exceder o limite de tokens. Tente com menos vídeos ou use o modelo Claude que tem maior capacidade.');
            }
            
            throw new Error('Resposta do Gemini sem conteúdo. Tente novamente ou use outro modelo.');
          }

          resultText = data.candidates[0].content.parts[0].text;
          
          // VALIDAÇÃO: Verificar se o conteúdo não está vazio
          if (!resultText || resultText.trim().length === 0) {
            console.error('❌ Resposta do Gemini está vazia');
            console.error('📦 Dados completos:', JSON.stringify(data));
            throw new Error('A API do Gemini retornou uma resposta vazia. Tente novamente ou use outro modelo.');
          }
          
          console.log('✅ Resposta do Gemini recebida:', resultText.slice(0, 200));
          
          // Success - break out of retry loop
          break;
          
        } catch (error) {
          lastError = error as Error;
          if (lastError.message !== 'RETRY_503') {
            // If it's not a retry error, throw immediately
            throw error;
          }
          // Otherwise, continue to next retry attempt
        }
      }
      
      // If we exhausted all retries
      if (lastError && lastError.message === 'RETRY_503') {
        throw new Error('⚠️ A API do Gemini está temporariamente sobrecarregada. Por favor, aguarde alguns segundos e tente novamente.');
      }
      
    // 3. GPT (API Key do Usuário)
    } else if (aiModel.startsWith('gpt') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-')) {
      provider = 'openai';
      console.log('🔍 Usando API Key da OpenAI do usuário');
      
      const apiKeyResult = await getApiKey(userId, provider, supabaseClient);
      if (!apiKeyResult) {
        throw new Error('❌ API Key da OpenAI não configurada. Configure em Configurações → API Keys.');
      }

      const apiKey = apiKeyResult.key;
      console.log(`✅ Usando chave do usuário para OpenAI (modelo: ${aiModel})`);

      // Helper: Detecta se é modelo novo (2025+)
      const isNewModel = aiModel.includes('2025') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      
      // Helper: Detecta se é modelo de raciocínio (precisa de mais tokens)
      const isReasoningModel = aiModel.startsWith('gpt-5') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      
      // Construir body dinamicamente baseado no modelo
      const openaiBody: any = {
        model: aiModel,
        messages: [{ role: 'user', content: prompt }]
      };
      
      // Modelos novos: max_completion_tokens (SEM temperature)
      if (isNewModel) {
        // Modelos de raciocínio precisam de MUITO mais tokens (raciocínio + resposta)
        if (isReasoningModel) {
          console.log('🧠 Modelo de raciocínio detectado - usando 16000 max_completion_tokens');
          openaiBody.max_completion_tokens = 16000;
        } else {
          // GPT-4.1 e outros modelos novos precisam de mais tokens para análises grandes
          console.log('📦 Usando 8000 max_completion_tokens para modelo novo (2025+)');
          openaiBody.max_completion_tokens = 8000;
        }
      } else {
        // Modelos legacy também precisam de mais tokens
        console.log('📦 Usando 8000 max_tokens para modelo legacy');
        openaiBody.max_tokens = 8000;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro OpenAI API:', errorText);
        
        if (response.status === 401) {
          throw new Error('❌ API Key da OpenAI inválida. Verifique sua chave em Configurações.');
        }
        if (response.status === 429) {
          throw new Error('❌ Limite de uso da API da OpenAI excedido.');
        }
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      console.log('📦 Resposta completa da OpenAI:', JSON.stringify(data).slice(0, 500));
      
      // VALIDAÇÃO: Verificar se a resposta contém os dados esperados
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Resposta da OpenAI sem estrutura esperada:', JSON.stringify(data));
        throw new Error('Resposta inválida da API da OpenAI. Estrutura de dados não encontrada.');
      }

      // VALIDAÇÃO: Verificar se há erro reportado pela API
      if (data.error) {
        console.error('❌ Erro reportado pela OpenAI:', JSON.stringify(data.error));
        throw new Error(`OpenAI API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      resultText = data.choices[0].message.content;
      
      // VALIDAÇÃO: Verificar se o conteúdo não está vazio
      if (!resultText || resultText.trim().length === 0) {
        console.error('❌ Resposta da OpenAI está vazia');
        console.error('📦 Dados completos:', JSON.stringify(data));
        throw new Error('A API da OpenAI retornou uma resposta vazia. Tente novamente ou use outro modelo.');
      }
      
      console.log('✅ Resposta da OpenAI recebida:', resultText.slice(0, 200));

    } else {
      throw new Error(`❌ Modelo de IA não suportado: ${aiModel}`);
    }
    
    console.log('🤖 Resposta bruta da IA (primeiros 500 chars):', resultText.slice(0, 500));
    console.log('📏 Tamanho total da resposta:', resultText.length, 'caracteres');
    
    // Limpeza agressiva do JSON
    resultText = resultText.trim();
    
    // Remove markdown code blocks
    resultText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove texto antes do primeiro { e depois do último }
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('❌ JSON não encontrado na resposta');
      throw new Error('Resposta da IA não contém JSON válido');
    }
    
    resultText = resultText.slice(firstBrace, lastBrace + 1);
    
    console.log('🧹 JSON limpo (primeiros 500 chars):', resultText.slice(0, 500));
    console.log('🧹 JSON limpo (últimos 200 chars):', resultText.slice(-200));
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError: any) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError.message);
      console.error('📄 JSON completo que falhou:', resultText);
      throw new Error(`Falha ao fazer parse da resposta: ${parseError.message}`);
    }
    
    console.log('✅ JSON parseado com sucesso');
    console.log('📊 Estrutura do resultado:', {
      tem_resumo_1: !!result.resumo_1,
      tem_resumo_2: !!result.resumo_2,
      tem_sub_nichos: !!result.sub_nichos,
      qtd_sub_nichos: result.sub_nichos?.length || 0,
      tem_insights: !!result.insights
    });
    
    // VALIDAÇÃO 1: Garantir até 10 campeões com foco nos melhores
    if (result.resumo_2?.micro_nichos_ranking) {
      console.log('🔍 Validando campeões...');
      
      // Ordena por avgViewsPerVideo para garantir que os melhores sejam campeões
      const sorted = [...result.resumo_2.micro_nichos_ranking].sort((a, b) => 
        b.avgViewsPerVideo - a.avgViewsPerVideo
      );
      
      // Marca os TOP 10 como campeões (baseado em performance)
      const championThreshold = Math.min(10, sorted.length);
      
      result.resumo_2.micro_nichos_ranking.forEach((micro: MicroNicheRanking) => {
        const position = sorted.findIndex(m => m.name === micro.name);
        micro.isChampion = position < championThreshold && micro.avgViewsPerVideo > 0;
      });
      
      const championCount = result.resumo_2.micro_nichos_ranking.filter((m: MicroNicheRanking) => m.isChampion).length;
      console.log(`✅ Campeões identificados: ${championCount} (objetivo: até 10 campeões)`);
      console.log('🏆 Campeões:', result.resumo_2.micro_nichos_ranking
        .filter((m: MicroNicheRanking) => m.isChampion)
        .map((m: MicroNicheRanking) => `${m.name} (${m.avgViewsPerVideo.toFixed(0)} avg views)`)
      );
    }

    // VALIDAÇÃO 2: Verificar completude dos vídeos (limitado a top 5)
    if (result.resumo_2?.micro_nichos_ranking) {
      console.log('🔍 Validando completude dos vídeos...');
      
      result.resumo_2.micro_nichos_ranking.forEach((micro: MicroNicheRanking) => {
        const videosCount = micro.videos?.length || 0;
        const expectedCount = Math.min(micro.videoCount, 5); // Limitado a top 5
        console.log(`  Micro-nicho "${micro.name}": ${videosCount} vídeos (esperado: até ${expectedCount} de ${micro.videoCount} totais)`);
      });
    }
    
    // Validação: Verificar se os exemplos de títulos realmente existem nos dados
    const allTitles = videosToAnalyze.map(v => v.title.toLowerCase());
    if (result.sub_nichos) {
      for (const subNiche of result.sub_nichos) {
        if (subNiche.exemplos) {
          // Filtra apenas exemplos que realmente existem nos títulos fornecidos
          subNiche.exemplos = subNiche.exemplos.filter((exemplo: string) => {
            const exampleLower = exemplo.toLowerCase();
            // Verifica se pelo menos 30% do título de exemplo existe em algum título real
            const exists = allTitles.some(t => {
              const words = exampleLower.split(' ').filter(w => w.length > 3);
              const matchedWords = words.filter(w => t.includes(w));
              return matchedWords.length / words.length > 0.3;
            });
            
            if (!exists) {
              console.warn(`⚠️ Título de exemplo não encontrado nos dados: "${exemplo}"`);
            }
            return exists;
          });
          
          // Se não restou nenhum exemplo válido, usa títulos reais do grupo
          if (subNiche.exemplos.length === 0 && videosToAnalyze.length > 0) {
            console.log(`📝 Substituindo exemplos inválidos por títulos reais`);
            subNiche.exemplos = videosToAnalyze.slice(0, 3).map(v => v.title);
          }
        }
      }
    }

    await supabaseClient.from('sub_niche_analyses').insert({
      user_id: userId,
      competitor_data: competitorData,
      videos_analyzed: videos.length,
      sub_niches_found: result,
      ai_model: aiModel,
    });

    await updateApiKeyUsage(userId, provider, supabaseClient);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videosAnalyzed: videos.length,
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in analyze-competitor-titles:', error);
    console.error('❌ Error stack:', error?.stack);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao analisar títulos';
    console.error('📤 Retornando erro ao cliente:', errorMessage);
    
    const statusCode = /timeout|demorou muito para responder|timed out/i.test(errorMessage) ? 504 : 500;
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error?.details || null
      }),
      { 
        status: statusCode, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});