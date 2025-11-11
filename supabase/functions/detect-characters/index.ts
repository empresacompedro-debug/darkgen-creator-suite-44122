import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, validateOrThrow, sanitizeString, ValidationException } from '../_shared/validation.ts';
import { mapModelToProvider } from '../_shared/model-mapper.ts';
import { buildGeminiOrVertexRequest } from '../_shared/vertex-helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const body = await req.json();
    
    // Validate inputs
    const errors = [
      ...validateString(body.script, 'script', { required: true, maxLength: 1000000 }),
      ...validateString(body.aiModel, 'aiModel', { required: true, maxLength: 50 }),
    ];
    validateOrThrow(errors);
    
    const script = sanitizeString(body.script);
    const aiModel = body.aiModel;

    // Get user ID for Vertex AI
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (e) {
        console.log('No authenticated user');
      }
    }

    // Map AI model to provider
    const { provider, model } = mapModelToProvider(aiModel);
    console.log(`🔄 [detect-characters] Mapped ${aiModel} → provider: ${provider}, model: ${model}`);

    const prompt = `Analyze this script and identify ALL main characters.

For EACH character, extract or infer:
- Full name
- Approximate or apparent age
- Detailed facial characteristics
- Hair (color, length, style)
- Physical build and relative height
- Skin tone and ethnicity (if mentioned)
- Distinctive marks (scars, tattoos, etc)
- Typical clothing style
- Personality traits that affect appearance (posture, common expression)

OUTPUT FORMAT (one block per character in JSON array):

[
  {
    "id": "char-1",
    "name": "Full Name",
    "age": "age or age range",
    "faceShape": "face shape, prominent features",
    "eyes": "color, shape, expression",
    "nose": "shape",
    "mouth": "lip shape",
    "hair": "color, length, style, texture",
    "physique": "body type, build",
    "height": "height description",
    "skinTone": "skin tone, texture, marks",
    "distinctiveMarks": "scars, tattoos, other marks",
    "clothing": "typical style, predominant colors",
    "accessories": "glasses, jewelry, others",
    "posture": "typical posture and expression"
  }
]

SCRIPT:
${script}

RESPOND NOW with ONLY the JSON array, no additional text:`;

    let apiUrl = '';
    let apiKey = '';
    let requestBody: any = {};

    if (provider === 'claude') {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
      apiUrl = 'https://api.anthropic.com/v1/messages';
      const modelMap: Record<string, string> = {
        'claude-sonnet-4.5': 'claude-sonnet-4-5',
        'claude-sonnet-4': 'claude-sonnet-4-0',
        'claude-sonnet-3.7': 'claude-3-7-sonnet-20250219',
        'claude-sonnet-3.5': 'claude-3-5-sonnet-20241022'
      };
      const finalModel = modelMap[model] || model;
      const maxTokens = getMaxTokensForModel(finalModel);
      console.log(`📦 [detect-characters] Usando ${maxTokens} max_tokens para ${finalModel}`);
      
      requestBody = {
        model: finalModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      };
    } else if (provider === 'gemini' || provider === 'vertex-ai') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const apiProvider = provider === 'vertex-ai' ? 'vertex-ai' : 'gemini';
      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted, vertex_config')
        .eq('user_id', userId)
        .eq('api_provider', apiProvider)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single();

      if (keyError || !keyData) {
        throw new Error(`No ${apiProvider.toUpperCase()} key configured`);
      }

      const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_api_key', {
        p_encrypted: keyData.api_key_encrypted,
        p_user_id: userId,
      });

      if (decErr || !decrypted) {
        throw new Error(`Failed to decrypt ${apiProvider.toUpperCase()} key`);
      }

      apiKey = decrypted as string;

      let keyInfo: any = { key: apiKey };
      if (provider === 'vertex-ai' && keyData.vertex_config) {
        keyInfo = {
          key: apiKey,
          provider: 'vertex-ai',
          vertexConfig: keyData.vertex_config
        };
      }

      const { url, headers, body } = await buildGeminiOrVertexRequest(
        keyInfo,
        model,
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
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      let charactersText = data.candidates[0].content.parts[0].text;

      // Try to parse JSON
      let characters = [];
      try {
        const jsonText = charactersText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        characters = JSON.parse(jsonText);
      } catch (e) {
        console.error('Failed to parse characters JSON, returning empty array:', e);
        characters = [];
      }

      return new Response(JSON.stringify({ characters }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (provider === 'openai') {
      apiKey = Deno.env.get('OPENAI_API_KEY') || '';
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      const isReasoningModel = model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-');
      const maxTokens = getMaxTokensForModel(model);
      console.log(`📦 [detect-characters] Usando ${maxTokens} ${isReasoningModel ? 'max_completion_tokens' : 'max_tokens'} para ${model}`);
      
      requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        ...(isReasoningModel 
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }
        )
      };
    }

    if (!apiKey) {
      throw new Error(`API key não configurada para ${provider}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'openai') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let charactersText = '';

    if (provider === 'claude') {
      charactersText = data.content[0].text;
    } else if (provider === 'openai') {
      charactersText = data.choices[0].message.content;
    }

    // Tentar parsear JSON
    let characters = [];
    try {
      // Remover markdown code blocks se presentes
      const jsonText = charactersText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      characters = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse characters JSON, returning empty array:', e);
      characters = [];
    }

    return new Response(JSON.stringify({ characters }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof ValidationException) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
