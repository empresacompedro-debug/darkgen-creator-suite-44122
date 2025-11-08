import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, serviceName, cookieValue } = await req.json();

    console.log(`Cookie management - User: ${user.id}, Action: ${action}, Service: ${serviceName}`);

    if (action === 'save') {
      // Encrypt and save cookie
      const { data: encrypted, error: encryptError } = await supabase
        .rpc('encrypt_service_cookie', {
          p_cookie: cookieValue,
          p_user_id: user.id
        });

      if (encryptError) {
        console.error('Encryption error:', encryptError);
        throw new Error('Failed to encrypt cookie');
      }

      // Upsert the encrypted cookie
      const { error: upsertError } = await supabase
        .from('user_service_cookies')
        .upsert({
          user_id: user.id,
          service_name: serviceName,
          encrypted_cookie: encrypted,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,service_name'
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw new Error('Failed to save cookie');
      }

      return new Response(JSON.stringify({ success: true, message: 'Cookie saved securely' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get') {
      // Get and decrypt cookie
      const { data: cookieData, error: fetchError } = await supabase
        .from('user_service_cookies')
        .select('encrypted_cookie')
        .eq('user_id', user.id)
        .eq('service_name', serviceName)
        .maybeSingle();

      if (fetchError || !cookieData) {
        return new Response(JSON.stringify({ cookie: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Decrypt the cookie
      const { data: decrypted, error: decryptError } = await supabase
        .rpc('decrypt_service_cookie', {
          p_encrypted: cookieData.encrypted_cookie,
          p_user_id: user.id
        });

      if (decryptError) {
        console.error('Decryption error:', decryptError);
        throw new Error('Failed to decrypt cookie');
      }

      return new Response(JSON.stringify({ cookie: decrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      // Delete cookie
      const { error: deleteError } = await supabase
        .from('user_service_cookies')
        .delete()
        .eq('user_id', user.id)
        .eq('service_name', serviceName);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error('Failed to delete cookie');
      }

      return new Response(JSON.stringify({ success: true, message: 'Cookie deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-service-cookie:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
