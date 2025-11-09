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
 * Busca a próxima chave disponível usando rotação circular
 * @param userId - ID do usuário (opcional, para chaves específicas do usuário)
 * @param provider - Provider da API (youtube, gemini, etc)
 * @param supabaseClient - Cliente Supabase
 * @returns Chave descriptografada e seu ID, ou null se não houver chaves disponíveis
 */
export async function getNextKeyRoundRobin(
  userId: string | undefined,
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi',
  supabaseClient: any
): Promise<{ key: string; keyId: string; keyNumber: number; totalKeys: number } | null> {
  console.log(`🔄 [Round-Robin] Buscando próxima chave para provider: ${provider}`);

  // Buscar todas as chaves ativas do usuário, ordenadas por priority
  const { data: keys, error } = await supabaseClient
    .from('user_api_keys')
    .select('id, api_key_encrypted, priority, is_active, last_used_at')
    .eq('user_id', userId)
    .eq('api_provider', provider)
    .eq('is_active', true)
    .order('last_used_at', { ascending: true, nullsFirst: true })
    .order('priority', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ [Round-Robin] Erro ao buscar chaves:', error);
    return null;
  }

  if (!keys || keys.length === 0) {
    console.log(`⚠️ [Round-Robin] Nenhuma chave ativa encontrada para ${provider}`);
    return null;
  }

  console.log(`📊 [Round-Robin] ${keys.length} chaves ativas encontradas`);
  if (keys[0]?.last_used_at) {
    console.log(`🕒 [Round-Robin] Oldest last_used_at: ${keys[0].last_used_at}`);
  } else {
    console.log('🕒 [Round-Robin] Some keys have never been used (NULL last_used_at)');
  }

  // Determinar qual chave usar baseado em last_used_at (NULL primeiro), depois priority e id
  // A chave que foi usada há mais tempo (ou nunca usada) será a próxima
  let selectedKey: ApiKey = keys[0];
  
  // Calcular número de exibição estável com base em (priority ASC, id ASC)
  const staticOrder = [...keys].sort((a: ApiKey, b: ApiKey) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });
  const displayIndex = staticOrder.findIndex(k => k.id === selectedKey.id);
  const keyIndex = Math.max(displayIndex, 0);

  console.log(`✅ [Round-Robin] Selecionada chave ${keyIndex + 1}/${keys.length} (priority: ${selectedKey.priority})`);

  // Atualizar last_used_at da chave selecionada
  const { error: updateError } = await supabaseClient
    .from('user_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', selectedKey.id);

  if (updateError) {
    console.error('⚠️ [Round-Robin] Erro ao atualizar last_used_at:', updateError);
    // Continua mesmo com erro de atualização
  }

  // Descriptografar a chave
  try {
    const { data: decryptedData, error: decryptError } = await supabaseClient.rpc(
      'decrypt_api_key',
      {
        p_encrypted: selectedKey.api_key_encrypted,
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
      keyId: selectedKey.id,
      keyNumber: keyIndex + 1,
      totalKeys: keys.length
    };
  } catch (error) {
    console.error('❌ [Round-Robin] Exceção ao descriptografar:', error);
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
  provider: 'youtube' | 'gemini' | 'claude' | 'openai' | 'kimi',
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
