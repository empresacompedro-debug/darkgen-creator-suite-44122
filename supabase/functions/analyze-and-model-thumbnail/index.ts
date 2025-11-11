import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get user's encrypted cookies
async function getUserCookies(userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: cookies } = await supabase
    .from('user_service_cookies')
    .select('service_name, encrypted_cookie')
    .eq('user_id', userId);

  if (!cookies) return { whisk: '', imagefx: '' };

  const result = { whisk: '', imagefx: '' };

  for (const cookie of cookies) {
    const { data: decrypted } = await supabase.rpc('decrypt_service_cookie', {
      p_encrypted: cookie.encrypted_cookie,
      p_user_id: userId
    });
    
    if (decrypted) {
      if (cookie.service_name === 'whisk') result.whisk = decrypted;
      if (cookie.service_name === 'imagefx') result.imagefx = decrypted;
    }
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth token for cookie retrieval
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

    const { imageBase64, modelingLevel, includeText, customText, customInstructions, quantity, imageGenerator, imageModel } = await req.json();
    
    if (!imageBase64 || !modelingLevel || !quantity || !imageGenerator) {
      throw new Error('Missing required parameters');
    }

    // Retrieve cookies from database if user is authenticated
    let whiskCookie = '';
    let imagefxCookie = '';
    if (userId) {
      const cookies = await getUserCookies(userId);
      whiskCookie = cookies.whisk;
      imagefxCookie = cookies.imagefx;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`🎨 Starting analysis for ${imageGenerator} with ${quantity} variations at level: ${modelingLevel}`);
    
    // Validar formato da imagem
    const imageFormatMatch = imageBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,/);
    if (!imageFormatMatch) {
      throw new Error('Formato de imagem inválido. Use apenas JPEG, PNG ou WebP.');
    }
    
    // Calcular tamanho aproximado da imagem (base64 tem ~33% overhead)
    const base64Data = imageBase64.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    console.log(`📊 Image size: ${sizeInMB.toFixed(2)}MB`);
    
    // Limitar tamanho da imagem
    if (sizeInMB > 10) {
      throw new Error(`Imagem muito grande (${sizeInMB.toFixed(1)}MB). O limite é 10MB. Comprima a imagem antes de enviar.`);
    }
    
    if (sizeInMB > 5) {
      console.warn(`⚠️ Large image detected (${sizeInMB.toFixed(2)}MB). May be slow to process.`);
    }

    // ETAPA 1: Análise Visual com Gemini Vision
    const analysisPrompt = `Analyze this YouTube thumbnail with extreme precision for replication purposes.

OUTPUT AS JSON:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3", ...],
  "layout": {
    "composition": "rule of thirds / centered / dynamic / asymmetric",
    "elements": [
      {"type": "face/text/object/graphic", "position": "X%,Y%", "size": "WxH%", "description": "..."}
    ]
  },
  "typography": {
    "fonts": [{"text": "exact text", "family": "sans-serif/serif/bold/italic", "size": "approx Xpx", "color": "#HEX", "position": "top/center/bottom"}],
    "hierarchy": "primary/secondary/tertiary"
  },
  "visual_style": "photorealistic/illustrated/3D/flat/minimalist/dramatic/vibrant",
  "lighting": "natural/studio/dramatic/backlit/soft",
  "emotion": "urgency/curiosity/excitement/fear/joy/shock",
  "background": "detailed description of background elements"
}

Be extremely detailed. Extract EVERY visible element, exact colors, positioning, and styling.`;

    const analysisRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }]
      })
    });

    let analysis = '';
    if (!analysisRes.ok) {
      const errorText = await analysisRes.text();
      console.error('Analysis failed:', analysisRes.status, errorText);
      
      // Tratamento específico
      if (analysisRes.status === 400) {
        console.warn('⚠️ Skipping analysis due to invalid image input. Proceeding with generation without detailed analysis.');
        analysis = '';
      } else if (analysisRes.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde alguns segundos e tente novamente.');
      } else if (analysisRes.status === 402) {
        throw new Error('Créditos esgotados. Adicione créditos em Settings → Workspace → Usage.');
      } else {
        throw new Error(`Falha na análise da imagem: ${analysisRes.status}. Tente novamente ou use uma imagem diferente.`);
      }
    } else {
      const analysisData = await analysisRes.json();
      analysis = analysisData.choices?.[0]?.message?.content || '';
      console.log('🔍 Analysis completed:', analysis.substring(0, 200));
    }

    // ETAPA 2: Gerar prompt baseado no nível (para TODOS os geradores)
    let generationPrompt = '';
    const analysisSnippet = analysis.substring(0, 1500);

    switch (modelingLevel) {
      case 'identical':
        generationPrompt = `Create an EXACT REPLICA of this YouTube thumbnail. ${analysisSnippet}

CRITICAL REQUIREMENTS FOR IDENTICAL REPLICATION:
- Match EXACT colors using the provided HEX codes
- Match EXACT layout and element positioning (use percentages)
- Match EXACT fonts, text styling, and typography hierarchy
- Maintain IDENTICAL composition and visual hierarchy
- Replicate lighting, shadows, and depth effects precisely
- Match facial expressions and body language exactly (if present)
- Preserve every detail: borders, gradients, textures, overlays
${includeText 
  ? customText 
    ? `- Include EXACTLY this text with same font style: "${customText}"` 
    : '- Include ALL text elements matching exact font styles, sizes, and positions'
  : '- NO TEXT, NO LETTERS, NO WORDS in the image whatsoever'}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Output a pixel-perfect replica that is indistinguishable from the original.`;
        break;

      case 'similar':
        generationPrompt = `Create a SIMILAR thumbnail inspired by this design. ${analysisSnippet}

REQUIREMENTS FOR SIMILAR STYLE:
- Maintain overall color palette (can vary shades by 10-20%)
- Keep similar layout structure (can adjust positioning within 15%)
- Use similar visual elements (can change minor details)
- Preserve compositional style and hierarchy
- Match the emotional impact and visual weight
- Maintain similar lighting and atmosphere
${includeText 
  ? customText 
    ? `- Add this text with similar style: "${customText}"` 
    : '- Include similar text style (can vary wording slightly)'
  : '- NO TEXT, NO LETTERS, NO WORDS in the image'}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Create a thumbnail that feels cohesive with the original but has unique execution.`;
        break;

      case 'concept':
        generationPrompt = `Create a NEW thumbnail inspired by the CONCEPT of this design. ${analysisSnippet}

REQUIREMENTS FOR CONCEPTUAL INSPIRATION:
- Capture the same emotional impact and viewer psychology
- Maintain the core visual strategy and communication goal
- Use similar compositional techniques (rule of thirds, contrast, etc.)
- Create entirely new execution with different visual elements
- Preserve the thumbnail's hook and curiosity factor
- Match the energy level and pacing
${includeText 
  ? customText 
    ? `- Include this impactful text: "${customText}"` 
    : '- Create new text that fits the concept and visual hierarchy'
  : '- NO TEXT, NO LETTERS, NO WORDS in the image'}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Reinterpret the concept with fresh creativity while maintaining strategic effectiveness.`;
        break;
    }

    // ETAPA 3: Geração de Imagens com o gerador escolhido
    const generatedImages: string[] = [];
    const bodyWhiskCookie = (whiskCookie || '').toString().replace(/\r?\n/g, '').trim();
    const bodyImagefxCookie = (imagefxCookie || '').toString().replace(/\r?\n/g, '').trim();
    const cookieWhisk = bodyWhiskCookie || Deno.env.get('WHISK_COOKIE') || '';
    const cookieImagefx = bodyImagefxCookie || Deno.env.get('IMAGEFX_COOKIE') || '';
    console.log(`[Cookies] whisk: ${cookieWhisk ? cookieWhisk.length : 0} chars, imagefx: ${cookieImagefx ? cookieImagefx.length : 0} chars`);

    for (let i = 0; i < quantity; i++) {
      try {
        const iterationPrompt = `${generationPrompt}\n\n(Generate variation ${i + 1}/${quantity} - make it unique while following all requirements above)`;
        let imageUrl = '';

        if (imageGenerator === 'lovable-ai' || imageGenerator === 'nano-banana') {
          // Delay entre requisições para evitar rate limiting
          if (i > 0) {
            console.log(`⏳ Waiting 4s before next generation...`);
            await new Promise(resolve => setTimeout(resolve, 4000));
          }

          const model = imageGenerator === 'nano-banana' 
            ? 'google/gemini-2.5-flash-image-preview' 
            : 'google/gemini-2.5-flash-image-preview';

          const imgRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: iterationPrompt }],
              modalities: ['image', 'text']
            })
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
          } else {
            const errorText = await imgRes.text();
            console.error(`❌ Image generation ${i + 1} failed:`, imgRes.status, errorText);
          }

        } else if (imageGenerator === 'whisk') {
          if (!cookieWhisk) {
            throw new Error('Whisk cookie not configured. Configure em Configurações → Cookies para Geração de Imagens.');
          }

          const whiskRes = await fetch('https://whisk.google.com/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieWhisk,
            },
            body: JSON.stringify({
              prompt: iterationPrompt,
              width: 1280,
              height: 720,
            }),
          });

          if (whiskRes.ok) {
            const whiskData = await whiskRes.json();
            imageUrl = whiskData.image_url || whiskData.url || '';
          } else {
            console.error(`❌ Whisk generation ${i + 1} failed:`, whiskRes.status);
          }

        } else if (imageGenerator === 'imagefx') {
          if (!cookieImagefx) {
            throw new Error('ImageFX cookie not configured. Configure em Configurações → Cookies para Geração de Imagens.');
          }

          const imagefxRes = await fetch('https://aisandbox-pa.googleapis.com/v1:runImagefx', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieImagefx,
            },
            body: JSON.stringify({
              prompt: iterationPrompt,
              aspect_ratio: '16:9',
            }),
          });

          if (imagefxRes.ok) {
            const imagefxData = await imagefxRes.json();
            imageUrl = imagefxData.images?.[0]?.url || imagefxData.generatedImages?.[0] || '';
          } else {
            const errTxt = await imagefxRes.text();
            console.error(`❌ ImageFX generation ${i + 1} failed:`, imagefxRes.status, errTxt);
          }

          // Fallback: usar Lovable AI se nenhum URL foi retornado
          if (!imageUrl) {
            try {
              console.warn(`⚠️ No image from ${imageGenerator}. Falling back to Lovable AI...`);
              const fallbackRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash-image-preview',
                  messages: [{ role: 'user', content: iterationPrompt }],
                  modalities: ['image', 'text']
                })
              });
              if (fallbackRes.ok) {
                const fData = await fallbackRes.json();
                imageUrl = fData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
              } else {
                console.error('Fallback generation failed:', await fallbackRes.text());
              }
            } catch (fbErr) {
              console.error('Fallback error:', fbErr);
            }
          }
        } else if (imageGenerator === 'huggingface') {
          try {
            const HUGGING_FACE_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
            if (!HUGGING_FACE_TOKEN) {
              throw new Error('HuggingFace Access Token não configurado. Adicione em Configurações.');
            }
            const hf = new HfInference(HUGGING_FACE_TOKEN);
            const modelMap: Record<string, string> = {
              'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
              'flux-dev': 'black-forest-labs/FLUX.1-dev',
              'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
              'sdxl-turbo': 'stabilityai/sdxl-turbo',
              'sd-21': 'stabilityai/stable-diffusion-2-1',
              'sd-15': 'runwayml/stable-diffusion-v1-5',
            };
            const selectedModel = modelMap[imageModel] || modelMap['flux-schnell'];
            console.log(`🤗 HF generating with ${selectedModel} (requested: ${imageModel})`);

            // Pequeno atraso entre gerações para evitar rate limits
            if (i > 0) await new Promise(r => setTimeout(r, 1500));

            const hfImage = await hf.textToImage({ inputs: iterationPrompt, model: selectedModel });
            const arrayBuffer = await hfImage.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            imageUrl = `data:image/png;base64,${base64}`;
          } catch (hfErr) {
            console.error(`❌ HuggingFace generation ${i + 1} failed:`, hfErr);
          }
        } else if (imageGenerator === 'pollinations') {
          try {
            const model = imageModel?.startsWith('pollinations')
              ? (imageModel === 'pollinations' ? 'flux' : imageModel.replace('pollinations-', ''))
              : 'flux';
            const encodedPrompt = encodeURIComponent(iterationPrompt);
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1280&height=720&enhance=true&nologo=true`;
            console.log('📡 Pollinations URL:', pollinationsUrl.slice(0, 140) + '...');

            const pollinationsResponse = await fetch(pollinationsUrl);
            if (pollinationsResponse.ok) {
              const buffer = await pollinationsResponse.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              imageUrl = `data:image/png;base64,${base64}`;
            } else {
              const errTxt = await pollinationsResponse.text();
              console.error(`❌ Pollinations generation ${i + 1} failed:`, pollinationsResponse.status, errTxt.substring(0, 200));
            }
          } catch (pErr) {
            console.error(`❌ Pollinations error on ${i + 1}:`, pErr);
          }
        }

        // Converter para base64 se não for
        if (imageUrl && !imageUrl.startsWith('data:image')) {
          try {
            const imgResponse = await fetch(imageUrl);
            const imgBuffer = await imgResponse.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
            imageUrl = `data:image/png;base64,${base64}`;
          } catch (conversionError) {
            console.error(`Error converting image ${i + 1} to base64:`, conversionError);
          }
        }

        if (imageUrl) {
          generatedImages.push(imageUrl);
          console.log(`✅ Image ${i + 1}/${quantity} generated successfully`);
        } else {
          // Adicionar placeholder de erro
          console.error(`❌ No image URL returned for variation ${i + 1}`);
          generatedImages.push(
            `data:image/svg+xml,${encodeURIComponent(
              `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
                <rect width="1280" height="720" fill="#1a1a1a"/>
                <text x="50%" y="50%" text-anchor="middle" fill="#fff" font-size="20" font-family="Arial">
                  Erro na geração da variação ${i + 1}
                </text>
              </svg>`
            )}`
          );
        }
      } catch (imgErr: any) {
        console.error(`Error generating image ${i + 1}:`, imgErr);
        generatedImages.push(
          `data:image/svg+xml,${encodeURIComponent(
            `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
              <rect width="1280" height="720" fill="#1a1a1a"/>
              <text x="50%" y="45%" text-anchor="middle" fill="#fff" font-size="20" font-family="Arial">
                Erro na variação ${i + 1}
              </text>
              <text x="50%" y="55%" text-anchor="middle" fill="#999" font-size="14" font-family="Arial">
                ${imgErr.message || 'Erro desconhecido'}
              </text>
            </svg>`
          )}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        generatedImages,
        quantity: generatedImages.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-and-model-thumbnail:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
