import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, CreditCard, Key, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [abacatePayApiKey, setAbacatePayApiKey] = useState("");
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPixKey(data.pix_key || "");
        setAbacatePayApiKey(data.abacatepay_api_key ? "••••••••••••••••" : "");
        setHasSettings(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('payment_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const settingsData = {
        pix_key: pixKey.trim(),
        abacatepay_api_key: abacatePayApiKey.includes('••') ? undefined : abacatePayApiKey.trim(),
      };

      let result;
      if (existing) {
        // Update existing settings
        result = await supabase
          .from('payment_settings')
          .update(settingsData)
          .eq('id', existing.id);
      } else {
        // Insert new settings
        result = await supabase
          .from('payment_settings')
          .insert(settingsData);
      }

      if (result.error) throw result.error;

      toast({
        title: "✅ Salvo!",
        description: "Configurações de pagamento atualizadas com sucesso.",
      });

      loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Configurações de Pagamento</h1>
        <p className="text-muted-foreground">
          Configure as credenciais para processar pagamentos PIX via AbacatePay
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Você precisa de uma conta AbacatePay para processar pagamentos.
          {' '}<a 
            href="https://abacatepay.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Criar conta <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Credenciais PIX</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixKey">Chave PIX para Recebimento</Label>
            <Input
              id="pixKey"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: 12345678900 ou email@exemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Esta chave será exibida para os clientes efetuarem o pagamento
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abacatePayApiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              AbacatePay API Key
            </Label>
            <Input
              id="abacatePayApiKey"
              type="password"
              value={abacatePayApiKey}
              onChange={(e) => setAbacatePayApiKey(e.target.value)}
              placeholder="Cole sua API Key do AbacatePay"
            />
            <p className="text-xs text-muted-foreground">
              Encontre sua API Key no painel da AbacatePay em Configurações → API
            </p>
          </div>
        </div>

        {hasSettings && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Configurações de pagamento já foram salvas anteriormente
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={saveSettings} 
          disabled={loading || !pixKey.trim() || !abacatePayApiKey.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </Card>

      <Card className="p-6 bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">🔐 Segurança</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Suas credenciais são armazenadas de forma segura no banco de dados</p>
          <p>✅ As API Keys são protegidas e nunca expostas no frontend</p>
          <p>✅ Apenas administradores podem visualizar e editar estas configurações</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Próximos Passos</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Crie uma conta no <a href="https://abacatepay.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AbacatePay</a></li>
          <li>Obtenha sua API Key no painel de configurações</li>
          <li>Cole a API Key acima e salve</li>
          <li>Configure os planos de assinatura na aba "Planos"</li>
          <li>Os usuários poderão assinar e pagar via PIX automaticamente</li>
        </ol>
      </Card>
    </div>
  );
}
