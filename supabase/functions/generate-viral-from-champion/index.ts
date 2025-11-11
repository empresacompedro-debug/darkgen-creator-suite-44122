import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey, getApiKeyWithHierarchicalFallback } from '../_shared/get-api-key.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Buscar usuário autenticado
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    let { championTitles, aiModel = 'claude-sonnet-4.5' } = await req.json();
    
    // Validação: força modelos válidos (Claude, Gemini e GPT)
    const validModels = ['claude-sonnet-4.5', 'claude-sonnet-4', 'claude-sonnet-3.7', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gpt-4o'];
    if (!validModels.includes(aiModel)) {
      console.warn(`⚠️ Modelo inválido recebido: ${aiModel}. Usando padrão: claude-sonnet-4.5`);
      aiModel = 'claude-sonnet-4.5';
    }

    console.log('🎯 Gerando títulos virais a partir de', championTitles?.length || 0, 'títulos campeões');
    console.log('🤖 Modelo validado:', aiModel);

    if (!championTitles || !Array.isArray(championTitles) || championTitles.length === 0) {
      throw new Error('Campo obrigatório: championTitles (array de objetos com title, structure, theme)');
    }

    // Processar TODOS os títulos campeões
    const championsList = championTitles.map((champion: any, index: number) => `
${index + 1}. TÍTULO ORIGINAL: "${champion.title}"
   ESTRUTURA: ${champion.structure}
`).join('\n');

    const prompt = `Você é um especialista em criar títulos virais para YouTube mantendo estruturas específicas.

Recebi ${championTitles.length} TÍTULOS CAMPEÕES. Você DEVE processar TODOS eles e gerar EXATAMENTE 5 variações para CADA um.

TÍTULOS CAMPEÕES:
${championsList}

TAREFA CRÍTICA:
Para CADA um dos ${championTitles.length} títulos campeões acima, gere EXATAMENTE 5 NOVOS títulos seguindo RIGOROSAMENTE a ESTRUTURA indicada.

REGRAS OBRIGATÓRIAS para cada variação:
1. Mantenha EXATAMENTE a mesma estrutura gramatical do título original
2. Se o título tem um número, mantenha um número na mesma posição (pode variar o valor)
3. Mantenha os mesmos adjetivos na mesma ordem (Disturbing, Scary, Creepy, etc.)
4. Mantenha "TRUE" se o título original tiver
5. Mantenha "Horror Stories" no final se o título original tiver
6. APENAS substitua o tema/assunto ([THEME]) por temas DIFERENTES mas no mesmo contexto
7. Mantenha capitalização e pontuação idênticas

EXEMPLOS DE SUBSTITUIÇÃO DE TEMA:
- Se o original é sobre "Halloween", use: "Friday the 13th", "April Fools", "Labor Day", etc.
- Se é sobre "Childhood", use: "School Days", "First Job", "College Years", etc.  
- Se é sobre "Highway", use: "Back Roads", "Mountain Passes", "Desert Roads", etc.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON puro, sem markdown):
{
  "results": [
    {
      "championTitle": "título campeão 1",
      "structure": "estrutura do título 1",
      "variations": ["variação 1", "variação 2", "variação 3", "variação 4", "variação 5"]
    }
    // ... TODOS os ${championTitles.length} títulos
  ]
}

CRÍTICO: 
- O array "results" DEVE ter EXATAMENTE ${championTitles.length} objetos
- Cada objeto DEVE ter EXATAMENTE 5 variações
- Retorne APENAS o JSON válido`;

    let aiResponse: string;

    // 1. CLAUDE (API Key do Usuário)
    if (aiModel.startsWith('claude')) {
      console.log('🔍 Buscando API Key do Claude para o usuário...');
      const claudeKeyInfo = await getApiKey(userId, 'claude', supabaseClient);
      
      if (!claudeKeyInfo) {
        throw new Error('❌ API Key do Claude não configurada. Configure em Configurações → API Keys.');
      }
      
      const ANTHROPIC_API_KEY = claudeKeyInfo.key;
      console.log(`✅ Usando API Key do Claude (ID: ${claudeKeyInfo.keyId})`);

      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };

      const finalModel = modelMap[aiModel] || 'claude-sonnet-4-5';
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [generate-viral-from-champion] Usando ${maxTokens} max_tokens para ${finalModel}`);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: finalModel,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro Claude API:', errorData);
        
        if (response.status === 401) {
          throw new Error('❌ API Key do Claude está inválida ou expirada. Verifique sua chave em Configurações → API Keys.');
        }
        
        if (response.status === 429) {
          throw new Error('❌ Limite de uso da API do Claude excedido. Aguarde alguns minutos.');
        }
        
        throw new Error(`Claude API Error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.content[0].text;

    // 2. Gemini (API Key do Usuário) com Fallback Hierárquico para Vertex AI
    } else if (aiModel.startsWith('gemini')) {
      console.log('🔍 Buscando API Key do Gemini com fallback hierárquico...');
      const keyData = await getApiKeyWithHierarchicalFallback(userId, 'gemini', supabaseClient);
      
      if (!keyData) {
        throw new Error('❌ API Key do Gemini/Vertex AI não configurada. Configure em Configurações → API Keys.');
      }
      
      console.log(`✅ Usando ${keyData.provider} (ID: ${keyData.keyId})`);

      const { url, headers, body } = await buildGeminiOrVertexRequest(
        keyData,
        aiModel.replace('gemini-', 'gemini-2.0-flash-exp'), // Map to actual model
        prompt,
        false
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro Gemini API:', errorData);
        
        if (response.status === 401) {
          throw new Error('❌ API Key do Gemini está inválida ou expirada. Verifique sua chave em Configurações → API Keys.');
        }
        
        if (response.status === 429) {
          throw new Error('❌ Limite de uso da API do Gemini excedido. Aguarde alguns minutos.');
        }
        
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.candidates[0].content.parts[0].text;

    // 3. GPT (API Key do Usuário)
    } else if (aiModel.startsWith('gpt')) {
      console.log('🔍 Buscando API Key da OpenAI para o usuário...');
      const openaiKeyInfo = await getApiKey(userId, 'openai', supabaseClient);
      
      if (!openaiKeyInfo) {
        throw new Error(`❌ API Key da OpenAI não configurada. Configure em Configurações → API Keys.`);
      }
      
      const OPENAI_API_KEY = openaiKeyInfo.key;
      const isReasoningModel = aiModel.startsWith('gpt-5') || aiModel.startsWith('o3-') || aiModel.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(aiModel);
      console.log(`✅ Usando API Key da OpenAI (ID: ${openaiKeyInfo.keyId})`);
      console.log(`📦 [generate-viral-from-champion] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${aiModel}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'user', content: prompt }],
          ...(isReasoningModel 
            ? { max_completion_tokens: maxTokens }
            : { max_tokens: maxTokens }
          )
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro OpenAI API:', errorData);
        
        if (response.status === 401) {
          throw new Error('❌ API Key da OpenAI está inválida. Verifique sua chave em Configurações → API Keys.');
        }
        
        if (response.status === 429) {
          throw new Error('❌ Limite de uso da API da OpenAI excedido. Aguarde alguns minutos.');
        }
        
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    } else {
      throw new Error(`❌ Modelo de IA não suportado: ${aiModel}. Use claude-sonnet-4 ou gpt-4o.`);
    }

    // Extrair JSON da resposta
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Resposta não contém JSON válido:', aiResponse);
      throw new Error('Resposta da IA não retornou formato esperado');
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.results || !Array.isArray(result.results)) {
      throw new Error('IA não retornou o formato esperado com array de results');
    }

    if (result.results.length !== championTitles.length) {
      console.warn(`⚠️ IA retornou ${result.results.length} grupos, esperado ${championTitles.length}`);
    }

    // Validar que cada grupo tem 5 variações
    const totalVariations = result.results.reduce((sum: number, group: any) => 
      sum + (group.variations?.length || 0), 0
    );

    console.log(`✅ Títulos virais gerados: ${result.results.length} grupos com ${totalVariations} variações totais`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
