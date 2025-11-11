import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, Trash2, Eye, BookOpen, Swords, Trophy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/brainstorm/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import { cn } from "@/lib/utils";

const AVAILABLE_AI_MODELS = [
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", icon: "🤖" },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "Anthropic", icon: "🤖" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", icon: "✨" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", icon: "⚡" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", icon: "⚡" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", icon: "🔥" },
  { id: "gpt-4.1-2025-04-14", name: "GPT-4.1", provider: "OpenAI", icon: "🔥" }
];

const Brainstorm = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState("claude-sonnet-4.5");
  const [battleMode, setBattleMode] = useState(false);
  const [battleResponses, setBattleResponses] = useState<Record<string, string>>({});
  const [selectedAIs, setSelectedAIs] = useState<string[]>([
    "claude-sonnet-4-5",
    "gemini-2.5-flash",
    "gpt-4o-mini"
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleAI = (aiId: string) => {
    setSelectedAIs(prev => {
      if (prev.includes(aiId)) {
        if (prev.length === 1) {
          toast({
            title: "Atenção",
            description: "Pelo menos 1 IA deve estar selecionada",
            variant: "destructive"
          });
          return prev;
        }
        return prev.filter(id => id !== aiId);
      } else {
        return [...prev, aiId];
      }
    });
  };

  const selectAllAIs = () => {
    setSelectedAIs(AVAILABLE_AI_MODELS.map(ai => ai.id));
  };

  const deselectAllAIs = () => {
    setSelectedAIs([AVAILABLE_AI_MODELS[0].id]);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('brainstorm_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleStreamIdeas = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite sua pergunta",
        variant: "destructive",
      });
      return;
    }

    setIsStreaming(true);
    
    if (battleMode) {
      setBattleResponses({});
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brainstorm-ideas`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              battleMode: true,
              selectedModels: selectedAIs
            })
          }
        );

        if (!response.ok || !response.body) {
          throw new Error('Falha ao iniciar batalha');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const responses: Record<string, string> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.model && parsed.content) {
                  responses[parsed.model] = (responses[parsed.model] || '') + parsed.content;
                  setBattleResponses({...responses});
                }
              } catch (e) {
                // Linha incompleta, ignora
              }
            }
          }
        }

        toast({
          title: "Batalha Finalizada!",
          description: `${Object.keys(responses).length} IAs responderam`,
        });

      } catch (error: any) {
        console.error("Erro:", error);
        toast({
          title: "Erro",
          description: error.message || "Erro na batalha de IAs",
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
      }
    } else {
      setStreamingResponse("");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brainstorm-ideas`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              aiModel
            })
          }
        );

        if (!response.ok || !response.body) {
          throw new Error('Falha ao iniciar streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || '';
                fullResponse += content;
                setStreamingResponse(fullResponse);
              } catch (e) {
                // Linha incompleta, ignora
              }
            }
          }
        }

        // Salvar no histórico
        await supabase.from('brainstorm_ideas').insert({
          niche: prompt.slice(0, 200),
          sub_niche: null,
          language: 'pt',
          ideas: [fullResponse],
          ai_model: aiModel,
          user_id: user?.id
        });

        await loadHistory();
        
        toast({
          title: "Resposta Completa!",
          description: "A IA finalizou a geração",
        });

      } catch (error: any) {
        console.error("Erro:", error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao gerar resposta",
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
      }
    }
  };

  const handleSelectWinner = async (modelName: string) => {
    const winnerResponse = battleResponses[modelName];
    
    await supabase.from('brainstorm_ideas').insert({
      niche: prompt.slice(0, 200),
      sub_niche: `Batalha - Vencedor: ${modelName}`,
      language: 'pt',
      ideas: [winnerResponse],
      ai_model: modelName,
      user_id: user?.id
    });

    await loadHistory();
    
    toast({
      title: "Vencedor Selecionado!",
      description: `${modelName} salvo no histórico`,
    });
  };

  const handleExportPDF = (model: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorm-${model}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportado!",
      description: `Resposta de ${model} exportada com sucesso`
    });
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('brainstorm_ideas').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Ideias removidas do histórico" });
  };

  const displayHistory = viewingHistory?.ideas?.[0] || "";

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
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">O que você quer descobrir?</Label>
              <span className={cn(
                "text-sm",
                prompt.length > 12000 ? "text-destructive font-semibold" : "text-muted-foreground"
              )}>
                {prompt.length}/12000
              </span>
            </div>
            <Textarea
              id="prompt"
              placeholder="Ex: Me dê 100 micronichos lucrativos de true crime para YouTube com CPM estimado..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {prompt.length > 12000 && (
              <p className="text-sm text-destructive">
                O prompt excede o limite de 12000 caracteres
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="battle-mode" className="text-base font-semibold cursor-pointer">
                  Batalha de IAs
                </Label>
                <p className="text-sm text-muted-foreground">
                  {battleMode 
                    ? `${selectedAIs.length} IA${selectedAIs.length > 1 ? 's' : ''} selecionada${selectedAIs.length > 1 ? 's' : ''}`
                    : 'Ative para comparar múltiplas IAs'
                  }
                </p>
              </div>
            </div>
            <Switch
              id="battle-mode"
              checked={battleMode}
              onCheckedChange={setBattleMode}
            />
          </div>

          {battleMode && (
            <Card className="p-4 bg-accent/5 border-dashed">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Selecione as IAs para batalhar:</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={selectAllAIs}
                      className="text-xs h-7"
                    >
                      Todas
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={deselectAllAIs}
                      className="text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_AI_MODELS.map((ai) => (
                    <div
                      key={ai.id}
                      onClick={() => toggleAI(ai.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105",
                        selectedAIs.includes(ai.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{ai.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{ai.name}</span>
                          <span className="text-xs text-muted-foreground">{ai.provider}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                        selectedAIs.includes(ai.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}>
                        {selectedAIs.includes(ai.id) && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {!battleMode && (
            <AIModelSelector 
              value={aiModel} 
              onChange={setAiModel} 
              label="Modelo de IA" 
            />
          )}

          <Button
            onClick={handleStreamIdeas}
            disabled={isStreaming || !prompt.trim() || prompt.length > 12000 || (battleMode && selectedAIs.length === 0)}
            className="w-full"
          >
            {isStreaming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {battleMode ? 'Batalha em Andamento...' : 'Gerando Resposta...'}
              </>
            ) : (
              <>
                {battleMode ? <Swords className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {battleMode ? `Iniciar Batalha (${selectedAIs.length} IA${selectedAIs.length > 1 ? 's' : ''})` : 'Enviar Pergunta'}
              </>
            )}
          </Button>
        </div>
      </Card>

      {battleMode && Object.keys(battleResponses).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Arena de Batalha
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(battleResponses).map(([model, response]) => (
              <Card key={model} className="p-6 shadow-medium border-2 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-bold text-lg">{model}</h3>
                  </div>
                  {!isStreaming && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectWinner(model)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Trophy className="h-4 w-4" />
                        Escolher
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleExportPDF(model, response)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar PDF
                      </Button>
                    </div>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed max-h-[500px] overflow-y-auto">
                    {response}
                    {isStreaming && <span className="animate-pulse ml-1">▋</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!battleMode && (isStreaming || streamingResponse || viewingHistory) && (
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {viewingHistory ? 'Visualizando Histórico' : 'Resposta da IA'}
            </h2>
            {viewingHistory && (
              <Button onClick={() => setViewingHistory(null)} variant="outline" size="sm">
                Fechar
              </Button>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {viewingHistory ? displayHistory : streamingResponse}
              {isStreaming && <span className="animate-pulse ml-1">▋</span>}
            </div>
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
