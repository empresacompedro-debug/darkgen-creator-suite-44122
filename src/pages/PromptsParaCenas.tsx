import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, Download, Trash2, History, Sparkles, Zap } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CharacterManager } from "@/components/prompts/CharacterManager";
import { CharacterData } from "@/components/prompts/CharacterForm";
import { cleanScriptMarkings, countWords } from "@/lib/scriptUtils";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import { cn } from "@/lib/utils";

const PromptsParaCenas = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [script, setScript] = useState("");
  const [generationMode, setGenerationMode] = useState("auto");
  const [sceneStyle, setSceneStyle] = useState("photorealistic");
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [optimizeFor, setOptimizeFor] = useState("flux");
  const [language, setLanguage] = useState("pt");
  const [includeText, setIncludeText] = useState(false);
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5");
  const [generatedPrompts, setGeneratedPrompts] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('scene_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!script.trim()) {
      toast({
        title: "Roteiro vazio",
        description: "Por favor, insira um roteiro antes de gerar os prompts.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGenerationProgress(5);
    setGeneratedPrompts("");

    const abortController = new AbortController();
    const STREAM_TIMEOUT = 180000; // 3 minutos
    let lastChunkTime = Date.now();
    let warningShown = false;

    const timeoutChecker = setInterval(() => {
      const timeSinceLastChunk = Date.now() - lastChunkTime;
      
      if (timeSinceLastChunk > 60000 && !warningShown) {
        console.log('⏳ Geração lenta detectada (60s). Aguardando...');
        setGenerationProgress(prev => Math.min(prev + 5, 70));
        warningShown = true;
      }
      
      if (timeSinceLastChunk > STREAM_TIMEOUT) {
        console.error('⏱️ Stream timeout - sem dados por 3min');
        abortController.abort();
        clearInterval(timeoutChecker);
      }
    }, 10000);

    try {
      console.log('🚀 Iniciando geração de prompts...');
      setGenerationProgress(10);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-prompts-v2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            script,
            generationMode,
            sceneStyle,
            characters,
            optimizeFor,
            language,
            includeText,
            aiModel,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Resposta sem corpo");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      setGenerationProgress(20);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('✅ Stream concluído');
          break;
        }

        lastChunkTime = Date.now();
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('🏁 Recebido [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Accept both {text} (new standard) and {content} (fallback)
              const chunk = parsed.text || parsed.content || '';
              
              if (chunk) {
                accumulatedText += chunk;
                setGeneratedPrompts(accumulatedText);
                setGenerationProgress(prev => Math.min(prev + 1, 90));
              }
              
              if (parsed.heartbeat) {
                console.log('💓 Heartbeat recebido');
              }
            } catch (parseError) {
              console.error('Erro ao parsear JSON:', parseError, 'Data:', data);
            }
          }
        }
      }

      clearInterval(timeoutChecker);

      if (!accumulatedText.trim()) {
        throw new Error("Nenhum conteúdo foi gerado");
      }

      setGenerationProgress(95);

      // Save to database
      if (user) {
        const { error: saveError } = await supabase.from("scene_prompts").insert({
          user_id: user.id,
          script_content: script.substring(0, 500),
          prompts: accumulatedText,
          generation_mode: generationMode,
          scene_style: sceneStyle,
          characters,
          optimize_for: optimizeFor,
          language,
          include_text: includeText,
          ai_model: aiModel,
        });

        if (saveError) {
          console.error("Erro ao salvar prompts:", saveError);
          toast({
            title: "Aviso",
            description: "Prompts gerados mas não foi possível salvar no histórico.",
            variant: "destructive",
          });
        } else {
          await loadHistory();
        }
      }

      setGenerationProgress(100);
      toast({
        title: "✅ Prompts Gerados!",
        description: `${accumulatedText.split('**Cena').length - 1} cenas criadas com sucesso.`,
      });

    } catch (error: any) {
      console.error("Erro ao gerar prompts:", error);
      clearInterval(timeoutChecker);
      
      let errorMessage = error.message || "Erro desconhecido ao gerar prompts.";
      let errorTitle = "Erro ao Gerar Prompts";
      
      if (error.name === 'AbortError') {
        errorTitle = "⏱️ Timeout de Geração";
        errorMessage = "A geração demorou mais de 3 minutos. Tente:\n• Dividir o roteiro em partes menores\n• Usar o modo 'Por Fala' ao invés de 'Automático'\n• Verificar se sua chave de API está ativa em Configurações";
      } else if (errorMessage.includes('Limite de requisições')) {
        errorTitle = "⚠️ Limite Atingido";
        errorMessage = "Limite de requisições da API atingido. Aguarde alguns minutos ou adicione outra chave em Configurações.";
      } else if (errorMessage.includes('bloqueado por políticas')) {
        errorTitle = "🚫 Conteúdo Bloqueado";
        errorMessage = "O modelo bloqueou o conteúdo por políticas de segurança. Tente:\n• Ajustar o roteiro (remover termos sensíveis)\n• Usar outro modelo de IA (Claude/GPT)\n• Contatar suporte se o conteúdo é adequado";
      } else if (errorMessage.includes('Nenhuma chave de API')) {
        errorTitle = "🔑 Chave de API Necessária";
        errorMessage = "Configure pelo menos uma chave de API em Configurações para gerar prompts.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  };

  const handleDetectCharacters = async () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Cole o roteiro para detectar personagens",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-characters', {
        body: { script, aiModel }
      });

      if (error) throw error;

      // Processar resposta estruturada
      const detectedCharacters: CharacterData[] = data.characters || [];
      setCharacters(detectedCharacters);
      
      toast({
        title: "Personagens Detectados!",
        description: `${detectedCharacters.length} personagem(ns) identificado(s) com IA. Revise e complete os detalhes.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao detectar personagens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const { error } = await supabase.from('scene_prompts').delete().eq('id', id);
      if (error) throw error;
      await loadHistory();
      toast({ title: "Prompt excluído com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleImportLastScript = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "📝 Nenhum Roteiro Encontrado",
          description: "Vá até 'Criador de Conteúdo' e crie um roteiro primeiro!",
          action: (
            <Button size="sm" onClick={() => window.location.href = '/criador-conteudo'}>
              Ir para Criador
            </Button>
          ),
          duration: 5000,
        });
        return;
      }

      const cleanedScript = cleanScriptMarkings(data.content);
      const wordCount = countWords(cleanedScript);
      setScript(cleanedScript);

      toast({
        title: "✅ Roteiro Importado!",
        description: `${wordCount} palavras importadas. Preview: "${cleanedScript.substring(0, 100)}..."`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Importar",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const exportPrompts = (withTitles: boolean) => {
    let content = generatedPrompts;
    
    // Adicionar ficha de personagens no início
    if (characters.length > 0) {
      let characterSheet = "=== FICHA DE PERSONAGENS PARA REFERÊNCIA ===\n\n";
      characters.forEach((char, index) => {
        characterSheet += `PERSONAGEM ${index + 1}: ${char.name}\n`;
        characterSheet += `Age: ${char.age}\n`;
        characterSheet += `Face: ${char.faceShape}\n`;
        characterSheet += `Eyes: ${char.eyes}\n`;
        if (char.nose) characterSheet += `Nose: ${char.nose}\n`;
        if (char.mouth) characterSheet += `Mouth: ${char.mouth}\n`;
        characterSheet += `Hair: ${char.hair}\n`;
        characterSheet += `Physique: ${char.physique}\n`;
        if (char.height) characterSheet += `Height: ${char.height}\n`;
        characterSheet += `Skin: ${char.skinTone}\n`;
        if (char.distinctiveMarks) characterSheet += `Distinctive Marks: ${char.distinctiveMarks}\n`;
        characterSheet += `Clothing: ${char.clothing}\n`;
        if (char.accessories) characterSheet += `Accessories: ${char.accessories}\n`;
        if (char.posture) characterSheet += `Posture: ${char.posture}\n`;
        characterSheet += "\n";
      });
      characterSheet += "=== PROMPTS DE CENA ===\n\n";
      content = characterSheet + content;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = withTitles ? 'prompts-com-ficha-personagens.txt' : 'prompts-apenas.txt';
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Prompts para Cenas</h1>
            <p className="text-muted-foreground text-lg">
              Gere prompts de imagem otimizados para o seu roteiro
            </p>
          </div>
          <HelpTooltip 
            description="🎬 Transforme roteiros em prompts visuais detalhados para IA (Flux, DALL-E, Stable Diffusion, etc.) com consistência de personagens"
            steps={[
              "Cole o roteiro ou importe o último criado",
              "Configure estilo visual e modelo de IA",
              "Opcional: Detecte personagens automaticamente",
              "Gere os prompts otimizados",
              "Exporte para usar em ferramentas de IA"
            ]}
          />
        </div>
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Ocultar' : 'Ver'} Histórico
        </Button>
      </div>

      {showHistory && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Histórico de Prompts</h2>
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setGeneratedPrompts(item.prompts)}>
                      Ver
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeletePrompt(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="script">Roteiro Completo</Label>
                <HelpTooltip description="Cole o roteiro completo ou clique em 'Importar' para carregar o último roteiro gerado automaticamente" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportLastScript}
                disabled={isImporting}
                className="border-accent text-accent hover:bg-accent/10 gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    ⚡ Importar Últimas Gerações
                  </>
                )}
              </Button>
            </div>
            <Textarea id="script" placeholder="Cole o roteiro completo aqui..." value={script} onChange={(e) => setScript(e.target.value)} className="min-h-[200px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generationMode">Modo de Geração</Label>
              <Select value={generationMode} onValueChange={setGenerationMode}>
                <SelectTrigger id="generationMode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Geração Automática de Cenas</SelectItem>
                  <SelectItem value="manual">Geração Manual por Palavras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sceneStyle">Estilo da Cena</Label>
              <Select value={sceneStyle} onValueChange={setSceneStyle}>
                <SelectTrigger id="sceneStyle"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealistic">Foto realista</SelectItem>
                  <SelectItem value="cinematic">Cinematográfico</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="fantasy">Fantasia</SelectItem>
                  <SelectItem value="stick-figure">Desenho de Palitos</SelectItem>
                  <SelectItem value="cartoon">Desenho Animado</SelectItem>
                  <SelectItem value="whiteboard">Animação de Quadro Branco</SelectItem>
                  <SelectItem value="modern-documentary">Documentário Moderno</SelectItem>
                  <SelectItem value="viral-vibrant">Estilo Viral Vibrante</SelectItem>
                  <SelectItem value="tech-minimalist">Estética Tech Minimalista</SelectItem>
                  <SelectItem value="analog-horror">Terror Analógico</SelectItem>
                  <SelectItem value="cinematic-narrative">Narrativa Cinematográfica</SelectItem>
                  <SelectItem value="cartoon-premium">Cartoon Style Premium</SelectItem>
                  <SelectItem value="neo-spiritual">Neo-Realismo Espiritual</SelectItem>
                  <SelectItem value="psychological-surrealism">Surrealismo Psicológico</SelectItem>
                  <SelectItem value="fragmented-memory">Memória Fragmentada</SelectItem>
                  <SelectItem value="dark-theater">Teatro Sombrio</SelectItem>
                  <SelectItem value="naturalist-drama">Drama Naturalista</SelectItem>
                  <SelectItem value="vhs-nostalgic">Estilo VHS Nostálgico</SelectItem>
                  <SelectItem value="spiritual-minimalist">Narrativa Espiritual Minimalista</SelectItem>
                  <SelectItem value="fragmented-narrative">Narrativa Fragmentada</SelectItem>
                  <SelectItem value="dream-real">Estilo Sonho-Real</SelectItem>
                  <SelectItem value="reflexive-monologue">Monólogo Reflexivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label>Personagens Consistentes</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Quanto mais detalhes, melhor a consistência visual entre cenas
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDetectCharacters} 
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Detectar com IA
              </Button>
            </div>
            <CharacterManager 
              characters={characters}
              onCharactersChange={setCharacters}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="optimizeFor">Otimizar Prompt Para</Label>
              <Select value={optimizeFor} onValueChange={setOptimizeFor}>
                <SelectTrigger id="optimizeFor"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>🌟 Pollinations (Recomendado)</SelectLabel>
                    <SelectItem value="flux">Flux - Universal e rápido</SelectItem>
                    <SelectItem value="flux-realism">Flux Realism - Fotorrealista</SelectItem>
                    <SelectItem value="flux-anime">Flux Anime - Estilo anime</SelectItem>
                    <SelectItem value="flux-3d">Flux 3D - Renderizações 3D</SelectItem>
                    <SelectItem value="turbo">Turbo - Ultra-rápido</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>⚡ HuggingFace Oficial</SelectLabel>
                    <SelectItem value="flux-schnell">FLUX.1 Schnell - Imagens realistas</SelectItem>
                    <SelectItem value="flux-dev">FLUX.1 Dev - Ultra-realista</SelectItem>
                    <SelectItem value="sdxl">Stable Diffusion XL - Arte conceitual</SelectItem>
                    <SelectItem value="sd-21">Stable Diffusion 2.1 - Testes rápidos</SelectItem>
                    <SelectItem value="sd-15">Stable Diffusion 1.5 - Cartoon/Stylizado</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>🎨 Outros</SelectLabel>
                    <SelectItem value="dall-e-3">DALL-E 3 - OpenAI</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion - Genérico</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma do Texto na Imagem</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português BR</SelectItem>
                  <SelectItem value="en">English US</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="includeText" checked={includeText} onCheckedChange={(checked) => setIncludeText(!!checked)} />
            <label htmlFor="includeText" className="text-sm">Incluir texto na imagem</label>
          </div>

          <AIModelSelector 
            value={aiModel} 
            onChange={setAiModel}
            label="Modelo de IA"
          />

          <Button 
            onClick={handleGeneratePrompts} 
            disabled={isLoading} 
            className={cn(
              "w-full",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ⚡ IA está escrevendo...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Prompts de Cena
              </>
            )}
          </Button>
          
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center animate-pulse">
              💭 Analisando roteiro e criando prompts detalhados...
            </div>
          )}
        </div>
      </Card>

      {generatedPrompts && (
        <Card className="p-6 shadow-soft">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Prompts Gerados</h2>
            <Textarea value={generatedPrompts} readOnly className="min-h-[400px] font-mono text-sm" />
            <div className="flex gap-4">
              <Button onClick={() => exportPrompts(true)} variant="outline">
                <Download className="h-4 w-4 mr-2" />Exportar com Títulos
              </Button>
              <Button onClick={() => exportPrompts(false)} variant="outline">
                <Download className="h-4 w-4 mr-2" />Exportar Apenas Prompts
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PromptsParaCenas;
