import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Save, DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Payment Settings
  const [pixKey, setPixKey] = useState("");
  const [abacatePayApiKey, setAbacatePayApiKey] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalPayments: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });

  // Recent data
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadStats();
      loadRecentData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      // Check admin status via edge function (server-side verification)
      const { data, error } = await supabase.functions.invoke('check-admin-status');

      if (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar permissões.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(!!data?.isAdmin);
      
      if (!data?.isAdmin) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão de administrador.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate("/");
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setPixKey(data.pix_key || "");
        setAbacatePayApiKey(data.abacatepay_api_key || "");
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Total payments
      const { count: totalPayments } = await supabase
        .from('pix_payments')
        .select('*', { count: 'exact', head: true });

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Total revenue
      const { data: payments } = await supabase
        .from('pix_payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Pending payments
      const { count: pendingPayments } = await supabase
        .from('pix_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalPayments: totalPayments || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
        pendingPayments: pendingPayments || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentData = async () => {
    try {
      // Recent payments
      const { data: payments } = await supabase
        .from('pix_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentPayments(payments || []);

      // Active subscriptions with user email
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (name, price)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      setActiveSubscriptions(subscriptions || []);
    } catch (error) {
      console.error('Error loading recent data:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!pixKey || !abacatePayApiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a chave PIX e a API Key da AbacatePay",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('payment_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('payment_settings')
          .update({
            pix_key: pixKey,
            abacatepay_api_key: abacatePayApiKey,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('payment_settings')
          .insert({
            pix_key: pixKey,
            abacatepay_api_key: abacatePayApiKey,
          });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações de pagamento foram atualizadas.",
      });
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

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Shield className="h-10 w-10 text-accent" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie pagamentos, assinaturas e configurações
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/pagamentos')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Configurar PIX
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/audit-logs')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Logs de Auditoria
          </Button>
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            Admin
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
              <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Pagamentos</p>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
              <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Configurações PIX</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Configurações de Pagamento PIX</h2>
                <p className="text-muted-foreground">
                  Configure suas credenciais da AbacatePay para aceitar pagamentos
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pixKey">Chave PIX *</Label>
                  <Input
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Sua chave PIX (CPF, CNPJ, email, etc.)"
                  />
                </div>

                <div>
                  <Label htmlFor="abacatePayApiKey">AbacatePay API Key *</Label>
                  <Input
                    id="abacatePayApiKey"
                    type="password"
                    value={abacatePayApiKey}
                    onChange={(e) => setAbacatePayApiKey(e.target.value)}
                    placeholder="abc_..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtenha em{" "}
                    <a
                      href="https://abacatepay.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      AbacatePay Dashboard
                    </a>
                  </p>
                </div>

                <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                  {loading ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⚠️ Importante:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Configure o webhook da AbacatePay para: <code className="bg-background px-2 py-1 rounded text-xs">https://nupqudfjnkxbvawwxefi.supabase.co/functions/v1/webhook-mercadopago-confirmation</code></li>
                  <li>O pagamento será creditado diretamente na sua chave PIX</li>
                  <li>As assinaturas serão ativadas automaticamente após confirmação</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Pagamentos Recentes</h2>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">R$ {Number(payment.amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge
                    variant={payment.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento ainda
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Assinaturas Ativas</h2>
            <div className="space-y-4">
              {activeSubscriptions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sub.subscription_plans?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Expira em: {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {Number(sub.subscription_plans?.price).toFixed(2)}</p>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                </div>
              ))}
              {activeSubscriptions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma assinatura ativa ainda
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}