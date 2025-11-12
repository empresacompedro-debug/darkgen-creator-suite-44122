import { ReactNode, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { UpgradeButton } from "./UpgradeButton";
import { Lock, Crown, Sparkles } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
  toolName: string;
}

export const SubscriptionGuard = ({ children, toolName }: SubscriptionGuardProps) => {
  const { isActive, isPremium, isAdmin, loading } = useSubscription();

  // Admin and Premium users always have access
  const hasAccess = isAdmin || isPremium || isActive;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

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
              Conteúdo Premium
            </h2>
            <p className="text-xl text-muted-foreground">
              {toolName}
            </p>
          </div>

          <div className="space-y-4 py-6">
            <p className="text-lg text-muted-foreground">
              Esta ferramenta está disponível apenas para assinantes Premium.
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
