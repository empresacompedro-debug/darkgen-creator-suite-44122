import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getNextKeyRoundRobin, markKeyExhaustedAndGetNext } from './round-robin.ts';
import { getNextVertexKeyRoundRobin, markVertexKeyExhaustedAndGetNext } from './round-robin-vertex.ts';

export async function getApiKey(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi' | 'huggingface' | 'vertex-ai',
  supabaseClient: any
): Promise<{ key: string; keyId: string; keyNumber?: number; totalKeys?: number; vertexConfig?: any } | null> {
  console.log(`🔍 [API Key] Fetching key for provider: ${provider}, userId: ${userId}`);
  
  // ✅ VERTEX AI: Usa tabela ISOLADA user_vertex_ai_keys
  if (provider === 'vertex-ai') {
    console.log(`🎯 [API Key] Vertex AI - buscando em tabela ISOLADA user_vertex_ai_keys`);
    if (!userId) {
      console.error('❌ [API Key] Vertex AI requer userId');
      return null;
    }
    return await getNextVertexKeyRoundRobin(userId, supabaseClient);
  }
  
  // ✅ GEMINI GRATUITO: SEMPRE usa env var global
  if (provider === 'gemini') {
    console.log(`🎯 [API Key] Gemini gratuito - usando GEMINI_API_KEY global`);
    const globalKey = Deno.env.get('GEMINI_API_KEY');
    if (globalKey) {
      return { key: globalKey, keyId: 'global' };
    }
    console.error('❌ [API Key] GEMINI_API_KEY global não configurada');
    return null;
  }
  
  // ✅ OUTROS PROVIDERS (Claude, OpenAI, YouTube, etc.): tabela user_api_keys original
  if (userId) {
    try {
      const result = await getNextKeyRoundRobin(userId, provider, supabaseClient);
      
      if (result) {
        console.log(`✅ [API Key] ${provider} - chave do usuário ${result.keyNumber}/${result.totalKeys}`);
        return result;
      }
    } catch (error: any) {
      console.error(`❌ [API Key] Erro ao buscar chave do usuário: ${error.message}`);
    }
  }

  // Fallback para env var global (Claude, OpenAI, etc.)
  console.log(`⚠️ [API Key] Fallback para env var global de ${provider}`);
  const envVarMap: Record<string, string | undefined> = {
    youtube: Deno.env.get('YOUTUBE_API_KEY'),
    claude: Deno.env.get('ANTHROPIC_API_KEY'),
    openai: Deno.env.get('OPENAI_API_KEY'),
    kimi: Deno.env.get('KIMI_API_KEY'),
    huggingface: Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
  };

  const globalKey = envVarMap[provider];
  if (globalKey) {
    console.log(`✅ [API Key] ${provider} - env var global encontrada`);
    return { key: globalKey, keyId: 'global' };
  }

  console.error(`❌ [API Key] Nenhuma chave encontrada para ${provider}`);
  return null;
}

export async function markApiKeyAsExhaustedAndRotate(
  userId: string | undefined,
  keyId: string,
  provider: string,
  supabaseClient: any
): Promise<{ key: string; keyId: string; rotated: boolean; keyNumber?: number; totalKeys?: number; vertexConfig?: any } | null> {
  console.log(`⚠️ [Key Rotation] Marking key as exhausted: ${keyId}`);
  
  if (!userId || keyId === 'global') {
    console.log('⚠️ [Key Rotation] Cannot rotate global keys');
    return null;
  }

  try {
    // ✅ VERTEX AI: usa rotação isolada
    if (provider === 'vertex-ai') {
      const result = await markVertexKeyExhaustedAndGetNext(userId, keyId, supabaseClient);
      if (!result) {
        console.error('❌ [Key Rotation] No more Vertex AI keys available');
        return null;
      }
      console.log(`✅ [Key Rotation] Rotated to Vertex key ${result.keyNumber}/${result.totalKeys}`);
      return { ...result, rotated: true };
    }
    
    // ✅ OUTROS PROVIDERS: usa rotação original
    const result = await markKeyExhaustedAndGetNext(
      userId,
      keyId,
      provider as 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi' | 'huggingface' | 'vertex-ai',
      supabaseClient
    );

    if (!result) {
      console.error('❌ [Key Rotation] No more API keys available');
      return null;
    }

    console.log(`✅ [Key Rotation] Rotated to key ${result.keyNumber}/${result.totalKeys}`);
    return { ...result, rotated: true };
  } catch (error: any) {
    console.error(`❌ [Key Rotation] Error rotating API key: ${error.message}`);
    return null;
  }
}

export async function updateApiKeyUsage(
  userId: string | undefined,
  provider: string,
  supabaseClient: any,
  keyId?: string,
  quotaStatus?: any
) {
  if (!userId || !keyId || keyId === 'global') return;
  
  try {
    const updateData: any = {
      last_used_at: new Date().toISOString()
    };
    
    if (quotaStatus) {
      updateData.quota_status = quotaStatus;
    }
    
    await supabaseClient
      .from('user_api_keys')
      .update(updateData)
      .eq('id', keyId);
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
}

export async function markApiKeyAsExceeded(
  userId: string | undefined,
  provider: string,
  supabaseClient: any
) {
  if (!userId) return;
  
  try {
    await supabaseClient
      .from('user_api_keys')
      .update({ 
        is_active: false,
        quota_status: { 
          exceeded: true, 
          exceeded_at: new Date().toISOString() 
        }
      })
      .eq('user_id', userId)
      .eq('api_provider', provider);
    
    console.log(`🚫 Chave do usuário marcada como esgotada para ${provider}`);
  } catch (error) {
    console.error('Error marking API key as exceeded:', error);
  }
}

// ❌ FUNÇÃO REMOVIDA: getApiKeyWithHierarchicalFallback
// Isolamento completo implementado: Gemini gratuito NUNCA usa Vertex AI
// Vertex AI NUNCA usa Gemini gratuito

export async function executeWithKeyRotation<T>(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi' | 'huggingface' | 'vertex-ai',
  supabaseClient: any,
  executeRequest: (apiKey: string, providerUsed?: string, vertexConfig?: any) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  console.log(`🚀 [Execute] Starting request with Round-Robin rotation (max ${maxRetries} retries)`);
  
  let currentAttempt = 0;
  let currentKeyId: string | null = null;
  let currentKeyNumber: number | undefined;
  let totalKeys: number | undefined;

  let currentProvider = provider;

  while (currentAttempt < maxRetries) {
    try {
      // ✅ ISOLAMENTO COMPLETO: cada provider usa sua própria fonte
      const keyData = await getApiKey(userId, provider, supabaseClient);
      
      if (!keyData) {
        throw new Error(`No API key available for ${provider}`);
      }
      
      currentProvider = provider;

      currentKeyId = keyData.keyId;
      currentKeyNumber = keyData.keyNumber;
      totalKeys = keyData.totalKeys;
      
      if (currentKeyNumber && totalKeys) {
        console.log(`🔑 [Execute] Attempt ${currentAttempt + 1}: Using ${currentProvider} key ${currentKeyNumber}/${totalKeys} (Round-Robin)`);
      } else {
        console.log(`🔑 [Execute] Attempt ${currentAttempt + 1}: Using global key`);
      }

      // Execute the request (passar provider e vertexConfig se aplicável)
      const result = await executeRequest(keyData.key, currentProvider, keyData.vertexConfig);
      
      // ✅ REMOVIDO: Double update de last_used_at
      // O update já foi feito atomicamente no get_and_update_next_key()
      // Manter updateApiKeyUsage aqui causava 2 updates desnecessários

      // 📊 Log API usage for cost tracking (only for Gemini/Vertex AI)
      if (userId && (currentProvider === 'gemini' || currentProvider === 'vertex-ai')) {
        const functionName = Deno.env.get('FUNCTION_NAME') || 'unknown';
        try {
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          );
          await supabaseAdmin.from('api_usage_logs').insert({
            user_id: userId,
            provider: currentProvider,
            function_name: functionName
          });
          console.log(`📊 [executeWithKeyRotation] Logged ${currentProvider} usage for ${functionName}`);
        } catch (logError) {
          console.error('⚠️ [executeWithKeyRotation] Failed to log usage:', logError);
          // Don't fail the request if logging fails
        }
      }
      
      console.log(`✅ [Execute] Request successful with key ${currentKeyNumber || 'global'}/${totalKeys || '?'}`);
      return result;

    } catch (error: any) {
      console.error(`❌ [Execute] Request failed on attempt ${currentAttempt + 1}:`, error.message);
      
      // Check if it's a quota error
      const isQuotaError = error?.status === 429 || 
                          error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('limit exceeded') ||
                          error?.message?.toLowerCase().includes('quotaExceeded') ||
                          error?.message?.toLowerCase().includes('rate limit');

      if (isQuotaError && currentKeyId && currentKeyId !== 'global' && userId) {
        console.log(`⚠️ [Execute] Quota error on key ${currentKeyNumber}/${totalKeys}, rotating...`);
        
        // Try to rotate to next key
        const rotatedKey = await markApiKeyAsExhaustedAndRotate(
          userId,
          currentKeyId,
          provider,
          supabaseClient
        );

        if (!rotatedKey) {
          console.error('❌ [Execute] No more keys available for rotation');
          throw new Error(`All API keys exhausted for ${provider}`);
        }

        console.log(`✅ [Execute] Rotated to key ${rotatedKey.keyNumber}/${rotatedKey.totalKeys}, retrying...`);
        currentAttempt++;
        continue;
      }

      // If not a quota error or can't rotate, throw the error
      throw error;
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}
