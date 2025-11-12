-- Corrigir função get_and_update_next_key com aliases corretos para resolver ambiguidade
CREATE OR REPLACE FUNCTION public.get_and_update_next_key(p_user_id uuid, p_provider text)
RETURNS TABLE(key_id uuid, encrypted_key bytea, priority integer, key_number integer, total_keys integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_key_id UUID;
  v_encrypted BYTEA;
  v_priority INT;
  v_total INT;
  v_row_num INT;
BEGIN
  -- Contar total de chaves ativas
  SELECT COUNT(*) INTO v_total
  FROM user_api_keys u
  WHERE u.user_id = p_user_id
    AND u.api_provider = p_provider
    AND u.is_active = true;

  IF v_total = 0 THEN
    RETURN;
  END IF;

  -- Buscar e atualizar atomicamente com lock (primeira tentativa com SKIP LOCKED)
  UPDATE user_api_keys u
  SET last_used_at = NOW()
  WHERE u.id = (
    SELECT u2.id
    FROM user_api_keys u2
    WHERE u2.user_id = p_user_id
      AND u2.api_provider = p_provider
      AND u2.is_active = true
    ORDER BY
      u2.last_used_at NULLS FIRST,
      u2.priority ASC,
      u2.id ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING u.id, u.api_key_encrypted, u.priority
  INTO v_key_id, v_encrypted, v_priority;

  -- Se locked, tentar novamente sem SKIP
  IF v_key_id IS NULL THEN
    UPDATE user_api_keys u
    SET last_used_at = NOW()
    WHERE u.id = (
      SELECT u3.id
      FROM user_api_keys u3
      WHERE u3.user_id = p_user_id
        AND u3.api_provider = p_provider
        AND u3.is_active = true
      ORDER BY
        u3.last_used_at NULLS FIRST,
        u3.priority ASC,
        u3.id ASC
      LIMIT 1
      FOR UPDATE
    )
    RETURNING u.id, u.api_key_encrypted, u.priority
    INTO v_key_id, v_encrypted, v_priority;
  END IF;

  IF v_key_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular key_number com alias
  SELECT row_number INTO v_row_num
  FROM (
    SELECT u4.id, ROW_NUMBER() OVER (ORDER BY u4.priority ASC, u4.id ASC) AS row_number
    FROM user_api_keys u4
    WHERE u4.user_id = p_user_id
      AND u4.api_provider = p_provider
      AND u4.is_active = true
  ) sub
  WHERE sub.id = v_key_id;

  RETURN QUERY SELECT v_key_id, v_encrypted, v_priority, v_row_num::INT, v_total::INT;
END;
$function$;

-- Corrigir função get_and_update_next_vertex_key com aliases corretos
CREATE OR REPLACE FUNCTION public.get_and_update_next_vertex_key(p_user_id uuid)
RETURNS TABLE(key_id uuid, encrypted_key bytea, vertex_config jsonb, priority integer, key_number integer, total_keys integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_key_id UUID;
  v_encrypted BYTEA;
  v_config JSONB;
  v_priority INT;
  v_total INT;
  v_row_num INT;
BEGIN
  -- Contar total de chaves Vertex ativas
  SELECT COUNT(*) INTO v_total
  FROM user_vertex_ai_keys v
  WHERE v.user_id = p_user_id AND v.is_active = true;

  IF v_total = 0 THEN
    RETURN;
  END IF;

  -- Buscar e atualizar atomicamente (FOR UPDATE SKIP LOCKED)
  UPDATE user_vertex_ai_keys v
  SET last_used_at = NOW()
  WHERE v.id = (
    SELECT v2.id
    FROM user_vertex_ai_keys v2
    WHERE v2.user_id = p_user_id AND v2.is_active = true
    ORDER BY 
      v2.last_used_at NULLS FIRST,
      v2.priority ASC,
      v2.id ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING v.id, v.api_key_encrypted, v.vertex_config, v.priority
  INTO v_key_id, v_encrypted, v_config, v_priority;

  IF v_key_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular key_number com alias
  SELECT row_number INTO v_row_num
  FROM (
    SELECT v3.id, ROW_NUMBER() OVER (ORDER BY v3.priority ASC, v3.id ASC) AS row_number
    FROM user_vertex_ai_keys v3
    WHERE v3.user_id = p_user_id AND v3.is_active = true
  ) sub
  WHERE sub.id = v_key_id;

  RETURN QUERY SELECT v_key_id, v_encrypted, v_config, v_priority, v_row_num::INT, v_total::INT;
END;
$function$;