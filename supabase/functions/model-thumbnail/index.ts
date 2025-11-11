import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function createPrompt(modelingLevel: string, customInstructions?: string): string {
  const basePrompts: Record<string, string> = {
    identical: `Create an IDENTICAL thumbnail to this reference image. 
REQUIREMENTS FOR IDENTICAL COPY:
- Same composition and layout
- Same colors and color scheme
- Same text placement (if any)
- Same visual style and aesthetic
- Recreate it as faithfully as possible

${customInstructions || ''}`,

    similar: `Create a SIMILAR thumbnail inspired by this design. 
REQUIREMENTS FOR SIMILAR VERSION:
- Keep the same general composition structure
- Use similar color palette
- Maintain the same visual impact and style
- Can vary text and specific elements slightly
- Should be recognizable as inspired by the original

${customInstructions || ''}`,

    concept: `Create a NEW thumbnail based on the CONCEPT of this image.
REQUIREMENTS FOR CONCEPT-BASED:
- Extract the core idea and message
- Reimagine with fresh composition
- Use different but complementary colors
- Create new text and visual elements
- Maintain the emotional impact

${customInstructions || ''}`
  };

  return basePrompts[modelingLevel] || basePrompts.similar;
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
      customInstructions
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
    console.log(`🔢 Quantity: ${quantity}`);

    // Create prompt based on modeling level
    const prompt = createPrompt(modelingLevel, customInstructions);
    console.log(`📝 Prompt created (${prompt.length} chars)`);

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
        modelingLevel
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
