import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertTriangle, Sparkles } from "lucide-react";

interface NicheMetrics {
  totalViews: number;
  avgVPH: number;
  uniqueChannels: number;
  avgSubscribers: number;
  channelDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  saturationScore: number;
  trendScore: number;
  opportunityScore: number;
}

interface NicheAnalysis {
  id: string;
  name: string;
  description: string;
  videoIds: string[];
  keywords: string[];
  specificity: 'broad' | 'sub-niche' | 'micro-niche';
  metrics: NicheMetrics;
}

interface NicheDashboardProps {
  niches: NicheAnalysis[];
}

export function NicheDashboard({ niches }: NicheDashboardProps) {
  const goldOpportunities = niches.filter(n => n.metrics.opportunityScore > 70);
  const trendingNiches = niches.filter(n => n.metrics.trendScore > 20);
  const saturatedNiches = niches.filter(n => n.metrics.saturationScore > 60);
  
  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-accent/20 to-primary/10 border-2">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        Dashboard de Oportunidades
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center bg-background/50 backdrop-blur">
          <p className="text-3xl font-bold text-primary">{niches.length}</p>
          <p className="text-sm text-muted-foreground">Nichos Descobertos</p>
        </Card>
        
        <Card className="p-4 text-center bg-green-500/10 backdrop-blur">
          <p className="text-3xl font-bold text-green-600">{goldOpportunities.length}</p>
          <p className="text-sm text-muted-foreground">💎 Oportunidades de Ouro</p>
        </Card>
        
        <Card className="p-4 text-center bg-orange-500/10 backdrop-blur">
          <p className="text-3xl font-bold text-orange-600">{trendingNiches.length}</p>
          <p className="text-sm text-muted-foreground">🔥 Em Alta</p>
        </Card>
        
        <Card className="p-4 text-center bg-red-500/10 backdrop-blur">
          <p className="text-3xl font-bold text-red-600">{saturatedNiches.length}</p>
          <p className="text-sm text-muted-foreground">⚠️ Saturados</p>
        </Card>
      </div>
      
      {/* Top 3 Oportunidades */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          🏆 Top 3 Oportunidades
        </h3>
        <div className="space-y-2">
          {niches
            .sort((a, b) => b.metrics.opportunityScore - a.metrics.opportunityScore)
            .slice(0, 3)
            .map((niche, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
                  <div>
                    <p className="font-semibold">{niche.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {niche.videoIds.length} vídeos • {niche.metrics.uniqueChannels} canais • 
                      Saturação: {niche.metrics.saturationScore}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default">
                    Score: {niche.metrics.opportunityScore}/100
                  </Badge>
                  {niche.metrics.trendScore > 20 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +{niche.metrics.trendScore}%
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Warning for saturated niches */}
      {saturatedNiches.length > 0 && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              {saturatedNiches.length} nicho(s) com alta saturação
            </p>
            <p className="text-amber-800 dark:text-amber-200">
              Estes nichos têm muitos canais grandes competindo. Considere os nichos com menor saturação para melhores resultados.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
