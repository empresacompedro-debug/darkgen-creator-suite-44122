import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import { Lock, Crown, Sparkles } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, isPremium, isAdmin, loading: subLoading } = useSubscription();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação e assinatura
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin sempre tem acesso total
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar se tem assinatura ativa (Premium ou Active)
  const hasAccess = isPremium || isActive;

  // Bloquear acesso se não tiver assinatura
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-12 text-center space-y-6 bg-gradient-to-br from-background to-muted/20">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
              <div className="relative bg-accent/10 p-6 rounded-full">
                <Lock className="h-16 w-16 text-accent" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Crown className="h-8 w-8 text-accent" />
              Assinatura Necessária
            </h2>
            <p className="text-xl text-muted-foreground">
              Acesso Restrito a Assinantes
            </p>
          </div>

          <div className="space-y-4 py-6">
            <p className="text-lg text-muted-foreground">
              Esta plataforma está disponível apenas para assinantes Premium.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-6 space-y-3">
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
                <span>Acesso completo a todas as ferramentas</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
                <span>Suporte prioritário</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
                <span>Atualizações ilimitadas</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
                <span>Exportação em Excel</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <UpgradeButton />
          </div>

          <p className="text-sm text-muted-foreground">
            Desbloqueie todo o potencial da plataforma por apenas R$ 97/mês
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
