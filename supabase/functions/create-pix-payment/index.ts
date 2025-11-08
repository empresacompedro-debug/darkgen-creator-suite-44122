import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, zodToValidationErrors, ValidationException } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const createPaymentSchema = z.object({
  planId: z.string().uuid({ message: 'Invalid plan ID format' }).min(1),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  customerPhone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').max(20),
  customerEmail: z.string().trim().email('Invalid email address').max(255),
  customerCpf: z.string().trim().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    // Validate request body
    const body = await req.json();
    const validation = createPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      throw new ValidationException(zodToValidationErrors(validation.error));
    }
    
    const { planId, customerName, customerPhone, customerEmail, customerCpf } = validation.data;

    console.log('Creating AbacatePay PIX payment for user:', user.id, 'plan:', planId);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error('Plano não encontrado');
    }

    // Get payment settings (AbacatePay credentials)
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      throw new Error('Configurações de pagamento não encontradas. Configure no painel admin.');
    }

    if (!settings.abacatepay_api_key) {
      throw new Error('AbacatePay API Key não configurada');
    }

    console.log('Creating PIX QR Code via AbacatePay API...');

    // Create PIX QR Code using AbacatePay API
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.abacatepay_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(plan.price) * 100), // AbacatePay usa centavos
        expiresIn: 1800, // 30 minutos em segundos
        description: `${plan.name} - DarkGen`,
        customer: {
          name: customerName,
          cellphone: customerPhone,
          email: customerEmail,
          taxId: customerCpf,
        },
        metadata: {
          externalId: `${user.id}-${planId}-${Date.now()}`,
        },
      }),
    });

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay error:', errorText);
      throw new Error('Erro ao gerar QR Code PIX na AbacatePay');
    }

    const abacatePayData = await abacatePayResponse.json();
    console.log('AbacatePay PIX QR Code created:', abacatePayData.data?.id);

    if (!abacatePayData.data || abacatePayData.error) {
      console.error('Invalid AbacatePay response:', abacatePayData);
      throw new Error(abacatePayData.error || 'Erro ao gerar dados do PIX');
    }

    const pixData = abacatePayData.data;

    // Create pending subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      throw new Error('Erro ao criar assinatura');
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('pix_payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        plan_id: planId,
        amount: plan.price,
        status: 'pending',
        payment_id: pixData.id,
        abacatepay_id: pixData.id, // Add AbacatePay ID for later verification
        qr_code_image: pixData.brCodeBase64,
        qr_code_text: pixData.brCode,
        payment_method: 'pix',
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_cpf: customerCpf,
        expires_at: pixData.expiresAt,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment error:', paymentError);
      throw new Error('Erro ao registrar pagamento');
    }

    console.log('Payment created successfully:', paymentRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: paymentRecord.id,
          qrCodeImage: pixData.brCodeBase64,
          qrCodeText: pixData.brCode,
          amount: plan.price,
          expiresAt: pixData.expiresAt,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof ValidationException) {
      console.error('Validation error in create-pix-payment:', error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.error('Error in create-pix-payment:', error);
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
