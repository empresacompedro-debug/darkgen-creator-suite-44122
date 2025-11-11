import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 [Generate Variations] Request received');
    
    const { prompt, provider, model, quantity, imageBase64, strength = 0.75 } = await req.json();

    if (!prompt) throw new Error('prompt is required');
    if (!provider) throw new Error('provider is required');
    if (!quantity || quantity < 1) throw new Error('quantity must be >= 1');

    console.log(`🎨 [Generate Variations] Generating ${quantity}x images with ${provider}/${model}`);

    const generatedImages: string[] = [];

    for (let i = 0; i < quantity; i++) {
      console.log(`📸 [Generate] Image ${i + 1}/${quantity}`);

      if (provider === 'pollinations') {
        const imageUrl = await generateWithPollinations(prompt, model);
        generatedImages.push(imageUrl);
      } else if (provider === 'huggingface') {
        const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
        if (!token) throw new Error('HuggingFace token not configured');
        
        const imageBase64Data = await generateWithHuggingFace(prompt, model, token, imageBase64, strength);
        generatedImages.push(imageBase64Data);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      // Pequeno delay entre gerações para evitar rate limits
      if (i < quantity - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ [Generate Variations] Successfully generated ${generatedImages.length} images`);

    return new Response(JSON.stringify({
      success: true,
      generatedImages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [Generate Variations] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // Process in chunks to avoid stack overflow
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

async function generateWithPollinations(prompt: string, model: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt);
  let url = '';

  switch (model) {
    case 'pollinations-flux-realism':
      url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-realism&width=1280&height=720&nologo=true&enhance=true`;
      break;
    case 'pollinations-flux-anime':
      url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-anime&width=1280&height=720&nologo=true&enhance=true`;
      break;
    case 'pollinations-flux-3d':
      url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-3d&width=1280&height=720&nologo=true&enhance=true`;
      break;
    case 'pollinations-turbo':
      url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=1280&height=720&nologo=true`;
      break;
    default:
      url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&enhance=true`;
  }

  console.log(`🌸 [Pollinations] Fetching: ${url.substring(0, 100)}...`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pollinations error: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  return `data:image/png;base64,${base64}`;
}

async function generateWithHuggingFace(prompt: string, model: string, token: string, imageBase64?: string, strength: number = 0.75): Promise<string> {
  const modelMap: Record<string, string> = {
    'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
    'flux-dev': 'black-forest-labs/FLUX.1-dev',
    'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
    'sdxl-turbo': 'stabilityai/sdxl-turbo',
    'sd-21': 'stabilityai/stable-diffusion-2-1',
    'sd-15': 'runwayml/stable-diffusion-v1-5'
  };

  const modelId = modelMap[model] || modelMap['flux-schnell'];
  console.log(`🤗 [HuggingFace] Using model: ${modelId}`);
  
  // FLUX não suporta img2img via API de inferência - apenas Stable Diffusion
  const isFluxModel = model.includes('flux');
  const useImg2Img = !isFluxModel && imageBase64 && imageBase64.length > 0;
  
  if (isFluxModel && imageBase64) {
    console.log(`⚠️ [HuggingFace] FLUX models don't support img2img via API - using text-to-image`);
  } else if (useImg2Img) {
    console.log(`🖼️ [HuggingFace] Attempting Image-to-Image with guidance_scale instead of strength`);
  }

  try {
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;
    console.log(`🔗 [HuggingFace] Calling: ${apiUrl}`);

    let requestBody: any;
    
    if (useImg2Img) {
      // Para img2img: FLUX não suporta, apenas text-to-image
      // AVISO: A API REST do HuggingFace tem suporte limitado a img2img
      // Os resultados podem não manter a composição da imagem original
      const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      requestBody = {
        inputs: {
          prompt: prompt,
          image: base64Clean,
          num_inference_steps: 50,
          guidance_scale: 15 - (strength * 10) // Inverter: strength baixo = guidance alto
        }
      };
      
      console.log(`📊 [HuggingFace] Using guidance_scale: ${requestBody.inputs.guidance_scale}`);
    } else {
      // Text-to-image padrão
      requestBody = {
        inputs: prompt
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [HuggingFace] API error: ${response.status} - ${errorText?.slice(0, 500)}`);
      throw new Error(`HuggingFace error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    console.log(`✅ [HuggingFace] Image generated successfully`);
    return `data:image/png;base64,${base64}`;

    
  } catch (error: any) {
    console.error(`❌ [HuggingFace] Error:`, error?.message || error);
    throw new Error(`HuggingFace error: ${error?.message || 'Unknown error'}`);
  }
}
