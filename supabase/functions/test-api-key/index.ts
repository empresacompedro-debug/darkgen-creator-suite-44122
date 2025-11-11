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
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      throw new Error('Provider and apiKey are required');
    }

    const keyPrefix = apiKey.substring(0, 12);
    console.log(`Testing ${provider} API key:`, keyPrefix + '...');

    let valid = false;
    let message = '';

    switch (provider) {
      case 'youtube': {
        const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`;
        const response = await fetch(testUrl);
        const data = await response.json();
        
        if (response.ok) {
          valid = true;
          message = 'Chave YouTube válida e funcionando!';
        } else {
          message = data.error?.message || 'Chave YouTube inválida';
        }
        break;
      }

      case 'gemini': {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'test' }] }]
          })
        });
        const data = await response.json();
        
        if (response.ok && data.candidates) {
          valid = true;
          message = 'Chave Gemini válida e funcionando!';
        } else {
          // Distinção detalhada de erros
          const errorCode = data.error?.code || response.status;
          const errorMessage = data.error?.message || '';
          
          if (errorCode === 403 || errorMessage.includes('API_KEY_INVALID')) {
            message = 'Chave Gemini INVÁLIDA (403 - não autorizada)';
          } else if (errorCode === 429 || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
            message = 'Chave Gemini com QUOTA ESGOTADA (429)';
          } else if (errorCode === 400) {
            message = 'Chave Gemini com FORMATO INVÁLIDO (400)';
          } else if (errorCode >= 500) {
            message = `Erro no servidor Google (${errorCode})`;
          } else {
            message = `Chave Gemini com erro: ${errorMessage || 'desconhecido'}`;
          }
        }
        break;
      }

      case 'claude': {
        const testUrl = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        const data = await response.json();
        
        if (response.ok) {
          valid = true;
          message = 'Chave Claude válida e funcionando!';
        } else {
          message = data.error?.message || 'Chave Claude inválida';
        }
        break;
      }

      case 'openai': {
        const testUrl = 'https://api.openai.com/v1/models';
        const response = await fetch(testUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          valid = true;
          message = 'Chave OpenAI válida e funcionando!';
        } else {
          message = data.error?.message || 'Chave OpenAI inválida';
        }
        break;
      }

      case 'huggingface': {
        const testUrl = 'https://huggingface.co/api/whoami-v2';
        const response = await fetch(testUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        
        if (response.ok && data.name) {
          valid = true;
          message = `Chave HuggingFace válida! Conta: ${data.name}`;
        } else {
          message = 'Chave HuggingFace inválida';
        }
        break;
      }

      default:
        throw new Error(`Provider "${provider}" não suportado`);
    }

    console.log(`${provider} validation result:`, { valid, message });

    return new Response(
      JSON.stringify({ 
        valid, 
        message, 
        keyPrefix,
        errorType: !valid ? (
          message.includes('INVÁLIDA') || message.includes('FORMATO INVÁLIDO') ? 'INVALID_KEY' :
          message.includes('QUOTA ESGOTADA') ? 'QUOTA_EXCEEDED' :
          'UNKNOWN_ERROR'
        ) : null
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in test-api-key:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
