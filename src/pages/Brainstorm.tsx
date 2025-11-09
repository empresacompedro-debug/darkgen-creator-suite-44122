import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, Trash2, Eye, BookOpen, Swords, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/brainstorm/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";

const Brainstorm = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState("claude-sonnet-4.5");
  const [battleMode, setBattleMode] = useState(false);
  const [battleResponses, setBattleResponses] = useState<Record<string, string>>({});
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
              battleMode: true
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
            <Label htmlFor="prompt">O que você quer descobrir?</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Me dê 100 micronichos lucrativos de true crime para YouTube com CPM estimado..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="battle-mode" className="text-base font-semibold cursor-pointer">
                  Batalha de IAs
                </Label>
                <p className="text-sm text-muted-foreground">
                  Todas as IAs com API key respondem simultaneamente
                </p>
              </div>
            </div>
            <Switch
              id="battle-mode"
              checked={battleMode}
              onCheckedChange={setBattleMode}
            />
          </div>

          {!battleMode && (
            <AIModelSelector 
              value={aiModel} 
              onChange={setAiModel} 
              label="Modelo de IA" 
            />
          )}

          <Button
            onClick={handleStreamIdeas}
            disabled={isStreaming || !prompt.trim()}
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
                {battleMode ? 'Iniciar Batalha' : 'Enviar Pergunta'}
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
                    <Button 
                      size="sm" 
                      onClick={() => handleSelectWinner(model)}
                      className="gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Escolher
                    </Button>
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
