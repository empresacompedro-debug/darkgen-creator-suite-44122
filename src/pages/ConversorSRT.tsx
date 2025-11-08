import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, History, Eye, Trash2, Settings, X, BookOpen, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/srt/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { ImportRecentDialog } from "@/components/srt/ImportRecentDialog";

interface SRTConfig {
  wordsPerSubtitle: number;
  maxLines: number;
  wordsPerLine: number;
  narrationSpeed: number;
}

interface SubtitleStats {
  totalSubtitles: number;
  totalDuration: number;
  avgWordsPerSubtitle: number;
  avgLinesPerSubtitle: number;
}

export default function ConversorSRT() {
  const [script, setScript] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any | null>(null);
  const [stats, setStats] = useState<SubtitleStats | null>(null);
  const [config, setConfig] = useState<SRTConfig>({
    wordsPerSubtitle: 50,
    maxLines: 5,
    wordsPerLine: 10,
    narrationSpeed: 2.5,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const [showManual, setShowManual] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('srt_conversions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar histórico:', error);
      return;
    }

    setHistory(data || []);
  };

  const handleDeleteHistory = async (id: string) => {
    const { error } = await supabase
      .from('srt_conversions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conversão",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Conversão excluída",
    });

    loadHistory();
  };

  // Função auxiliar para dividir texto em sentenças (preservando pontuação final)
  const splitIntoSentences = (text: string): string[] => {
    const normalized = text
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    
    if (!normalized) return [];
    
    return normalized
      .split(/(?<=[.!?…]["»"')]*)\s+/u)
      .filter(Boolean)
      .map(s => s.trim());
  };

  // Verifica se texto termina com pontuação de final de frase
  const endsWithPunctuation = (s: string): boolean => {
    return /[.!?…]["»"')]*$/u.test(s.trim());
  };

  // Estima número de linhas para um texto dado o wordsPerLine
  const estimateLines = (text: string, wordsPerLine: number): number => {
    const wc = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wc / wordsPerLine));
  };

  // Função auxiliar para quebrar legenda em múltiplas linhas
  const breakIntoLines = (subtitle: string, wordsPerLine: number): string[] => {
    const words = subtitle.split(/\s+/);
    const lines: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerLine) {
      const line = words.slice(i, i + wordsPerLine).join(" ");
      lines.push(line);
    }
    
    return lines;
  };

  // Função auxiliar para agrupar sentenças em legendas (terminando em pontuação)
  const groupSentencesIntoSubtitles = (
    sentences: string[],
    config: SRTConfig
  ): string[] => {
    const minLinesDesired = 3;
    const subtitles: string[] = [];
    let current = "";

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const candidate = current ? `${current} ${s}` : s;

      const candidateLines = estimateLines(candidate, config.wordsPerLine);
      const currentLines = current ? estimateLines(current, config.wordsPerLine) : 0;

      // Se adicionar a próxima sentença ainda cabe no limite, adiciona
      if (candidateLines <= config.maxLines) {
        current = candidate;
        continue;
      }

      // Ultrapassou o limite
      // Se já temos o mínimo de linhas desejado, fecha o bloco atual
      if (current && currentLines >= minLinesDesired) {
        subtitles.push(current.trim());
        current = s;
      } else {
        // Ainda não alcançou o mínimo: continue até completar uma sentença,
        // mesmo que passe do limite
        current = candidate;
      }
    }

    // Adiciona o último bloco
    if (current.trim()) {
      // Se não termina com pontuação, adiciona ponto
      if (!endsWithPunctuation(current)) {
        current = current.trim() + ".";
      }
      subtitles.push(current.trim());
    }

    return subtitles;
  };

  const convertToSRT = async () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o roteiro",
        variant: "destructive",
      });
      return;
    }

    // 1. Dividir em sentenças
    const sentences = splitIntoSentences(script);
    
    if (sentences.length === 0) {
      toast({
        title: "Erro",
        description: "Não foi possível dividir o texto em sentenças",
        variant: "destructive",
      });
      return;
    }

    // 2. Agrupar sentenças em legendas
    const subtitles = groupSentencesIntoSubtitles(sentences, config);

    // 3. Gerar SRT
    let srtContent = "";
    let currentTime = 0;
    let totalWords = 0;
    let totalLines = 0;

    subtitles.forEach((subtitle, index) => {
      const words = subtitle.split(/\s+/);
      const wordCount = words.length;
      const duration = wordCount / config.narrationSpeed;

      // Quebrar em linhas
      const lines = breakIntoLines(subtitle, config.wordsPerLine);
      totalLines += lines.length;

      const startTime = formatTime(currentTime);
      const endTime = formatTime(currentTime + duration);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += lines.join("\n") + "\n\n";

      currentTime += duration + 0.5; // Buffer de 0.5s entre legendas
      totalWords += wordCount;
    });

    setResult(srtContent);

    // Calcular estatísticas
    setStats({
      totalSubtitles: subtitles.length,
      totalDuration: currentTime,
      avgWordsPerSubtitle: totalWords / subtitles.length,
      avgLinesPerSubtitle: totalLines / subtitles.length,
    });

    // Salvar no histórico
    const { error: saveError } = await supabase
      .from('srt_conversions')
      .insert({
        script_original: script,
        srt_result: srtContent,
        user_id: user?.id
      });

    if (saveError) {
      console.error('Erro ao salvar histórico:', saveError);
    } else {
      loadHistory();
    }

    toast({
      title: "Conversão concluída!",
      description: `${subtitles.length} legendas geradas em ${Math.round(currentTime)}s`,
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  };

  const handleDownload = (content: string = result) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legendas.srt';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Download iniciado",
      description: "Arquivo SRT baixado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">📝 Conversor de SRT (Estilo CapCut)</h1>
          <p className="text-muted-foreground mt-2">
            Converta texto em legendas no formato SRT, otimizado para edição rápida
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowManual(true)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Cole o roteiro completo aqui</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Últimos Gerados
              </Button>
              {(script || result) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScript("");
                    setResult("");
                    setStats(null);
                    toast({
                      title: "Limpeza concluída",
                      description: "Texto e resultado removidos",
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
          <Textarea
            placeholder="Cole seu roteiro aqui..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        {/* Configurações */}
        <Card className="p-4 space-y-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="font-semibold">Configurações Avançadas</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Palavras por legenda</Label>
                <span className="text-sm text-muted-foreground">{config.wordsPerSubtitle}</span>
              </div>
              <Slider
                value={[config.wordsPerSubtitle]}
                onValueChange={(value) => setConfig({ ...config, wordsPerSubtitle: value[0] })}
                min={30}
                max={80}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Máximo de linhas</Label>
                <span className="text-sm text-muted-foreground">{config.maxLines}</span>
              </div>
              <Slider
                value={[config.maxLines]}
                onValueChange={(value) => setConfig({ ...config, maxLines: value[0] })}
                min={3}
                max={7}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Palavras por linha</Label>
                <span className="text-sm text-muted-foreground">{config.wordsPerLine}</span>
              </div>
              <Slider
                value={[config.wordsPerLine]}
                onValueChange={(value) => setConfig({ ...config, wordsPerLine: value[0] })}
                min={8}
                max={15}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Velocidade de narração (palavras/s)</Label>
                <span className="text-sm text-muted-foreground">{config.narrationSpeed.toFixed(1)}</span>
              </div>
              <Slider
                value={[config.narrationSpeed * 10]}
                onValueChange={(value) => setConfig({ ...config, narrationSpeed: value[0] / 10 })}
                min={20}
                max={30}
                step={1}
              />
            </div>
          </div>
        </Card>

        <Button onClick={convertToSRT} className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Converter para SRT
        </Button>
      </Card>

      {history.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold">Histórico de Conversões</h3>
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.script_original.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingHistory(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item.srt_result)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteHistory(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {viewingHistory && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Visualizando Histórico</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingHistory(null)}>
                Fechar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload(viewingHistory.srt_result)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar .srt
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Criado em:</strong> {new Date(viewingHistory.created_at).toLocaleString('pt-BR')}
          </p>
          <Textarea value={viewingHistory.srt_result} readOnly className="min-h-[400px] font-mono text-sm" />
        </Card>
      )}

      {result && !viewingHistory && (
        <>
          {stats && (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">📊 Estatísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Legendas</p>
                  <p className="text-2xl font-bold">{stats.totalSubtitles}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="text-2xl font-bold">{Math.round(stats.totalDuration)}s</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Palavras/Legenda</p>
                  <p className="text-2xl font-bold">{Math.round(stats.avgWordsPerSubtitle)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Linhas/Legenda</p>
                  <p className="text-2xl font-bold">{stats.avgLinesPerSubtitle.toFixed(1)}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Resultado SRT</h3>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setResult("");
                    setStats(null);
                    toast({
                      title: "Resultado limpo",
                      description: "SRT removido",
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload()}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar .srt
                </Button>
              </div>
            </div>
            <Textarea value={result} readOnly className="min-h-[400px] font-mono text-sm" />
          </Card>
        </>
      )}

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Conversor SRT</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>

      <ImportRecentDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={(content) => setScript(content)}
      />
    </div>
  );
}
