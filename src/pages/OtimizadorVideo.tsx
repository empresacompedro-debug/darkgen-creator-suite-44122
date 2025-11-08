import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Video, Trash2, Eye, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/video-optimizer/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { useLoadingProgress, StageConfig } from "@/hooks/useLoadingProgress";
import { LoadingProgress } from "@/components/ui/loading-progress";

const optimizationStages: StageConfig[] = [
  { stage: 'fetch', label: 'Obtendo dados do vídeo', duration: 2000, percentage: 25, details: 'Buscando informações no YouTube...' },
  { stage: 'analyze', label: 'Analisando SEO atual', duration: 3000, percentage: 60, details: 'Avaliando título, descrição e tags...' },
  { stage: 'optimize', label: 'Gerando otimizações', duration: 3000, percentage: 90, details: 'Criando sugestões com IA...' },
  { stage: 'save', label: 'Salvando análise', duration: 500, percentage: 100, details: 'Concluído!' }
];

export default function OtimizadorVideo() {
  const [videoUrl, setVideoUrl] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-pro");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showManual, setShowManual] = useState(false);
  const { progress, startProgress, completeProgress, stopProgress, isActive } = useLoadingProgress(optimizationStages);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('video_optimizations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleAnalyze = async () => {
    if (!videoUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do vídeo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    startProgress();
    
    try {
      const { data, error } = await supabase.functions.invoke('optimize-video', {
        body: { videoUrl, aiModel }
      });

      if (error) throw error;
      setResult(data);
      
      await supabase.from('video_optimizations').insert({
        original_title: data.original?.title || '',
        original_description: data.original?.description || '',
        original_tags: data.original?.tags || [],
        optimized_title: data.optimized?.title || '',
        optimized_description: data.optimized?.description || '',
        optimized_tags: data.optimized?.tags || [],
        ai_model: aiModel,
        user_id: user?.id
      } as any);
      
      await loadHistory();
      completeProgress();
      
      toast({
        title: "Análise concluída!",
        description: "O vídeo foi analisado com sucesso",
      });
    } catch (error: any) {
      stopProgress();
      toast({
        title: "Erro ao analisar vídeo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage: string) => {
    const icons: Record<string, string> = {
      fetch: '📡',
      analyze: '📊',
      optimize: '🤖',
      save: '💾',
    };
    return icons[stage] || '⚙️';
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('video_optimizations').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Otimização removida do histórico" });
  };

  const displayResult = viewingHistory || result;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🎬 Otimizador de Vídeo</h1>
          <p className="text-muted-foreground mt-2">
            Analise um vídeo do YouTube e gere sugestões de IA para otimizar título, descrição e tags
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowManual(true)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Vídeo do YouTube</label>
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Modelo de IA</label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
              <SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
              <SelectItem value="claude-sonnet-3.5">Claude Sonnet 3.5</SelectItem>
              <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAnalyze} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Analisar Vídeo
            </>
          )}
        </Button>
      </Card>

      {isActive && (
        <LoadingProgress
          stages={optimizationStages.map(s => ({ stage: s.stage, icon: getStageIcon(s.stage), label: s.label }))}
          currentStage={progress.stage}
          percentage={progress.percentage}
          estimatedTimeRemaining={progress.estimatedTimeRemaining}
          stageLabel={progress.stageLabel}
          details={progress.details}
        />
      )}

      {displayResult && (
        <div className="space-y-6">
          {viewingHistory && (
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Visualizando Histórico</h2>
              <Button onClick={() => setViewingHistory(null)} variant="outline">Fechar</Button>
            </div>
          )}
          <h2 className="text-2xl font-bold">Estrutura Antiga</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Título Original</p>
                <p className="font-medium">{(displayResult.original || displayResult.original_data)?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição Original</p>
                <p className="text-sm whitespace-pre-wrap">{(displayResult.original || displayResult.original_data)?.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pontuação Original</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span>Total: {(displayResult.original || displayResult.original_data)?.score}/100</span>
                  <span>Título: {(displayResult.original || displayResult.original_data)?.titleScore}/100</span>
                  <span>Descrição: {(displayResult.original || displayResult.original_data)?.descriptionScore}/100</span>
                  <span>Tags: {(displayResult.original || displayResult.original_data)?.tagsScore}/100</span>
                </div>
              </div>
            </div>
          </Card>

          <h2 className="text-2xl font-bold">Estrutura Nova</h2>
          
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Título Otimizado</h3>
            <p className="font-medium text-lg">{(displayResult.optimized || displayResult.optimized_data)?.title}</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Descrição Otimizada</h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{(displayResult.optimized || displayResult.optimized_data)?.description}</pre>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Tags Sugeridas</h3>
            <div className="flex flex-wrap gap-2">
              {(displayResult.optimized || displayResult.optimized_data)?.tags?.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Nova Pontuação</h3>
            <div className="flex flex-wrap gap-4">
              <span className="text-lg">Total: <strong>{(displayResult.optimized || displayResult.optimized_data)?.score}/100</strong></span>
              <span>Título: {(displayResult.optimized || displayResult.optimized_data)?.titleScore}/100</span>
              <span>Descrição: {(displayResult.optimized || displayResult.optimized_data)?.descriptionScore}/100</span>
              <span>Tags: {(displayResult.optimized || displayResult.optimized_data)?.tagsScore}/100</span>
            </div>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Vídeo: {item.video_url}</p>
                  <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewingHistory(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteHistory(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Otimizador de Vídeo</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
}
