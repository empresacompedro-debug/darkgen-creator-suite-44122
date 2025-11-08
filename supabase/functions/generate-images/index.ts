// Pollinations.ai integration - Progressive generation (1 image per request)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração dos modelos HuggingFace (apenas modelos oficiais públicos)
const HUGGINGFACE_MODELS: Record<string, {
  id: string;
  category: string;
  maxWidth: number;
  maxHeight: number;
  supportsNegative: boolean;
  supportsDimensions: boolean;
}> = {
  'flux-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    category: 'universal',
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegative: true,
    supportsDimensions: true
  },
  'flux-dev': {
    id: 'black-forest-labs/FLUX.1-dev',
    category: 'universal',
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegative: true,
    supportsDimensions: true
  },
  'sdxl': {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    category: 'universal',
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegative: true,
    supportsDimensions: true
  },
  'sd-21': {
    id: 'stabilityai/stable-diffusion-2-1',
    category: 'universal',
    maxWidth: 768,
    maxHeight: 768,
    supportsNegative: true,
    supportsDimensions: true
  },
  'sd-15': {
    id: 'runwayml/stable-diffusion-v1-5',
    category: 'universal',
    maxWidth: 512,
    maxHeight: 512,
    supportsNegative: true,
    supportsDimensions: true
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const { prompt, aspectRatio = "1:1", imageModel = "pollinations", promptStyle = "none", provider = "pollinations" } = await req.json();

    console.log(`📥 Request recebido:`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Image Model: ${imageModel}`);
    console.log(`   Prompt Style: ${promptStyle}`);
    console.log(`   Aspect Ratio: ${aspectRatio}`);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt inválido ou vazio' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Style enhancements
    const styleEnhancements: Record<string, string> = {
      'realistic': 'realistic, photorealistic',
      'hyper-realistic': 'hyper-realistic, ultra detailed, 8k',
      'photo-8k': '8k photography, high resolution',
      'cinematic': 'cinematic lighting, dramatic',
      'sharp-focus': 'sharp focus, high detail',
      'long-exposure': 'long exposure photography',
      'black-white': 'black and white photography',
      'macro': 'macro photography',
      'digital-art': 'digital art',
      'concept-art': 'concept art',
      'fantasy-art': 'fantasy art',
      'sci-fi-art': 'sci-fi art',
      '3d-render': '3d render',
      'pixel-art': 'pixel art',
      'anime': 'anime style',
      'comics': 'comic book style',
      'watercolor': 'watercolor painting',
      'oil-painting': 'oil painting',
      'surrealism': 'surrealism',
      'minimalist': 'minimalist'
    };

    // Função para gerar imagem via HuggingFace
    const generateHuggingFaceImage = async (
      modelKey: string,
      prompt: string,
      width: number,
      height: number,
      promptStyle: string,
      styleEnhancements: Record<string, string>
    ): Promise<string> => {
      // Buscar token do usuário primeiro, depois fallback para env
      let HUGGING_FACE_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
      let usingUserToken = false;
      
      console.log(`🔑 Buscando token HuggingFace para usuário: ${userId}`);
      
      try {
        // Tentar buscar chave do usuário
        const { data: userKeys, error: keyError } = await supabase
          .from('user_api_keys')
          .select('api_key_encrypted')
          .eq('user_id', userId)
          .eq('api_provider', 'huggingface')
          .eq('is_active', true)
          .order('priority', { ascending: true })
          .limit(1);

        console.log(`📊 Resultado da busca: ${userKeys?.length || 0} tokens encontrados`);
        if (keyError) {
          console.error('❌ Erro ao buscar tokens:', keyError);
        }

        if (!keyError && userKeys && userKeys.length > 0) {
          console.log('🔓 Descriptografando token do usuário...');
          // Descriptografar a chave do usuário
          const { data: decryptedKey, error: decryptError } = await supabase
            .rpc('decrypt_api_key', {
              p_encrypted: userKeys[0].api_key_encrypted,
              p_user_id: userId
            });

          if (decryptError) {
            console.error('❌ Erro ao descriptografar:', decryptError);
          }

          if (!decryptError && decryptedKey) {
            HUGGING_FACE_TOKEN = decryptedKey.trim();
            usingUserToken = true;
            console.log('✅ Usando token HuggingFace do usuário');
          }
        } else {
          console.log('⚠️ Nenhum token do usuário encontrado, usando token padrão');
        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar token do usuário:', error);
      }
      
      if (!HUGGING_FACE_TOKEN) {
        throw new Error('❌ HuggingFace Access Token não configurado.\n\n📝 Para usar modelos HuggingFace:\n1. Acesse Configurações no menu\n2. Role até "HuggingFace Access Token"\n3. Adicione seu token pessoal\n\nOu use o provider "Pollinations.ai" que é 100% gratuito!');
      }
      
      if (!usingUserToken) {
        console.log('⚠️ ATENÇÃO: Usando token padrão do sistema que pode estar com limite excedido');
      }
      
      const modelConfig = HUGGINGFACE_MODELS[modelKey];
      if (!modelConfig) {
        throw new Error(`Modelo HuggingFace desconhecido: ${modelKey}`);
      }
      
      // Aplicar enhancement de estilo
      const enhancedPrompt = promptStyle !== 'none' && styleEnhancements[promptStyle]
        ? `${prompt}, ${styleEnhancements[promptStyle]}`
        : prompt;
      
      console.log(`📡 HuggingFace Request:`);
      console.log(`   Model: ${modelConfig.id}`);
      console.log(`   Category: ${modelConfig.category}`);
      console.log(`   Size: ${width}x${height}`);
      console.log(`   Enhanced prompt (first 200 chars): ${enhancedPrompt.substring(0, 200)}`);
      
      const payload: any = {
        inputs: enhancedPrompt,
        parameters: {
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      };
      
      // Adicionar dimensões se o modelo suportar
      if (modelConfig.supportsDimensions) {
        payload.parameters.width = Math.min(width, modelConfig.maxWidth);
        payload.parameters.height = Math.min(height, modelConfig.maxHeight);
      }
      
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`);
          
          const response = await fetch(`https://router.huggingface.co/hf-inference/models/${modelConfig.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          console.log(`📊 Response status: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HuggingFace Error ${response.status}:`, errorText);
            
            // Erro 401 - Token inválido
            if (response.status === 401) {
              if (usingUserToken) {
                throw new Error('❌ Seu token HuggingFace está inválido.\n\n🔑 Verifique:\n1. Cole o token correto sem espaços extras\n2. Obtenha um novo token em https://huggingface.co/settings/tokens\n3. Clique em "Salvar" após colar o token\n\nOu use "Pollinations.ai" (100% gratuito)');
              } else {
                throw new Error('❌ Token padrão inválido.\n\n📝 Configure seu próprio token:\n1. Acesse Configurações\n2. Adicione seu HuggingFace Access Token\n3. Clique em "Salvar"\n\nOu use "Pollinations.ai" (100% gratuito)');
              }
            }
            
            // Erro 402 - Créditos excedidos
            if (response.status === 402) {
              if (usingUserToken) {
                throw new Error('❌ Seus créditos do HuggingFace foram excedidos.\n\n💡 Soluções:\n1. Assine o HuggingFace PRO para 20x mais créditos\n2. Use o provider "Pollinations.ai" (100% gratuito)\n3. Aguarde o reset mensal dos créditos');
              } else {
                throw new Error('❌ O token padrão do HuggingFace excedeu o limite.\n\n📝 Para continuar:\n1. Adicione SEU próprio token em Configurações\n2. Ou use "Pollinations.ai" (100% gratuito e sem limites)');
              }
            }
            
            // Modelo pode estar carregando (503)
            if (response.status === 503 && attempt < maxRetries) {
              console.log(`⏳ Modelo carregando... Aguardando ${attempt * 5} segundos...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 5000));
              continue;
            }
            
            // Rate limit (429)
            if (response.status === 429 && attempt < maxRetries) {
              console.log(`⏳ Rate limit... Aguardando ${attempt * 3} segundos...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 3000));
              continue;
            }
            
            throw new Error(`HuggingFace retornou erro ${response.status}: ${errorText.substring(0, 200)}`);
          }
          
          const imageBuffer = await response.arrayBuffer();
          console.log(`📦 Image buffer size: ${imageBuffer.byteLength} bytes`);
          
          if (imageBuffer.byteLength === 0) {
            throw new Error('Imagem vazia recebida do HuggingFace');
          }
          
          const base64Image = btoa(
            new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          const imageUrl = `data:image/png;base64,${base64Image}`;
          console.log(`✅ Imagem HuggingFace gerada com sucesso (${(imageBuffer.byteLength / 1024).toFixed(1)} KB)`);
          
          return imageUrl;
          
        } catch (error: any) {
          lastError = error;
          console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          console.log(`⏳ Aguardando ${attempt * 2} segundos antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
      
      if (lastError) {
        throw lastError;
      }
      
      throw new Error('Falha ao gerar imagem HuggingFace após todas as tentativas');
    };

    const enhancedPrompt = promptStyle !== 'none' && styleEnhancements[promptStyle]
      ? `${prompt}, ${styleEnhancements[promptStyle]}`
      : prompt;

    // Limitar tamanho do prompt para evitar URLs muito longas (max 1500 caracteres)
    const maxPromptLength = 1500;
    const truncatedPrompt = enhancedPrompt.length > maxPromptLength 
      ? enhancedPrompt.substring(0, maxPromptLength) + '...'
      : enhancedPrompt;

    console.log(`📝 Prompt length: ${enhancedPrompt.length} chars, truncated to: ${truncatedPrompt.length} chars`);

    // Dimensions
    const dimensions: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '1:1': { width: 1024, height: 1024 }
    };
    const { width, height } = dimensions[aspectRatio] || dimensions['1:1'];

    let imageUrl = '';

    console.log(`🔀 Iniciando geração com provider: ${provider}`);

    if (provider === 'huggingface') {
      console.log(`✅ Usando HuggingFace com modelo: ${imageModel}`);
      // HUGGINGFACE
      imageUrl = await generateHuggingFaceImage(
        imageModel,
        prompt,
        width,
        height,
        promptStyle,
        styleEnhancements
      );
      
    } else if (imageModel.startsWith('pollinations')) {
      console.log(`✅ Usando Pollinations com modelo: ${imageModel}`);
      const pollinationsModel = imageModel === 'pollinations' 
        ? 'flux' 
        : imageModel.replace('pollinations-', '');
      
      const encodedPrompt = encodeURIComponent(truncatedPrompt);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=${width}&height=${height}&enhance=true&nologo=true`;
      
      console.log(`📡 Pollinations.ai Request:`);
      console.log(`   Model: ${pollinationsModel}`);
      console.log(`   Size: ${width}x${height}`);
      console.log(`   URL length: ${pollinationsUrl.length} chars`);
      console.log(`   Original prompt (first 200 chars): ${prompt.substring(0, 200)}`);
      console.log(`   Enhanced prompt (first 200 chars): ${enhancedPrompt.substring(0, 200)}`);
      
      // Retry logic para lidar com erros temporários da Pollinations
      let lastError: Error | null = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`);
          
          const pollinationsResponse = await fetch(pollinationsUrl, { 
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ImageGenerator/1.0)',
            }
          });
          
          console.log(`📊 Response status: ${pollinationsResponse.status}`);
          console.log(`📊 Response headers:`, Object.fromEntries(pollinationsResponse.headers.entries()));
          
          if (!pollinationsResponse.ok) {
            const errorText = await pollinationsResponse.text();
            console.error(`❌ Pollinations.ai Error ${pollinationsResponse.status}:`, errorText.substring(0, 500));
            
            // Se for erro 500, vamos tentar novamente
            if (pollinationsResponse.status === 500 && attempt < maxRetries) {
              console.log(`⏳ Aguardando ${attempt * 2} segundos antes de tentar novamente...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
            
            throw new Error(`Pollinations.ai retornou erro ${pollinationsResponse.status}: ${errorText.substring(0, 200)}`);
          }
          
          const imageBuffer = await pollinationsResponse.arrayBuffer();
          console.log(`📦 Image buffer size: ${imageBuffer.byteLength} bytes`);
          
          if (imageBuffer.byteLength === 0) {
            throw new Error('Imagem vazia recebida da Pollinations.ai');
          }
          
          const base64Image = btoa(
            new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          imageUrl = `data:image/png;base64,${base64Image}`;
          console.log(`✅ Imagem gerada com sucesso (${(imageBuffer.byteLength / 1024).toFixed(1)} KB)`);
          break; // Sucesso, sair do loop
          
        } catch (error: any) {
          lastError = error;
          console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Aguardar antes da próxima tentativa
          console.log(`⏳ Aguardando ${attempt * 2} segundos antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
      
      if (!imageUrl && lastError) {
        throw lastError;
      }
    } else {
      console.error(`❌ Provider/modelo não reconhecido: provider=${provider}, imageModel=${imageModel}`);
      return new Response(
        JSON.stringify({ error: `Provider ou modelo desconhecido: ${provider} / ${imageModel}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!imageUrl) {
      throw new Error('Nenhuma imagem gerada');
    }

    return new Response(
      JSON.stringify({ 
        images: [imageUrl],
        prompt: enhancedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao gerar imagem'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
