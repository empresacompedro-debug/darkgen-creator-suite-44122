import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { channels, targetChannel } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY não configurada');
    }

    console.log('🔍 Analisando padrão dos canais...');
    
    // Buscar informações de cada canal
    const channelInfos = [];
    
    for (const channelHandle of channels) {
      try {
        // Buscar canal pelo handle
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&maxResults=1&key=${YOUTUBE_API_KEY}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.items && searchData.items.length > 0) {
          const channelId = searchData.items[0].snippet.channelId;
          
          // Buscar detalhes do canal
          const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
          const channelResponse = await fetch(channelUrl);
          const channelData = await channelResponse.json();
          
          if (channelData.items && channelData.items.length > 0) {
            const channel = channelData.items[0];
            
            // Buscar vídeos recentes
            const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
            const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
            const videosResponse = await fetch(videosUrl);
            const videosData = await videosResponse.json();
            
            // Pegar títulos dos vídeos
            const videoTitles = videosData.items?.map((v: any) => v.snippet.title) || [];
            
            channelInfos.push({
              handle: channelHandle,
              name: channel.snippet.title,
              description: channel.snippet.description,
              subscribers: parseInt(channel.statistics.subscriberCount || '0'),
              videoCount: parseInt(channel.statistics.videoCount || '0'),
              recentVideoTitles: videoTitles.slice(0, 5),
            });
            
            console.log(`✅ Informações coletadas: ${channel.snippet.title}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${channelHandle}:`, error);
      }
    }
    
    // Agora vamos analisar com o Gemini
    const analysisPrompt = `
Analise estes canais do YouTube e identifique:

1. **Padrão de Nicho**: Qual é o nicho EXATO que esses canais compartilham?
2. **Padrão de Conteúdo**: Que tipo de conteúdo eles produzem? (formato, estilo, temas)
3. **Palavras-chave comuns**: Quais palavras-chave aparecem com frequência nos nomes e descrições?
4. **Estilo de títulos**: Como são os títulos dos vídeos? Que padrões você identifica?
5. **Por que não são encontrados**: Por que um sistema de busca que procura por "curiosidades shorts" ou "viral shorts canal" pode NÃO encontrar esses canais?

Canal Alvo (que gerou a busca):
${targetChannel}

Canais de Exemplo que DEVERIAM ser encontrados:
${JSON.stringify(channelInfos, null, 2)}

Responda em formato JSON:
{
  "nichoExato": "descrição detalhada do nicho",
  "tipoConteudo": "descrição do tipo de conteúdo",
  "palavrasChaveComuns": ["palavra1", "palavra2", ...],
  "padraoTitulos": "padrão identificado nos títulos",
  "problemaBusca": "explicação de por que não são encontrados",
  "termosBuscaIdeais": ["termo1", "termo2", ...],
  "caracteristicasUnicas": ["característica1", "característica2", ...]
}
`;

    console.log('🤖 Enviando para análise do Gemini...');
    
    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de canais do YouTube e identificação de padrões de conteúdo. Seja preciso e detalhado na sua análise.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Erro do Gemini:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.choices[0].message.content;
    
    console.log('📊 Análise recebida do Gemini');
    
    // Tentar extrair JSON da resposta
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { rawAnalysis: analysisText };
      }
    } catch {
      analysis = { rawAnalysis: analysisText };
    }

    return new Response(
      JSON.stringify({
        success: true,
        channelInfos,
        analysis,
        rawAnalysis: analysisText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
