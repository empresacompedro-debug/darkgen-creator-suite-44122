import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getApiKey(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai',
  supabaseClient: any
): Promise<{ key: string; keyId: string } | null> {
  
  // 1. Se houver userId, tentar pegar chaves do usuário (ordenadas por prioridade)
  if (userId) {
    try {
      const { data: userKeys } = await supabaseClient
        .from('user_api_keys')
        .select('id, api_key_encrypted, quota_status, is_active, priority')
        .eq('user_id', userId)
        .eq('api_provider', provider)
        .eq('is_active', true)
        .order('priority', { ascending: true });
      
      if (userKeys && userKeys.length > 0) {
        const currentKey = userKeys[0];
        
        // Decrypt the API key using the database function
        const { data: decryptedKey, error: decryptError } = await supabaseClient
          .rpc('decrypt_api_key', {
            p_encrypted: currentKey.api_key_encrypted,
            p_user_id: userId
          });
        
        if (decryptError || !decryptedKey) {
          console.error(`❌ Erro ao descriptografar chave para ${provider}:`, decryptError);
          throw new Error('Failed to decrypt API key');
        }
        
        console.log(`✅ Usando chave do usuário para ${provider} (priority: ${currentKey.priority})`);
        
        // Marcar como key atual
        await supabaseClient
          .from('user_api_keys')
          .update({ is_current: true })
          .eq('id', currentKey.id);
        
        return { key: decryptedKey, keyId: currentKey.id };
      }
    } catch (error) {
      console.log(`⚠️ Chave do usuário não encontrada para ${provider}, usando fallback global`);
    }
  }
  
  // 2. Fallback para chave global (Supabase Secrets)
  const globalKeys: Record<string, string | undefined> = {
    youtube: Deno.env.get('YOUTUBE_API_KEY'),
    gemini: Deno.env.get('GEMINI_API_KEY'),
    claude: Deno.env.get('ANTHROPIC_API_KEY'),
    openai: Deno.env.get('OPENAI_API_KEY')
  };
  
  const globalKey = globalKeys[provider];
  if (globalKey) {
    console.log(`🔑 Usando chave global para ${provider}`);
    return { key: globalKey, keyId: 'global' };
  }
  
  console.error(`❌ Nenhuma chave configurada para ${provider}`);
  return null;
}

export async function markApiKeyAsExhaustedAndRotate(
  userId: string | undefined,
  keyId: string,
  provider: string,
  supabaseClient: any
): Promise<{ key: string; keyId: string; rotated: boolean } | null> {
  if (!userId || keyId === 'global') return null;
  
  try {
    // 1. Marcar key atual como inativa (esgotada)
    await supabaseClient
      .from('user_api_keys')
      .update({ 
        is_active: false, 
        is_current: false,
        quota_status: { 
          exceeded: true, 
          exceeded_at: new Date().toISOString() 
        }
      })
      .eq('id', keyId);
    
    console.log(`🚫 Chave ${keyId} marcada como esgotada para ${provider}`);
    
    // 2. Buscar próxima key ativa
    const { data: nextKeys } = await supabaseClient
      .from('user_api_keys')
      .select('id, api_key_encrypted, priority')
      .eq('user_id', userId)
      .eq('api_provider', provider)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1);
    
    if (!nextKeys || nextKeys.length === 0) {
      console.log(`❌ Sem keys disponíveis para ${provider}`);
      return null;
    }
    
    const nextKey = nextKeys[0];
    
    // Decrypt the next API key
    const { data: decryptedKey, error: decryptError } = await supabaseClient
      .rpc('decrypt_api_key', {
        p_encrypted: nextKey.api_key_encrypted,
        p_user_id: userId
      });
    
    if (decryptError || !decryptedKey) {
      console.error(`❌ Erro ao descriptografar próxima chave para ${provider}:`, decryptError);
      return null;
    }
    
    // 3. Marcar nova key como atual
    await supabaseClient
      .from('user_api_keys')
      .update({ is_current: true })
      .eq('id', nextKey.id);
    
    console.log(`🔄 Rotacionado para key ${nextKey.id} (priority: ${nextKey.priority})`);
    
    return { key: decryptedKey, keyId: nextKey.id, rotated: true };
  } catch (error) {
    console.error('Erro ao rotacionar API key:', error);
    return null;
  }
}

export async function updateApiKeyUsage(
  userId: string | undefined,
  provider: string,
  supabaseClient: any,
  quotaStatus?: any
) {
  if (!userId) return;
  
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
      .eq('user_id', userId)
      .eq('api_provider', provider);
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
export async function executeWithKeyRotation<T>(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai',
  supabaseClient: any,
  executeRequest: (apiKey: string) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let currentKeyInfo = await getApiKey(userId, provider, supabaseClient);
  
  if (!currentKeyInfo) {
    throw new Error(`Nenhuma chave configurada para ${provider}`);
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    
    try {
      console.log(`🔑 Tentativa ${attempt}/${maxRetries} com key ${currentKeyInfo.keyId}`);
      
      const result = await executeRequest(currentKeyInfo.key);
      
      // Sucesso! Atualizar uso
      await updateApiKeyUsage(userId, provider, supabaseClient);
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é erro de quota esgotada
      const isQuotaError = 
        error?.status === 429 ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('rate limit') ||
        error?.message?.toLowerCase().includes('quotaExceeded');

      if (!isQuotaError) {
        // Erro não relacionado a quota, não rotacionar
        throw error;
      }

      console.log(`⚠️ Quota esgotada na key ${currentKeyInfo.keyId}, tentando rotacionar...`);

      // Tentar rotacionar para próxima chave
      const rotated = await markApiKeyAsExhaustedAndRotate(
        userId,
        currentKeyInfo.keyId,
        provider,
        supabaseClient
      );

      if (!rotated) {
        console.log(`❌ Sem mais chaves disponíveis para ${provider}`);
        throw new Error(`Todas as chaves de API para ${provider} estão esgotadas. Adicione novas chaves ou aguarde o reset.`);
      }

      currentKeyInfo = { key: rotated.key, keyId: rotated.keyId };
      console.log(`✅ Rotacionado para nova chave ${currentKeyInfo.keyId}`);
    }
  }

  throw lastError || new Error(`Falha após ${maxRetries} tentativas`);
}
