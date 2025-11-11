// Image generation integration - Pollinations, HuggingFace, and Google AI (Nano Banana)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeWithKeyRotation } from '../_shared/get-api-key.ts';

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

    // Verificar se é Nano Banana (Google AI)
    if (provider === 'google' || imageModel === 'nano-banana') {
      console.log(`🍌 Usando Nano Banana (Google AI) com rotação automática`);
      
      // Aplicar enhancement de estilo
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
      
      const enhancedPrompt = promptStyle !== 'none' && styleEnhancements[promptStyle]
        ? `${prompt}, ${styleEnhancements[promptStyle]}`
        : prompt;
      
      console.log(`📡 Google AI (Nano Banana) Request com enhanced prompt`);
      
      // Usar executeWithKeyRotation para rotação automática
      const imageUrl = await executeWithKeyRotation(
        userId,
        'gemini',
        supabase,
        async (GEMINI_API_KEY: string) => {
          console.log('📡 Chamando Google AI com chave rotacionada...');
          
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: enhancedPrompt
                  }]
                }],
                generationConfig: {
                  responseModalities: ['image', 'text'],
                  temperature: 0.7,
                }
              })
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Google AI Error ${response.status}:`, errorText);
            
            if (response.status === 401 || response.status === 403) {
              throw new Error('❌ Chave Gemini inválida.\n\n🔑 Verifique:\n1. Cole a chave correta do Google AI Studio\n2. Clique em "Salvar" após colar\n\nObtenha em: https://aistudio.google.com/apikey');
            }
            
            if (response.status === 429 || errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
              throw new Error('QUOTA_EXCEEDED');
            }
            
            throw new Error(`Google AI retornou erro ${response.status}: ${errorText.substring(0, 200)}`);
          }
          
          const data = await response.json();
          console.log('📦 Google AI response:', JSON.stringify(data).substring(0, 500));
          
          // Extrair imagem do response
          const candidate = data.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          
          let extractedImageUrl = '';
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              extractedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
          
          if (!extractedImageUrl) {
            throw new Error('Nenhuma imagem retornada pelo Google AI');
          }
          
          console.log(`✅ Nano Banana: Imagem gerada com sucesso`);
          return extractedImageUrl;
        }
      );
      
      return new Response(
        JSON.stringify({ 
          images: [imageUrl],
          prompt: enhancedPrompt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Função para gerar imagem via HuggingFace com rotação automática
    const generateHuggingFaceImage = async (
      modelKey: string,
      prompt: string,
      width: number,
      height: number,
      promptStyle: string,
      styleEnhancements: Record<string, string>
    ): Promise<string> => {
      console.log(`🔑 Gerando imagem HuggingFace com rotação automática para modelo: ${modelKey}`);
      
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
      
      // Usar executeWithKeyRotation para rotação automática
      return await executeWithKeyRotation(
        userId,
        'huggingface',
        supabase,
        async (HUGGING_FACE_TOKEN: string) => {
          console.log('📡 Chamando HuggingFace API com chave rotacionada...');
          
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
                  throw new Error('❌ Seu token HuggingFace está inválido.\n\n🔑 Verifique:\n1. Cole o token correto sem espaços extras\n2. Obtenha um novo token em https://huggingface.co/settings/tokens\n3. Clique em "Salvar" após colar o token\n\nOu use "Pollinations.ai" (100% gratuito)');
                }
                
                // Erro 402 - Créditos excedidos / Quota
                if (response.status === 402 || response.status === 429 || errorText.includes('quota') || errorText.includes('rate limit')) {
                  throw new Error('QUOTA_EXCEEDED');
                }
                
                // Modelo pode estar carregando (503)
                if (response.status === 503 && attempt < maxRetries) {
                  console.log(`⏳ Modelo carregando... Aguardando ${attempt * 5} segundos...`);
                  await new Promise(resolve => setTimeout(resolve, attempt * 5000));
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
              
              // Se for QUOTA_EXCEEDED, propagar imediatamente para rotacionar
              if (error.message === 'QUOTA_EXCEEDED') {
                throw error;
              }
              
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
        }
      );
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
