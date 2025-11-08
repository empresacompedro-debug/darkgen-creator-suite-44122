import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Trash2, Eye, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/description-optimizer/UserManual";

export default function OtimizadorDescricao() {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [aiModel, setAiModel] = useState("gemini-2.5-pro");
  const [includeCTA, setIncludeCTA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('description_optimizations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleOptimize = async () => {
    if (!title) {
      toast({
        title: "Erro",
        description: "Por favor, insira o título do vídeo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-description', {
        body: { title, language, aiModel, includeCTA }
      });

      if (error) throw error;
      setResult(data);
      
      await supabase.from('description_optimizations').insert({
        original_description: title,
        optimized_description: data.description || '',
        ai_model: aiModel,
        user_id: user?.id
      } as any);
      
      await loadHistory();
      toast({
        title: "Otimização concluída!",
        description: "O conteúdo foi otimizado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao otimizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('description_optimizations').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Otimização removida do histórico" });
  };

  const displayResult = viewingHistory ? {
    description: viewingHistory.optimized_description,
    seoScore: 85,
    reachPotential: 80,
    engagementPotential: 75,
    tags: [],
    thumbnailPhrases: []
  } : result;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">✨ Otimizador de Descrição</h1>
          <p className="text-muted-foreground mt-2">
            Otimize descrições, tags e títulos de vídeos para melhorar o alcance
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowManual(true)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título Principal de Vídeo</label>
          <Input
            placeholder="Ex: TADALAFILA TURBINADA: A MELHOR ESTRATÉGIA..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Idioma</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español (España)</SelectItem>
                <SelectItem value="fr-FR">Français (France)</SelectItem>
                <SelectItem value="de-DE">Deutsch (Deutschland)</SelectItem>
                <SelectItem value="it-IT">Italiano (Italia)</SelectItem>
                <SelectItem value="ja-JP">日本語 (Japão)</SelectItem>
                <SelectItem value="ko-KR">한국어 (Coréia do Sul)</SelectItem>
                <SelectItem value="ro-RO">Română (România)</SelectItem>
                <SelectItem value="pl-PL">Polski (Polska)</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="cta" checked={includeCTA} onCheckedChange={(checked) => setIncludeCTA(checked as boolean)} />
          <label htmlFor="cta" className="text-sm font-medium cursor-pointer">
            Incluir Chamada Para Ação (CTA) na Descrição
          </label>
        </div>

        <Button onClick={handleOptimize} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Otimizando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Otimizar Conteúdo
            </>
          )}
        </Button>
      </Card>

      {displayResult && (
        <div className="space-y-6">
          {viewingHistory && (
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Visualizando Histórico</h2>
              <Button onClick={() => setViewingHistory(null)} variant="outline">Fechar</Button>
            </div>
          )}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Análise de Potencial</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{displayResult.seoScore}/100</p>
                <p className="text-sm text-muted-foreground">Pontuação SEO</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{displayResult.reachPotential}/100</p>
                <p className="text-sm text-muted-foreground">Potencial de Alcance</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{displayResult.engagementPotential}/100</p>
                <p className="text-sm text-muted-foreground">Potencial de Engajamento</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Descrição Otimizada</h3>
            <Textarea value={displayResult.description} readOnly className="min-h-[300px]" />
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Tags Recomendadas</h3>
            <div className="flex flex-wrap gap-2">
              {displayResult.tags?.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Frases para Thumbnail</h3>
            <div className="space-y-3">
              {displayResult.thumbnailPhrases?.map((phrase: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-medium">{phrase.text}</span>
                  <span className="text-sm text-muted-foreground">CTR: {phrase.ctrScore}/100</span>
                </div>
              ))}
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
                  <p className="font-medium">Título: {item.title}</p>
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
            <DialogTitle>Manual Completo - Otimizador de Descrição</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
}
