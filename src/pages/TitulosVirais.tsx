import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Loader2, Trash2, Eye, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/titles/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

const TitulosVirais = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("");
  const [generationType, setGenerationType] = useState("structure");
  const [language, setLanguage] = useState("pt");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [titles, setTitles] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('viral_titles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleGenerateTitles = async () => {
    if (!theme.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o tema central",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-titles', {
        body: { theme, generationType, language, aiModel }
      });

      if (error) throw error;

      setTitles(data.titles || []);
      
      await supabase.from('viral_titles').insert({
        theme,
        generation_type: generationType,
        language,
        titles: data.titles,
        ai_model: aiModel,
        user_id: user?.id
      });
      
      await loadHistory();
      toast({
        title: "Títulos Gerados!",
        description: `${data.titles?.length || 0} títulos foram criados`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar títulos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('viral_titles').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Títulos removidos do histórico" });
  };

  const displayTitles = viewingHistory?.titles || titles;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Títulos Virais</h1>
          <p className="text-muted-foreground text-lg">
            Crie Títulos e Estruturas Magnéticas Para Multiplicar Suas Visualizações
          </p>
        </div>
        <Button onClick={() => setShowManual(true)} variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema Central</Label>
            <Input
              id="theme"
              placeholder="ex: Como Investir em Ações"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="generation-type">Tipo de Geração</Label>
            <Select value={generationType} onValueChange={setGenerationType}>
              <SelectTrigger id="generation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">Gerar Estrutura de Títulos</SelectItem>
                <SelectItem value="ready">Gerar Títulos Prontos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português BR</SelectItem>
                  <SelectItem value="en">English US</SelectItem>
                  <SelectItem value="es">Español (España)</SelectItem>
                  <SelectItem value="fr">Français (France)</SelectItem>
                  <SelectItem value="de">Deutsch (Alemanha)</SelectItem>
                  <SelectItem value="it">Italiano (Italia)</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="ro">Română (România)</SelectItem>
                  <SelectItem value="pl">Polski (Polska)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">Modelo de IA</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger id="ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4">Anthropic Claude Sonnet 4</SelectItem>
                  <SelectItem value="claude-sonnet-4.5">Anthropic Claude Sonnet 4.5</SelectItem>
                  <SelectItem value="claude-sonnet-3.5">Anthropic Claude Sonnet 3.5</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Google Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-flash-lite">Google Gemini 2.5 Flash Lite</SelectItem>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">OpenAI GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateTitles}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando Conteúdo...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Gerar Conteúdo
              </>
            )}
          </Button>
        </div>
      </Card>

      {displayTitles.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">{viewingHistory ? 'Visualizando Histórico' : 'Títulos Gerados'}</h2>
            {viewingHistory && (
              <Button onClick={() => setViewingHistory(null)} variant="outline">Fechar</Button>
            )}
          </div>
          <div className="space-y-3">
            {displayTitles.map((title: string, index: number) => (
              <div key={index} className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-foreground">{title}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Tema: {item.theme}</p>
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

      {/* Manual Completo */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Títulos Virais</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TitulosVirais;
