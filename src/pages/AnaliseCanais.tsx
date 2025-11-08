import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/channel-analysis/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { useLoadingProgress, StageConfig } from "@/hooks/useLoadingProgress";
import { LoadingProgress } from "@/components/ui/loading-progress";

const analysisStages: StageConfig[] = [
  { stage: 'fetch', label: 'Buscando informações dos canais', duration: 3000, percentage: 30, details: 'Obtendo dados do YouTube...' },
  { stage: 'analyze', label: 'Analisando padrões', duration: 5000, percentage: 70, details: 'Processando com IA...' },
  { stage: 'complete', label: 'Finalizando', duration: 1000, percentage: 100, details: 'Gerando relatório...' }
];

export default function AnaliseCanais() {
  const [targetChannel, setTargetChannel] = useState("@luiz_stubbe");
  const [exampleChannels, setExampleChannels] = useState(`@pereirashortsbr
@Lucas_o_Almeida
@eagoraa
@goldzerax
@mulekelegal
@GiulianaMafra
@thedanieloliver
@SabiaNão-ALV`);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const [showManual, setShowManual] = useState(false);
  const { progress, startProgress, completeProgress, stopProgress, isActive } = useLoadingProgress(analysisStages);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    startProgress();

    try {
      const channelsList = exampleChannels
        .split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      console.log('Analisando canais:', channelsList);

      const { data, error } = await supabase.functions.invoke('analyze-channel-pattern', {
        body: {
          channels: channelsList,
          targetChannel: targetChannel,
        }
      });

      if (error) throw error;

      console.log('Análise recebida:', data);
      setAnalysis(data);
      
      completeProgress();

      toast({
        title: "Análise concluída!",
        description: "A análise dos canais foi gerada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao analisar:', error);
      stopProgress();
      toast({
        title: "Erro na análise",
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
      analyze: '🤖',
      complete: '✅',
    };
    return icons[stage] || '⚙️';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Análise de Padrão de Canais</h1>
          <p className="text-muted-foreground">
            Identifique por que certos canais não estão sendo encontrados pelo sistema
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowManual(true)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Manual Completo
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração da Análise</CardTitle>
            <CardDescription>
              Insira o canal alvo e os canais de exemplo que deveriam ser encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="target">Canal Alvo (que gerou a busca)</Label>
              <Input
                id="target"
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                placeholder="@canal_alvo"
              />
            </div>

            <div>
              <Label htmlFor="examples">Canais de Exemplo (um por linha)</Label>
              <Textarea
                id="examples"
                value={exampleChannels}
                onChange={(e) => setExampleChannels(e.target.value)}
                placeholder="@canal1&#10;@canal2&#10;@canal3"
                rows={10}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Analisar Padrão'
              )}
            </Button>
          </CardContent>
        </Card>

        {isActive && (
          <LoadingProgress
            stages={analysisStages.map(s => ({ stage: s.stage, icon: getStageIcon(s.stage), label: s.label }))}
            currentStage={progress.stage}
            percentage={progress.percentage}
            estimatedTimeRemaining={progress.estimatedTimeRemaining}
            stageLabel={progress.stageLabel}
            details={progress.details}
          />
        )}

        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Informações dos Canais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.channelInfos?.map((channel: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h3 className="font-bold text-lg">{channel.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{channel.handle}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>Inscritos: {channel.subscribers?.toLocaleString()}</div>
                        <div>Vídeos: {channel.videoCount}</div>
                      </div>
                      <p className="text-sm mb-2">{channel.description?.substring(0, 200)}...</p>
                      <div className="mt-2">
                        <p className="font-semibold text-sm">Títulos recentes:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {channel.recentVideoTitles?.slice(0, 3).map((title: string, i: number) => (
                            <li key={i}>{title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise do Gemini</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.analysis && typeof analysis.analysis === 'object' && !analysis.analysis.rawAnalysis ? (
                  <div className="space-y-4">
                    {analysis.analysis.nichoExato && (
                      <div>
                        <h3 className="font-bold mb-2">Nicho Exato:</h3>
                        <p>{analysis.analysis.nichoExato}</p>
                      </div>
                    )}

                    {analysis.analysis.tipoConteudo && (
                      <div>
                        <h3 className="font-bold mb-2">Tipo de Conteúdo:</h3>
                        <p>{analysis.analysis.tipoConteudo}</p>
                      </div>
                    )}

                    {analysis.analysis.palavrasChaveComuns && (
                      <div>
                        <h3 className="font-bold mb-2">Palavras-chave Comuns:</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.analysis.palavrasChaveComuns.map((word: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.analysis.padraoTitulos && (
                      <div>
                        <h3 className="font-bold mb-2">Padrão de Títulos:</h3>
                        <p>{analysis.analysis.padraoTitulos}</p>
                      </div>
                    )}

                    {analysis.analysis.problemaBusca && (
                      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <h3 className="font-bold mb-2 text-destructive">Por que não são encontrados:</h3>
                        <p>{analysis.analysis.problemaBusca}</p>
                      </div>
                    )}

                    {analysis.analysis.termosBuscaIdeais && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <h3 className="font-bold mb-2 text-green-700 dark:text-green-300">Termos de Busca Ideais:</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.analysis.termosBuscaIdeais.map((term: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.analysis.caracteristicasUnicas && (
                      <div>
                        <h3 className="font-bold mb-2">Características Únicas:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.analysis.caracteristicasUnicas.map((char: string, i: number) => (
                            <li key={i}>{char}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold mb-2">Análise Completa:</h3>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                      {analysis.rawAnalysis}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Análise de Canais</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
}
