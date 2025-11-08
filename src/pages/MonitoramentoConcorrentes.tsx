import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, RefreshCw, Trash2, Eye, TrendingUp, Calendar, Flame, Users, Clock, Download, Heart, MessageCircle, BookOpen, GitCompare, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/monitoring/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { exportToExcel } from "@/lib/exportToExcel";
import { useAuth } from "@/contexts/AuthContext";
import { AdvancedFilters, type FilterState } from "@/components/monitoring/AdvancedFilters";
import { FilterPresets } from "@/components/monitoring/FilterPresets";
import { calculateMetrics, getChannelSize, getVideoStatus, getViralityLevel, type VideoWithMetrics } from "@/lib/videoMetrics";
import { useCompetitorNiches } from "@/hooks/useCompetitorNiches";
import { NicheSidebar } from "@/components/monitoring/NicheSidebar";
import { CreateNicheDialog } from "@/components/monitoring/CreateNicheDialog";
import { BulkAssignDialog } from "@/components/monitoring/BulkAssignDialog";
import { VideoComparison } from "@/components/monitoring/VideoComparison";
import { AlertsPanel } from "@/components/monitoring/AlertsPanel";
import { TrendsDashboard } from "@/components/monitoring/TrendsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export interface CompetitorMonitor {
  id: string;
  channel_id: string;
  channel_title: string;
  channel_url: string;
  channel_thumbnail: string;
  subscriber_count: number;
  video_count: number;
  created_at: string;
  last_updated_at: string;
  niche_id?: string | null;
}

interface MonitoredVideo {
  id: string;
  monitor_id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  vph: number;
  days_since_upload: number;
  is_explosive: boolean;
  explosive_reason?: string | null;
  competitor_monitors?: {
    channel_title: string;
    channel_thumbnail: string;
    subscriber_count: number;
  };
}

export default function MonitoramentoConcorrentes() {
  const [channelUrl, setChannelUrl] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorMonitor[]>([]);
  const [videos, setVideos] = useState<MonitoredVideo[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Nichos
  const { 
    niches, 
    loading: nichesLoading, 
    createNiche,
    deleteNiche,
    moveCompetitorToNiche, 
    bulkAssignNiche 
  } = useCompetitorNiches();
  
  const [selectedNicheId, setSelectedNicheId] = useState<string | null>(null);
  const [showCreateNicheDialog, setShowCreateNicheDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showManual, setShowManual] = useState(false);
  
  // Comparação de vídeos
  const [selectedVideosForComparison, setSelectedVideosForComparison] = useState<Set<string>>(new Set());

  // Estado de filtros avançados
  const [filters, setFilters] = useState<FilterState>({
    vph: { min: 0, max: 1000000 },
    views: { min: 0, max: 1000000000 },
    days: { min: 0, max: 365 },
    subscribers: { min: 0, max: 100000000 },
    likes: { min: 0, max: 10000000 },
    comments: { min: 0, max: 1000000 },
    channelSizes: [],
    videoStatus: [],
    viralityLevel: [],
    sortBy: "explosive",
  });

  useEffect(() => {
    loadCompetitors();
    loadAllVideos();
  }, []);

  const loadCompetitors = async () => {
    const { data } = await supabase
      .from('competitor_monitors')
      .select('*')
      .order('created_at', { ascending: false });
    setCompetitors(data || []);
  };

  const loadAllVideos = async () => {
    const { data, error } = await supabase
      .from('monitored_videos')
      .select(`
        *,
        competitor_monitors (
          channel_title,
          channel_thumbnail,
          subscriber_count
        )
      `)
      .eq('is_explosive', true)
      .not('competitor_monitors', 'is', null)
      .order('published_at', { ascending: false });
    
    if (error) console.error('Erro ao carregar vídeos:', error);
    setVideos(data || []);
  };

  const handleAddCompetitor = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do canal",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-competitor', {
        body: { 
          channelUrl,
          nicheId: selectedNicheId ? selectedNicheId : null
        }
      });

      if (error) throw error;

      setCompetitors([data.channel, ...competitors]);
      setVideos([...data.explosiveVideos, ...videos]);

      toast({
        title: "✅ Concorrente Adicionado",
        description: `${data.explosiveVideos.length} vídeos explosivos encontrados`,
      });

      setChannelUrl("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar concorrente",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRefreshCompetitor = async (monitorId: string, channelTitle: string) => {
    setRefreshingId(monitorId);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-competitor', {
        body: { monitorId }
      });

      if (error) throw error;

      await loadAllVideos();
      
      // Criar snapshots para gráficos de tendência
      try {
        await supabase.functions.invoke('create-video-snapshots', {
          body: { monitorId }
        });
      } catch (snapshotError) {
        console.error('Erro ao criar snapshots:', snapshotError);
      }

      if (data.newVideosCount > 0) {
        toast({
          title: "🔥 Novos Vídeos Explosivos!",
          description: `${data.newVideosCount} novos vídeos de ${channelTitle}`,
        });
      } else {
        toast({
          title: "Atualizado",
          description: "Nenhum vídeo novo explosivo encontrado",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar",
        variant: "destructive",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    let totalNew = 0;

    for (const comp of competitors) {
      try {
        const { data } = await supabase.functions.invoke('monitor-competitor', {
          body: { monitorId: comp.id }
        });
        if (data) totalNew += data.newVideosCount;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Erro ao atualizar ${comp.channel_title}:`, error);
      }
    }

    await loadAllVideos();

    toast({
      title: "✅ Todos Atualizados",
      description: `${totalNew} novos vídeos explosivos encontrados`,
    });

    setIsRefreshingAll(false);
  };

  const handleDeleteCompetitor = async (monitorId: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitors')
        .delete()
        .eq('id', monitorId);

      if (error) throw error;

      setCompetitors(competitors.filter(c => c.id !== monitorId));
      setVideos(videos.filter(v => v.monitor_id !== monitorId));

      toast({
        title: "Concorrente Removido",
        description: "Canal removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover",
        variant: "destructive",
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Filtrar por nicho selecionado
  const filteredCompetitors = selectedNicheId === null
    ? competitors
    : competitors.filter(c => c.niche_id === selectedNicheId);

  const filteredCompetitorIds = new Set(filteredCompetitors.map(c => c.id));
  const videosByNiche = selectedNicheId === null
    ? videos
    : videos.filter(v => filteredCompetitorIds.has(v.monitor_id));

  // Calcular métricas derivadas para vídeos filtrados por nicho
  const videosWithMetrics: VideoWithMetrics[] = videosByNiche.map(calculateMetrics);

  // Aplicar filtros avançados
  const filteredVideos = videosWithMetrics.filter(video => {
    const subscriberCount = video.competitor_monitors?.subscriber_count || 0;
    
    // Filtros numéricos
    if (video.vph < filters.vph.min || video.vph > filters.vph.max) return false;
    if (video.view_count < filters.views.min || video.view_count > filters.views.max) return false;
    if (video.days_since_upload < filters.days.min || video.days_since_upload > filters.days.max) return false;
    if (subscriberCount < filters.subscribers.min || subscriberCount > filters.subscribers.max) return false;
    if ((video.like_count || 0) < filters.likes.min || (video.like_count || 0) > filters.likes.max) return false;
    if ((video.comment_count || 0) < filters.comments.min || (video.comment_count || 0) > filters.comments.max) return false;

    // Filtros categóricos
    if (filters.channelSizes.length > 0) {
      const channelSize = getChannelSize(subscriberCount);
      if (!filters.channelSizes.includes(channelSize)) return false;
    }

    if (filters.videoStatus.length > 0) {
      const videoStatus = getVideoStatus(video.days_since_upload);
      if (!filters.videoStatus.includes(videoStatus)) return false;
    }

    if (filters.viralityLevel.length > 0) {
      const viralityLevel = getViralityLevel(video.vph);
      if (!filters.viralityLevel.includes(viralityLevel)) return false;
    }

    return true;
  });

  // Ordenação multi-critério
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const aSubCount = a.competitor_monitors?.subscriber_count || 0;
    const bSubCount = b.competitor_monitors?.subscriber_count || 0;

    switch (filters.sortBy) {
      case "explosive":
        if (b.vph !== a.vph) return b.vph - a.vph;
        return a.days_since_upload - b.days_since_upload;
      case "emerging":
        if (aSubCount !== bSubCount) return aSubCount - bSubCount;
        return b.vph - a.vph;
      case "reach":
        return b.view_count - a.view_count;
      case "engagement":
        return b.engagementRate - a.engagementRate;
      case "recent":
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      case "ratio":
        return b.viewsPerSubscriber - a.viewsPerSubscriber;
      case "score":
        return b.explosiveScore - a.explosiveScore;
      default:
        return 0;
    }
  });

  const totalExplosiveVideos = videos.length;
  const avgVPH = videos.length > 0 
    ? Math.round(videos.reduce((acc, v) => acc + v.vph, 0) / videos.length) 
    : 0;

  // Handlers de filtros
  const handleApplyPreset = (presetFilters: Partial<FilterState>) => {
    setFilters({ ...filters, ...presetFilters });
  };

  const handleClearFilters = () => {
    setFilters({
      vph: { min: 0, max: 100000 },
      views: { min: 0, max: 10000000 },
      days: { min: 0, max: 365 },
      subscribers: { min: 0, max: 10000000 },
      likes: { min: 0, max: 100000 },
      comments: { min: 0, max: 10000 },
      channelSizes: [],
      videoStatus: [],
      viralityLevel: [],
      sortBy: "explosive",
    });
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideosForComparison);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      if (newSelection.size >= 6) {
        toast({
          title: "Limite atingido",
          description: "Você pode comparar no máximo 6 vídeos",
          variant: "destructive",
        });
        return;
      }
      newSelection.add(videoId);
    }
    setSelectedVideosForComparison(newSelection);
  };

  const getComparisonVideos = () => {
    return sortedVideos.filter(v => selectedVideosForComparison.has(v.video_id));
  };

  return (
    <SubscriptionGuard toolName="monitoramento-concorrentes">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar de Nichos */}
        <NicheSidebar
          niches={niches}
          selectedNicheId={selectedNicheId}
          onSelectNiche={setSelectedNicheId}
          onCreateNiche={() => setShowCreateNicheDialog(true)}
          onBulkAssign={() => setShowBulkAssignDialog(true)}
          onDeleteNiche={async (nicheId) => {
            await deleteNiche(nicheId);
            if (selectedNicheId === nicheId) {
              setSelectedNicheId(null);
            }
            await loadCompetitors();
          }}
          competitors={competitors}
        />

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold flex items-center gap-2">
                  👁️ Monitoramento de Concorrentes
                </h1>
                <p className="text-muted-foreground">
                  Monitore vídeos explosivos dos seus principais concorrentes em tempo real
                  {selectedNicheId && niches.find(n => n.id === selectedNicheId) && (
                    <span className="ml-2 text-primary font-semibold">
                      • Nicho: {niches.find(n => n.id === selectedNicheId)?.name}
                    </span>
                  )}
                </p>
              </div>
              <Button onClick={() => setShowManual(true)} variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Manual Completo
              </Button>
            </div>

            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Concorrentes</p>
                      <p className="text-2xl font-bold">{filteredCompetitors.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vídeos Explosivos</p>
                      <p className="text-2xl font-bold">{totalExplosiveVideos}</p>
                    </div>
                    <Flame className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Média VPH</p>
                      <p className="text-2xl font-bold">{formatNumber(avgVPH)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Última Atualização</p>
                      <p className="text-sm font-bold">
                        {competitors.length > 0 
                          ? new Date(competitors[0].last_updated_at).toLocaleString('pt-BR') 
                          : '-'}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Adicionar Concorrente */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Concorrente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Cole a URL do canal concorrente (ex: youtube.com/@NomeCanal)"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddCompetitor} disabled={isAdding}>
                      <Plus className="w-4 h-4 mr-2" />
                      {isAdding ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ou importe múltiplos canais de uma vez:
                    </p>
                    <Input
                      type="file"
                      accept=".txt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsAdding(true);
                        try {
                          const text = await file.text();
                          const urls = text.split('\n').map(url => url.trim()).filter(url => url);
                          
                          let added = 0;
                          let existing = 0;
                          let invalid = 0;

                          for (let i = 0; i < urls.length; i++) {
                            const url = urls[i];
                            
                            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                              invalid++;
                              continue;
                            }

                            try {
                              const { data, error } = await supabase.functions.invoke('monitor-competitor', {
                                body: { channelUrl: url }
                              });

                              if (error) {
                                if (error.message?.includes('já está sendo monitorado')) {
                                  existing++;
                                } else {
                                  invalid++;
                                }
                              } else {
                                added++;
                                setCompetitors(prev => [data.channel, ...prev]);
                                setVideos(prev => [...data.explosiveVideos, ...prev]);
                              }

                              if (i < urls.length - 1) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                              }
                            } catch {
                              invalid++;
                            }
                          }

                          toast({
                            title: "📊 Importação Concluída",
                            description: `✅ ${added} adicionados | ⚠️ ${existing} já existiam | ❌ ${invalid} inválidos`,
                            duration: 8000,
                          });

                          e.target.value = '';
                        } catch (error: any) {
                          toast({
                            title: "Erro na Importação",
                            description: error.message || "Erro ao processar arquivo",
                            variant: "destructive",
                          });
                        } finally {
                          setIsAdding(false);
                        }
                      }}
                      disabled={isAdding}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Arquivo .txt com uma URL por linha
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Concorrentes */}
            {filteredCompetitors.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Concorrentes Monitorados ({filteredCompetitors.length})</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshAll}
                    disabled={isRefreshingAll}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                    {isRefreshingAll ? "Atualizando Todos..." : "Atualizar Todos"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCompetitors.map((comp) => (
                      <Card key={comp.id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <img 
                              src={comp.channel_thumbnail} 
                              alt={comp.channel_title}
                              className="w-16 h-16 rounded-full"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2">{comp.channel_title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatNumber(comp.subscriber_count)} inscritos
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {videos.filter(v => v.monitor_id === comp.id).length} vídeos explosivos 🔥
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleRefreshCompetitor(comp.id, comp.channel_title)}
                              disabled={refreshingId === comp.id}
                            >
                              <RefreshCw className={`w-3 h-3 ${refreshingId === comp.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteCompetitor(comp.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs de Navegação */}
            {videos.length > 0 && (
              <Tabs defaultValue="videos" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="videos">
                    <Flame className="h-4 w-4 mr-2" />
                    Vídeos ({sortedVideos.length})
                  </TabsTrigger>
                  <TabsTrigger value="trends">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Tendências
                  </TabsTrigger>
                  <TabsTrigger value="alerts">
                    <Bell className="h-4 w-4 mr-2" />
                    Alertas
                  </TabsTrigger>
                  <TabsTrigger value="comparison">
                    <GitCompare className="h-4 w-4 mr-2" />
                    Comparação ({selectedVideosForComparison.size})
                  </TabsTrigger>
                </TabsList>

                {/* Aba de Vídeos */}
                <TabsContent value="videos" className="space-y-6">
                  {/* Filtros Rápidos */}
                  <Card>
                    <CardContent className="pt-6">
                      <FilterPresets 
                        onApplyPreset={handleApplyPreset}
                        onClearFilters={handleClearFilters}
                      />
                    </CardContent>
                  </Card>

                  {/* Filtros Avançados */}
                  <AdvancedFilters 
                    filters={filters}
                    onFiltersChange={setFilters}
                  />

                  {/* Estatísticas dos Resultados Filtrados */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">
                            📊 {sortedVideos.length} vídeos encontrados
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Mostrando {sortedVideos.length} de {videos.length} vídeos totais
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            const exportData = sortedVideos.map((video) => ({
                              'Título': video.title,
                              'Canal': video.competitor_monitors?.channel_title || '-',
                              'Inscritos do Canal': video.competitor_monitors?.subscriber_count || 0,
                              'Views': video.view_count,
                              'Likes': video.like_count || 0,
                              'Comentários': video.comment_count || 0,
                              'VPH': video.vph,
                              'Dias desde Upload': video.days_since_upload,
                              'Taxa de Engajamento (%)': video.engagementRate,
                              'Views/Inscritos': video.viewsPerSubscriber,
                              'Velocidade de Crescimento': video.growthVelocity,
                              'Score de Explosividade': video.explosiveScore,
                              'Data de Publicação': new Date(video.published_at).toLocaleString('pt-BR'),
                              'URL': `https://youtube.com/watch?v=${video.video_id}`
                            }));
                            exportToExcel(exportData, `monitoramento-concorrentes-${new Date().toISOString().split('T')[0]}`, 'Vídeos Explosivos');
                            toast({ title: "✅ Exportado!", description: "Planilha gerada com sucesso" });
                          }}
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Grid de Vídeos Explosivos */}
                  {sortedVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedVideos.map((video) => {
                        const subscriberCount = video.competitor_monitors?.subscriber_count || 0;
                        const isNewChannel = subscriberCount < 10000;
                        const superPerformance = video.viewsPerSubscriber > 3.0;
                        const highEngagement = video.engagementRate > 5;
                        const justBorn = video.days_since_upload <= 3 && video.vph > 2000;

                        return (
                          <Card key={video.id} className="relative overflow-hidden border-2 border-red-500/20 hover:border-red-500/40 transition-all">
                            {/* Checkbox para comparação */}
                            <div className="absolute top-3 left-3 z-10">
                              <Checkbox
                                checked={selectedVideosForComparison.has(video.video_id)}
                                onCheckedChange={() => toggleVideoSelection(video.video_id)}
                                className="bg-background"
                              />
                            </div>

                            {/* Score de Explosividade */}
                            <div className="absolute top-3 left-12 z-10">
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold">
                                ⭐ {video.explosiveScore}
                              </Badge>
                            </div>

                            {/* Badge EXPLOSIVO com Motivo */}
                            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold animate-pulse">
                                🔥 {formatNumber(video.vph)} VPH
                              </Badge>
                              {video.explosive_reason && (
                                <Badge variant="secondary" className="text-[10px] bg-black/70 text-white">
                                  {video.explosive_reason}
                                </Badge>
                              )}
                            </div>

                            {/* Thumbnail */}
                            <div className="relative group">
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                              />
                            </div>

                            <CardContent className="p-4 space-y-3">
                              {/* Título */}
                              <h3 className="font-semibold line-clamp-2 text-sm">
                                {video.title}
                              </h3>

                              {/* Canal */}
                              {video.competitor_monitors && (
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={video.competitor_monitors.channel_thumbnail} 
                                    alt=""
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-muted-foreground line-clamp-1 block">
                                      {video.competitor_monitors.channel_title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatNumber(subscriberCount)} inscritos
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Estatísticas Principais */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{video.days_since_upload}d atrás</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{formatNumber(video.view_count)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{formatNumber(video.like_count || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{formatNumber(video.comment_count || 0)}</span>
                                </div>
                              </div>

                              {/* Métricas Derivadas */}
                              <div className="pt-2 border-t space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Taxa de Engajamento:</span>
                                  <span className="font-semibold">{video.engagementRate.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Views/Inscritos:</span>
                                  <span className="font-semibold">{video.viewsPerSubscriber.toFixed(2)}x</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Velocidade de Crescimento:</span>
                                  <span className="font-semibold">{formatNumber(video.growthVelocity)}/dia</span>
                                </div>
                              </div>

                              {/* Badges Dinâmicos */}
                              <div className="flex gap-1 flex-wrap">
                                {isNewChannel && (
                                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                    🎯 CANAL NOVO
                                  </Badge>
                                )}
                                {superPerformance && (
                                  <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                                    💎 SUPER PERFORMANCE
                                  </Badge>
                                )}
                                {highEngagement && (
                                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                    📈 ENGAJAMENTO ALTO
                                  </Badge>
                                )}
                                {justBorn && (
                                  <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                                    ⚡ NASCENDO AGORA
                                  </Badge>
                                )}
                                {video.vph > 5000 && (
                                  <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                                    🚀 MEGA VIRAL
                                  </Badge>
                                )}
                                {video.view_count > 1000000 && (
                                  <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                    👑 1M+ VIEWS
                                  </Badge>
                                )}
                              </div>

                              {/* Botão */}
                              <Button size="sm" className="w-full" asChild>
                                <a href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer">
                                  Ver Vídeo
                                </a>
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          {competitors.length === 0 
                            ? "Adicione concorrentes para começar a monitorar vídeos explosivos"
                            : "Nenhum vídeo explosivo encontrado com os filtros aplicados"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Aba de Tendências */}
                <TabsContent value="trends">
                  <TrendsDashboard competitors={competitors} />
                </TabsContent>

                {/* Aba de Alertas */}
                <TabsContent value="alerts">
                  <AlertsPanel />
                </TabsContent>

                {/* Aba de Comparação */}
                <TabsContent value="comparison">
                  {selectedVideosForComparison.size > 0 ? (
                    <VideoComparison
                      videos={getComparisonVideos()}
                      onClose={() => {
                        setSelectedVideosForComparison(new Set());
                      }}
                      onRemoveVideo={(videoId) => {
                        const newSelection = new Set(selectedVideosForComparison);
                        newSelection.delete(videoId);
                        setSelectedVideosForComparison(newSelection);
                      }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum vídeo selecionado</h3>
                        <p className="text-muted-foreground">
                          Selecione vídeos na aba "Vídeos" usando as caixas de seleção para compará-los aqui
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <CreateNicheDialog
          open={showCreateNicheDialog}
          onOpenChange={setShowCreateNicheDialog}
          onCreateNiche={async (name, description, color) => {
            await createNiche(name, description, color);
          }}
        />
        <BulkAssignDialog
          open={showBulkAssignDialog}
          onOpenChange={setShowBulkAssignDialog}
          competitors={competitors.filter(c => !c.niche_id)}
          niches={niches}
          onCreateNiche={() => {
            setShowBulkAssignDialog(false);
            setShowCreateNicheDialog(true);
          }}
          onAssign={async (competitorIds, nicheId) => {
            await bulkAssignNiche(competitorIds, nicheId);
            await loadCompetitors();
          }}
        />
        <Dialog open={showManual} onOpenChange={setShowManual}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manual Completo - Monitoramento de Concorrentes</DialogTitle>
            </DialogHeader>
            <UserManual />
          </DialogContent>
        </Dialog>
      </div>
    </SubscriptionGuard>
  );
}
