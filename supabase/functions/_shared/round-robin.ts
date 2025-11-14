/**
 * Sistema de rotação Round-Robin para API Keys
 * Distribui requisições uniformemente entre todas as chaves ativas
 */

interface ApiKey {
  id: string;
  api_key_encrypted: any;
  priority: number;
  is_active: boolean;
  last_used_at: string | null;
}

/**
 * Busca a próxima chave disponível usando rotação atômica (FOR UPDATE SKIP LOCKED)
 * Previne race conditions em cenários de alta concorrência (1000+ req/dia)
 * @param userId - ID do usuário (opcional, para chaves específicas do usuário)
 * @param provider - Provider da API (youtube, gemini, etc)
 * @param supabaseClient - Cliente Supabase
 * @returns Chave descriptografada e seu ID, ou null se não houver chaves disponíveis
 */
export async function getNextKeyRoundRobin(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi' | 'huggingface' | 'vertex-ai' | 'scrapingbee',
  supabaseClient: any
): Promise<{ key: string; keyId: string; keyNumber: number; totalKeys: number } | null> {
  console.log(`🔄 [Round-Robin] Buscando próxima chave ATÔMICA para provider: ${provider}`);
  console.log(`🔑 [DEBUG Round-Robin] userId recebido: ${userId} (tipo: ${typeof userId})`);
  
  if (!userId) {
    console.log('⚠️ [Round-Robin] userId é null/undefined, sem chaves do usuário');
    return null;
  }

  try {
    // 🔒 Chamada atômica à função RPC com lock (FOR UPDATE SKIP LOCKED)
    // Isso garante 0% de race conditions mesmo em 1000+ requisições/dia
    const { data: keyData, error } = await supabaseClient
      .rpc('get_and_update_next_key', {
        p_user_id: userId,
        p_provider: provider
      })
      .single();

    if (error || !keyData) {
      console.log(`⚠️ [Round-Robin] Nenhuma chave ativa disponível para ${provider}`);
      console.log('Error details:', error);
      return null;
    }

    console.log(`📊 [Round-Robin] Chave selecionada: ${keyData.key_number}/${keyData.total_keys} (priority: ${keyData.priority})`);
    console.log(`✅ [Round-Robin] last_used_at atualizado atomicamente (evita double update)`);

    // Descriptografar a chave
    const { data: decryptedData, error: decryptError } = await supabaseClient.rpc(
      'decrypt_api_key',
      {
        p_encrypted: keyData.encrypted_key,
        p_user_id: userId
      }
    );

    if (decryptError || !decryptedData) {
      console.error('❌ [Round-Robin] Erro ao descriptografar chave:', decryptError);
      return null;
    }

    console.log(`🔑 [Round-Robin] Chave descriptografada com sucesso (${decryptedData.substring(0, 10)}...)`);

    return {
      key: decryptedData,
      keyId: keyData.key_id,
      keyNumber: keyData.key_number,
      totalKeys: keyData.total_keys
    };
  } catch (error) {
    console.error('❌ [Round-Robin] Exceção na rotação atômica:', error);
    return null;
  }
}

/**
 * Marca uma chave como inativa (esgotada) e busca a próxima disponível
 * @param userId - ID do usuário
 * @param keyId - ID da chave a ser marcada como inativa
 * @param provider - Provider da API
 * @param supabaseClient - Cliente Supabase
 * @returns Próxima chave disponível ou null
 */
export async function markKeyExhaustedAndGetNext(
  userId: string | undefined,
  keyId: string,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi' | 'huggingface' | 'vertex-ai' | 'scrapingbee',
  supabaseClient: any
): Promise<{ key: string; keyId: string; keyNumber: number; totalKeys: number } | null> {
  console.log(`⚠️ [Round-Robin] Marcando chave ${keyId} como esgotada`);

  // Marcar chave atual como inativa
  const { error: updateError } = await supabaseClient
    .from('user_api_keys')
    .update({
      is_active: false,
      quota_status: { exhausted: true, exhausted_at: new Date().toISOString() }
    })
    .eq('id', keyId);

  if (updateError) {
    console.error('❌ [Round-Robin] Erro ao marcar chave como inativa:', updateError);
  }

  // Buscar próxima chave disponível
  console.log('🔄 [Round-Robin] Buscando próxima chave disponível...');
  return await getNextKeyRoundRobin(userId, provider, supabaseClient);
}
