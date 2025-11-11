-- Criar função RPC para rotação atômica de chaves com lock
CREATE OR REPLACE FUNCTION get_and_update_next_key(
  p_user_id UUID,
  p_provider TEXT
) RETURNS TABLE (
  key_id UUID,
  encrypted_key BYTEA,
  priority INT,
  key_number INT,
  total_keys INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_id UUID;
  v_encrypted BYTEA;
  v_priority INT;
  v_total INT;
  v_row_num INT;
BEGIN
  -- Contar total de chaves ativas
  SELECT COUNT(*) INTO v_total
  FROM user_api_keys
  WHERE user_id = p_user_id
    AND api_provider = p_provider
    AND is_active = true;

  IF v_total = 0 THEN
    RETURN; -- Nenhuma chave disponível
  END IF;

  -- Buscar e atualizar atomicamente com lock
  -- FOR UPDATE SKIP LOCKED garante que não haja race condition
  -- Se a chave estiver locked por outra transação, pula para a próxima
  UPDATE user_api_keys
  SET last_used_at = NOW()
  WHERE id = (
    SELECT id FROM user_api_keys
    WHERE user_id = p_user_id
      AND api_provider = p_provider
      AND is_active = true
    ORDER BY 
      last_used_at NULLS FIRST,  -- Chaves nunca usadas primeiro
      priority ASC,               -- Depois por prioridade (1 = mais prioritária)
      id ASC                      -- Desempate por ID
    LIMIT 1
    FOR UPDATE SKIP LOCKED        -- 🔒 Lock atômico, pula se locked
  )
  RETURNING id, api_key_encrypted, priority
  INTO v_key_id, v_encrypted, v_priority;

  IF v_key_id IS NULL THEN
    -- Todas as chaves estão locked, tenta novamente sem SKIP LOCKED
    -- (isso é raro, só acontece em alta concorrência extrema)
    UPDATE user_api_keys
    SET last_used_at = NOW()
    WHERE id = (
      SELECT id FROM user_api_keys
      WHERE user_id = p_user_id
        AND api_provider = p_provider
        AND is_active = true
      ORDER BY last_used_at NULLS FIRST, priority ASC, id ASC
      LIMIT 1
      FOR UPDATE  -- Aguarda o lock sem SKIP
    )
    RETURNING id, api_key_encrypted, priority
    INTO v_key_id, v_encrypted, v_priority;
  END IF;

  IF v_key_id IS NULL THEN
    RETURN; -- Ainda não conseguiu, retorna vazio
  END IF;

  -- Calcular key_number baseado em prioridade/ID (posição estática na fila)
  SELECT row_number INTO v_row_num
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY priority ASC, id ASC) as row_number
    FROM user_api_keys
    WHERE user_id = p_user_id
      AND api_provider = p_provider
      AND is_active = true
  ) sub
  WHERE id = v_key_id;

  RETURN QUERY SELECT v_key_id, v_encrypted, v_priority, v_row_num::INT, v_total::INT;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION get_and_update_next_key IS 
'Função atômica para rotação de API keys com round-robin. 
Usa FOR UPDATE SKIP LOCKED para evitar race conditions em alta concorrência (1000+ req/dia).
Retorna a próxima chave disponível e atualiza last_used_at atomicamente.';