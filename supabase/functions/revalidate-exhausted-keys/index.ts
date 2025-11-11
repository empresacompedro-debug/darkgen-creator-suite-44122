import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [Re-validação] Iniciando re-validação de chaves esgotadas...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar chaves marcadas como esgotadas há mais de 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: exhaustedKeys, error: fetchError } = await supabase
      .from('user_api_keys')
      .select('id, user_id, api_provider, api_key_encrypted, updated_at, quota_status')
      .eq('is_active', false)
      .lt('updated_at', twentyFourHoursAgo);

    if (fetchError) {
      console.error('❌ [Re-validação] Erro ao buscar chaves:', fetchError);
      throw fetchError;
    }

    if (!exhaustedKeys || exhaustedKeys.length === 0) {
      console.log('✅ [Re-validação] Nenhuma chave esgotada encontrada (>24h)');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma chave para re-validar',
          revalidated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 [Re-validação] Encontradas ${exhaustedKeys.length} chave(s) para re-validar`);

    // 2. Re-validar cada chave
    const results = {
      total: exhaustedKeys.length,
      reactivated: 0,
      stillExhausted: 0,
      errors: 0
    };

    for (const key of exhaustedKeys) {
      try {
        console.log(`🔍 [Re-validação] Testando ${key.api_provider} (ID: ${key.id.substring(0, 8)}...)`);

        // Descriptografar a chave
        const { data: decryptedKey, error: decryptError } = await supabase
          .rpc('decrypt_api_key', {
            p_encrypted: key.api_key_encrypted,
            p_user_id: key.user_id
          });

        if (decryptError || !decryptedKey) {
          console.error(`❌ [Re-validação] Erro ao descriptografar chave ${key.id}:`, decryptError);
          results.errors++;
          continue;
        }

        // Validar chave usando test-api-key
        const testResponse = await supabase.functions.invoke('test-api-key', {
          body: { 
            provider: key.api_provider, 
            apiKey: decryptedKey 
          }
        });

        if (testResponse.error) {
          console.error(`❌ [Re-validação] Erro ao testar chave ${key.id}:`, testResponse.error);
          results.errors++;
          continue;
        }

        const validationResult = testResponse.data;

        // 3. Reativar se a chave está válida novamente
        if (validationResult.valid) {
          const { error: updateError } = await supabase
            .from('user_api_keys')
            .update({
              is_active: true,
              quota_status: { 
                revalidated: true, 
                revalidated_at: new Date().toISOString(),
                previous_exhaustion: key.quota_status
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', key.id);

          if (updateError) {
            console.error(`❌ [Re-validação] Erro ao reativar chave ${key.id}:`, updateError);
            results.errors++;
          } else {
            console.log(`✅ [Re-validação] Chave ${key.api_provider} REATIVADA (ID: ${key.id.substring(0, 8)}...)`);
            results.reactivated++;
          }
        } else {
          console.log(`⚠️ [Re-validação] Chave ${key.api_provider} ainda esgotada/inválida (ID: ${key.id.substring(0, 8)}...)`);
          results.stillExhausted++;
          
          // Atualizar quota_status com último check
          await supabase
            .from('user_api_keys')
            .update({
              quota_status: {
                ...key.quota_status,
                last_revalidation_attempt: new Date().toISOString(),
                last_validation_message: validationResult.message
              }
            })
            .eq('id', key.id);
        }

      } catch (error: any) {
        console.error(`❌ [Re-validação] Exceção ao processar chave ${key.id}:`, error);
        results.errors++;
      }
    }

    console.log('✅ [Re-validação] Processo concluído:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Re-validação concluída: ${results.reactivated} reativada(s)`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [Re-validação] Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
