import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getNextKeyRoundRobin, markKeyExhaustedAndGetNext } from './round-robin.ts';

export async function getApiKey(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi',
  supabaseClient: any
): Promise<{ key: string; keyId: string; keyNumber?: number; totalKeys?: number } | null> {
  console.log(`🔍 [API Key] Fetching key for provider: ${provider}, userId: ${userId}`);
  
  // Try to get user-specific API key using round-robin if userId is provided
  if (userId) {
    try {
      const result = await getNextKeyRoundRobin(userId, provider, supabaseClient);
      
      if (result) {
        console.log(`✅ [API Key] Using user key ${result.keyNumber}/${result.totalKeys} (Round-Robin)`);
        return result;
      }
    } catch (error: any) {
      console.error(`❌ [API Key] Error fetching user key: ${error.message}`);
    }
  }

  // Fallback to global environment variable
  console.log(`⚠️ [API Key] Falling back to global environment variable for ${provider}`);
  const envVarMap: Record<string, string | undefined> = {
    youtube: Deno.env.get('YOUTUBE_API_KEY'),
    gemini: Deno.env.get('GEMINI_API_KEY'),
    claude: Deno.env.get('ANTHROPIC_API_KEY'),
    openai: Deno.env.get('OPENAI_API_KEY'),
    kimi: Deno.env.get('KIMI_API_KEY')
  };

  const envVar = envVarMap[provider];
  const globalKey = envVar;

  if (globalKey) {
    console.log(`✅ [API Key] Found global API key for ${provider}`);
    return { key: globalKey, keyId: 'global' };
  }

  console.error(`❌ [API Key] No API key found for ${provider}`);
  return null;
}

export async function markApiKeyAsExhaustedAndRotate(
  userId: string | undefined,
  keyId: string,
  provider: string,
  supabaseClient: any
): Promise<{ key: string; keyId: string; rotated: boolean; keyNumber?: number; totalKeys?: number } | null> {
  console.log(`⚠️ [Key Rotation] Marking key as exhausted: ${keyId}`);
  
  if (!userId || keyId === 'global') {
    console.log('⚠️ [Key Rotation] Cannot rotate global keys');
    return null;
  }

  try {
    // Use round-robin to get next key and mark current as exhausted
    const result = await markKeyExhaustedAndGetNext(
      userId,
      keyId,
      provider as 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi',
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

// Helper universal para executar requisições com rotação automática de API keys
// Agora usa sistema Round-Robin para melhor distribuição de carga
export async function executeWithKeyRotation<T>(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi',
  supabaseClient: any,
  executeRequest: (apiKey: string) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  console.log(`🚀 [Execute] Starting request with Round-Robin rotation (max ${maxRetries} retries)`);
  
  let currentAttempt = 0;
  let currentKeyId: string | null = null;
  let currentKeyNumber: number | undefined;
  let totalKeys: number | undefined;

  while (currentAttempt < maxRetries) {
    try {
      // Get current API key using Round-Robin
      const keyData = await getApiKey(userId, provider, supabaseClient);
      
      if (!keyData) {
        throw new Error(`No API key available for ${provider}`);
      }

      currentKeyId = keyData.keyId;
      currentKeyNumber = keyData.keyNumber;
      totalKeys = keyData.totalKeys;
      
      if (currentKeyNumber && totalKeys) {
        console.log(`🔑 [Execute] Attempt ${currentAttempt + 1}: Using key ${currentKeyNumber}/${totalKeys} (Round-Robin)`);
      } else {
        console.log(`🔑 [Execute] Attempt ${currentAttempt + 1}: Using global key`);
      }

      // Execute the request
      const result = await executeRequest(keyData.key);
      
      // Update key usage on success
      if (userId && currentKeyId && currentKeyId !== 'global') {
        await updateApiKeyUsage(userId, provider, supabaseClient, currentKeyId);
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
