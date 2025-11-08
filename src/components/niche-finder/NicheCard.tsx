import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

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

interface NicheCardProps {
  niche: NicheAnalysis;
  onExpand: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function NicheCard({ niche, onExpand }: NicheCardProps) {
  const opportunityLevel = 
    niche.metrics.opportunityScore > 70 ? '🟢 ALTA' :
    niche.metrics.opportunityScore > 40 ? '🟡 MÉDIA' : '🔴 BAIXA';
  
  const opportunityVariant = 
    niche.metrics.opportunityScore > 70 ? 'default' :
    niche.metrics.opportunityScore > 40 ? 'secondary' : 'destructive';

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]" 
      onClick={onExpand}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold">{niche.name}</h3>
            {niche.metrics.trendScore > 20 && (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {niche.metrics.trendScore < -20 && (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{niche.description}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Vídeos</p>
              <p className="text-2xl font-bold text-primary">{niche.videoIds.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Views Totais</p>
              <p className="text-2xl font-bold text-primary">{formatNumber(niche.metrics.totalViews)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Canais</p>
              <p className="text-2xl font-bold text-primary">{niche.metrics.uniqueChannels}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant={opportunityVariant}>
              Score de Oportunidade: {niche.metrics.opportunityScore}/100
            </Badge>
            <Badge variant="outline">
              {opportunityLevel}
            </Badge>
            <Badge variant="outline">
              VPH Médio: {formatNumber(niche.metrics.avgVPH)}
            </Badge>
          </div>
          
          {/* Barra de Saturação */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saturação do Nicho</span>
              <span className="font-semibold">{niche.metrics.saturationScore}%</span>
            </div>
            <Progress value={niche.metrics.saturationScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {niche.metrics.saturationScore < 30 ? '🟢 Oceano Azul - Baixa competição' : 
               niche.metrics.saturationScore < 60 ? '🟡 Competição Moderada' : 
               '🔴 Oceano Vermelho - Alta competição'}
            </p>
          </div>

          {/* Keywords */}
          <div className="flex gap-1 flex-wrap">
            {niche.keywords.map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="text-right ml-4">
          <Badge variant={niche.metrics.trendScore > 0 ? 'default' : 'secondary'}>
            {niche.metrics.trendScore > 0 ? '📈 +' : '📉 '}
            {Math.abs(niche.metrics.trendScore)}%
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {niche.specificity === 'micro-niche' ? '🎯 Micro-Nicho' :
             niche.specificity === 'sub-niche' ? '📦 Sub-Nicho' : '🌍 Nicho Amplo'}
          </p>
        </div>
      </div>
    </Card>
  );
}
