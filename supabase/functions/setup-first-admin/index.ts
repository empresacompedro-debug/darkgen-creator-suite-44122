import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      throw new Error('Unauthorized: No auth token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    console.log('🔐 Request from user:', user.email);

    // Check if user_roles table is empty (first admin setup)
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing roles:', checkError);
      throw new Error('Failed to check existing roles');
    }

    // If there are already roles, prevent creating another admin this way
    if (existingRoles && existingRoles.length > 0) {
      console.log('⚠️ Admin already configured, rejecting request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Admin já configurado. Esta função só pode ser usada uma vez para criar o primeiro admin.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the user is andreanselmolima@gmail.com
    if (user.email !== 'andreanselmolima@gmail.com') {
      console.log('⛔ Unauthorized email:', user.email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Esta função só pode ser usada pelo email autorizado.' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      })
      .select()
      .single();

    if (roleError) {
      console.error('❌ Error inserting admin role:', roleError);
      throw new Error('Failed to insert admin role');
    }

    console.log('✅ Admin role created successfully:', roleData);

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_action: 'first_admin_setup',
      p_resource_type: 'user_roles',
      p_resource_id: roleData.id,
      p_details: { email: user.email }
    });

    console.log('📝 Audit log created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin role criado com sucesso!',
        user_email: user.email,
        role: 'admin'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in setup-first-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
