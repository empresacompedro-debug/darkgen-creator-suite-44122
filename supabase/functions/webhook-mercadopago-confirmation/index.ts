import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, zodToValidationErrors, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook payload validation schema
const webhookPayloadSchema = z.object({
  id: z.string().min(1, 'Billing ID is required'),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'], {
    errorMap: () => ({ message: 'Invalid payment status' })
  }),
  metadata: z.record(z.any()).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit (10 requests per minute per IP)
    const { data: rateLimitOk } = await supabase.rpc('check_webhook_rate_limit', {
      p_endpoint: 'webhook-mercadopago',
      p_identifier: clientIp,
      p_max_requests: 10,
      p_window_minutes: 1
    });

    if (!rateLimitOk) {
      console.error(`Rate limit exceeded for IP: ${clientIp}`);
      
      // Log rate limit violation
      await supabase.rpc('log_audit_event', {
        p_user_id: null,
        p_action: 'webhook_rate_limit_exceeded',
        p_resource_type: 'webhook',
        p_resource_id: 'mercadopago-confirmation',
        p_details: { ip: clientIp },
        p_ip_address: clientIp
      });

      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get webhook signature from headers
    const signature = req.headers.get('X-Webhook-Signature') || req.headers.get('x-webhook-signature');
    const rawBody = await req.text();
    
    // Verify webhook signature
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('abacatepay_api_key')
      .single();
    
    if (!settings?.abacatepay_api_key) {
      throw new Error('AbacatePay API key not configured');
    }

    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(settings.abacatepay_api_key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const expectedSignature = Array.from(
      new Uint8Array(
        await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      
      // Log security violation
      await supabase.rpc('log_audit_event', {
        p_user_id: null,
        p_action: 'webhook_signature_failed',
        p_resource_type: 'webhook',
        p_resource_id: 'mercadopago-confirmation',
        p_details: { ip: clientIp, reason: 'invalid_signature' },
        p_ip_address: clientIp
      });

      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate webhook payload
    const payload = JSON.parse(rawBody);
    const validation = webhookPayloadSchema.safeParse(payload);
    
    if (!validation.success) {
      throw new ValidationException(zodToValidationErrors(validation.error));
    }
    
    const { id, status, metadata } = validation.data;
    console.log('AbacatePay Webhook received:', JSON.stringify({ id, status }));

    console.log('Processing billing notification:', id, 'status:', status);

    // Find payment in our database
    const { data: payment, error: paymentError } = await supabase
      .from('pix_payments')
      .select('*')
      .eq('payment_id', id)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment not found in database:', id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found payment in database:', payment.id, 'current status:', payment.status);

    // Map AbacatePay status to our status
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'PAID': 'completed',
      'CANCELLED': 'canceled',
      'REFUNDED': 'refunded',
    };

    const newStatus = statusMap[status] || payment.status;

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from('pix_payments')
      .update({
        status: newStatus,
        paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError);
      throw new Error('Erro ao atualizar pagamento');
    }

    console.log('Payment updated to:', newStatus);

    // If paid, activate subscription
    if (status === 'PAID' && payment.status !== 'completed') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      const { error: updateSubscriptionError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', payment.subscription_id);

      if (updateSubscriptionError) {
        console.error('Error updating subscription:', updateSubscriptionError);
        throw new Error('Erro ao ativar assinatura');
      }

      console.log('Subscription activated successfully');

      // Add premium role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: payment.user_id,
          role: 'premium',
        });

      // Ignore error if role already exists (unique constraint)
      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Error adding role:', roleError);
      } else {
        console.log('Premium role added to user');
      }

      // Log subscription activation
      await supabase.rpc('log_audit_event', {
        p_user_id: payment.user_id,
        p_action: 'subscription_activated',
        p_resource_type: 'subscription',
        p_resource_id: payment.subscription_id,
        p_details: { 
          payment_id: payment.id,
          plan_id: payment.plan_id,
          amount: payment.amount,
          payment_method: 'pix'
        },
        p_ip_address: clientIp
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof ValidationException) {
      console.error('Validation error in webhook:', error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid webhook payload', 
          details: error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.error('Error in webhook-mercadopago-confirmation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
