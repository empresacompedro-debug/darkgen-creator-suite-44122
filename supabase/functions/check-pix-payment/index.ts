import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, zodToValidationErrors, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const checkPaymentSchema = z.object({
  paymentId: z.string().uuid({ message: 'Invalid payment ID format' }).min(1)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = checkPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      throw new ValidationException(zodToValidationErrors(validation.error));
    }
    
    const { paymentId } = validation.data;

    // Get payment from database to retrieve AbacatePay ID
    const { data: payment, error: paymentError } = await supabase
      .from('pix_payments')
      .select('abacatepay_id, subscription_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment?.abacatepay_id) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking payment status for AbacatePay ID:', payment.abacatepay_id);

    // Get payment settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('abacatepay_api_key')
      .single();

    if (settingsError || !settings?.abacatepay_api_key) {
      return new Response(
        JSON.stringify({ error: 'Payment settings not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payment status with AbacatePay using their ID
    const abacatePayResponse = await fetch(
      `https://api.abacatepay.com/v1/pixQrCode/check?id=${payment.abacatepay_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.abacatepay_api_key}`,
        },
      }
    );

    const abacatePayData = await abacatePayResponse.json();
    console.log('AbacatePay check response:', abacatePayData);

    if (!abacatePayResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to check payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const status = abacatePayData.data?.status;

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('pix_payments')
      .update({ status: status === 'PAID' ? 'completed' : 'pending' })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // If payment is completed, activate subscription
    if (status === 'PAID') {
      console.log('Payment confirmed! Activating subscription...');
      
      // Update subscription status
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', user.id)
        .eq('id', payment.subscription_id);

      if (subError) {
        console.error('Error updating subscription:', subError);
      } else {
        console.log('Subscription activated successfully');
      }

      // Add premium role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'premium',
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error('Error adding premium role:', roleError);
      } else {
        console.log('Premium role added successfully');
      }
    }

    return new Response(
      JSON.stringify({
        status,
        isPaid: status === 'PAID',
        expiresAt: abacatePayData.data?.expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    if (error instanceof ValidationException) {
      console.error('Validation error in check-pix-payment:', error.errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.error('Error in check-pix-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
