import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, BarChart3, Copy, Download } from "lucide-react";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import ReactMarkdown from "react-markdown";

interface AnalysisResult {
  markdownReport: string;
}

export default function TitleAnalysis() {
  const [rawData, setRawData] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [loading, setLoading] = useState(false);
  const [liveOutput, setLiveOutput] = useState("");
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
    setLiveOutput("");
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-titles-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ rawData, aiModel }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Falha ao iniciar análise: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            setResult({ markdownReport: accumulatedText });
            toast({
              title: "✅ Análise concluída!",
              description: "Relatório gerado com sucesso"
            });
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.error) {
              throw new Error(parsed.error);
            }

            const content = parsed.text;
            if (content) {
              accumulatedText += content;
              setLiveOutput(accumulatedText);
            }
          } catch (e: any) {
            if (e.message && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush final
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) throw new Error(parsed.error);
            const content = parsed.text;
            if (content) {
              accumulatedText += content;
              setLiveOutput(accumulatedText);
            }
          } catch {}
        }
      }

      if (!result && accumulatedText) {
        setResult({ markdownReport: accumulatedText });
      }

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

      {/* Live Output - IA trabalhando */}
      {loading && liveOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              IA trabalhando...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-4 text-foreground border-b pb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 mb-4 text-foreground">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-accent px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-accent p-4 rounded-lg overflow-x-auto mb-4 text-foreground">{children}</pre>
                  ),
                }}
              >
                {liveOutput}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {result && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">🎯 Relatório Completo</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(result.markdownReport);
                  toast({ 
                    title: "✅ Copiado!",
                    description: "Relatório copiado para a área de transferência"
                  });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([result.markdownReport], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analise-titulos-${Date.now()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mb-4 text-foreground border-b pb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 space-y-2 mb-4 text-foreground">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground">{children}</li>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground">{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code className="bg-accent px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-accent p-4 rounded-lg overflow-x-auto mb-4 text-foreground">{children}</pre>
                    ),
                  }}
                >
                  {result.markdownReport}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
