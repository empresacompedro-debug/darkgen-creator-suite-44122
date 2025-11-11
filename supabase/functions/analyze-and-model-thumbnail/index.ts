import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // ETAPA 1: Análise Visual (simplificada para HF e Pollinations)
    console.log('🔍 Skipping visual analysis - generating based on modeling level only');
    const analysis = '';

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

        if (imageGenerator === 'whisk') {
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

        } else if (imageGenerator === 'huggingface') {
          try {
            // Buscar token do usuário primeiro, depois fallback para env
            let HUGGING_FACE_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
            let usingUserToken = false;
            
            console.log(`🔑 Buscando token HuggingFace para usuário: ${userId}`);
            
            if (userId) {
              try {
                const { data: userKeys, error: keyError } = await supabase
                  .from('user_api_keys')
                  .select('api_key_encrypted')
                  .eq('user_id', userId)
                  .eq('api_provider', 'huggingface')
                  .eq('is_active', true)
                  .order('priority', { ascending: true })
                  .limit(1);

                console.log(`📊 Resultado da busca: ${userKeys?.length || 0} tokens encontrados`);

                if (!keyError && userKeys && userKeys.length > 0) {
                  console.log('🔓 Descriptografando token do usuário...');
                  const { data: decryptedKey, error: decryptError } = await supabase
                    .rpc('decrypt_api_key', {
                      p_encrypted: userKeys[0].api_key_encrypted,
                      p_user_id: userId
                    });

                  if (!decryptError && decryptedKey) {
                    HUGGING_FACE_TOKEN = decryptedKey.trim();
                    usingUserToken = true;
                    console.log('✅ Usando token HuggingFace do usuário');
                  }
                }
              } catch (error) {
                console.error('⚠️ Erro ao buscar token do usuário:', error);
              }
            }
            
            if (!HUGGING_FACE_TOKEN) {
              throw new Error('❌ HuggingFace Access Token não configurado.\n\n📝 Para usar modelos HuggingFace:\n1. Acesse Configurações no menu\n2. Role até "HuggingFace Access Token"\n3. Adicione seu token pessoal\n\nOu use "Pollinations" que é 100% gratuito!');
            }
            
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

            // Delay entre gerações
            if (i > 0) {
              console.log(`⏳ Waiting 2s before next generation...`);
              await new Promise(r => setTimeout(r, 2000));
            }

            // Retry logic com nova URL
            const maxRetries = 3;
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`🔄 HF Attempt ${attempt}/${maxRetries}...`);
                
                const response = await fetch(`https://router.huggingface.co/hf-inference/models/${selectedModel}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    inputs: iterationPrompt,
                    parameters: {
                      num_inference_steps: 50,
                      guidance_scale: 7.5,
                    }
                  })
                });
                
                console.log(`📊 HF Response status: ${response.status}`);
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`❌ HuggingFace Error ${response.status}:`, errorText);
                  
                  // Erro 401 - Token inválido
                  if (response.status === 401) {
                    if (usingUserToken) {
                      throw new Error('❌ Seu token HuggingFace está inválido.\n\n🔑 Verifique:\n1. Cole o token correto sem espaços extras\n2. Obtenha um novo token em https://huggingface.co/settings/tokens\n3. Clique em "Salvar" após colar o token\n\nOu use "Pollinations" (100% gratuito)');
                    } else {
                      throw new Error('❌ Token padrão inválido.\n\n📝 Configure seu próprio token:\n1. Acesse Configurações\n2. Adicione seu HuggingFace Access Token\n3. Clique em "Salvar"\n\nOu use "Pollinations" (100% gratuito)');
                    }
                  }
                  
                  // Erro 402 - Créditos excedidos
                  if (response.status === 402) {
                    if (usingUserToken) {
                      throw new Error('❌ Seus créditos do HuggingFace foram excedidos.\n\n💡 Soluções:\n1. Assine o HuggingFace PRO para 20x mais créditos\n2. Use "Pollinations" (100% gratuito)\n3. Aguarde o reset mensal dos créditos');
                    } else {
                      throw new Error('❌ O token padrão do HuggingFace excedeu o limite.\n\n📝 Para continuar:\n1. Adicione SEU próprio token em Configurações\n2. Ou use "Pollinations" (100% gratuito e sem limites)');
                    }
                  }
                  
                  // Modelo carregando (503)
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
                
                const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
                imageUrl = `data:image/png;base64,${base64}`;
                console.log(`✅ Imagem HuggingFace gerada com sucesso (${(imageBuffer.byteLength / 1024).toFixed(1)} KB)`);
                break; // Success!
                
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
            
            if (lastError && !imageUrl) {
              throw lastError;
            }
          } catch (hfErr: any) {
            console.error(`❌ HuggingFace generation ${i + 1} failed:`, hfErr);
            throw hfErr;
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
