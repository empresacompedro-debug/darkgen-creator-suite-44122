import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  topKeywords: Array<{
    keyword: string;
    frequency: number;
    avgViews: number;
    avgVPH: number;
    examples: string[];
  }>;
  championMicroNiches: Array<{
    niche: string;
    avgViews: number;
    avgVPH: number;
    videoCount: number;
    bestTitles: string[];
    pattern: string;
  }>;
  insights: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData, aiModel = 'claude-sonnet-4-5' } = await req.json();

    console.log('Received request with model:', aiModel);
    console.log('Raw data length:', rawData?.length);

    if (!rawData || rawData.trim().length === 0) {
      throw new Error('Dados vazios. Por favor, cole os dados do YouTube.');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    console.log('User ID:', userId);

    // Get API key based on model
    let apiKey: string | undefined;
    let apiUrl: string;
    let requestBody: any;

    if (aiModel.includes('claude')) {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      apiUrl = 'https://api.anthropic.com/v1/messages';
      
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada');
      }
    } else if (aiModel.includes('gemini')) {
      apiKey = Deno.env.get('GEMINI_API_KEY');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }
    } else if (aiModel.includes('gpt')) {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada');
      }
    } else {
      throw new Error(`Modelo não suportado: ${aiModel}`);
    }

    // Build optimized prompt
    const prompt = `Analise os dados de vídeos do YouTube abaixo e retorne um JSON estruturado.

DADOS DO YOUTUBE:
${rawData}

INSTRUÇÕES IMPORTANTES:
1. Os dados estão em formato brasileiro (ex: "3,2 mil visualizações", "15,8 mil", "VPH")
2. Extraia TODOS os vídeos encontrados
3. Identifique padrões nos títulos de melhor performance
4. Detecte micro-nichos campeões (grupos de vídeos com tema similar e boas métricas)
5. Encontre palavras-chave mais frequentes e efetivas

FORMATO DE RESPOSTA (JSON):
{
  "topKeywords": [
    {
      "keyword": "palavra ou frase",
      "frequency": número_de_ocorrências,
      "avgViews": média_de_views,
      "avgVPH": média_de_VPH,
      "examples": ["título 1", "título 2"]
    }
  ],
  "championMicroNiches": [
    {
      "niche": "nome do micro-nicho",
      "avgViews": média_de_views,
      "avgVPH": média_de_VPH,
      "videoCount": quantidade_de_vídeos,
      "bestTitles": ["melhor título 1", "melhor título 2"],
      "pattern": "padrão identificado nos títulos"
    }
  ],
  "insights": "texto com insights gerais sobre a análise"
}

RETORNE APENAS O JSON, SEM MARKDOWN OU EXPLICAÇÕES ADICIONAIS.`;

    console.log('Sending request to AI model...');

    let analysis: AnalysisResult;

    // Make API request based on model
    if (aiModel.includes('claude')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: aiModel,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Claude response received');
      
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }
      
      analysis = JSON.parse(jsonMatch[0]);
      
    } else if (aiModel.includes('gemini')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response received');
      
      const content = data.candidates[0].content.parts[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }
      
      analysis = JSON.parse(jsonMatch[0]);
      
    } else if (aiModel.includes('gpt')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de dados do YouTube. Retorne apenas JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenAI response received');
      
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }
      
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Modelo não suportado');
    }

    console.log('Analysis parsed successfully');

    // Save to database if user is authenticated
    if (userId) {
      console.log('Saving analysis to database...');
      
      const { error: insertError } = await supabase
        .from('title_analyses')
        .insert({
          user_id: userId,
          raw_data: rawData,
          ai_model: aiModel,
          top_keywords: analysis.topKeywords,
          champion_micro_niches: analysis.championMicroNiches,
          insights: analysis.insights,
        });

      if (insertError) {
        console.error('Error saving to database:', insertError);
        // Don't throw, just log - we still want to return the analysis
      } else {
        console.log('Analysis saved to database successfully');
      }
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-titles function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar análise',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
