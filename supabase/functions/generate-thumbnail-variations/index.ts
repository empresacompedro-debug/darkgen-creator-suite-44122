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
    
    const { prompt, provider, model, quantity } = await req.json();

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
        
        const imageBase64 = await generateWithHuggingFace(prompt, model, token);
        generatedImages.push(imageBase64);
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
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}

async function generateWithHuggingFace(prompt: string, model: string, token: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
    'flux-dev': 'black-forest-labs/FLUX.1-dev',
    'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
    'sdxl-turbo': 'stabilityai/sdxl-turbo',
    'sd-21': 'stabilityai/stable-diffusion-2-1',
    'sd-15': 'runwayml/stable-diffusion-v1-5'
  };

  const modelId = modelMap[model] || modelMap['flux-schnell'];
  const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

  console.log(`🤗 [HuggingFace] Using model: ${modelId}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 1280,
        height: 720,
        num_inference_steps: model === 'flux-schnell' ? 4 : 30
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}
