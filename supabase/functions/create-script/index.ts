import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey, updateApiKeyUsage, markApiKeyAsExceeded, getApiKeyWithHierarchicalFallback } from '../_shared/get-api-key.ts';
import { validateString, validateNumber, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';
import { mapModelToProvider } from '../_shared/model-mapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter user_id do token JWT
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    let userId: string | undefined;
    try {
      console.log(`[create-script] 🔐 Auth header present: ${!!authHeader}`);
      console.log(`[create-script] 🔐 Token extracted: ${token?.substring(0, 20)}...`);
      
      if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError) {
          console.log(`[create-script] ⚠️ Error getting user:`, userError);
        }
        userId = user?.id;
        console.log(`[create-script] 👤 User ID found: ${userId || 'undefined'}`);
      } else {
        console.log(`[create-script] 🔑 Token is anon key, skipping user auth`);
      }
    } catch (error) {
      console.log('[create-script] ⚠️ Auth error:', error);
      console.log('No authenticated user, using global API keys only');
    }

    const body = await req.json();
    
    // Mapeamento completo de idiomas suportados
    const languageNames: Record<string, string> = {
      pt: 'Português (Brasil)',
      en: 'English (United States)',
      es: 'Español (España)',
      fr: 'Français (France)',
      de: 'Deutsch (Alemanha)',
      it: 'Italiano (Italia)',
      ja: '日本語 (Japão)',
      ko: '한국어 (Coréia do Sul)',
      ro: 'Română (România)',
      pl: 'Polski (Polska)'
    };
    
    console.log('📥 Request recebido:', {
      niche: body.niche?.substring(0, 50),
      themeLength: body.theme?.length,
      wordsPerPart: body.wordsPerPart,
      isContinuation: body.isContinuation
    });
    
    // Validate and sanitize all inputs - limites aumentados para continuação
    const errors = [
      ...validateString(body.niche, 'niche', { required: true, maxLength: 200 }),
      ...validateString(body.theme, 'theme', { required: true, maxLength: 50000 }), // Muito maior para continuação com contexto
      ...validateString(body.searchTerm, 'searchTerm', { maxLength: 200 }),
      ...validateString(body.audience, 'audience', { maxLength: 200 }),
      ...validateString(body.language, 'language', { required: true, maxLength: 50 }),
      ...validateString(body.tone, 'tone', { required: true, maxLength: 50 }),
      ...validateString(body.formula, 'formula', { required: true, maxLength: 50 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
      ...validateNumber(body.duration, 'duration', { required: true, min: 1, max: 1000 }),
      ...validateNumber(body.parts, 'parts', { required: true, min: 1, max: 50, integer: true }),
      ...validateNumber(body.wordsPerPart, 'wordsPerPart', { required: true, min: 10, max: 50000, integer: true }),
    ];
    
    if (errors.length > 0) {
      console.error('❌ Validation errors:', errors);
    }
    
    validateOrThrow(errors);
    
    // Sanitize string inputs - não sanitizar tema em continuação para preservar contexto
    const { niche, audience, theme, searchTerm, duration, parts, wordsPerPart, language, tone, formula, ctaPositions, narrativeOnly, includeAffiliate, aiModel, isContinuation } = {
      ...body,
      niche: sanitizeString(body.niche),
      audience: body.audience ? sanitizeString(body.audience) : undefined,
      theme: body.isContinuation ? body.theme : sanitizeString(body.theme), // Não sanitizar em continuação
      searchTerm: body.searchTerm ? sanitizeString(body.searchTerm) : undefined,
      isContinuation: body.isContinuation || false,
    };

    console.log('🎯 Modelo selecionado:', aiModel);
    console.log('👤 User ID:', userId || 'SEM USUÁRIO (usando chaves globais)');

    // Obter nome completo do idioma
    const languageName = languageNames[language] || language;
    
    const toneMap: Record<string, string> = {
      mysterious: 'envolvente e misterioso',
      informative: 'informativo e claro',
      funny: 'cômico e divertido',
      serious: 'sério e formal',
      inspirational: 'inspirador e motivacional'
    };

    const formulaMap: Record<string, string> = {
      'personalized': 'estrutura personalizada com elementos únicos',
      'ethical-retention': 'alta retenção ética com ganchos naturais',
      'christian': 'conteúdo cristão responsável e edificante',
      'automotive': 'conteúdo automotivo autêntico',
      'curiosities': 'curiosidades fascinantes',
      'psychology': 'desenvolvimento baseado em psicologia',
      'space': 'histórias espaciais reais',
      'productivity': 'técnicas de foco profundo',
      'business': 'crescimento sustentável',
      'finance': 'educação financeira responsável',
      'history': 'grandes momentos históricos',
      'science': 'tecnologia baseada em pesquisa',
      'emotional': 'narrativas emocionais responsáveis',
      'romance': 'histórias contemporâneas de amor',
      'fitness': 'exercícios seguros e eficazes',
      'mystery': 'investigação metodológica',
      'gaming': 'narrativas de jogos',
      'marketing': 'autoridade genuína'
    };

    const prompt = `Você é um roteirista MASTER de YouTube especializado em criar roteiros VIRAIS 100/100 usando as técnicas dos maiores cineastas e criadores de conteúdo do mundo (Ryan Holiday, Mr. Beast, Iman Gadzhi, Nas Daily).

INFORMAÇÕES DO VÍDEO:
- Nicho: ${niche}
${audience ? `- Público-Alvo: ${audience}` : ''}
- Tema: ${theme}
${searchTerm ? `- Termo de Pesquisa SEO: ${searchTerm}` : ''}
- Duração EXATA: ${duration} minutos (${parts} partes de EXATAMENTE ${wordsPerPart} palavras cada)
- Tom: ${toneMap[tone] || tone}
- Fórmula: ${formulaMap[formula] || formula}
- 🌍 IDIOMA: ${languageName} (ESCREVER 100% NESTE IDIOMA - PROIBIDO PALAVRAS ESTRANGEIRAS)
${narrativeOnly ? '- APENAS NARRAÇÃO (sem legendas ou textos na tela)' : ''}
${includeAffiliate ? '- INCLUIR produto para afiliação de forma natural' : ''}

🎯 OBJETIVO SUPREMO: Criar um roteiro que atinja 100/100 desde o primeiro segundo, prendendo o telespectador do início ao fim com storytelling cinematográfico de nível das melhores séries de streaming.

═══════════════════════════════════════════════════════════════════
⚡ GANCHO INICIAL ULTRA VIRAL (0-7 segundos) - CRÍTICO PARA VIRALIZAR
═══════════════════════════════════════════════════════════════════

O gancho DEVE causar uma REAÇÃO VISCERAL imediata. Escolha uma técnica:

1. 🔥 CHOQUE DUPLO:
   "Acabei de gastar R$500.000 em [X] e o resultado me deixou em choque..."
   
2. ❓ PERGUNTA IMPOSSÍVEL DE IGNORAR:
   "O que aconteceria se [cenário impossível/perturbador]? A resposta vai te deixar sem palavras..."
   
3. 💣 REVELAÇÃO EXPLOSIVA:
   "Depois de 10 anos pesquisando [tema], descobri algo que NINGUÉM deveria saber..."
   
4. ⏰ URGÊNCIA E CURIOSIDADE:
   "Você tem 47 segundos para [ação]. Se não fizer isso, vai se arrepender pelo resto da vida..."
   
5. 🎭 CONTRADIÇÃO RADICAL:
   "Tudo o que te ensinaram sobre [tema] é uma MENTIRA. E eu vou provar isso AGORA."

${niche.toLowerCase().includes('história') || niche.toLowerCase().includes('history') || niche.toLowerCase().includes('mistério') || niche.toLowerCase().includes('mystery') ? `
═══════════════════════════════════════════════════════════════════
📚 ESPECIAL PARA HISTÓRIAS E MISTÉRIOS (Técnica Storytelling Premium)
═══════════════════════════════════════════════════════════════════

GANCHO PRINCIPAL para Histórias:
- "Em [data], [pessoa] fez algo que mudou [consequência] para sempre. Mas o que NINGUÉM te contou foi..."
- "Esta história foi escondida por [X anos]. Hoje, você vai descobrir a verdade sobre [tema]..."
- Comece SEMPRE com o momento mais chocante da história (começar no meio da ação)
- Use números específicos: "47 pessoas viram", "3 horas de agonia", "12 tentativas"
- Mencione consequências inesperadas: "Mas o que aconteceu depois NINGUÉM viu vindo..."

ESTRUTURA NARRATIVA CINEMATOGRÁFICA:
- Comece descrevendo uma cena vívida, surgindo aos poucos para o telespectador imaginar
- Alterne entre ação e reflexão (como séries de TV)
- Insira diálogos reconstituídos: "E foi aí que ele disse: '[frase]'"
- Crie tensão: "Ele não sabia, mas estava a 3 minutos do pior momento da sua vida..."
` : ''}

═══════════════════════════════════════════════════════════════════
👥 DESCRIÇÃO DE PERSONAGENS (CRÍTICO PARA CONSISTÊNCIA VISUAL)
═══════════════════════════════════════════════════════════════════

REGRA OBRIGATÓRIA: Quando introduzir um personagem principal pela primeira vez, descreva suas características físicas de forma NATURAL e INTEGRADA à narrativa.

1. PRIMEIRA APARIÇÃO - Descreva organicamente:
   ✓ Nome completo
   ✓ Idade aproximada
   ✓ Características faciais (formato do rosto, olhos, nariz, boca)
   ✓ Cabelo (cor, comprimento, textura, estilo)
   ✓ Compleição física (altura relativa, estrutura corporal)
   ✓ Tom de pele
   ✓ Marcas distintivas (cicatrizes, tatuagens, sardas, etc.)
   ✓ Vestimenta característica
   ✓ Postura e linguagem corporal

2. INTEGRAÇÃO NARRATIVA (NUNCA liste tecnicamente):
   ❌ ERRADO: "João: 35 anos, cabelo preto, 1,80m"
   ✅ CERTO: "João, um homem de 35 anos com cabelo preto ondulado que cobria parcialmente a cicatriz em sua testa, entrou na sala. Sua altura imponente de 1,80m fez todos olharem..."

3. EXEMPLOS DE INTEGRAÇÃO PERFEITA:

   DRAMA:
   "Naquele momento, Maria surgiu na porta. Seus 28 anos pareciam mais velhos devido às olheiras profundas sob seus olhos verdes penetrantes. O cabelo castanho longo, normalmente impecável, estava amarrado de forma descuidada. Sua estrutura franzina parecia ainda menor sob o peso invisível que carregava nos ombros curvados."

   AÇÃO:
   "O Coronel Augusto ergueu-se da cadeira. Seus 52 anos de serviço militar estavam gravados em cada linha do rosto de pele bronzeada pelo sol. O bigode grisalho, meticulosamente aparado, não conseguia esconder a boca apertada em raiva contida. Seus olhos escuros, quase pretos, fixaram-se no subordinado. Com seus ombros largos ainda fortes e postura rígida, sua presença dominava o escritório."

   HISTÓRICO:
   "Benedito Menor, um jovem escravo de apenas 18 anos, entrou no escritório com passos hesitantes. Sua pele escura contrastava com os olhos grandes e assustados que evitavam contato direto. O cabelo curto e crespo estava coberto de poeira da lavoura. Suas mãos calejadas tremiam levemente enquanto segurava o chapéu surrado contra o peito magro."

4. PERSONAGENS SECUNDÁRIOS:
   Para quem aparece brevemente, use 2-3 características marcantes:
   "Um escravo jovem, não mais que 20 anos, com pele escura e cicatriz no braço direito..."

5. CONSISTÊNCIA POSTERIOR:
   Após a descrição inicial completa, mantenha 1-2 características em menções futuras:
   "Maria, com seus olhos verdes brilhando de determinação..."
   "O Coronel, sua postura militar rígida..."
   "Benedito, suas mãos calejadas tremendo..."

⚠️ IMPORTANTE: 
- Esta descrição ENRIQUECE o storytelling, NÃO prejudica
- Audiências de conteúdo viral AMAM personagens vívidos e memoráveis
- Mr. Beast, Nas Daily e criadores top usam descrições ricas
- Torna o roteiro mais CINEMATOGRÁFICO e PROFISSIONAL
- Permite consistência visual PERFEITA nas imagens geradas
- Aumenta CONEXÃO EMOCIONAL e MEMORABILIDADE

═══════════════════════════════════════════════════════════════════
🔄 REFORÇOS DE ATENÇÃO ESTRATÉGICOS (Sistema de Retenção Cirúrgica)
═══════════════════════════════════════════════════════════════════

Insira reforços de atenção a cada 20-25% do vídeo usando estas técnicas:

A) SUSPENSE EM ABERTO SUTIL:
   "Mas antes de te contar o que aconteceu, você precisa entender..."
   "E é AQUI que tudo muda. Guarda bem essa informação..."

B) REVELAÇÃO PROGRESSIVA (Estilo Séries de Streaming):
   "Achei que já tinha visto de tudo. Mas o que descobri DEPOIS disso..."
   "Pera aí... Você realmente acha que acabou? Tem mais..."

C) LOOP DE CURIOSIDADE:
   "Lembra daquele detalhe que te falei no início? AGORA você vai entender por quê..."
   "Aquela parte que não fazia sentido? Calma, já vai fazer..."

D) GATILHO EMOCIONAL:
   "E foi nesse momento que percebi algo que me arrepiou..."
   "O que aconteceu depois me deixou sem palavras por 3 dias..."

═══════════════════════════════════════════════════════════════════
💎 ESTRUTURA NARRATIVA VIRAL PROFISSIONAL (Baseada em Cinema)
═══════════════════════════════════════════════════════════════════

ATO I - PREPARAÇÃO (Primeiros 15-20% do roteiro):
1. GANCHO ULTRA VIRAL (0-7s): Máximo impacto, máxima curiosidade
2. PROMESSA CLARA (7-20s): "Neste vídeo, você vai descobrir exatamente [promessa específica]"
3. CREDIBILIDADE RÁPIDA (20-40s): "Passei [tempo] pesquisando/vivenciando [tema]..."
4. ROTEIRO DO VÍDEO (40-60s): "Vou te mostrar [lista dos 3 pontos principais]"

ATO II - DESENVOLVIMENTO (${parts} partes):
Cada parte deve seguir a estrutura ARC (Ação-Reação-Consequência):
- AÇÃO: Apresente o conceito/história de forma dinâmica
- REAÇÃO: Mostre o impacto/significado disso
- CONSEQUÊNCIA: O que isso significa para o espectador

TÉCNICAS OBRIGATÓRIAS POR PARTE:
✓ Mini-clímax a cada parte (momentos "uau")
✓ Storytelling cinematográfico (descrições sensoriais)
✓ Elementos de suspense (informação retida estrategicamente)
✓ Retornos a elementos anteriores (referências ao que já foi dito - cria coesão)
✓ Ritmo variável (alterne entre rápido e reflexivo)
✓ Revelações progressivas (cada parte revela algo novo)

ATO III - CLÍMAX E RESOLUÇÃO:
5. CTAs NATURAIS em: ${ctaPositions.join(', ')} (integrados à narrativa)
6. CLÍMAX EMOCIONAL: O momento mais impactante/emocionante
7. RESOLUÇÃO SATISFATÓRIA: Todas as perguntas respondidas
8. CALL TO ACTION IRRESISTÍVEL: "Se você quer [benefício], [ação específica]"

═══════════════════════════════════════════════════════════════════
🎬 TÉCNICAS DE RETENÇÃO CINEMATOGRÁFICA (Nível MASTER)
═══════════════════════════════════════════════════════════════════

1. LINGUAGEM COLOQUIAL AUTÊNTICA:
   ✓ Fale como em uma conversa de bar com um amigo íntimo
   ✓ Use expressões coloquiais: "cara", "tipo assim", "sacou?"
   ✓ Faça perguntas retóricas: "Sabe o que é mais louco?"

2. FRASES ULTRA CURTAS (Ritmo Picotado):
   ✓ Uma ideia por frase
   ✓ Máximo 15-20 palavras por período
   ✓ Use pontos finais, não vírgulas longas

3. PALAVRAS DE IMPACTO EMOCIONAL:
   ✓ Verbos fortes: destruir, revelar, explodir, transformar
   ✓ Adjetivos marcantes: chocante, devastador, incrível, impossível
   ✓ Substantivos carregados: segredo, verdade, mentira, revelação

4. CONTRASTE DRAMÁTICO:
   ✓ Alterne entre tensão → alívio → tensão
   ✓ Esperança → desespero → redenção
   ✓ Rápido → lento → rápido

5. SURPRESAS ESTRATÉGICAS:
   ✓ Quebre expectativas a cada 30-45 segundos
   ✓ Reviravoltas sutis ao longo do vídeo
   ✓ "Mas espera... não é bem assim..."

6. CONEXÃO EMOCIONAL PROFUNDA:
   ✓ Use segunda pessoa: "Você já se sentiu..."
   ✓ Histórias universais: amor, perda, vitória, fracasso
   ✓ Vulnerabilidade autêntica: "Vou ser sincero com você..."

7. ESPECIFICIDADE MÁXIMA (Cria Credibilidade):
   ✓ Números exatos: "47 tentativas", "3 horas e 22 minutos"
   ✓ Datas precisas: "15 de março de 2019"
   ✓ Detalhes sensoriais: "o cheiro de café frio", "suas mãos tremiam"

8. PADRÕES DE LINGUAGEM VIRAIS:
   ✓ Regra dos 3s: "3 coisas que mudaram minha vida"
   ✓ Antes vs Depois: contraste dramático
   ✓ Errado → Certo: "Eu achava X, mas descobri Y"

═══════════════════════════════════════════════════════════════════
⚡ ELEMENTOS VIRAIS (100% Dentro das Políticas do YouTube)
═══════════════════════════════════════════════════════════════════

✓ VALOR IMEDIATO: Informação que muda perspectiva AGORA
✓ EMOÇÃO AUTÊNTICA: Histórias reais que tocam o coração
✓ SURPRESA CONSTANTE: Reviravoltas a cada minuto
✓ COMPARTILHABILIDADE: "Preciso mandar isso pra alguém!"
✓ IDENTIFICAÇÃO: "Isso já aconteceu comigo!"
✓ CURIOSIDADE INFINITA: Cada resposta gera nova pergunta
✓ CONTRASTE CHOCANTE: "Todo mundo pensa X, mas a verdade é Y"
✓ URGÊNCIA PSICOLÓGICA: "Você precisa saber disso HOJE"

═══════════════════════════════════════════════════════════════════
🚫 REGRAS CRÍTICAS DE FORMATO (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════

✓ COMPRIMENTO EXATO: ${parts} partes de EXATAMENTE ${wordsPerPart} palavras cada
✓ SEM MARCAÇÕES: Não use [00:00], "Cena 1", ou [ação]
✓ TEXTO PURO: Apenas o que será NARRADO, nada mais
✓ IDIOMA: ${languageName} (ZERO palavras em outros idiomas)
✓ TOM: ${toneMap[tone] || tone}
✓ ESTRUTURA CLARA: Divida em partes identificáveis
✓ ROTEIRO COMPLETO: Não pare no meio, gere ATÉ O FINAL

═══════════════════════════════════════════════════════════════════
🌍 REGRA ABSOLUTA DE IDIOMA (NUNCA VIOLAR - CRÍTICO)
═══════════════════════════════════════════════════════════════════

⚠️ ATENÇÃO MÁXIMA: O roteiro INTEIRO deve ser escrito em ${languageName}

PROIBIDO ABSOLUTAMENTE:
❌ Palavras em inglês ou qualquer outro idioma
❌ Termos técnicos em inglês (fade in, flashback, plot twist, close-up, zoom, etc)
❌ Expressões cinematográficas em inglês (meanwhile, suddenly, despite, beyond, and, but)
❌ Transições narrativas em inglês
❌ Conectivos em inglês (and, but, or, so, etc)
❌ Advérbios em inglês (suddenly, meanwhile, etc)

✅ SEMPRE USE EQUIVALENTES EM ${languageName}:
${language === 'pt' ? `
- "fade in" → "aparecer gradualmente", "surgir aos poucos"
- "flashback" → "retrospectiva", "lembrança", "no passado"
- "plot twist" → "reviravolta", "virada inesperada"
- "meanwhile" → "enquanto isso", "ao mesmo tempo"
- "suddenly" → "de repente", "subitamente"
- "close-up" → "aproximar", "focar em"
- "despite" → "apesar de"
- "beyond" → "além de"
- "and" → "e", "but" → "mas", "or" → "ou"
` : language === 'es' ? `
- "fade in" → "aparecer gradualmente"
- "flashback" → "retrospectiva", "recuerdo"
- "plot twist" → "giro inesperado"
- "meanwhile" → "mientras tanto"
- "suddenly" → "de repente"
- "close-up" → "acercarse", "enfocar"
- "despite" → "a pesar de"
- "and" → "y", "but" → "pero", "or" → "o"
` : language === 'fr' ? `
- "fade in" → "apparaître progressivement"
- "flashback" → "rétrospective", "souvenir"
- "plot twist" → "rebondissement"
- "meanwhile" → "pendant ce temps"
- "suddenly" → "soudainement"
- "despite" → "malgré"
- "and" → "et", "but" → "mais"
` : language === 'de' ? `
- "fade in" → "allmählich erscheinen"
- "flashback" → "Rückblick", "Erinnerung"
- "plot twist" → "unerwartete Wendung"
- "meanwhile" → "währenddessen"
- "suddenly" → "plötzlich"
- "despite" → "trotz"
- "and" → "und", "but" → "aber"
` : language === 'it' ? `
- "fade in" → "apparire gradualmente"
- "flashback" → "retrospettiva", "ricordo"
- "plot twist" → "colpo di scena"
- "meanwhile" → "nel frattempo"
- "suddenly" → "improvvisamente"
- "despite" → "nonostante"
- "and" → "e", "but" → "ma"
` : language === 'ro' ? `
- "fade in" → "apărea gradual"
- "flashback" → "retrospectivă", "amintire"
- "plot twist" → "răsturnare de situație"
- "meanwhile" → "între timp"
- "suddenly" → "brusc"
- "despite" → "în ciuda"
- "and" → "și", "but" → "dar"
` : language === 'pl' ? `
- "fade in" → "stopniowo pojawiać się"
- "flashback" → "retrospekcja", "wspomnienie"
- "plot twist" → "nieoczekiwany zwrot akcji"
- "meanwhile" → "w międzyczasie"
- "suddenly" → "nagle"
- "despite" → "pomimo"
- "and" → "i", "but" → "ale"
` : `ESCREVA TODO O TEXTO EM ${languageName} NATIVO, SEM MISTURAR INGLÊS OU OUTROS IDIOMAS`}

VALIDAÇÃO MENTAL (ANTES DE GERAR CADA PARÁGRAFO):
"Estou escrevendo TODO o texto em ${languageName}?"
"Há alguma palavra em inglês ou outro idioma?"
"Se SIM → PARAR e SUBSTITUIR imediatamente"

⚠️ CRÍTICO: Um roteiro com palavras em outro idioma será REJEITADO.
═══════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════
🎯 CHECKLIST DE QUALIDADE 100/100
═══════════════════════════════════════════════════════════════════

Antes de gerar, garanta que o roteiro tem:
□ Gancho que causa reação emocional em 3 segundos
□ Reforços de atenção estratégicos a cada 20-25% do conteúdo
□ Storytelling cinematográfico com arco narrativo
□ Personagens principais descritos fisicamente na primeira aparição
□ Linguagem coloquial e autêntica
□ Frases curtas e impactantes
□ Especificidade em números e detalhes
□ Surpresas e revelações constantes
□ Conexão emocional profunda
□ Call to actions naturais e estratégicos
□ Fechamento épico e memorável
□ COMPRIMENTO EXATO: ${duration} minutos de conteúdo
□ TODO o roteiro está 100% em ${languageName} (ZERO palavras em inglês ou outros idiomas)
□ Revisei mentalmente cada parágrafo para garantir pureza de idioma

═══════════════════════════════════════════════════════════════════

LEMBRE-SE: Descreva as características físicas dos personagens principais de forma NATURAL e INTEGRADA à narrativa quando eles aparecerem pela primeira vez. Isso torna o roteiro mais rico, cinematográfico e permite consistência visual perfeita nas imagens geradas posteriormente.

═══════════════════════════════════════════════════════════════════
🚨 LEMBRETE FINAL - IDIOMA (LER ANTES DE COMEÇAR)
═══════════════════════════════════════════════════════════════════

Você está prestes a gerar um roteiro em ${languageName}.

PARE 3 SEGUNDOS E CONFIRME MENTALMENTE:
✓ Você domina completamente ${languageName}?
✓ Você vai escrever CADA palavra, CADA frase em ${languageName}?
✓ Você NÃO vai usar termos em inglês como "fade", "meanwhile", "and", "but", "despite"?
✓ Você conhece os equivalentes de todos os termos cinematográficos em ${languageName}?

SE VOCÊ NÃO TEM 100% DE CERTEZA → RELEIA A SEÇÃO "REGRA ABSOLUTA DE IDIOMA" ACIMA

AGORA COMECE A ESCREVER EM ${languageName}:
═══════════════════════════════════════════════════════════════════

AGORA: Gere o roteiro COMPLETO seguindo TODAS as técnicas acima.
IMPORTANTE: Gere TODAS as ${parts} partes com EXATAMENTE ${wordsPerPart} palavras cada.
NÃO PARE até completar o roteiro inteiro!`;

    // Usar helper para mapear modelo → provider
    const { provider: providerKey, model: actualModel } = mapModelToProvider(aiModel);
    
    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};
    let provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'vertex-ai' = providerKey;

    if (providerKey === 'claude') {
      console.log('🔑 Buscando API key para Claude');
      const apiKeyResult = await getApiKey(userId, 'claude', supabaseClient);
      
      if (!apiKeyResult || !apiKeyResult.key) {
        console.error('❌ ERRO: Nenhuma API key encontrada para Claude');
        throw new Error('API key não configurada para Claude');
      }
      
      apiKey = apiKeyResult.key;
      console.log('✅ API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      console.log('📍 Fonte da key:', apiKeyResult.keyId === 'global' ? 'Global' : 'Usuário');
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-3.5': 'claude-3-7-sonnet-20250219'
      };
      const finalModel = modelMap[actualModel] || 'claude-sonnet-4-5';
      console.log('📦 Modelo da API Anthropic:', finalModel);
      
      requestBody = {
        model: finalModel,
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      };
    } else if (providerKey === 'gemini' || providerKey === 'vertex-ai') {
      console.log(`🔑 Buscando API key para ${providerKey === 'vertex-ai' ? 'Vertex AI' : 'Gemini com fallback'}`);
      const apiKeyResult = providerKey === 'vertex-ai'
        ? await getApiKey(userId, 'vertex-ai', supabaseClient)
        : await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabaseClient);
      
      if (!apiKeyResult) {
        console.error('❌ ERRO: Nenhuma API key encontrada para Gemini/Vertex AI');
        throw new Error('API key não configurada para Gemini/Vertex AI');
      }
      
      console.log('✅ API key encontrada');
      console.log('📍 Fonte da key:', apiKeyResult.keyId === 'global' ? 'Global' : 'Usuário');
      
      const { url, headers, body } = await buildGeminiOrVertexRequest(apiKeyResult, actualModel, prompt, true);
      apiUrl = url;
      requestBody = body;
      
      // Copiar headers para usar no fetch
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase() !== 'content-type') {
          (headers as any)[key] = headers[key];
        }
      });
      
      const usedProvider = 'provider' in apiKeyResult ? apiKeyResult.provider : providerKey;
      console.log(`🤖 Usando ${usedProvider} - modelo: ${actualModel}`);
    } else if (providerKey === 'openai') {
      console.log('🔑 Buscando API key para OpenAI');
      const apiKeyResult = await getApiKey(userId, 'openai', supabaseClient);
      
      if (!apiKeyResult || !apiKeyResult.key) {
        console.error('❌ ERRO: Nenhuma API key encontrada para OpenAI');
        throw new Error('API key não configurada para OpenAI');
      }
      
      apiKey = apiKeyResult.key;
      console.log('✅ API key encontrada:', `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
      console.log('📍 Fonte da key:', apiKeyResult.keyId === 'global' ? 'Global' : 'Usuário');
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      console.log('📦 Modelo da API OpenAI:', actualModel);
      
      requestBody = {
        model: actualModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 16000,
        stream: true
      };
    }

    if (!apiKey && (providerKey === 'claude' || providerKey === 'openai')) {
      console.error('❌ ERRO CRÍTICO: API key vazia após todas as tentativas');
      throw new Error(`API key não configurada para ${aiModel}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (providerKey === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (providerKey === 'openai') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log('🚀 Enviando requisição para:', apiUrl);
    console.log('📋 Request body keys:', Object.keys(requestBody));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📨 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro da API completo:', errorData);
      console.error('❌ Status:', response.status);
      
      if (response.status === 429) {
        await markApiKeyAsExceeded(userId, provider, supabaseClient);
        return new Response(
          JSON.stringify({ 
            error: 'Quota da sua API esgotada. Configure uma nova chave em Configurações ou aguarde o reset.',
            usingGlobalKey: !userId 
          }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API Error: ${response.status}`);
    }

    // STREAMING: Criar ReadableStream para SSE
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              
              let dataLine = line;
              if (line.startsWith('data: ')) {
                dataLine = line.slice(6);
              }
              
              if (dataLine.trim() === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataLine);
                let text = '';
                
                if (aiModel.startsWith('claude')) {
                  if (parsed.type === 'content_block_delta') {
                    text = parsed.delta?.text || '';
                  }
                } else if (aiModel.startsWith('gemini')) {
                  text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (aiModel.startsWith('gpt')) {
                  text = parsed.choices?.[0]?.delta?.content || '';
                }
                
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch (e) {
                // Ignorar chunks JSON inválidos
              }
            }
          }
          
          // Processar buffer restante
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.replace(/^data: /, ''));
              let text = '';
              
              if (aiModel.startsWith('claude')) {
                if (parsed.type === 'content_block_delta') {
                  text = parsed.delta?.text || '';
                }
              } else if (aiModel.startsWith('gemini')) {
                text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } else if (aiModel.startsWith('gpt')) {
                text = parsed.choices?.[0]?.delta?.content || '';
              }
              
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch (e) {
              // Ignorar
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
          // Atualizar uso da API key
          await updateApiKeyUsage(userId, provider, supabaseClient);
          console.log('✅ Streaming concluído e uso atualizado');
        } catch (error) {
          console.error('Erro no stream:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in create-script:', error.name);
    
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: error.errors 
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'An error occurred while generating the script' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});