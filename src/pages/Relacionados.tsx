import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ExternalLink, Info, History, Trash2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

const Relacionados = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [channelUrl, setChannelUrl] = useState("");
  const [searchMethod, setSearchMethod] = useState<string>("hybrid");
  const [isSearching, setIsSearching] = useState(false);
  const [channels, setChannels] = useState<SimilarChannel[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

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

      setChannels(data.channels || []);
      
      toast({
        title: "✅ Busca concluída!",
        description: `${data.total_found} canais similares encontrados. Quota usada: ${data.quota_used}`,
      });

      // Recarregar histórico
      await loadHistory();
    } catch (error: any) {
      console.error("Erro na busca:", error);
      
      if (error.message.includes("Configure sua chave ScrapingBee")) {
        toast({
          title: "🔑 Chave ScrapingBee necessária",
          description: (
            <div>
              Configure sua chave em{" "}
              <a href="/configuracoes" className="underline font-semibold">Configurações</a>
            </div>
          ),
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Erro na busca",
          description: error.message || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const loadSearchResults = (search: SearchHistory) => {
    setChannels(search.channels_found);
    setChannelUrl(search.target_channel_url);
    toast({
      title: "📂 Busca carregada",
      description: `${search.channels_found.length} canais de ${new Date(search.created_at).toLocaleDateString()}`
    });
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from("similar_channels_scrapingbee")
        .delete()
        .eq("id", searchId);

      if (error) throw error;

      toast({ title: "🗑️ Busca removida" });
      await loadHistory();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🔗 Canais Similares (ScrapingBee)</h1>
        <p className="text-muted-foreground">
          Encontre canais similares usando web scraping inteligente via ScrapingBee
        </p>
      </div>

      {/* Card de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Nova Busca
          </CardTitle>
          <CardDescription>
            Insira a URL de um canal do YouTube e escolha o método de busca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-url">URL do Canal</Label>
            <Input
              id="channel-url"
              type="url"
              placeholder="https://youtube.com/@channelhandle"
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
                <SelectItem value="featured">🎯 Canais em Destaque</SelectItem>
                <SelectItem value="related-videos">📹 Vídeos Relacionados</SelectItem>
                <SelectItem value="keywords">🔤 Por Keywords</SelectItem>
                <SelectItem value="hybrid">⚡ Híbrido (Recomendado)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {searchMethod === "featured" && "Extrai canais da seção 'Canais em Destaque'"}
              {searchMethod === "related-videos" && "Analisa canais de vídeos relacionados"}
              {searchMethod === "keywords" && "Busca por keywords comuns"}
              {searchMethod === "hybrid" && "Combina todos os métodos para melhor resultado"}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>💡 Chave ScrapingBee necessária:</strong>{" "}
              Configure em{" "}
              <a href="/configuracoes" className="underline font-semibold">
                Configurações
              </a>{" "}
              antes de usar esta ferramenta.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !channelUrl.trim()} 
            size="lg" 
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando canais similares...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Canais Similares
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✅ {channels.length} Canais Similares Encontrados</CardTitle>
            <CardDescription>
              Ordenados por score de similaridade (mais relevantes primeiro)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <Card key={channel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative bg-muted">
                    <img
                      src={channel.thumbnail}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/320x180?text=Canal";
                      }}
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-2" title={channel.name}>
                        {channel.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{channel.handle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {channel.subscribers} inscritos
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(channel.similarity_score * 100)}% similar
                      </Badge>
                    </div>

                    {channel.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {channel.description}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(channel.url, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Visitar Canal
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Buscas
            </CardTitle>
            <CardDescription>
              Suas últimas 10 buscas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{search.target_channel_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {search.search_method}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {search.channels_found.length} canais • {" "}
                      {new Date(search.created_at).toLocaleString("pt-BR")} • {" "}
                      Quota: {search.quota_used}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadSearchResults(search)}
                    >
                      Ver Resultados
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!loadingHistory && history.length === 0 && channels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-6xl">🔍</div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma busca realizada ainda</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Insira a URL de um canal do YouTube acima e clique em "Buscar Canais Similares" 
                para encontrar canais relacionados usando ScrapingBee.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relacionados;
