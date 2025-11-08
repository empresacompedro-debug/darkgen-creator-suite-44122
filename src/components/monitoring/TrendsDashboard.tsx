import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Activity } from "lucide-react";
import type { CompetitorMonitor } from "@/pages/MonitoramentoConcorrentes";

interface TrendsDashboardProps {
  competitors: CompetitorMonitor[];
}

interface Snapshot {
  snapshot_at: string;
  vph: number;
  view_count: number;
  video_id: string;
}

export function TrendsDashboard({ competitors }: TrendsDashboardProps) {
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (competitors.length > 0 && !selectedMonitorId) {
      setSelectedMonitorId(competitors[0].id);
    }
  }, [competitors]);

  useEffect(() => {
    if (selectedMonitorId) {
      loadSnapshots(selectedMonitorId);
    }
  }, [selectedMonitorId]);

  const loadSnapshots = async (monitorId: string) => {
    setLoading(true);
    
    // Buscar snapshots dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('video_snapshots')
      .select('*')
      .eq('monitor_id', monitorId)
      .gte('snapshot_at', thirtyDaysAgo.toISOString())
      .order('snapshot_at', { ascending: true });

    if (!error && data) {
      setSnapshots(data);
    }

    setLoading(false);
  };

  // Agrupar snapshots por vídeo e calcular médias por dia
  const processChartData = () => {
    if (snapshots.length === 0) return [];

    const groupedByDate = snapshots.reduce((acc, snap) => {
      const date = new Date(snap.snapshot_at).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = {
          date,
          totalVph: 0,
          totalViews: 0,
          count: 0,
        };
      }
      acc[date].totalVph += Number(snap.vph);
      acc[date].totalViews += Number(snap.view_count);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate).map((item: any) => ({
      date: item.date,
      vphMedio: Math.round(item.totalVph / item.count),
      viewsMedias: Math.round(item.totalViews / item.count),
    }));
  };

  const chartData = processChartData();

  const selectedCompetitor = competitors.find(c => c.id === selectedMonitorId);

  if (competitors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Concorrente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Dashboard de Tendências</CardTitle>
            </div>
            <Select value={selectedMonitorId} onValueChange={setSelectedMonitorId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um concorrente" />
              </SelectTrigger>
              <SelectContent>
                {competitors.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.channel_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      ) : chartData.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Sem dados históricos ainda. Os snapshots são criados automaticamente quando você atualiza os concorrentes.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Atualize o concorrente algumas vezes ao longo dos dias para ver as tendências.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Gráfico VPH */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 VPH Médio ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="vphMedio" 
                    name="VPH Médio"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico Views */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👁️ Views Médias ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="viewsMedias" 
                    name="Views Médias"
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
