import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Trash2, Eye, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/brainstorm/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

const Brainstorm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [language, setLanguage] = useState("pt");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('brainstorm_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const nicheOptions = [
    "Curiosidades", "Histórias", "True Crime", "Crimes reais", "Mistérios",
    "Finanças Pessoais", "Desenvolvimento Pessoal", "Saúde e Bem-estar",
    "Tecnologia", "Gaming", "Entretenimento"
  ];

  const handleGenerateIdeas = async () => {
    if (!niche.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um nicho",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('brainstorm-ideas', {
        body: { 
          niche,
          subNiche: subNiche || undefined,
          language,
          aiModel
        }
      });

      if (error) throw error;

      setIdeas(data.ideas || []);
      
      await supabase.from('brainstorm_ideas').insert({
        niche,
        sub_niche: subNiche || null,
        language,
        ideas: data.ideas,
        ai_model: aiModel,
        user_id: user?.id
      });
      
      await loadHistory();
      toast({
        title: "Ideias Geradas!",
        description: `${data.ideas?.length || 0} ideias de vídeos foram criadas`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar ideias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('brainstorm_ideas').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Ideias removidas do histórico" });
  };

  const displayIdeas = viewingHistory?.ideas || ideas;

  return (
    <SubscriptionGuard toolName="Brainstorm de Ideias">
      <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Brainstorm de Ideias</h1>
          <p className="text-muted-foreground text-lg">
            Gere Ideias de Vídeos Virais Para o Seu Nicho e Nunca Mais Sofra Com Bloqueio Criativo
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
            <Label htmlFor="niche">Nicho do Canal</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger id="niche">
                <SelectValue placeholder="Selecione o nicho" />
              </SelectTrigger>
              <SelectContent>
                {nicheOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subNiche">Subnicho (Opcional)</Label>
            <Input
              id="subNiche"
              placeholder="ex: Crimes não resolvidos dos anos 90"
              value={subNiche}
              onChange={(e) => setSubNiche(e.target.value)}
            />
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
              <Label htmlFor="aiModel">Modelo de IA</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger id="aiModel">
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
            onClick={handleGenerateIdeas}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando Ideias...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Ideias
              </>
            )}
          </Button>
        </div>
      </Card>

      {displayIdeas.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">{viewingHistory ? 'Visualizando Histórico' : 'Ideias Geradas'}</h2>
            {viewingHistory && (
              <Button onClick={() => setViewingHistory(null)} variant="outline">Fechar</Button>
            )}
          </div>
          <div className="space-y-3">
            {displayIdeas.map((idea: string, index: number) => (
              <div key={index} className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-foreground">{idea}</p>
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
                  <p className="font-medium">Nicho: {item.niche} {item.sub_niche && `- ${item.sub_niche}`}</p>
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
            <DialogTitle>Manual Completo - Brainstorm de Ideias</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionGuard>
  );
};

export default Brainstorm;
