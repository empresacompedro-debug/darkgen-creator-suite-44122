import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeWithKeyRotation } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Extrair userId do JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log('Sem usuário autenticado, usando chave global');
      }
    }

    const { keyword, language = 'auto' } = await req.json();

    console.log('Gerando sugestões para:', keyword, 'idioma:', language);

    // Mapear códigos de idioma para nomes completos
    const languageMap: { [key: string]: string } = {
      'en': 'inglês',
      'pt': 'português',
      'es': 'espanhol',
      'fr': 'francês',
      'de': 'alemão',
      'it': 'italiano',
      'ja': 'japonês',
      'ko': 'coreano',
      'zh': 'chinês',
      'auto': 'o mesmo idioma da palavra-chave fornecida'
    };

    const targetLanguage = languageMap[language] || languageMap['auto'];

    const prompt = `Você é um especialista em YouTube e marketing digital especializado em encontrar nichos virais.

Dado a palavra-chave "${keyword}", gere exatamente 8 sugestões de palavras-chave OTIMIZADAS para encontrar vídeos virais no YouTube.

IMPORTANTE - IDIOMA: As sugestões DEVEM ser geradas em ${targetLanguage}. Respeite estritamente este idioma.

As sugestões devem:
- Ser variações mais específicas e direcionadas da palavra original
- Incluir termos que podem gerar vídeos com alto potencial viral
- ESTAR OBRIGATORIAMENTE em ${targetLanguage}
- Ser frases de busca completas e naturais, não apenas palavras soltas
- Focar em nichos específicos e tendências relacionadas ao tema
- Incluir variações com diferentes ângulos (tutorial, comparação, review, etc.)

IMPORTANTE: Retorne APENAS um array JSON válido com exatamente 8 sugestões em ${targetLanguage}.
Formato: ["sugestão 1", "sugestão 2", "sugestão 3", "sugestão 4", "sugestão 5", "sugestão 6", "sugestão 7", "sugestão 8"]

Não inclua explicações, markdown ou texto adicional. APENAS o array JSON com sugestões em ${targetLanguage}.`;

    console.log('🔑 Executando com rotação automática de chaves Gemini...');

    // Usar executeWithKeyRotation para rotação automática
    const generatedText = await executeWithKeyRotation(
      userId,
      'gemini',
      supabaseClient,
      async (apiKey: string) => {
        console.log('📡 Chamando Gemini API...');
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 512,
              }
            })
          }
        );

        const data = await response.json();

        // Detectar erro de quota
        if (!response.ok) {
          const errorMsg = data.error?.message || '';
          console.error('❌ Erro na API Gemini:', data);
          
          if (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXCEEDED');
          }
          
          throw new Error(errorMsg || 'Erro ao gerar sugestões');
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      }
    );
    console.log('Texto gerado:', generatedText);

    // Extrair JSON do texto gerado
    let suggestions: string[] = [];
    try {
      // Tentar parsear diretamente
      suggestions = JSON.parse(generatedText);
    } catch {
      // Se falhar, tentar extrair JSON do texto
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
        } catch {
          // Fallback: dividir por linhas e limpar
          suggestions = generatedText
            .split('\n')
            .filter((line: string) => line.trim() && !line.includes('[') && !line.includes(']'))
            .map((line: string) => line.replace(/^[-*"\d.]\s*/, '').replace(/[",]/g, '').trim())
            .filter((line: string) => line.length > 0)
            .slice(0, 8);
        }
      } else {
        // Último fallback
        suggestions = [keyword];
      }
    }

    // Garantir que temos exatamente 8 sugestões
    if (suggestions.length < 8) {
      const baseSuggestions = [
        `${keyword} tutorial completo`,
        `como fazer ${keyword}`,
        `${keyword} passo a passo`,
        `${keyword} para iniciantes`,
        `melhor ${keyword}`,
        `${keyword} avançado`,
        `dicas de ${keyword}`,
        `${keyword} atualizado`
      ];
      while (suggestions.length < 8) {
        suggestions.push(baseSuggestions[suggestions.length % baseSuggestions.length]);
      }
    }

    suggestions = suggestions.slice(0, 8);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro na função generate-suggestions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
