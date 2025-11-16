import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ExternalLink, Info, History, Trash2, Globe, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface SimilarChannel {
  id: string;
  name: string;
  handle: string;
  url: string;
  thumbnail: string;
  subscribers: string;
  videos_count?: number;
  similarity_score: number;
  category?: string;
  description?: string;
}

interface SearchHistory {
  id: string;
  target_channel_name: string;
  target_channel_url: string;
  target_channel_thumbnail?: string;
  channels_found: SimilarChannel[];
  created_at: string;
  search_method: string;
  quota_used: number;
}

interface ProgressState {
  status: 'running' | 'completed' | 'error' | 'quota_exceeded';
  channels_collected: SimilarChannel[];
  quota_used: number;
  featured_done?: boolean;
  related_done?: boolean;
  keywords_done?: boolean;
  error_message?: string;
}

const Relacionados = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [channelUrl, setChannelUrl] = useState("");
  const [searchMethod, setSearchMethod] = useState<string>("hybrid");
  const [isSearching, setIsSearching] = useState(false);
  const [channels, setChannels] = useState<SimilarChannel[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    // Limpar interval ao desmontar
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("similar_channels_scrapingbee")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setHistory((data || []).map(item => ({
        ...item,
        channels_found: item.channels_found as unknown as SimilarChannel[]
      })));
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const pollProgress = async (progressId: string) => {
    try {
      const { data, error } = await supabase
        .from('similar_channels_progress')
        .select('*')
        .eq('id', progressId)
        .single();

      if (error) {
        console.error('Erro ao buscar progresso:', error);
        return;
      }

      if (data) {
        const progressData: ProgressState = {
          status: data.status as 'running' | 'completed' | 'error' | 'quota_exceeded',
          channels_collected: (data.channels_collected as unknown as SimilarChannel[]) || [],
          quota_used: data.quota_used || 0,
          featured_done: data.featured_done,
          related_done: data.related_done,
          keywords_done: data.keywords_done,
          error_message: data.error_message
        };

        setProgress(progressData);
        setChannels(progressData.channels_collected);

        // Parar polling se busca concluída
        if (progressData.status === 'completed' || progressData.status === 'error' || progressData.status === 'quota_exceeded') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }

          setIsSearching(false);

          if (progressData.status === 'completed') {
            toast({
              title: "✅ Busca concluída!",
              description: `${progressData.channels_collected.length} canais encontrados. Créditos usados: ${progressData.quota_used}`,
            });
          } else if (progressData.status === 'quota_exceeded') {
            toast({
              title: "⚠️ Quota esgotada",
              description: `Busca parcial: ${progressData.channels_collected.length} canais encontrados antes da quota esgotar.`,
              variant: "destructive"
            });
          } else if (progressData.status === 'error') {
            toast({
              title: "❌ Erro na busca",
              description: progressData.error_message || "Erro desconhecido",
              variant: "destructive"
            });
          }

          await loadHistory();
        }
      }
    } catch (error) {
      console.error('Erro no polling:', error);
    }
  };

  const handleSearch = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "⚠️ URL obrigatória",
        description: "Insira a URL de um canal do YouTube",
        variant: "destructive"
      });
      return;
    }

    if (!channelUrl.includes("youtube.com")) {
      toast({
        title: "❌ URL inválida",
        description: "A URL deve ser de um canal do YouTube",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setChannels([]);
    setProgress(null);

    try {
      const { data, error } = await supabase.functions.invoke("find-similar-scrapingbee", {
        body: {
          channelUrl,
          searchMethod
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao buscar canais");
      }

      // Iniciar polling se houver progress_id
      if (data.progress_id) {
        progressIntervalRef.current = window.setInterval(() => {
          pollProgress(data.progress_id);
        }, 2000);

        // Primeira atualização imediata
        pollProgress(data.progress_id);
      } else {
        // Fallback: sem progresso, mostrar resultado direto
        setChannels(data.channels || []);
        setIsSearching(false);
        
        toast({
          title: "✅ Busca concluída!",
          description: `${data.total_found} canais similares encontrados. Créditos usados: ${data.quota_used}`,
        });

        await loadHistory();
      }
    } catch (error: any) {
      console.error("Erro na busca:", error);
      
      setIsSearching(false);
      
      if (error.message.includes("Configure sua chave ScrapingBee")) {
        toast({
          title: "🔑 Chave ScrapingBee necessária",
          description: "Configure sua chave ScrapingBee em Configurações para usar esta ferramenta.",
          variant: "destructive"
        });
      } else if (error.message.includes("inválida")) {
        toast({
          title: "❌ Chave inválida",
          description: "Sua chave ScrapingBee é inválida. Verifique em Configurações.",
          variant: "destructive"
        });
      } else if (error.message.includes("esgotada") || error.message.includes("402")) {
        toast({
          title: "⚠️ Quota esgotada",
          description: "Seus créditos ScrapingBee esgotaram. Recarregue em app.scrapingbee.com",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Erro na busca",
          description: error.message || "Erro desconhecido ao buscar canais",
          variant: "destructive"
        });
      }
    }
  };

  const loadSearchResults = (searchItem: SearchHistory) => {
    setChannels(searchItem.channels_found);
    setChannelUrl(searchItem.target_channel_url);
    setSearchMethod(searchItem.search_method);
    
    toast({
      title: "📜 Histórico carregado",
      description: `${searchItem.channels_found.length} canais do histórico`,
    });
  };

  const deleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("similar_channels_scrapingbee")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "🗑️ Excluído",
        description: "Histórico removido com sucesso"
      });

      loadHistory();
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível excluir",
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    
    let completed = 0;
    const total = searchMethod === 'hybrid' ? 3 : 1;
    
    if (progress.featured_done) completed++;
    if (progress.related_done) completed++;
    if (progress.keywords_done) completed++;
    
    return (completed / total) * 100;
  };

  const getProgressLabel = () => {
    if (!progress) return '';
    
    const steps = [];
    if (progress.featured_done) steps.push('Featured');
    if (progress.related_done) steps.push('Related');
    if (progress.keywords_done) steps.push('Keywords');
    
    return steps.join(', ') || 'Iniciando...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Canais Relacionados (ScrapingBee)</h1>
            <p className="text-muted-foreground">
              Descubra canais similares usando web scraping avançado
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta ferramenta usa a API ScrapingBee para fazer scraping do YouTube. Configure sua chave em <strong>Configurações</strong> antes de usar.
            Cada busca consome créditos da sua conta ScrapingBee.
          </AlertDescription>
        </Alert>

        {/* Formulário de Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Busca</CardTitle>
            <CardDescription>
              Insira a URL de um canal do YouTube para encontrar canais similares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-url">URL do Canal</Label>
              <Input
                id="channel-url"
                placeholder="https://www.youtube.com/@CanalExemplo"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                disabled={isSearching}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-method">Método de Busca</Label>
              <Select value={searchMethod} onValueChange={setSearchMethod} disabled={isSearching}>
                <SelectTrigger id="search-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">🔥 Híbrido (Featured + Related + Keywords)</SelectItem>
                  <SelectItem value="featured">⭐ Apenas Featured</SelectItem>
                  <SelectItem value="related-videos">📹 Apenas Vídeos Relacionados</SelectItem>
                  <SelectItem value="keywords">🔤 Apenas Keywords</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {progress && isSearching && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {getProgressLabel()}
                  </span>
                  <span className="font-medium">
                    {channels.length} canais • {progress.quota_used} créditos
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            )}

            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando canais...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Canais
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {channels.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Canais Encontrados</CardTitle>
              <CardDescription>
                {channels.length} canais similares {progress ? `• ${progress.quota_used} créditos usados` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <Card key={channel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      {channel.thumbnail ? (
                        <img 
                          src={channel.thumbnail} 
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-2">{channel.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                          {(channel.similarity_score * 100).toFixed(0)}% match
                        </Badge>
                        {channel.subscribers && (
                          <span className="text-xs">{channel.subscribers}</span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        asChild
                      >
                        <a href={channel.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Visitar Canal
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Buscas
                </CardTitle>
                <CardDescription>Suas últimas buscas realizadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma busca realizada ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.target_channel_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {item.search_method}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span>{item.channels_found.length} canais</span>
                        <span>{item.quota_used} créditos</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSearchResults(item)}
                      >
                        Carregar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSearch(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relacionados;
