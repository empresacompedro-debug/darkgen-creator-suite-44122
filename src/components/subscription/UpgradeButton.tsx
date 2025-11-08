import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export const UpgradeButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerCpf, setCustomerCpf] = useState("");

  const features = [
    "Todas as ferramentas desbloqueadas",
    "Suporte prioritário",
    "Atualizações ilimitadas",
    "Exportação em Excel",
  ];

  const handleGenerateQRCode = async () => {
    if (!user) {
      toast.error("Faça login para continuar");
      return;
    }

    if (!customerName || !customerPhone || !customerEmail || !customerCpf) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    
    try {
      // Get available plans
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (plansError || !plans) {
        throw new Error('Nenhum plano disponível');
      }

      // Create PIX payment
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { 
          planId: plans.id,
          customerName,
          customerPhone,
          customerEmail,
          customerCpf,
        },
      });

      if (error) throw error;

      if (data.success) {
        setQrCode(data.payment.qrCodeImage);
        setQrCodeText(data.payment.qrCodeText);
        setPaymentId(data.payment.id);
        setShowForm(false);
        
        // Start polling for payment confirmation
        startPolling(data.payment.id);
        
        toast.success("QR Code gerado! Escaneie para pagar");
      } else {
        throw new Error(data.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || "Erro ao gerar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('pix_payments')
        .select('status')
        .eq('id', id)
        .single();

      if (data?.status === 'completed') {
        clearInterval(interval);
        toast.success("Pagamento confirmado! ✅");
        setOpen(false);
        setQrCode(null);
        window.location.reload(); // Reload to update subscription status
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  const copyToClipboard = () => {
    if (qrCodeText) {
      navigator.clipboard.writeText(qrCodeText);
      toast.success("Código PIX copiado!");
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentId) return;

    setCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-pix-payment', {
        body: { paymentId },
      });

      if (error) throw error;

      if (data.isPaid) {
        setPaymentConfirmed(true);
        toast.success("Pagamento confirmado! ✅");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.info("Pagamento ainda não confirmado");
      }
    } catch (error: any) {
      console.error('Error checking payment:', error);
      toast.error("Erro ao verificar pagamento");
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when dialog closes
      setShowForm(true);
      setQrCode(null);
      setQrCodeText(null);
      setPaymentId(null);
      setPaymentConfirmed(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail(user?.email || "");
      setCustomerCpf("");
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-accent to-accent-hover text-white"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Upgrade
      </Button>

      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Premium Mensal</DialogTitle>
            <DialogDescription>
              Desbloqueie todo o potencial da plataforma
            </DialogDescription>
          </DialogHeader>

          {showForm ? (
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">R$ 97,00</div>
                  <div className="text-muted-foreground">por mês</div>
                </div>

                <div className="space-y-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateQRCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Gerando..." : "Criar QR Code PIX"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentConfirmed ? (
                <div className="text-center space-y-4 py-8">
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-2xl font-bold text-green-500">
                    Pagamento Confirmado!
                  </h3>
                  <p className="text-lg">
                    Seja bem-vindo ao DarkGen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecionando...
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                  
                  {qrCode && (
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img
                        src={qrCode}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="w-full"
                  >
                    Copiar código PIX
                  </Button>

                  <Button
                    onClick={handleCheckPayment}
                    disabled={checkingPayment}
                    className="w-full"
                  >
                    {checkingPayment ? "Verificando..." : "Já efetuei o pagamento"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Aguardando pagamento... ⏳
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
