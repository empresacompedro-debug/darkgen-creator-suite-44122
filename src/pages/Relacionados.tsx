import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Loader2, StopCircle, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  channel_title: string;
  channel_thumbnail: string;
  subscriber_count: number;
  channel_age_days: number;
  vph: number;
  view_sub_ratio: number;
  is_dark: boolean;
  dark_score: number;
  iteration: number;
}

const Relacionados = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [minDuration, setMinDuration] = useState(1200);
  const [darkDetectionMethod, setDarkDetectionMethod] = useState("lovable-ai");
  const [minTargetVideos, setMinTargetVideos] = useState(500);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [totalFacelessFound, setTotalFacelessFound] = useState(0);
  const [totalVideosAnalyzed, setTotalVideosAnalyzed] = useState(0);
  const [quotaUsed, setQuotaUsed] = useState(0);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const pollingIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!searchId || !isSearching) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      return;
    }
    
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('related_videos')
        .select('*')
        .eq('search_id', searchId)
        .order('created_at', { ascending: false });
      
      if (data) {
        setVideos(data);
        setTotalFacelessFound(data.length);
      }
      
      const { data: searchData } = await supabase
        .from('related_searches')
        .select('current_iteration, total_videos_analyzed, quota_used')
        .eq('id', searchId)
        .single();
      
      if (searchData) {
        setCurrentIteration(searchData.current_iteration);
        setTotalVideosAnalyzed(searchData.total_videos_analyzed);
        setQuotaUsed(searchData.quota_used);
      }
    };
    
    fetchVideos();
    pollingIntervalRef.current = window.setInterval(fetchVideos, 2000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [searchId, isSearching]);
  
  const handleStartSearch = async () => {
    if (!searchTerm) {
      toast({
        title: "Termo de busca necessário",
        description: "Digite um nicho ou palavra-chave para buscar",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setVideos([]);
    setCurrentIteration(0);
    setTotalFacelessFound(0);
    setTotalVideosAnalyzed(0);
    setQuotaUsed(0);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-related-darks', {
        body: {
          action: 'start',
          searchTerm,
          minDuration,
          darkDetectionMethod,
        },
      });
      
      if (error) throw error;
      
      setSearchId(data.searchId);
      setCurrentIteration(data.iteration);
      setTotalFacelessFound(data.facelessFound);
      setQuotaUsed(data.quotaUsed);
      
      toast({
        title: `✅ Iteração ${data.iteration} completa`,
        description: `${data.facelessFound} vídeos faceless encontrados`,
      });
      
      setTimeout(() => continueIteration(data.searchId), 2000);
      
    } catch (error: any) {
      console.error('Erro ao iniciar busca:', error);
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
      setIsSearching(false);
    }
  };
  
  const continueIteration = async (currentSearchId: string) => {
    if (!isSearching) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('search-related-darks', {
        body: {
          action: 'continue',
          searchId: currentSearchId,
        },
      });
      
      if (error) {
        if (error.message === 'YOUTUBE_QUOTA_EXCEEDED') {
          toast({
            title: "🔥 Quota Esgotada",
            description: `Busca finalizada. ${totalFacelessFound} vídeos faceless encontrados.`,
          });
          setIsSearching(false);
          return;
        }
        throw error;
      }
      
      setCurrentIteration(data.iteration);
      setTotalFacelessFound(prev => prev + data.facelessFound);
      setQuotaUsed(prev => prev + data.quotaUsed);
      
      toast({
        title: `✅ Iteração ${data.iteration} completa`,
        description: `+${data.facelessFound} novos vídeos faceless`,
      });
      
      if (data.hasMore) {
        setTimeout(() => continueIteration(currentSearchId), 2000);
      } else {
        toast({
          title: "🎉 Busca Concluída",
          description: `${totalFacelessFound} vídeos faceless encontrados no total`,
        });
        setIsSearching(false);
      }
      
    } catch (error: any) {
      console.error('Erro ao continuar iteração:', error);
      toast({
        title: "Erro na iteração",
        description: error.message,
        variant: "destructive",
      });
      setIsSearching(false);
    }
  };
  
  const handleStopSearch = async () => {
    if (!searchId) return;
    
    try {
      await supabase.functions.invoke('search-related-darks', {
        body: {
          action: 'stop',
          searchId,
        },
      });
      
      setIsSearching(false);
      
      toast({
        title: "❌ Busca Pausada",
        description: `${totalFacelessFound} vídeos faceless foram encontrados até o momento`,
      });
      
    } catch (error: any) {
      console.error('Erro ao parar busca:', error);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔗 Busca ILIMITADA de Canais Faceless</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema busca o MÁXIMO de vídeos possível sem limites. 
            Continua até você parar, quota esgotar ou não encontrar mais canais faceless.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nicho ou Palavra-chave</Label>
            <Input
              placeholder="Ex: WW2 Tales, True Crime, Ancient History"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duração Mínima</Label>
              <Select
                value={minDuration.toString()}
                onValueChange={(v) => setMinDuration(parseInt(v))}
                disabled={isSearching}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="600">10 minutos</SelectItem>
                  <SelectItem value="1200">20 minutos (recomendado)</SelectItem>
                  <SelectItem value="1800">30 minutos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Canais faceless geralmente fazem vídeos de 20min a 3h
              </p>
            </div>
            
            <div>
              <Label>Meta Mínima de Vídeos</Label>
              <Select
                value={minTargetVideos.toString()}
                onValueChange={(v) => setMinTargetVideos(parseInt(v))}
                disabled={isSearching}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 vídeos</SelectItem>
                  <SelectItem value="300">300 vídeos</SelectItem>
                  <SelectItem value="500">500 vídeos (padrão)</SelectItem>
                  <SelectItem value="1000">1000 vídeos</SelectItem>
                  <SelectItem value="2000">2000 vídeos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Não é um limite! Sistema continua após atingir a meta.
              </p>
            </div>
          </div>
          
          <div>
            <Label>Método de Detecção Faceless</Label>
            <Select
              value={darkDetectionMethod}
              onValueChange={setDarkDetectionMethod}
              disabled={isSearching}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lovable-ai">
                  🤖 Lovable AI (Análise Semântica - Recomendado)
                </SelectItem>
                <SelectItem value="google-vision">
                  🖼️ Google Vision API (Detecção de Rosto)
                </SelectItem>
                <SelectItem value="face-api">
                  👤 Face-API.js (Rápido, sem API key)
                </SelectItem>
                <SelectItem value="hybrid-lovable-faceapi">
                  ⚡ Híbrido: Lovable AI + Face-API
                </SelectItem>
                <SelectItem value="hybrid-faceapi-vision">
                  🔥 Híbrido: Face-API + Google Vision
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Detecta canais sem pessoas reais (narração + imagens, vídeos de arquivo, animações)
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isSearching ? (
              <Button
                onClick={handleStartSearch}
                disabled={!searchTerm}
                size="lg"
                className="flex-1"
              >
                <Search className="mr-2 h-4 w-4" />
                🚀 Iniciar Busca ILIMITADA
              </Button>
            ) : (
              <Button
                onClick={handleStopSearch}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                ❌ PARAR BUSCA
              </Button>
            )}
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Busca sem limites:</strong> O sistema continuará buscando vídeos até você clicar em "❌ PARAR BUSCA", 
              a quota de todas as API keys esgotar, ou não encontrar mais canais faceless. 
              Pode resultar em 500, 1000, 2000+ vídeos dependendo do nicho.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Buscando: "{searchTerm}"</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sistema em busca ILIMITADA. Clique em "❌ PARAR BUSCA" para interromper.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Iteração {currentIteration}</span>
                  <span>{totalFacelessFound} vídeos faceless encontrados</span>
                </div>
                <Progress 
                  value={Math.min(100, (totalFacelessFound / minTargetVideos) * 100)} 
                  className="animate-pulse" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {totalFacelessFound >= minTargetVideos 
                    ? `✅ Meta de ${minTargetVideos} atingida! Continuando busca...`
                    : `Meta mínima: ${minTargetVideos} vídeos (${Math.round((totalFacelessFound / minTargetVideos) * 100)}%)`
                  }
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalVideosAnalyzed}</div>
                <div className="text-xs text-muted-foreground">Analisados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalFacelessFound}</div>
                <div className="text-xs text-muted-foreground">Faceless</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{quotaUsed.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Quota</div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔄 <strong>Iteração {currentIteration}:</strong> Buscando relacionados e filtrando canais faceless...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              ✅ {videos.length} Vídeos Faceless Encontrados
              {isSearching && <Badge variant="outline" className="ml-2 animate-pulse">🔄 Atualizando...</Badge>}
              {!isSearching && videos.length >= minTargetVideos && (
                <Badge variant="default" className="ml-2">🎉 Meta atingida!</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Canais sem pessoas reais (narração + imagens, vídeos de arquivo, animações)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-40 object-cover"
                  />
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2 text-sm">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Dark: {video.dark_score}</Badge>
                      {video.iteration > 0 && (
                        <Badge variant="outline">Iter: {video.iteration}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <img
                        src={video.channel_thumbnail}
                        alt={video.channel_title}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="line-clamp-1">{video.channel_title}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>👥 {video.subscriber_count.toLocaleString()} inscritos</div>
                      <div>👁️ {video.view_count.toLocaleString()} views</div>
                      <div>📅 Canal: {video.channel_age_days} dias</div>
                      <div>⚡ VPH: {video.vph.toLocaleString()}</div>
                      <div>📊 Ratio: {video.view_sub_ratio.toFixed(1)}x</div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `https://youtube.com/watch?v=${video.youtube_video_id}`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Ver no YouTube
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relacionados;
