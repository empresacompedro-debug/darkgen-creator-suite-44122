import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, TrendingUp, BarChart3, Lightbulb } from "lucide-react";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import { Badge } from "@/components/ui/badge";

interface KeywordData {
  keyword: string;
  occurrences: number;
  avgViews: number;
  avgVph: number;
  bestTitles: string[];
}

interface VideoData {
  title: string;
  views: number;
  vph: number;
}

interface MicroNicheData {
  rank: number;
  name: string;
  description: string;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo: number;
  titleStructure: string;
  isChampion: boolean;
  videos: VideoData[];
}

interface AnalysisResult {
  topKeywords: Array<{
    keyword: string;
    frequency: number;
    avgViews: number;
    avgVPH: number;
    examples: string[];
  }>;
  championMicroNiches: Array<{
    niche: string;
    avgViews: number;
    avgVPH: number;
    videoCount: number;
    bestTitles: string[];
    pattern: string;
  }>;
  insights: string;
}

export default function TitleAnalysis() {
  const [rawData, setRawData] = useState("");
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeData = async () => {
    if (!rawData.trim()) {
      toast({
        title: "⚠️ Dados vazios",
        description: "Cole os dados do YouTube",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-titles', {
        body: { rawData, aiModel }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "✅ Análise concluída!",
        description: `Análise realizada com sucesso`
      });
    } catch (error: any) {
      console.error("Erro na análise:", error);
      toast({
        title: "❌ Erro na análise",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">📊 Análise de Títulos</h1>
          <p className="text-muted-foreground">Cole dados do YouTube e descubra padrões virais</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do YouTube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Área de entrada */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Cole os dados do YouTube (formato completo com views, VPH, etc)
            </label>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="19:06
Tocando agora
My Parents Kicked Me Out...
3,2 mil visualizações
há 7 horas
434 VPH

20:20
Tocando agora
My Parents Transferred...
1,9 mil visualizações
há 12 horas
152 VPH"
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          {/* Seletor de modelo */}
          <AIModelSelector
            value={aiModel}
            onChange={setAiModel}
          />

          {/* Botão de análise */}
          <Button
            onClick={analyzeData}
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
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analisar Títulos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">🎯 Resultados</h2>
          </div>
          
          {/* Palavras-chave */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                🔑 Top Palavras-Chave Campeãs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.topKeywords?.slice(0, 10).map((kw, i) => (
                  <div key={i} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          #{i + 1}
                        </span>
                        <span className="font-bold text-lg">{kw.keyword}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex gap-4">
                          <Badge variant="outline">{kw.frequency}x</Badge>
                          <Badge variant="secondary">{kw.avgViews?.toLocaleString()} views</Badge>
                          <Badge variant="default">{kw.avgVPH} VPH</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Melhores Títulos:</p>
                      {kw.examples?.map((title, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                          • {title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Micro-nichos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                🏆 Micro-Nichos Campeões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.championMicroNiches?.map((micro, idx) => (
                  <div key={idx} className="p-5 border-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xl mb-1">{micro.niche}</h4>
                          <p className="text-sm text-muted-foreground">{micro.pattern}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-primary">{micro.avgViews?.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">views médias</div>
                        <div className="flex gap-2 justify-end mt-2">
                          <Badge variant="secondary">{micro.videoCount} vídeos</Badge>
                          <Badge variant="default">{micro.avgVPH} VPH</Badge>
                        </div>
                      </div>
                    </div>

                    {micro.bestTitles && micro.bestTitles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Melhores Títulos:</p>
                        <div className="space-y-2">
                          {micro.bestTitles.slice(0, 3).map((title, idx) => (
                            <div key={idx} className="p-2 bg-background rounded border text-sm">
                              <span className="flex-1">{title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {result.insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  💡 Insights da Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line text-foreground">{result.insights}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
