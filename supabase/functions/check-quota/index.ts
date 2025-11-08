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
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { feature } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    // Create Supabase client to check admin status
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin (admins have unlimited quota)
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminRole) {
      console.log('✅ Admin user detected, granting unlimited quota');
      return new Response(JSON.stringify({
        quotaUsed: 0,
        dailyQuota: 999999,
        lastReset: new Date().toISOString().split('T')[0],
        percentageUsed: 0,
        apiStatus: 'active',
        isAdmin: true,
        message: 'Admin tem quota ilimitada'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Calcular início do dia (meia-noite PST)
    const now = new Date();
    const pstOffset = -8 * 60; // PST = UTC-8
    const pstNow = new Date(now.getTime() + (pstOffset * 60 * 1000));
    const today = pstNow.toISOString().split('T')[0];
    
    // Buscar uso de quota de hoje
    const quotaCheckUrl = `${SUPABASE_URL}/rest/v1/quota_usage?feature=eq.${feature}&timestamp=gte.${today}T00:00:00&select=quota_used`;
    const quotaCheckRes = await fetch(quotaCheckUrl, {
      headers: { 'apikey': SUPABASE_ANON_KEY || '' }
    });
    
    if (!quotaCheckRes.ok) {
      throw new Error('Erro ao verificar quota');
    }
    
    const quotaData = await quotaCheckRes.json();
    const totalUsedToday = quotaData.reduce((sum: number, item: any) => sum + item.quota_used, 0);
    
    // Definir limites por feature
    // Limites informativos apenas (não bloqueiam buscas)
    const limits: Record<string, { dailyQuota: number }> = {
      'similar-channels': { dailyQuota: 10000 },
      'niche-finder': { dailyQuota: 10000 },
    };
    
    const featureLimit = limits[feature] || limits['niche-finder'];
    const percentageUsed = (totalUsedToday / featureLimit.dailyQuota) * 100;
    const apiStatus = totalUsedToday >= featureLimit.dailyQuota ? 'exhausted' : 'active';
    
    console.log(`Quota check - Feature: ${feature}, Used: ${totalUsedToday}, Status: ${apiStatus}, Percentage: ${percentageUsed.toFixed(1)}%`);
    
    return new Response(JSON.stringify({
      quotaUsed: totalUsedToday,
      dailyQuota: featureLimit.dailyQuota,
      lastReset: today,
      percentageUsed: Math.round(percentageUsed * 10) / 10,
      apiStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro em check-quota:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
