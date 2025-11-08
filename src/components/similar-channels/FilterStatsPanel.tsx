import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Calendar, Globe, Video } from "lucide-react";

interface FilterStats {
  totalFound: number;
  rejectedByCountry: number;
  rejectedByDateOrSubs: number;
  rejectedByMinSubscribers: number;
  rejectedByVideoDuration: number;
  rejectedByFormat: number;
  similarityErrors: number;
  finalCount: number;
}

interface FilterStatsPanelProps {
  stats: FilterStats | null;
  loading: boolean;
}

export function FilterStatsPanel({ stats, loading }: FilterStatsPanelProps) {
  if (!stats && !loading) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 animate-pulse" />
            Analisando canais...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aplicando filtros em tempo real...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const totalRejected = stats.rejectedByCountry + stats.rejectedByDateOrSubs + 
                        stats.rejectedByMinSubscribers + stats.rejectedByVideoDuration + 
                        stats.rejectedByFormat + stats.similarityErrors;

  const filterItems = [
    { label: "País", count: stats.rejectedByCountry, icon: Globe, color: "bg-blue-500" },
    { label: "Data/Inscritos", count: stats.rejectedByDateOrSubs, icon: Calendar, color: "bg-purple-500" },
    { label: "Monetização", count: stats.rejectedByMinSubscribers, icon: TrendingUp, color: "bg-green-500" },
    { label: "Duração", count: stats.rejectedByVideoDuration, icon: Video, color: "bg-orange-500" },
    { label: "Formato", count: stats.rejectedByFormat, icon: Filter, color: "bg-red-500" },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Estatísticas de Filtragem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-foreground">{stats.totalFound}</p>
            <p className="text-xs text-muted-foreground">Total Encontrados</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{totalRejected}</p>
            <p className="text-xs text-muted-foreground">Total Filtrados</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <p className="text-2xl font-bold text-primary">{stats.finalCount}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/10">
            <p className="text-2xl font-bold text-accent-foreground">
              {stats.totalFound > 0 ? Math.round((stats.finalCount / stats.totalFound) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa Aprovação</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Canais Filtrados por Critério:</p>
          {filterItems.map((item) => (
            item.count > 0 && (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
