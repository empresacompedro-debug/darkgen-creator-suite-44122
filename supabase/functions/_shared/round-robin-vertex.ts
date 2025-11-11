/**
 * Sistema de rotação Round-Robin EXCLUSIVO para Vertex AI (Gemini pago)
 * 100% ISOLADO de Gemini gratuito
 */

interface VertexKeyData {
  key: string;
  keyId: string;
  keyNumber: number;
  totalKeys: number;
  vertexConfig: any;
}

export async function getNextVertexKeyRoundRobin(
  userId: string | undefined,
  supabaseClient: any
): Promise<VertexKeyData | null> {
  console.log(`🔄 [Vertex Round-Robin] Buscando próxima chave Vertex para userId: ${userId}`);
  
  if (!userId) {
    console.log('⚠️ [Vertex Round-Robin] userId é null/undefined');
    return null;
  }

  try {
    const { data: keyData, error } = await supabaseClient
      .rpc('get_and_update_next_vertex_key', { p_user_id: userId })
      .single();

    if (error || !keyData) {
      console.log(`⚠️ [Vertex Round-Robin] Nenhuma chave Vertex ativa para ${userId}:`, error);
      return null;
    }

    console.log(`📊 [Vertex Round-Robin] Chave selecionada: ${keyData.key_number}/${keyData.total_keys}`);

    // Descriptografar
    const { data: decryptedData, error: decryptError } = await supabaseClient.rpc(
      'decrypt_api_key',
      { p_encrypted: keyData.encrypted_key, p_user_id: userId }
    );

    if (decryptError || !decryptedData) {
      console.error('❌ [Vertex Round-Robin] Erro ao descriptografar:', decryptError);
      return null;
    }

    return {
      key: decryptedData,
      keyId: keyData.key_id,
      keyNumber: keyData.key_number,
      totalKeys: keyData.total_keys,
      vertexConfig: keyData.vertex_config
    };
  } catch (error) {
    console.error('❌ [Vertex Round-Robin] Exceção:', error);
    return null;
  }
}

export async function markVertexKeyExhaustedAndGetNext(
  userId: string | undefined,
  keyId: string,
  supabaseClient: any
): Promise<VertexKeyData | null> {
  console.log(`⚠️ [Vertex Round-Robin] Marcando chave Vertex ${keyId} como esgotada`);

  if (!userId) {
    return null;
  }

  await supabaseClient
    .from('user_vertex_ai_keys')
    .update({
      is_active: false,
      quota_status: { exhausted: true, exhausted_at: new Date().toISOString() }
    })
    .eq('id', keyId);

  return await getNextVertexKeyRoundRobin(userId, supabaseClient);
}
