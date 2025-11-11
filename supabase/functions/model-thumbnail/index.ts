import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiKey, updateApiKeyUsage } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// HUGGINGFACE MODELS
// ========================================
const HF_MODELS: Record<string, string> = {
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
  'flux-dev': 'black-forest-labs/FLUX.1-dev',
  'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
  'sdxl-turbo': 'stabilityai/sdxl-turbo',
  'sd-21': 'stabilityai/stable-diffusion-2-1',
  'sd-15': 'runwayml/stable-diffusion-v1-5',
};

// ========================================
// POLLINATIONS MODELS
// ========================================
const POLLINATIONS_MODELS: Record<string, string> = {
  'pollinations': 'flux',
  'pollinations-flux-realism': 'flux-realism',
  'pollinations-flux-anime': 'flux-anime',
  'pollinations-flux-3d': 'flux-3d',
  'pollinations-turbo': 'turbo'
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getAnalysisPrompt(modelingLevel: string, customInstructions?: string): string {
  const basePrompts: Record<string, string> = {
    identical: `Analise esta thumbnail de YouTube EM DETALHES EXTREMOS para criar uma cópia IDÊNTICA.

EXTRAIA E DESCREVA MINUCIOSAMENTE:

📐 COMPOSIÇÃO E LAYOUT:
- Posição exata de cada elemento (esquerda/direita/centro, percentuais)
- Divisão do espaço (split-screen? que proporção?)
- Camadas visuais (frente, meio, fundo)
- Pontos focais e hierarquia visual

🎨 CORES E ESTILO VISUAL:
- Paleta de cores EXATA (tons, saturação, contrastes)
- Gradientes ou cores sólidas? Onde?
- Efeitos visuais (glow, sombras, bordas, outlines)
- Estilo artístico (realista, cartoon, 3D, flat design?)

✍️ TEXTO E TIPOGRAFIA:
- Texto EXATO (todas as palavras, maiúsculas, minúsculas)
- Fonte (bold, italic, outline, shadow?)
- Tamanho relativo de cada texto
- Posicionamento EXATO de cada texto
- Cores do texto
- Efeitos no texto (stroke, glow, 3D?)

👤 PESSOAS/PERSONAGENS:
- Quantas pessoas? Características físicas
- Poses, expressões, gestos
- Roupas e acessórios
- Posição na composição

🎬 ELEMENTOS VISUAIS:
- Todos os objetos/ícones/símbolos presentes
- Backgrounds (texturas, padrões, imagens)
- Efeitos especiais (fogo, água, luz, partículas)
- Elementos decorativos

FORNEÇA UMA DESCRIÇÃO CIRÚRGICA que permitirá recriar PIXEL POR PIXEL esta thumbnail.

${customInstructions || ''}`,

    similar: `Analise esta thumbnail de YouTube para criar uma versão SIMILAR mantendo o mesmo impacto visual.

EXTRAIA OS ELEMENTOS-CHAVE:

📐 ESTRUTURA FUNDAMENTAL:
- Layout geral (divisão de espaços, simetria)
- Tipo de composição (split-screen, centralizado, etc)
- Hierarquia visual principal

🎨 IDENTIDADE VISUAL:
- Esquema de cores dominante
- Estilo artístico (cartoon, realista, 3D, minimalista)
- Mood/atmosfera (energético, calmo, dramático)
- Elementos visuais principais

✍️ TEXTOS E MENSAGEM:
- Mensagem central (tema, conceito)
- Estilo de texto (tamanho relativo, posição)
- Palavras-chave ou frases importantes

👤 ELEMENTOS HUMANOS:
- Presença de pessoas? Quantas? Como?
- Expressões e emoções transmitidas

🎯 CONCEITO GERAL:
- Qual a proposta da thumbnail?
- Que emoção ela busca causar?
- Elementos que NÃO podem mudar
- Elementos que PODEM variar

FORNEÇA uma análise que permita criar uma versão similar mas não idêntica.

${customInstructions || ''}`,

    concept: `Analise esta thumbnail de YouTube para extrair seu CONCEITO CENTRAL e permitir uma reimaginação criativa.

IDENTIFIQUE:

🎯 CONCEITO CORE:
- Qual a mensagem/ideia PRINCIPAL?
- Que sentimento deve transmitir?
- Qual o objetivo desta thumbnail?

🧠 ELEMENTOS CONCEITUAIS:
- Tema/assunto do vídeo
- Tom emocional (informativo, dramático, divertido, sério)
- Target audience (público-alvo provável)

🎨 ESCOLHAS CRIATIVAS:
- Por que essas cores foram escolhidas?
- Por que essa composição?
- Que princípios de design estão sendo usados?

✨ POSSIBILIDADES DE REIMAGINAÇÃO:
- Que elementos podem ser completamente diferentes?
- Que sentimento DEVE ser mantido?
- Como transmitir a mesma mensagem de forma diferente?

FORNEÇA uma análise CONCEITUAL que permita criar algo completamente novo mas com o mesmo impacto.

${customInstructions || ''}`
  };

  return basePrompts[modelingLevel] || basePrompts.similar;
}

async function analyzeImageWithAI(
  imageBase64: string,
  modelingLevel: string,
  aiModel: string,
  customInstructions: string | undefined,
  userId: string,
  supabaseClient: any
): Promise<string> {
  console.log(`🔍 Analisando imagem com ${aiModel}`);
  
  const analysisPrompt = getAnalysisPrompt(modelingLevel, customInstructions);
  
  // Get API key based on model
  let provider: 'claude' | 'gemini' | 'openai';
  if (aiModel.startsWith('claude')) {
    provider = 'claude';
  } else if (aiModel.startsWith('gemini')) {
    provider = 'gemini';
  } else if (aiModel.startsWith('gpt')) {
    provider = 'openai';
  } else {
    throw new Error('Modelo de IA inválido. Use claude, gemini ou gpt');
  }
  
  const keyData = await getApiKey(userId, provider, supabaseClient);
  if (!keyData) {
    throw new Error(`❌ Nenhuma chave ${provider.toUpperCase()} configurada. Configure em Configurações → Chaves de API`);
  }
  
  console.log(`🔑 Usando chave ${provider}`);
  
  let analysis = '';
  
  // Call appropriate API based on model
  if (provider === 'claude') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': keyData.key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: aiModel,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            },
            {
              type: 'text',
              text: analysisPrompt
            }
          ]
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Error: ${error}`);
    }
    
    const data = await response.json();
    analysis = data.content[0].text;
    
  } else if (provider === 'gemini') {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${keyData.key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }]
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API Error: ${error}`);
    }
    
    const data = await response.json();
    analysis = data.candidates[0].content.parts[0].text;
    
  } else if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyData.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiModel,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: analysisPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${error}`);
    }
    
    const data = await response.json();
    analysis = data.choices[0].message.content;
  }
  
  // Update API key usage
  await updateApiKeyUsage(userId, keyData.keyId, supabaseClient);
  
  console.log(`✅ Análise concluída (${analysis.length} caracteres)`);
  return analysis;
}

function createGenerationPrompt(analysis: string, modelingLevel: string): string {
  const instructions: Record<string, string> = {
    identical: `Com base na análise detalhada abaixo, crie uma thumbnail de YouTube IDÊNTICA à original.

ANÁLISE DA THUMBNAIL ORIGINAL:
${analysis}

INSTRUÇÕES CRÍTICAS:
- Recrie EXATAMENTE como descrito na análise
- Mesma composição, mesmas cores, mesmos elementos
- Textos IDÊNTICOS (mesmas palavras, mesma tipografia)
- Mesmas poses e expressões
- FIDELIDADE MÁXIMA à descrição

Crie uma thumbnail profissional de YouTube em alta qualidade (1280x720px).`,

    similar: `Com base na análise abaixo, crie uma thumbnail de YouTube SIMILAR mantendo o mesmo impacto visual.

ANÁLISE DA THUMBNAIL DE REFERÊNCIA:
${analysis}

INSTRUÇÕES:
- Mantenha a ESTRUTURA geral da composição
- Use PALETA DE CORES similar
- Mantenha o ESTILO VISUAL e mood
- Pode variar textos específicos mas mantenha a mensagem
- Mantenha elementos-chave mas pode ajustar detalhes
- DEVE SER RECONHECÍVEL como inspirada na original

Crie uma thumbnail profissional de YouTube em alta qualidade (1280x720px).`,

    concept: `Com base na análise conceitual abaixo, crie uma thumbnail de YouTube NOVA baseada no mesmo conceito.

ANÁLISE CONCEITUAL:
${analysis}

INSTRUÇÕES:
- Capture a ESSÊNCIA e mensagem principal
- Reimagine completamente a composição
- Use cores e elementos DIFERENTES mas complementares
- Crie novos textos mantendo a ideia central
- INOVE mas mantenha o mesmo impacto emocional
- Deve transmitir a MESMA MENSAGEM de forma diferente

Crie uma thumbnail profissional de YouTube em alta qualidade (1280x720px).`
  };

  return instructions[modelingLevel] || instructions.similar;
}

async function getUserHuggingFaceToken(userId: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', userId)
      .eq('api_provider', 'huggingface')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No user HuggingFace token found, using environment variable');
      return null;
    }

    const { data: decryptedData, error: decryptError } = await supabase.rpc('decrypt_api_key', {
      p_encrypted: data.api_key_encrypted,
      p_user_id: userId
    });

    if (decryptError) {
      console.error('Error decrypting token:', decryptError);
      return null;
    }

    return decryptedData;
  } catch (error) {
    console.error('Error retrieving user token:', error);
    return null;
  }
}

async function generateWithHuggingFace(
  prompt: string,
  model: string,
  token: string
): Promise<ArrayBuffer> {
  const modelId = HF_MODELS[model] || HF_MODELS['flux-schnell'];
  const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  
  console.log(`🤗 Calling HuggingFace: ${modelId}`);
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 50,
            guidance_scale: 7.5,
          }
        })
      });

      if (response.status === 401) {
        throw new Error('❌ Token inválido ou expirado. Configure um token válido em Configurações → Chaves de API');
      }

      if (response.status === 402) {
        throw new Error('❌ Créditos insuficientes no HuggingFace. Adicione créditos ou use Pollinations (gratuito)');
      }

      if (response.status === 503) {
        console.log(`⏳ Model loading (attempt ${attempt}/${maxRetries}), waiting...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 20000)); // 20s wait
          continue;
        }
        throw new Error('Modelo ainda carregando. Tente novamente em 30 segundos.');
      }

      if (response.status === 429) {
        console.log(`⏳ Rate limit (attempt ${attempt}/${maxRetries}), waiting...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10s wait
          continue;
        }
        throw new Error('Limite de requisições atingido. Aguarde alguns minutos ou use Pollinations.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API Error ${response.status}: ${errorText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      console.log(`✅ HuggingFace image generated (${(imageBuffer.byteLength / 1024).toFixed(2)}KB)`);
      return imageBuffer;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries && !error.message.includes('Token inválido') && !error.message.includes('Créditos')) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError || new Error('Failed after all retries');
}

async function generateWithPollinations(
  prompt: string,
  model: string
): Promise<ArrayBuffer> {
  const pollinationsModel = POLLINATIONS_MODELS[model] || 'flux';
  const encodedPrompt = encodeURIComponent(prompt);
  
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=1280&height=720&enhance=true&nologo=true`;
  
  console.log(`🌸 Calling Pollinations: ${pollinationsModel}`);
  console.log(`📡 URL: ${url.substring(0, 150)}...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Pollinations Error ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  console.log(`✅ Pollinations image generated (${(imageBuffer.byteLength / 1024).toFixed(2)}KB)`);
  return imageBuffer;
}

// ========================================
// MAIN HANDLER
// ========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      imageBase64, 
      modelingLevel, 
      quantity, 
      imageGenerator, 
      imageModel,
      customInstructions,
      aiModel = 'gemini-2.5-flash'
    } = await req.json();

    // Validations
    if (!imageBase64) {
      throw new Error('imageBase64 é obrigatório');
    }

    if (!modelingLevel || !['identical', 'similar', 'concept'].includes(modelingLevel)) {
      throw new Error('modelingLevel inválido (use: identical, similar ou concept)');
    }

    if (!quantity || quantity < 1 || quantity > 10) {
      throw new Error('quantity deve ser entre 1 e 10');
    }

    if (!imageGenerator || !['huggingface', 'pollinations'].includes(imageGenerator)) {
      throw new Error('imageGenerator inválido (use: huggingface ou pollinations)');
    }

    console.log('🎨 Starting thumbnail modeling');
    console.log(`📊 Generator: ${imageGenerator} | Model: ${imageModel} | Level: ${modelingLevel}`);
    console.log(`🤖 AI Model: ${aiModel}`);
    console.log(`🔢 Quantity: ${quantity}`);

    // STEP 1: Analyze the reference image with AI (vision)
    const imageAnalysis = await analyzeImageWithAI(
      imageBase64,
      modelingLevel,
      aiModel,
      customInstructions,
      user.id,
      supabase
    );
    
    console.log(`📊 Análise completa: ${imageAnalysis.substring(0, 200)}...`);

    // STEP 2: Create generation prompt based on analysis
    const prompt = createGenerationPrompt(imageAnalysis, modelingLevel);
    console.log(`📝 Prompt de geração criado (${prompt.length} chars)`);

    // Get token for HuggingFace if needed
    let hfToken = '';
    if (imageGenerator === 'huggingface') {
      const userToken = await getUserHuggingFaceToken(user.id);
      hfToken = userToken || Deno.env.get('HUGGING_FACE_ACCESS_TOKEN') || '';
      
      if (!hfToken) {
        throw new Error('❌ HuggingFace requer um token. Configure em Configurações → Chaves de API ou use Pollinations (gratuito)');
      }
      
      console.log(`🔑 Using ${userToken ? 'user' : 'environment'} HuggingFace token`);
    }

    // Generate images
    const generatedImages: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      console.log(`\n🖼️ Generating image ${i + 1}/${quantity}`);
      
      try {
        let imageBuffer: ArrayBuffer;
        
        if (imageGenerator === 'huggingface') {
          imageBuffer = await generateWithHuggingFace(prompt, imageModel, hfToken);
        } else {
          imageBuffer = await generateWithPollinations(prompt, imageModel);
        }
        
        // Convert to base64
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        const dataUrl = `data:image/png;base64,${base64}`;
        generatedImages.push(dataUrl);
        
        console.log(`✅ Image ${i + 1}/${quantity} generated successfully`);
        
        // Delay between generations
        if (i < quantity - 1) {
          console.log('⏳ Waiting 2s before next generation...');
          await new Promise(r => setTimeout(r, 2000));
        }
        
      } catch (error: any) {
        console.error(`❌ Error generating image ${i + 1}:`, error.message);
        throw error;
      }
    }

    console.log(`\n🎉 All ${quantity} images generated successfully!`);

    return new Response(
      JSON.stringify({
        success: true,
        generatedImages,
        quantity: generatedImages.length,
        provider: imageGenerator,
        model: imageModel,
        modelingLevel,
        aiAnalysis: imageAnalysis,
        aiModel
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error in model-thumbnail:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido ao gerar imagens',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
