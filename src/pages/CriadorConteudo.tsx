import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2, Download, Trash2, Target, Lightbulb, Languages, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ScriptAnalysisCard } from "@/components/script/ScriptAnalysisCard";
import { ScriptActions } from "@/components/script/ScriptActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/script/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
const CriadorConteudo = () => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados para continuação
  const [canContinue, setCanContinue] = useState(false);
  const [continuationContext, setContinuationContext] = useState("");
  const [expectedWords, setExpectedWords] = useState(0);
  const [currentWords, setCurrentWords] = useState(0);
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [theme, setTheme] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [parts, setParts] = useState("3");
  const [wordsPerPart, setWordsPerPart] = useState("2000");
  const [language, setLanguage] = useState("pt");
  const [tone, setTone] = useState("mysterious");
  const [formula, setFormula] = useState("ethical-retention");
  const [ctaPositions, setCtaPositions] = useState<string[]>(["end"]);
  const [narrativeOnly, setNarrativeOnly] = useState(false);
  const [includeAffiliate, setIncludeAffiliate] = useState(false);
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5");
  const [script, setScript] = useState("");
  const [showManual, setShowManual] = useState(false);
  useEffect(() => {
    loadHistory();

    // Verificar se há checkpoint salvo
    const checkpoint = localStorage.getItem('script_checkpoint');
    if (checkpoint) {
      try {
        const data = JSON.parse(checkpoint);
        const ageMinutes = (Date.now() - data.timestamp) / 1000 / 60;

        // Se checkpoint tem menos de 30 minutos
        if (ageMinutes < 30) {
          toast({
            title: "📥 Rascunho Encontrado",
            description: `Encontramos um roteiro com ${data.words} palavras de ${Math.round(ageMinutes)} minutos atrás.`,
            action: <Button size="sm" onClick={() => {
              setScript(data.content);
              setNiche(data.params.niche);
              setTheme(data.params.theme);
              setTone(data.params.tone);
              setAiModel(data.params.aiModel);
              setCanContinue(true);
              setCurrentWords(data.words);
              setExpectedWords(data.expectedWords || data.words * 2);
              setContinuationContext(data.content.slice(-1000)); // Contexto otimizado
              toast({
                title: "✅ Rascunho recuperado!"
              });
            }}>
                Recuperar
              </Button>,
            duration: 15000
          });
        }
      } catch (e) {
        console.error('Erro ao recuperar checkpoint:', e);
      }
    }
  }, []);
  const loadHistory = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('scripts').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  const analyzeScript = async (scriptToAnalyze: string) => {
    setIsAnalyzing(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-script', {
        body: {
          script: scriptToAnalyze,
          niche,
          aiModel
        }
      });
      if (error) throw error;
      setAnalysis(data.analysis);
      toast({
        title: "Análise Concluída!",
        description: `Pontuação geral: ${data.analysis.overall}/100`
      });
    } catch (error: any) {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleGenerateScript = async () => {
    if (!niche.trim() || !theme.trim()) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Nicho e Tema)",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setIsStreaming(true);
    setAnalysis(null);
    setScript("");
    setStreamProgress(0);
    setCanContinue(false);
    const totalWords = parseInt(parts) * parseInt(wordsPerPart);
    setExpectedWords(totalWords);
    setCurrentWords(0);
    try {
      const duration = Math.ceil(totalWords / 150);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          niche,
          audience,
          theme,
          searchTerm,
          duration,
          parts: parseInt(parts),
          wordsPerPart: parseInt(wordsPerPart),
          language,
          tone,
          formula,
          ctaPositions,
          narrativeOnly,
          includeAffiliate,
          aiModel
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar roteiro');
      }
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedScript = "";
      let buffer = "";
      let wordsSinceLastCheckpoint = 0;
      const CHECKPOINT_INTERVAL = 5000;
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulatedScript += parsed.text;
                setScript(accumulatedScript);
                const words = accumulatedScript.split(/\s+/).length;
                setStreamProgress(words);
                setCurrentWords(words);

                // Checkpoint automático
                if (words - wordsSinceLastCheckpoint >= CHECKPOINT_INTERVAL) {
                  localStorage.setItem('script_checkpoint', JSON.stringify({
                    content: accumulatedScript,
                    words: words,
                    expectedWords: totalWords,
                    timestamp: Date.now(),
                    params: {
                      niche,
                      theme,
                      tone,
                      aiModel
                    }
                  }));
                  wordsSinceLastCheckpoint = words;
                  console.log(`✅ Checkpoint salvo: ${words} palavras`);
                }
              }
            } catch (e) {
              console.error('Erro ao parsear chunk:', e);
            }
          }
        }
      }
      setIsStreaming(false);
      localStorage.removeItem('script_checkpoint'); // Limpar checkpoint após sucesso

      // Salvar no banco após conclusão
      await supabase.from('scripts').insert({
        title: theme,
        content: accumulatedScript,
        niche,
        theme,
        tone,
        ai_model: aiModel,
        user_id: user?.id,
        is_draft: false
      });
      await loadHistory();
      toast({
        title: "Roteiro Gerado!",
        description: "Seu roteiro foi criado e salvo com sucesso"
      });

      // Analisar automaticamente
      await analyzeScript(accumulatedScript);
    } catch (error: any) {
      console.error('Erro na geração:', error);

      // Se tinha conteúdo parcial, habilitar continuação
      const currentScript = script;
      if (currentScript.length > 100) {
        setCanContinue(true);
        setContinuationContext(currentScript.slice(-1000)); // Contexto otimizado

        // Salvar rascunho automaticamente
        try {
          await supabase.from('scripts').insert({
            title: `${theme} (Rascunho)`,
            content: currentScript,
            niche,
            theme,
            tone,
            ai_model: aiModel,
            user_id: user?.id,
            is_draft: true
          });
        } catch (e) {
          console.error('Erro ao salvar rascunho:', e);
        }
        toast({
          title: "⚠️ Geração Interrompida",
          description: `${currentWords} palavras salvas. Você pode continuar de onde parou!`,
          duration: 10000
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao gerar roteiro",
          variant: "destructive"
        });
      }
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };
  const handleContinueGeneration = async () => {
    if (!canContinue) return;

    // Validar campos obrigatórios novamente
    if (!niche.trim() || !theme.trim()) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Nicho e Tema) antes de continuar",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setIsStreaming(true);
    try {
      const remainingWords = Math.max(expectedWords - currentWords, parseInt(wordsPerPart));

      // Contexto otimizado: apenas 1000 caracteres para evitar requisições muito grandes
      const optimizedContext = continuationContext.length > 1000 ? continuationContext.slice(-1000) : continuationContext;
      const continuationPrompt = `CONTINUE o roteiro abaixo de onde parou. 
Mantenha EXATAMENTE o mesmo tom, estilo e narrativa.

Contexto (últimos parágrafos):
${optimizedContext}

Continue escrevendo aproximadamente ${remainingWords} palavras adicionais.
NÃO repita nada que já foi escrito, apenas CONTINUE de forma natural.`;
      console.log('📝 Continuando com:', {
        niche,
        themeOriginal: theme.substring(0, 50),
        remainingWords,
        contextLength: optimizedContext.length
      });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          niche: niche.trim(),
          audience: audience || "",
          theme: continuationPrompt,
          searchTerm: searchTerm || "",
          duration: Math.ceil(remainingWords / 150),
          parts: 1,
          wordsPerPart: remainingWords,
          language,
          tone,
          formula,
          ctaPositions,
          narrativeOnly,
          includeAffiliate,
          aiModel,
          isContinuation: true
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao continuar roteiro');
      }
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedScript = script; // Começa do conteúdo atual!
      let buffer = "";
      let wordsSinceLastCheckpoint = currentWords;
      const CHECKPOINT_INTERVAL = 5000;
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulatedScript += parsed.text;
                setScript(accumulatedScript);
                const words = accumulatedScript.split(/\s+/).length;
                setCurrentWords(words);
                setStreamProgress(words);

                // Checkpoint automático
                if (words - wordsSinceLastCheckpoint >= CHECKPOINT_INTERVAL) {
                  localStorage.setItem('script_checkpoint', JSON.stringify({
                    content: accumulatedScript,
                    words: words,
                    expectedWords: expectedWords,
                    timestamp: Date.now(),
                    params: {
                      niche,
                      theme,
                      tone,
                      aiModel
                    }
                  }));
                  wordsSinceLastCheckpoint = words;
                  console.log(`✅ Checkpoint salvo: ${words} palavras`);
                }
              }
            } catch (e) {
              console.error('Erro ao parsear chunk:', e);
            }
          }
        }
      }
      setIsStreaming(false);
      setCanContinue(false);
      localStorage.removeItem('script_checkpoint');

      // Salvar versão final
      await supabase.from('scripts').insert({
        title: theme,
        content: accumulatedScript,
        niche,
        theme,
        tone,
        ai_model: aiModel,
        user_id: user?.id,
        is_draft: false
      });
      await loadHistory();
      toast({
        title: "✅ Roteiro Completo!",
        description: "Geração continuada com sucesso"
      });
      await analyzeScript(accumulatedScript);
    } catch (error: any) {
      console.error('Erro ao continuar:', error);
      toast({
        title: "Erro ao continuar",
        description: error.message,
        variant: "destructive"
      });
      setCanContinue(true); // Manter opção de tentar novamente
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };
  const handleImproveScript = async () => {
    if (!analysis?.weaknesses || analysis.weaknesses.length === 0) {
      toast({
        title: "Nada a melhorar",
        description: "Seu roteiro já está perfeito!"
      });
      return;
    }
    setIsImproving(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('improve-script', {
        body: {
          script,
          weaknesses: analysis.weaknesses,
          aiModel
        }
      });
      if (error) throw error;
      const improvedScript = data.improvedScript || "";
      setScript(improvedScript);

      // Atualizar no banco
      await supabase.from('scripts').insert({
        title: `${theme} (Melhorado)`,
        content: improvedScript,
        niche,
        theme,
        tone,
        ai_model: aiModel,
        user_id: user?.id
      });
      await loadHistory();
      toast({
        title: "Roteiro Melhorado!",
        description: "As partes foram reescritas com base nas sugestões"
      });

      // Re-analisar
      await analyzeScript(improvedScript);
    } catch (error: any) {
      toast({
        title: "Erro ao melhorar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  };
  const handleDeleteScript = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('scripts').delete().eq('id', id);
      if (error) throw error;
      await loadHistory();
      toast({
        title: "Roteiro excluído com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDownloadScript = (content: string, title: string) => {
    const blob = new Blob([content], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
  };
  const handleClearScript = () => {
    setScript("");
    setAnalysis(null);
    setStreamProgress(0);
    setCanContinue(false);
    setCurrentWords(0);
    setExpectedWords(0);
    localStorage.removeItem('script_checkpoint');
    toast({
      title: "Roteiro limpo",
      description: "Pronto para criar um novo roteiro"
    });
  };
  const handlePrepareForContinuation = () => {
    if (!script || script.length < 100) {
      toast({
        title: "Roteiro muito curto",
        description: "Adicione mais conteúdo antes de continuar",
        variant: "destructive"
      });
      return;
    }

    // Validar campos obrigatórios
    if (!niche.trim() || !theme.trim()) {
      toast({
        title: "Campos obrigatórios vazios",
        description: "Preencha Nicho e Tema antes de continuar",
        variant: "destructive"
      });
      return;
    }
    const words = script.split(/\s+/).length;
    const estimatedTotal = Math.max(words * 2, parseInt(parts) * parseInt(wordsPerPart));
    setCurrentWords(words);
    setExpectedWords(estimatedTotal);
    setContinuationContext(script.slice(-1000)); // Reduzido para 1000 caracteres
    setCanContinue(true);

    // Salvar checkpoint com parâmetros
    localStorage.setItem('script_checkpoint', JSON.stringify({
      content: script,
      words: words,
      expectedWords: estimatedTotal,
      timestamp: Date.now(),
      params: {
        niche,
        theme,
        tone,
        aiModel,
        parts,
        wordsPerPart,
        language,
        formula
      }
    }));
    toast({
      title: "✅ Pronto para continuar!",
      description: `${words.toLocaleString()} palavras detectadas. Clique em "Continuar de onde parou"`
    });
  };

  // Auto-scroll do textarea durante streaming
  useEffect(() => {
    if (scriptTextareaRef.current && isStreaming) {
      scriptTextareaRef.current.scrollTop = scriptTextareaRef.current.scrollHeight;
    }
  }, [script, isStreaming]);
  return <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Criador de Conteúdo</h1>
          <p className="text-muted-foreground text-lg">Gere roteiros envolventes e otimizados para o seu canal dark</p>
        </div>
        <Button onClick={() => setShowManual(true)} variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Ver Manual Completo
        </Button>
      </div>

      {/* Ferramentas de Criação */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/sub-niche-hunter">
          <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group h-full">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:scale-110 transition-transform mb-3">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">Sub-Niche Hunter</CardTitle>
              <CardDescription>
                Descubra sub-nichos e expanda estratégias de conteúdo
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/brainstorm">
          <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group h-full">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light group-hover:scale-110 transition-transform mb-3">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Brainstorm</CardTitle>
              <CardDescription>
                Gere ideias criativas para vídeos do seu nicho
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/tradutor-roteiros">
          <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group h-full">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted-foreground group-hover:scale-110 transition-transform mb-3">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Tradutor de Roteiros</CardTitle>
              <CardDescription>
                Traduza seus roteiros para múltiplos idiomas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho do Canal *</Label>
              <Input id="niche" placeholder="ex: True Crime" value={niche} onChange={e => setNiche(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Público-Alvo</Label>
              <Input id="audience" placeholder="ex: Jovens adultos" value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema do Vídeo *</Label>
            <Input id="theme" placeholder="ex: O Mistério do Triângulo das Bermudas" value={theme} onChange={e => setTheme(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchTerm">Termo de Pesquisa (Opcional)</Label>
            <Input id="searchTerm" placeholder="ex: True Crime Brasil" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parts">Número de Partes</Label>
              <Input id="parts" type="number" min="1" value={parts} onChange={e => setParts(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wordsPerPart">Palavras por Parte</Label>
              <Input id="wordsPerPart" type="number" min="500" value={wordsPerPart} onChange={e => setWordsPerPart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração Estimada (min)</Label>
              <Input id="duration" type="number" value={Math.ceil(parseInt(parts) * parseInt(wordsPerPart) / 150)} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tom Narrativo</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mysterious">Envolvente e Misterioso</SelectItem>
                  <SelectItem value="informative">Informativo e Claro</SelectItem>
                  <SelectItem value="funny">Cômico e Divertido</SelectItem>
                  <SelectItem value="serious">Sério e Formal</SelectItem>
                  <SelectItem value="inspirational">Inspirador e Motivacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formula">Fórmula de Estrutura</Label>
            <Select value={formula} onValueChange={setFormula}>
              <SelectTrigger id="formula"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personalized">🧠 PERSONALIZADO</SelectItem>
                <SelectItem value="ethical-retention">🔥 ALTA RETENÇÃO ÉTICA</SelectItem>
                <SelectItem value="christian">✝️ CANAIS CRISTÃOS</SelectItem>
                <SelectItem value="automotive">🚗 AUTOMOBILISMO & CARROS</SelectItem>
                <SelectItem value="curiosities">🧩 CURIOSIDADES</SelectItem>
                <SelectItem value="psychology">🧠 PSICOLOGIA & DESENVOLVIMENTO</SelectItem>
                <SelectItem value="space">🪐 PLANETAS & ESPAÇO</SelectItem>
                <SelectItem value="productivity">💼 PRODUTIVIDADE & FOCO</SelectItem>
                <SelectItem value="business">💰 NEGÓCIOS & EMPREENDEDORISMO</SelectItem>
                <SelectItem value="finance">📊 FINANÇAS & INVESTIMENTOS</SelectItem>
                <SelectItem value="history">🏺 HISTÓRIA EMOCIONANTE</SelectItem>
                <SelectItem value="science">🔬 CIÊNCIA & TECNOLOGIA</SelectItem>
                <SelectItem value="emotional">❤️ HISTÓRIAS EMOCIONANTES</SelectItem>
                <SelectItem value="romance">💕 HISTÓRIAS ROMÂNTICAS</SelectItem>
                <SelectItem value="fitness">💪 FITNESS & SAÚDE</SelectItem>
                <SelectItem value="mystery">🎭 DRAMA & MISTÉRIO</SelectItem>
                <SelectItem value="gaming">🎮 ENTRETENIMENTO & GAMING</SelectItem>
                <SelectItem value="marketing">📈 MARKETING & VENDAS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Posição do CTA (Chamada para Ação)</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="cta-start" checked={ctaPositions.includes("start")} onCheckedChange={checked => setCtaPositions(prev => checked ? [...prev, "start"] : prev.filter(p => p !== "start"))} />
                <label htmlFor="cta-start" className="text-sm">Início</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cta-middle" checked={ctaPositions.includes("middle")} onCheckedChange={checked => setCtaPositions(prev => checked ? [...prev, "middle"] : prev.filter(p => p !== "middle"))} />
                <label htmlFor="cta-middle" className="text-sm">Meio</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cta-end" checked={ctaPositions.includes("end")} onCheckedChange={checked => setCtaPositions(prev => checked ? [...prev, "end"] : prev.filter(p => p !== "end"))} />
                <label htmlFor="cta-end" className="text-sm">Fim</label>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="narrative-only" checked={narrativeOnly} onCheckedChange={checked => setNarrativeOnly(!!checked)} />
              <label htmlFor="narrative-only" className="text-sm">Apenas Narração (Para Voice Over)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="affiliate" checked={includeAffiliate} onCheckedChange={checked => setIncludeAffiliate(!!checked)} />
              <label htmlFor="affiliate" className="text-sm">Incluir Produto Para Afiliação</label>
            </div>
          </div>

          <AIModelSelector
            value={aiModel}
            onChange={setAiModel}
            label="Modelo de IA"
          />

          {/* Barra de progresso */}
          {(isStreaming || canContinue) && expectedWords > 0 && <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{
              width: `${Math.min(currentWords / expectedWords * 100, 100)}%`
            }} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {currentWords.toLocaleString()} / {expectedWords.toLocaleString()} palavras 
                ({Math.round(currentWords / expectedWords * 100)}%)
                {isStreaming && " - Gerando..."}
              </p>
            </div>}

          <div className="flex gap-2">
            {canContinue ? <>
                <Button onClick={handleContinueGeneration} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Continuando...
                    </> : <>
                      <FileText className="mr-2 h-4 w-4" />
                      Continuar de onde parou
                    </>}
                </Button>
                
                <Button onClick={() => {
              setCanContinue(false);
              setScript("");
              setCurrentWords(0);
              setExpectedWords(0);
              localStorage.removeItem('script_checkpoint');
              toast({
                title: "Pronto para novo roteiro"
              });
            }} variant="outline" disabled={isLoading}>
                  Começar do zero
                </Button>
              </> : <Button onClick={handleGenerateScript} disabled={isLoading} className="w-full">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isStreaming ? `Gerando... (${streamProgress.toLocaleString()} palavras)` : 'Gerando Roteiro...'}</> : <><FileText className="h-4 w-4 mr-2" />Gerar Roteiro</>}
              </Button>}
          </div>
          
          {isStreaming && <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando roteiro em tempo real...
            </div>}
        </div>
      </Card>

      {analysis && <ScriptAnalysisCard analysis={analysis} />}

      {script && <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Roteiro Gerado</h2>
            {!canContinue && !isStreaming && script.length > 100 && <Button onClick={handlePrepareForContinuation} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Preparar para Continuar
              </Button>}
          </div>
          <Textarea ref={scriptTextareaRef} value={script} readOnly className="min-h-[400px] font-mono text-sm mb-4" placeholder="Seu roteiro aparecerá aqui em tempo real..." />
          <ScriptActions script={script} theme={theme} onClear={handleClearScript} onImprove={handleImproveScript} showImprove={analysis && analysis.overall < 100 && !isImproving} />
          {isImproving && <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Melhorando roteiro...</span>
            </div>}
        </Card>}

      {history.length > 0 && <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Histórico de Roteiros</h2>
          <div className="space-y-4">
            {(showAllHistory ? history : history.slice(0, 5)).map(item => <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setScript(item.content)}>
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadScript(item.content, item.title)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteScript(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>)}
          </div>
          {history.length > 5 && <Button variant="outline" onClick={() => setShowAllHistory(!showAllHistory)} className="w-full mt-4">
              {showAllHistory ? 'Ver Menos' : `Ver Todos (${history.length})`}
            </Button>}
        </Card>}

      {/* Manual Completo */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Criador de Conteúdo</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>;
};
export default CriadorConteudo;