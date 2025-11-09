import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2, Target, Download, Trash2, TrendingUp, Save, FolderOpen, BookOpen, Zap, Copy, CheckCircle2, FileText, XCircle } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/subniche/UserManual";
import { useLoadingProgress, StageConfig } from "@/hooks/useLoadingProgress";
import { LoadingProgress } from "@/components/ui/loading-progress";
import { Sparkles, Database, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Trophy, ChevronRight } from "lucide-react";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SubNicheResult {
  nome: string;
  justificativa: string;
  exemplos: string[];
  palavras_chave: string[];
  formula_titulo: string;
  gancho_emocional: string;
  potencial: string;
  vph_medio: number;
  nivel_especificidade: number;
}

interface VideoInNiche {
  title: string;
  views: number;
  structure?: string;
}

interface MicroNicheRanking {
  rank: number;
  name: string;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo: number;
  description: string;
  titleStructure?: string;
  videos: VideoInNiche[];
  isChampion?: boolean;
}

interface Resumo1 {
  nicho_principal: string;
  sub_nichos: Array<{
    nome: string;
    descricao: string;
  }>;
  micro_sub_nichos: Array<{
    nome: string;
    descricao: string;
    exemplos_titulos: string[];
    estruturas_titulos: string[];
  }>;
}

interface Resumo2 {
  micro_nichos_ranking: MicroNicheRanking[];
  analise_campeao: string;
}

interface FailedMicroNiche {
  rank: number;
  name: string;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo: number;
  description: string;
  titleStructure?: string;
  failedTitles: string[];
  motivoFalha: string;
}

interface Resumo3 {
  micro_nichos_que_falharam: FailedMicroNiche[];
}

interface KeywordRanking {
  keyword: string;
  occurrences: number;
  avgViews: number;
  avgVPH: number;
  bestTitle: string;
  bestTitleViews: number;
}

interface PalavrasChaveCampeas {
  ranking: KeywordRanking[];
  observacao_detalhada: string;
}

interface AnalysisResult {
  sub_nichos: SubNicheResult[];
  insights: string;
  palavras_chave_campeas?: PalavrasChaveCampeas;
  resumo_1?: Resumo1;
  resumo_2?: Resumo2;
  resumo_3?: Resumo3;
}

interface ExpansionResult {
  nivel_detectado: string;
  lista_1: {
    titulo: string;
    descricao: string;
    items: string[];
  };
  lista_2: {
    titulo: string;
    descricao: string;
    items: string[];
  };
}

const SubNicheHunter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // PASSO 1: Limpa Títulos state
  const [rawTitles, setRawTitles] = useState("");
  const [cleanedTitles, setCleanedTitles] = useState("");
  const [showCleanedOutput, setShowCleanedOutput] = useState(false);

  // Função para extrair a estrutura de um título
  const extractTitleStructure = (title: string): string => {
    // Padrões comuns em títulos de horror
    // Ex: "3 Disturbing TRUE Halloween Scary Stories" -> "[NUMBER] [Adjectives] TRUE [THEME] Horror Stories"
    
    let structure = title;
    
    // Substituir números por placeholder
    structure = structure.replace(/\b\d+\b/g, '[NUMBER]');
    
    // Identificar palavras-chave temáticas específicas e substituir por placeholder
    const themes = [
      'Halloween', 'Christmas', 'Valentine', 'Easter', 'Thanksgiving', 'New Year',
      'Summer', 'Winter', 'Spring', 'Fall', 'Birthday', '4th of July', 'Memorial Day',
      'Highway', 'Remote Places', 'Childhood', 'Fishing', 'Airtag', 'Dead of Night',
      'Hide & Seek', 'Thunderstorm', 'Security Guard', 'School', 'Night Shift',
      'Janitor', 'Home Intrusion', 'Hidden Camera', 'Vacation', 'Trespassing',
      'Night Drive', 'Being Watched', 'Stalker', 'Uber', 'Beach', 'Woods',
      'Camping', 'Bar', 'Internet', 'Suburban', 'Urban', 'Dream', 'Lockdown',
      'Rainy Night', 'Countryside', 'Road Trip', 'Desert', 'Jogging', 'Neighbor',
      'Lake House', 'Boardwalk', 'Au Pair', 'Parenting', 'Deep Woods', 'Wilderness',
      'Trick-or-Treating', 'Black Friday', 'Scout', 'Dog Walking', 'Dog Sitting',
      'RING Cameras', 'Apple Airtag', 'Trick or Treating'
    ];
    
    for (const theme of themes) {
      const regex = new RegExp(theme, 'gi');
      structure = structure.replace(regex, '[THEME]');
    }
    
    // Manter adjetivos e palavras estruturais comuns
    // (Disturbing, Scary, Creepy, TRUE, Horror, Stories, etc. permanecem)
    
    return structure.trim();
  };
  
  // Análise de Títulos state
  const [competitorData, setCompetitorData] = useState("");
  const [aiModel1, setAiModel1] = useState("claude-sonnet-4.5");
  const [loading1, setLoading1] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [videosDetected, setVideosDetected] = useState(0);
  
  // Expansão de Nicho state
  const [mainNiche, setMainNiche] = useState("");
  const [language, setLanguage] = useState("Português");
  const [aiModel2, setAiModel2] = useState("claude-sonnet-4.5");
  const [loading2, setLoading2] = useState(false);
  const [expansionResult, setExpansionResult] = useState<ExpansionResult | null>(null);

  // Saved analyses state
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [analysisName, setAnalysisName] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Viral titles generation state
  interface ViralTitleGroup {
    championTitle: string;
    structure: string;
    variations: string[];
  }
  const [viralTitles, setViralTitles] = useState<{ [key: number]: ViralTitleGroup[] }>({});
  const [generatingViralFor, setGeneratingViralFor] = useState<number | null>(null);
  const [expandedViralCard, setExpandedViralCard] = useState<number | null>(null);
  const [copiedTitles, setCopiedTitles] = useState<{ [key: string]: boolean }>({});
  const [selectedAIModel, setSelectedAIModel] = useState("claude-sonnet-4.5");
  const [expandedMicroNiches, setExpandedMicroNiches] = useState<{ [key: number]: boolean }>({});

  const toggleMicroNicheExpansion = (rank: number) => {
    setExpandedMicroNiches(prev => ({
      ...prev,
      [rank]: !prev[rank]
    }));
  };

  // Loading progress for title analysis
  const titleAnalysisStages: StageConfig[] = [
    { stage: 'parsing', label: 'Analisando dados', duration: 3000, percentage: 15, details: 'Extraindo títulos, visualizações e métricas...' },
    { stage: 'hierarchy', label: 'Estrutura hierárquica', duration: 8000, percentage: 40, details: 'Identificando nicho, sub-nichos e micro-nichos...' },
    { stage: 'ranking', label: 'Análise de performance', duration: 10000, percentage: 70, details: 'Ranqueando micro-nichos e identificando campeões...' },
    { stage: 'failures', label: 'Detectando falhas', duration: 6000, percentage: 90, details: 'Analisando títulos com baixa performance...' },
    { stage: 'complete', label: 'Finalizando', duration: 2000, percentage: 100, details: 'Análise concluída com sucesso!' }
  ];

  const { progress: analysisProgress, startProgress: startAnalysisProgress, stopProgress: stopAnalysisProgress, completeProgress: completeAnalysisProgress } = useLoadingProgress(titleAnalysisStages);

  // Loading progress for viral generation
  const viralGenerationStages: StageConfig[] = [
    { stage: 'analyze', label: 'Analisando campeões', duration: 2000, percentage: 30, details: 'Extraindo estrutura e tema...' },
    { stage: 'generate', label: 'Gerando títulos virais', duration: 8000, percentage: 80, details: 'Criando 5 variações para cada campeão...' },
    { stage: 'complete', label: 'Finalizando', duration: 1000, percentage: 100, details: 'Títulos gerados com sucesso!' }
  ];

  const { progress: viralProgress, startProgress: startViralProgress, stopProgress: stopViralProgress, completeProgress: completeViralProgress } = useLoadingProgress(viralGenerationStages);

  const getAnalysisStageIcon = (stage: string) => {
    switch (stage) {
      case 'parsing': return 'Database';
      case 'hierarchy': return 'Target';
      case 'ranking': return 'TrendingUp';
      case 'failures': return 'AlertCircle';
      case 'complete': return 'CheckCircle';
      default: return 'Loader2';
    }
  };

  const getViralStageIcon = (stage: string) => {
    switch (stage) {
      case 'analyze': return 'Database';
      case 'generate': return 'Sparkles';
      case 'complete': return 'CheckCircle';
      default: return 'Loader2';
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedAnalyses();
    }
  }, [user]);

  const loadSavedAnalyses = async () => {
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('sub_niche_saved_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error: any) {
      console.error('Error loading saved analyses:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const saveCurrentAnalysis = async () => {
    if (!analysisName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a análise",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const analysisData: any = analysisResult ? {
        analysis_type: 'titles',
        analysis_name: analysisName,
        user_id: user.id,
        competitor_data: competitorData,
        videos_analyzed: videosDetected,
        sub_nichos: analysisResult.sub_nichos,
        insights: analysisResult.insights,
        ai_model: aiModel1,
      } : {
        analysis_type: 'expansion',
        analysis_name: analysisName,
        user_id: user.id,
        main_niche: mainNiche,
        nivel_detectado: expansionResult?.nivel_detectado,
        lista_1: expansionResult?.lista_1,
        lista_2: expansionResult?.lista_2,
        ai_model: aiModel2,
        language: language,
      };

      const { error } = await supabase
        .from('sub_niche_saved_analyses')
        .insert([analysisData]);

      if (error) throw error;

      toast({
        title: "✅ Análise Salva",
        description: "Análise salva com sucesso!",
      });

      setShowSaveDialog(false);
      setAnalysisName("");
      loadSavedAnalyses();
    } catch (error: any) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar análise",
        variant: "destructive",
      });
    }
  };

  const loadAnalysis = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('sub_niche_saved_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.analysis_type === 'titles') {
        setCompetitorData(data.competitor_data || "");
        setVideosDetected(data.videos_analyzed || 0);
        setAnalysisResult({
          sub_nichos: data.sub_nichos as unknown as SubNicheResult[],
          insights: data.insights || "",
        });
        setAiModel1(data.ai_model || "claude-sonnet-4.5");
      } else {
        setMainNiche(data.main_niche || "");
        setExpansionResult({
          nivel_detectado: data.nivel_detectado || "",
          lista_1: data.lista_1 as unknown as { titulo: string; descricao: string; items: string[]; },
          lista_2: data.lista_2 as unknown as { titulo: string; descricao: string; items: string[]; },
        });
        setAiModel2(data.ai_model || "claude-sonnet-4.5");
        setLanguage(data.language || "Português");
      }

      setShowLoadDialog(false);
      toast({
        title: "✅ Análise Carregada",
        description: "Análise carregada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error loading analysis:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar análise",
        variant: "destructive",
      });
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sub_niche_saved_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "✅ Análise Excluída",
        description: "Análise excluída com sucesso!",
      });

      loadSavedAnalyses();
      if (selectedAnalysisId === id) {
        setSelectedAnalysisId(null);
      }
    } catch (error: any) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir análise",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se o modelo escolhido suporta a quantidade de vídeos
  const getModelMaxVideos = (modelId: string): number => {
    const limits: { [key: string]: number } = {
      'google/gemini-2.5-pro': 100,
      'google/gemini-2.5-flash': 150,
      'google/gemini-2.5-flash-lite': 60,
      'openai/gpt-5': 1000,
      'openai/gpt-5-mini': 1200,
      'openai/gpt-5-nano': 1500,
      'claude-sonnet-4.5': 800,
      'claude-sonnet-4': 600,
      'gpt-4.1': 600,
      'gpt-4o': 500
    };
    return limits[modelId] || 450;
  };

  const countVideosInData = (data: string): number => {
    // Contar quantos vídeos existem nos dados (cada linha com visualizações)
    const lines = data.split('\n').filter(line => line.trim());
    return lines.filter(line => /\d+/.test(line)).length;
  };

  // Função de limpeza de títulos
  const cleanTitles = () => {
    if (!rawTitles.trim()) {
      toast({
        title: "⚠️ Campo vazio",
        description: "Cole os títulos originais antes de limpar",
        variant: "destructive",
      });
      return;
    }

    // Processa linha por linha
    const lines = rawTitles.split('\n');
    const cleanedLines: string[] = [];
    
    for (const line of lines) {
      if (!line.trim()) {
        cleanedLines.push(''); // Mantém linhas vazias
        continue;
      }
      
      // Limpa cada linha:
      // 1. Remove acentos (NFD + remove combining diacritics)
      // 2. Remove TODOS caracteres especiais exceto letras, números e espaços
      // 3. Normaliza espaços múltiplos
      const cleaned = line
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove caracteres especiais
        .replace(/\s+/g, ' ')             // Normaliza espaços
        .trim();
      
      cleanedLines.push(cleaned);
    }
    
    // Junta tudo mantendo a estrutura original
    const result = cleanedLines.join('\n');
    
    setCleanedTitles(result);
    setShowCleanedOutput(true);

    // Conta vídeos (grupos de 4 linhas + 1 em branco)
    const videoCount = Math.floor(cleanedLines.filter(l => l.trim()).length / 4);

    toast({
      title: "✅ Títulos limpos com sucesso!",
      description: `${videoCount} vídeos processados`,
    });
  };

  // Detecta caracteres especiais (exceto letras, números, espaços e quebras)
  const hasSpecialCharacters = (text: string): boolean => {
    return /[^a-zA-Z0-9\s\n\r]/.test(text);
  };

  // Retorna mensagem de aviso se houver caracteres especiais
  const getSpecialCharacterWarning = (text: string): string | null => {
    if (!text.trim()) return null;
    
    if (hasSpecialCharacters(text)) {
      const matches = text.match(/[^a-zA-Z0-9\s\n\r]/g) || [];
      const uniqueChars = [...new Set(matches)].slice(0, 15).join(', ');
      return `Caracteres especiais encontrados: ${uniqueChars}`;
    }
    
    return null;
  };

  const analyzeCompetitorTitles = async () => {
    // VALIDAÇÃO: Bloquear se houver caracteres especiais
    const warning = getSpecialCharacterWarning(competitorData);
    if (warning) {
      toast({
        title: "❌ Títulos contêm caracteres especiais!",
        description: "Use o PASSO 1 acima para limpar os títulos antes de analisar",
        variant: "destructive",
      });
      return;
    }
    if (!competitorData.trim()) {
      toast({
        title: "Erro",
        description: "Cole os dados dos vídeos dos concorrentes",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o modelo suporta a quantidade de vídeos
    const videoCount = countVideosInData(competitorData);
    const maxVideos = getModelMaxVideos(selectedAIModel);
    
    if (videoCount > maxVideos) {
      toast({
        title: "⚠️ Muitos vídeos para este modelo",
        description: `${videoCount} vídeos detectados, mas "${selectedAIModel.split('/')[1]}" suporta apenas ${maxVideos}. Apenas os primeiros ${maxVideos} serão analisados. Para analisar todos, use GPT-5 Nano (1000), GPT-5 Mini (800) ou Claude Sonnet 4.5 (3000).`,
        variant: "default",
        duration: 8000,
      });
    }

    setLoading1(true);
    startAnalysisProgress();
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitor-titles', {
        body: { competitorData, aiModel: selectedAIModel }
      });

      if (error) throw error;

      completeAnalysisProgress();
      setAnalysisResult(data.result);
      setVideosDetected(data.videosAnalyzed);
      
      toast({
        title: "Análise Concluída",
        description: `${data.videosAnalyzed} vídeos analisados com sucesso`,
      });
    } catch (error: any) {
      console.error('Error analyzing:', error);
      stopAnalysisProgress();

      // Extrair mensagem de erro real do backend
      const errorMsg = String(error?.message || "");
      const jsonMatch = errorMsg.match(/\{[\s\S]*\}$/);
      let description = errorMsg;
      
      if (jsonMatch) {
        try {
          const errorJson = JSON.parse(jsonMatch[0]);
          description = errorJson?.error || description;
        } catch {
          // Se falhar o parse, usa a mensagem original
        }
      }

      // Tratamento específico para erros conhecidos
      if (description.includes('atingiu o limite de tokens')) {
        toast({
          title: "⚠️ Análise incompleta",
          description: description,
          variant: "destructive",
          duration: 10000,
        });
      } else if (description.includes('Failed to fetch') || description.includes('failed to send')) {
        toast({
          title: "❌ Erro de conexão",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Erro na análise",
          description: description || "Tente novamente",
          variant: "destructive",
        });
      }
    } finally {
      setLoading1(false);
    }
  };

  const expandNiche = async () => {
    if (!mainNiche.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nicho para expandir",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive",
      });
      return;
    }

    setLoading2(true);
    try {
      const { data, error } = await supabase.functions.invoke('expand-niche', {
        body: { mainNiche, language, aiModel: aiModel2 }
      });

      if (error) throw error;

      setExpansionResult(data.result);
      
      toast({
        title: "Expansão Concluída",
        description: `Nicho expandido com sucesso`,
      });
    } catch (error: any) {
      console.error('Error expanding:', error);
      toast({
        title: "Erro na expansão",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading2(false);
    }
  };

  const exportAnalysisToExcel = () => {
    if (!analysisResult) return;
    
    const data = analysisResult.sub_nichos.map(sn => ({
      'Sub-Nicho': sn.nome,
      'Potencial': sn.potencial,
      'VPH Médio': sn.vph_medio,
      'Especificidade': sn.nivel_especificidade || 'N/A',
      'Palavras-chave': sn.palavras_chave?.join(', ') || '',
      'Fórmula de Título': sn.formula_titulo || '',
      'Gancho Emocional': sn.gancho_emocional || '',
      'Justificativa': sn.justificativa,
      'Exemplos': sn.exemplos.join(' | '),
    }));
    
    exportToExcel(data, 'analise-subnichos', 'Sub-Nichos');
    
    toast({
      title: "Exportado",
      description: "Análise exportada para Excel",
    });
  };

  const exportExpansionToExcel = () => {
    if (!expansionResult) return;
    
    const maxLength = Math.max(
      expansionResult.lista_1.items.length,
      expansionResult.lista_2.items.length
    );
    
    const data = [];
    for (let i = 0; i < maxLength; i++) {
      data.push({
        [expansionResult.lista_1.titulo]: expansionResult.lista_1.items[i] || '',
        [expansionResult.lista_2.titulo]: expansionResult.lista_2.items[i] || '',
      });
    }
    
    exportToExcel(data, `expansao-${mainNiche.toLowerCase().replace(/\s+/g, '-')}`, 'Expansão');
    
    toast({
      title: "Exportado",
      description: "Expansão exportada para Excel",
    });
  };

  const generateViralFromChampion = async (champion: MicroNicheRanking) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive",
      });
      return;
    }

    if (champion.videos.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum vídeo encontrado para este campeão",
        variant: "destructive",
      });
      return;
    }

    // LOG DETALHADO
    console.log(`🎯 Preparando geração viral para campeão "${champion.name}"`);
    console.log(`📊 Total de vídeos do campeão: ${champion.videos.length}`);
    console.log(`📝 Esperado gerar: ${champion.videos.length * 5} títulos virais`);

    // Validação adicional
    if (champion.videos.length < champion.videoCount) {
      console.warn(`⚠️ AVISO: Campeão tem apenas ${champion.videos.length} vídeos, esperado ${champion.videoCount}`);
      toast({
        title: "Aviso",
        description: `Apenas ${champion.videos.length} de ${champion.videoCount} vídeos serão usados para gerar títulos`,
        variant: "default",
      });
    }

    setGeneratingViralFor(champion.rank);
    startViralProgress();

    try {
      // Envia TODOS os vídeos do campeão para análise
      const championTitles = champion.videos.map(video => ({
        title: video.title,
        structure: video.structure || extractTitleStructure(video.title),
        theme: video.title // Tema completo será extraído pela IA
      }));

      console.log(`🎯 Enviando ${championTitles.length} títulos campeões para análise`);

      const { data, error } = await supabase.functions.invoke('generate-viral-from-champion', {
        body: { 
          championTitles,
          aiModel: selectedAIModel 
        }
      });

      if (error) throw error;

      completeViralProgress();

      // Processar resultado: manter estrutura organizada
      const organizedResults: ViralTitleGroup[] = [];
      let totalVariations = 0;
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any) => {
          if (result.variations && Array.isArray(result.variations)) {
            organizedResults.push({
              championTitle: result.championTitle || '',
              structure: result.structure || '',
              variations: result.variations
            });
            totalVariations += result.variations.length;
          }
        });
      }

      setViralTitles(prev => ({
        ...prev,
        [champion.rank]: organizedResults
      }));

      setExpandedViralCard(champion.rank);

      toast({
        title: "✅ Títulos Virais Gerados",
        description: `${totalVariations} títulos criados com base em ${championTitles.length} títulos campeões (${championTitles.length * 5} esperados)`,
      });
    } catch (error: any) {
      console.error('Error generating viral titles:', error);
      stopViralProgress();
      toast({
        title: "Erro ao gerar títulos",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setGeneratingViralFor(null);
    }
  };

  const copyTitle = async (title: string, key: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedTitles(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedTitles(prev => ({ ...prev, [key]: false }));
      }, 2000);
      toast({
        title: "✅ Copiado",
        description: "Título copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o título",
        variant: "destructive",
      });
    }
  };

  const copyAllTitles = async (titleGroups: ViralTitleGroup[], rank: number) => {
    try {
      const formattedText = titleGroups.map((group, idx) => {
        const header = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 TÍTULO ORIGINAL ${idx + 1}: ${group.championTitle}\n📐 Estrutura: ${group.structure}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        const variations = group.variations.map((v, i) => `${i + 1}. ${v}`).join('\n');
        return header + variations;
      }).join('\n\n');
      
      await navigator.clipboard.writeText(formattedText);
      const totalTitles = titleGroups.reduce((sum, g) => sum + g.variations.length, 0);
      toast({
        title: "✅ Todos os Títulos Copiados",
        description: `${totalTitles} títulos copiados para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os títulos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🎯 Sub-Niche Hunter
          </h1>
          <p className="text-muted-foreground text-lg">
            Descubra sub-nichos e expanda estratégias de conteúdo
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowManual(true)}
            variant="outline"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Ver Manual Completo
          </Button>
          <Button 
            onClick={() => setShowLoadDialog(true)}
            variant="outline"
            disabled={loadingSaved}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Carregar
          </Button>
          <Button 
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            disabled={!analysisResult && !expansionResult}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Análise de Títulos</TabsTrigger>
          <TabsTrigger value="expansion">Expansão de Nicho</TabsTrigger>
        </TabsList>

        {/* Tab 1: Análise de Títulos */}
        <TabsContent value="analysis" className="space-y-6">
          {/* PASSO 1: LIMPA TÍTULOS */}
          <Card className="border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-yellow-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-600 hover:bg-orange-600 text-white text-lg px-4 py-1.5 font-bold">
                  PASSO 1
                </Badge>
                <div className="flex-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-orange-500" />
                    Limpa Títulos
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Cole os títulos originais com acentos e caracteres especiais. Clique em "Limpar" para preparar para análise.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Input: Títulos Originais */}
              <div className="space-y-2">
                <Label htmlFor="raw-titles" className="text-base font-semibold">
                  📝 Títulos Originais (com acentos e caracteres especiais)
                </Label>
                <Textarea
                  id="raw-titles"
                  placeholder={`Cole aqui os títulos originais, exemplo:

"My Mom Said: \"I Wish You Were Never Born\""
857 visualizações
há 5 horas
166 VPH

120 BANNED Photos—That Reveal What Was Never Meant to Be Seen!
2,5 mil visualizações
há 1 dia
61 VPH`}
                  value={rawTitles}
                  onChange={(e) => setRawTitles(e.target.value)}
                  className="min-h-[280px] font-mono text-sm resize-none"
                />
                {rawTitles && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {rawTitles.split('\n').filter(l => l.trim()).length} linhas • ~{Math.floor(rawTitles.split('\n').filter(l => l.trim()).length / 4)} vídeos
                  </p>
                )}
              </div>

              {/* Botão Limpar */}
              <Button 
                onClick={cleanTitles}
                disabled={!rawTitles.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Limpar Títulos Agora
              </Button>

              {/* Output: Títulos Limpos */}
              {showCleanedOutput && (
                <div className="space-y-3 pt-4 border-t-2 border-orange-500/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cleaned-titles" className="text-base font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Títulos Limpos (prontos para análise)
                    </Label>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(cleanedTitles);
                        toast({ 
                          title: "✅ Copiado!", 
                          description: "Agora cole no PASSO 2 abaixo" 
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Tudo
                    </Button>
                  </div>
                  
                  <Textarea
                    id="cleaned-titles"
                    value={cleanedTitles}
                    readOnly
                    className="min-h-[280px] font-mono text-sm bg-green-500/10 border-2 border-green-500/50 resize-none"
                  />
                  
                  <Alert className="bg-green-500/10 border-2 border-green-500/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-base">
                      <strong>✅ Títulos limpos e prontos!</strong>
                      <br />
                      Agora copie e cole no <strong className="text-primary">PASSO 2</strong> abaixo para analisar.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASSO 2: ANÁLISE DE TÍTULOS */}
          <Card className={cn(
            "border-2",
            getSpecialCharacterWarning(competitorData) 
              ? "border-red-500/50 bg-red-500/5" 
              : "border-primary/50"
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "text-lg px-4 py-1.5 font-bold",
                  getSpecialCharacterWarning(competitorData)
                    ? "bg-red-600 hover:bg-red-600"
                    : "bg-primary hover:bg-primary"
                )}>
                  PASSO 2
                </Badge>
                <div className="flex-1">
                  <CardTitle className="text-2xl">🎯 Análise de Títulos de Concorrentes</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Cole APENAS os títulos limpos do PASSO 1 (sem acentos ou caracteres especiais)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alerta se detectar caracteres especiais */}
              {competitorData && getSpecialCharacterWarning(competitorData) && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base font-bold">
                    ❌ Caracteres especiais detectados!
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    <strong>{getSpecialCharacterWarning(competitorData)}</strong>
                    <br />
                    <br />
                    Volte ao <strong>PASSO 1</strong> acima e limpe os títulos antes de continuar.
                    <br />
                    A análise não funcionará com caracteres especiais.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="competitor-data" className="text-base font-semibold flex items-center gap-2">
                  {getSpecialCharacterWarning(competitorData) ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-500">Dados dos Vídeos (precisam ser limpos!)</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 text-primary" />
                      Dados dos Vídeos (limpos, sem acentos ou caracteres especiais)
                    </>
                  )}
                </Label>
                <Textarea
                  id="competitor-data"
                  placeholder={`Cole aqui os títulos LIMPOS do PASSO 1:

My Mom Said I Wish You Were Never Born
857 visualizacoes
ha 5 horas
166 VPH

120 BANNED Photos That Reveal What Was Never Meant to Be Seen
2500 visualizacoes
ha 1 dia
61 VPH`}
                  value={competitorData}
                  onChange={(e) => setCompetitorData(e.target.value)}
                  className={cn(
                    "min-h-[300px] font-mono text-sm",
                    getSpecialCharacterWarning(competitorData) && "border-red-500 bg-red-500/5"
                  )}
                />
                {competitorData && (
                  <p className="text-sm text-muted-foreground">
                    Dados inseridos: {competitorData.split('\n').filter(l => l.trim()).length} linhas
                  </p>
                )}
              </div>

              <AIModelSelector 
                value={selectedAIModel} 
                onChange={setSelectedAIModel}
                label="Modelo de IA para Geração Viral"
              />

              <Button 
                onClick={analyzeCompetitorTitles}
                disabled={
                  loading1 || 
                  !competitorData.trim() || 
                  hasSpecialCharacters(competitorData)
                }
                className="w-full"
                size="lg"
              >
                {loading1 ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analisando...
                  </>
                ) : hasSpecialCharacters(competitorData) ? (
                  <>
                    <XCircle className="mr-2 h-5 w-5" />
                    Limpe os títulos no PASSO 1 primeiro
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analisar Sub-Nichos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading Progress */}
          {loading1 && (
            <LoadingProgress
              stages={[
                { stage: 'parsing', icon: '🗄️', label: 'Analisando Dados' },
                { stage: 'hierarchy', icon: '🎯', label: 'Estrutura Hierárquica' },
                { stage: 'ranking', icon: '📊', label: 'Análise de Performance' },
                { stage: 'failures', icon: '⚠️', label: 'Detectando Falhas' },
                { stage: 'complete', icon: '✅', label: 'Concluído' }
              ]}
              currentStage={analysisProgress.stage}
              percentage={analysisProgress.percentage}
              estimatedTimeRemaining={analysisProgress.estimatedTimeRemaining}
              stageLabel={analysisProgress.stageLabel}
              details={analysisProgress.details}
              title="Analisando Títulos de Concorrentes"
            />
          )}

          {/* Results */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Resultados da Análise</h3>
                  <p className="text-sm text-muted-foreground">{videosDetected} vídeos analisados</p>
                </div>
                <Button onClick={exportAnalysisToExcel} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>

              {/* NOVO: PALAVRAS-CHAVE CAMPEÃS - Aparece PRIMEIRO */}
              {analysisResult.palavras_chave_campeas && (
                <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-7 w-7 text-yellow-500" />
                      <div>
                        <CardTitle className="text-2xl">🏆 Palavras-Chave Campeãs</CardTitle>
                        <CardDescription>
                          Palavras/frases que mais aparecem nos títulos de maior sucesso
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ranking de Keywords */}
                    <div className="space-y-3">
                      {analysisResult.palavras_chave_campeas.ranking.map((kw, idx) => (
                        <div 
                          key={idx}
                          className="p-4 rounded-lg border-2 border-yellow-500/30 bg-card"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-yellow-500">#{idx + 1}</span>
                                <h5 className="text-lg font-bold text-foreground">
                                  "{kw.keyword}"
                                </h5>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs mt-2">
                                <Badge variant="secondary" className="bg-yellow-500/20">
                                  {kw.occurrences} aparições
                                </Badge>
                                <Badge variant="outline">
                                  Média: {Math.round(kw.avgViews).toLocaleString('pt-BR')} views
                                </Badge>
                                {kw.avgVPH > 0 && (
                                  <Badge variant="default">
                                    VPH médio: {Math.round(kw.avgVPH)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Melhor Título */}
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              📌 Melhor título com esta palavra-chave:
                            </p>
                            <div className="p-2 bg-background/50 rounded">
                              <p className="text-sm text-foreground">"{kw.bestTitle}"</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {kw.bestTitleViews.toLocaleString('pt-BR')} views
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Observação Detalhada */}
                    <div className="p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border-2 border-yellow-500/40">
                      <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        ANÁLISE DETALHADA DOS PADRÕES:
                      </p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {analysisResult.palavras_chave_campeas.observacao_detalhada}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RESUMO 1 - Estrutura Hierárquica */}
              {analysisResult.resumo_1 && (
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-2xl">📊 Resumo 1: Estrutura Hierárquica do Conteúdo</CardTitle>
                    <CardDescription>
                      Compreensão profunda do tipo de conteúdo do canal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Nicho Principal */}
                    <div className="p-4 bg-card rounded-lg border-2 border-primary/40">
                      <h4 className="text-lg font-bold text-primary mb-2">🎯 Nicho Principal</h4>
                      <p className="text-foreground font-semibold text-xl">{analysisResult.resumo_1.nicho_principal}</p>
                    </div>

                    {/* Sub-Nichos */}
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-3">📁 Sub-Nichos ({analysisResult.resumo_1.sub_nichos.length})</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {analysisResult.resumo_1.sub_nichos.map((sn, idx) => (
                          <div key={idx} className="p-3 bg-accent/20 rounded-lg border border-accent/50">
                            <p className="font-semibold text-foreground">{idx + 1}. {sn.nome}</p>
                            <p className="text-sm text-muted-foreground mt-1">{sn.descricao}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Micro-Sub-Nichos */}
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-3">🔬 Micro-Sub-Nichos ({analysisResult.resumo_1.micro_sub_nichos.length})</h4>
                      <div className="space-y-4">
                        {analysisResult.resumo_1.micro_sub_nichos.map((msn, idx) => (
                          <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                            <h5 className="font-bold text-foreground mb-2">{idx + 1}. {msn.nome}</h5>
                            <p className="text-sm text-muted-foreground mb-3">{msn.descricao}</p>
                            
                            {msn.exemplos_titulos && msn.exemplos_titulos.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-foreground mb-1">📝 Exemplos de Títulos:</p>
                                <ul className="space-y-1">
                                  {msn.exemplos_titulos.map((titulo, i) => (
                                    <li key={i} className="text-xs text-muted-foreground bg-background/50 p-2 rounded italic">
                                      "{titulo}"
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {msn.estruturas_titulos && msn.estruturas_titulos.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-foreground mb-1">🏗️ Estruturas de Títulos:</p>
                                <ul className="space-y-1">
                                  {msn.estruturas_titulos.map((estrutura, i) => (
                                    <li key={i} className="text-xs text-muted-foreground bg-primary/10 p-2 rounded">
                                      {estrutura}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RESUMO 2 - Ranking por Performance */}
              {analysisResult.resumo_2 && (
                <Card className="bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-2xl">🏆 Resumo 2: Ranking de Performance por Micro-Subnicho</CardTitle>
                    <CardDescription>
                      Descubra quais micro-subnichos mais viralizaram (ordenados por total de visualizações)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Análise do Campeão */}
                    {analysisResult.resumo_2.analise_campeao && (
                      <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/40">
                        <p className="text-sm text-foreground">
                          <span className="font-bold">⭐ Análise do Campeão:</span> {analysisResult.resumo_2.analise_campeao}
                        </p>
                      </div>
                    )}

                    {/* Ranking de Micro-Nichos */}
                    <div className="space-y-4">
                      {analysisResult.resumo_2.micro_nichos_ranking.map((microNiche) => (
                        <div 
                          key={microNiche.rank}
                          className={`p-4 rounded-lg border-2 ${
                            microNiche.isChampion 
                              ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50' 
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-primary">#{microNiche.rank}</span>
                                <h5 className="text-lg font-bold text-foreground flex-1">
                                  {microNiche.name}
                                  {microNiche.isChampion && <span className="ml-2 text-yellow-500">⭐ CAMPEÃO</span>}
                                </h5>
                              </div>
                               <p className="text-sm text-muted-foreground mb-2">{microNiche.description}</p>
                              {microNiche.titleStructure && (
                                <div className="mb-2 bg-accent/10 rounded px-3 py-2">
                                  <p className="text-xs text-muted-foreground">
                                    📐 <span className="font-semibold">Estrutura dos Títulos:</span> {microNiche.titleStructure}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="secondary">
                                  {microNiche.totalViews.toLocaleString('pt-BR')} views totais
                                </Badge>
                                <Badge variant="outline">
                                  {microNiche.videoCount} vídeos
                                </Badge>
                                <Badge variant="default" className={microNiche.isChampion ? 'bg-yellow-500 text-black' : ''}>
                                  Média: {Math.round(microNiche.avgViewsPerVideo).toLocaleString('pt-BR')} views/vídeo
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Botão Gerar Títulos Virais */}
                            {microNiche.isChampion && (
                              <Button
                                onClick={() => generateViralFromChampion(microNiche)}
                                disabled={generatingViralFor === microNiche.rank}
                                variant="default"
                                size="sm"
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                              >
                                {generatingViralFor === microNiche.rank ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Gerar Títulos Virais
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {/* Lista de Vídeos */}
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              📹 Vídeos neste micro-nicho: {microNiche.videos.length} de {microNiche.videoCount} 
                              {microNiche.videos.length < microNiche.videoCount && (
                                <span className="text-destructive ml-2">
                                  ⚠️ Faltam {microNiche.videoCount - microNiche.videos.length} vídeos
                                </span>
                              )}
                            </p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {microNiche.videos.map((video, idx) => {
                                const videoStructure = extractTitleStructure(video.title);
                                return (
                                  <div key={idx} className="p-2 bg-background/50 rounded hover:bg-background/80 transition-colors">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <span className="text-xs text-muted-foreground mr-2">#{idx + 1}</span>
                                      <span className="text-muted-foreground flex-1 text-xs">"{video.title}"</span>
                                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                                        {video.views.toLocaleString('pt-BR')} views
                                      </Badge>
                                    </div>
                                    <div className="ml-6 mt-1">
                                      <span className="text-xs text-muted-foreground/70 italic">
                                        📐 Estrutura: {videoStructure}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Títulos Virais Gerados */}
                          {viralTitles[microNiche.rank] && (
                            <div className="mt-4 pt-4 border-t border-yellow-500/30">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                  <Zap className="h-4 w-4" />
                                  Títulos Virais Gerados ({viralTitles[microNiche.rank].reduce((sum, g) => sum + g.variations.length, 0)})
                                </h6>
                                <Button
                                  onClick={() => copyAllTitles(viralTitles[microNiche.rank], microNiche.rank)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Copy className="mr-1 h-3 w-3" />
                                  Copiar Todos
                                </Button>
                              </div>
                              <div className="space-y-6">
                                {viralTitles[microNiche.rank].map((group, groupIdx) => (
                                  <div key={groupIdx} className="space-y-2">
                                    {/* Header do Grupo */}
                                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
                                      <div className="flex items-start gap-2">
                                        <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 space-y-1">
                                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            TÍTULO CAMPEÃO #{groupIdx + 1}
                                          </p>
                                          <p className="text-sm text-foreground font-medium">
                                            {group.championTitle}
                                          </p>
                                          <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                                            📐 Estrutura: {group.structure}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Variações do Grupo */}
                                    <div className="space-y-2 pl-6">
                                      {group.variations.map((title, idx) => {
                                        const copyKey = `${microNiche.rank}-${groupIdx}-${idx}`;
                                        return (
                                          <div 
                                            key={idx} 
                                            className="flex items-start justify-between gap-2 p-3 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                                          >
                                            <div className="flex-1">
                                              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                                Variação #{idx + 1}
                                              </span>
                                              <p className="text-sm text-foreground mt-1">
                                                {title}
                                              </p>
                                            </div>
                                            <Button
                                              onClick={() => copyTitle(title, copyKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="flex-shrink-0"
                                            >
                                              {copiedTitles[copyKey] ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <Copy className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Loading Progress para Geração Viral */}
                          {generatingViralFor === microNiche.rank && viralProgress.stage !== '' && (
                            <div className="mt-4">
                              <LoadingProgress
                                stages={viralGenerationStages.map(s => ({
                                  stage: s.stage,
                                  icon: getViralStageIcon(s.stage),
                                  label: s.label
                                }))}
                                currentStage={viralProgress.stage}
                                percentage={viralProgress.percentage}
                                estimatedTimeRemaining={viralProgress.estimatedTimeRemaining}
                                stageLabel={viralProgress.stageLabel}
                                details={viralProgress.details}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RESUMO 3 - O Que Nunca Fazer */}
              {analysisResult.resumo_3 && analysisResult.resumo_3.micro_nichos_que_falharam && analysisResult.resumo_3.micro_nichos_que_falharam.length > 0 && (
                <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/30">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      Resumo 3: O Que Nunca Fazer (Micro-Nichos que Falharam)
                    </CardTitle>
                    <CardDescription>
                      Aprenda com os erros: padrões que resultaram em baixo desempenho
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Alerta Explicativo */}
                    <Alert className="bg-destructive/10 border-destructive/30">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-sm">
                        <strong>Atenção:</strong> Estes micro-nichos tiveram as menores médias de visualizações. 
                        Estude os motivos da falha para evitar esses padrões em seu conteúdo!
                      </AlertDescription>
                    </Alert>

                    {/* Lista de Micro-Nichos que Falharam */}
                    <div className="space-y-4">
                      {analysisResult.resumo_3.micro_nichos_que_falharam.map((failed) => (
                        <div 
                          key={failed.rank}
                          className="p-5 rounded-lg border-2 border-destructive/30 bg-destructive/5"
                        >
                          {/* Header do Card */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl font-bold text-destructive">
                                  #{failed.rank} PIOR
                                </span>
                                <h5 className="text-lg font-bold text-foreground flex-1">
                                  {failed.name}
                                </h5>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {failed.description}
                              </p>

                              {/* Métricas */}
                              <div className="flex flex-wrap gap-2 text-xs mb-3">
                                <Badge variant="secondary" className="bg-muted">
                                  {failed.totalViews.toLocaleString('pt-BR')} views totais
                                </Badge>
                                <Badge variant="outline">
                                  {failed.videoCount} vídeos
                                </Badge>
                                <Badge variant="destructive">
                                  Média: {Math.round(failed.avgViewsPerVideo).toLocaleString('pt-BR')} views/vídeo
                                </Badge>
                              </div>

                              {/* Estrutura dos Títulos Ruins */}
                              {failed.titleStructure && (
                                <div className="mb-3 bg-background/50 rounded px-3 py-2 border border-destructive/20">
                                  <p className="text-xs text-muted-foreground">
                                    📐 <span className="font-semibold">Estrutura dos títulos ruins:</span> {failed.titleStructure}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Exemplos de Títulos que Falharam */}
                          {failed.failedTitles && failed.failedTitles.length > 0 && (
                            <div className="mb-3 p-3 bg-background/30 rounded-lg border border-border">
                              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                                📝 Exemplos de títulos que falharam:
                              </p>
                              <div className="space-y-1.5">
                                {failed.failedTitles.map((title, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <span className="text-destructive font-bold">❌</span>
                                    <span className="flex-1 italic">"{title}"</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Motivo da Falha */}
                          <div className="p-4 bg-destructive/10 rounded-lg border-2 border-destructive/30">
                            <p className="text-xs font-bold text-destructive mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              MOTIVO DA FALHA:
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">
                              {failed.motivoFalha}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResult.insights && (
                <Card className="bg-accent/10 border-accent">
                  <CardHeader>
                    <CardTitle className="text-lg">💡 Insights Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{analysisResult.insights}</p>
                  </CardContent>
                </Card>
              )}

              {analysisResult.sub_nichos && analysisResult.sub_nichos.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {analysisResult.sub_nichos.map((subNiche, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg flex-1">{subNiche.nome}</CardTitle>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={
                              subNiche.potencial === 'alto' ? 'default' : 
                              subNiche.potencial === 'médio' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {subNiche.potencial}
                          </Badge>
                          {subNiche.nivel_especificidade && (
                            <Badge variant="outline" className="text-xs">
                              Especificidade: {subNiche.nivel_especificidade}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        VPH Médio: {subNiche.vph_medio}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {subNiche.palavras_chave && subNiche.palavras_chave.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">🎯 Palavras-chave:</p>
                          <div className="flex flex-wrap gap-1">
                            {subNiche.palavras_chave.map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {subNiche.formula_titulo && (
                        <div>
                          <p className="text-sm font-medium mb-1">📐 Fórmula dos Títulos:</p>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {subNiche.formula_titulo}
                          </p>
                        </div>
                      )}
                      
                      {subNiche.gancho_emocional && (
                        <div>
                          <p className="text-sm font-medium mb-1">🎣 Gancho Emocional:</p>
                          <p className="text-xs text-muted-foreground italic">
                            {subNiche.gancho_emocional}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium mb-1">💡 Justificativa:</p>
                        <p className="text-sm text-muted-foreground">{subNiche.justificativa}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">📝 Exemplos de Títulos:</p>
                        <ul className="space-y-1">
                          {subNiche.exemplos.map((ex, i) => (
                            <li key={i} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}

              {/* Resumo Final */}
              {analysisResult.sub_nichos && analysisResult.sub_nichos.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">📋 Resumo dos Sub-Nichos Encontrados</CardTitle>
                  <CardDescription>
                    Visão consolidada de todos os sub-nichos com suas fórmulas e exemplos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysisResult.sub_nichos.map((subNiche, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="text-lg font-semibold text-foreground flex-1">
                            {idx + 1}. {subNiche.nome}
                          </h4>
                          <Badge 
                            variant={
                              subNiche.potencial === 'alto' ? 'default' : 
                              subNiche.potencial === 'médio' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {subNiche.potencial}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {subNiche.formula_titulo && (
                            <div className="bg-accent/10 p-3 rounded">
                              <p className="text-xs font-semibold text-accent-foreground mb-1">
                                📐 Fórmula:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {subNiche.formula_titulo}
                              </p>
                            </div>
                          )}
                          
                          {subNiche.exemplos && subNiche.exemplos.length > 0 && (
                            <div className="bg-muted/30 p-3 rounded">
                              <p className="text-xs font-semibold text-foreground mb-1">
                                📝 Exemplo:
                              </p>
                              <p className="text-sm text-muted-foreground italic">
                                "{subNiche.exemplos[0]}"
                              </p>
                            </div>
                          )}
                          
                          {subNiche.palavras_chave && subNiche.palavras_chave.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {subNiche.palavras_chave.slice(0, 5).map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )}

              <Button
                onClick={() => setAnalysisResult(null)}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Resultados
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Expansão de Nicho */}
        <TabsContent value="expansion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expansão de Nicho</CardTitle>
              <CardDescription>
                Digite um nicho (amplo, sub-nicho ou micro-nicho) para expandir em 2 níveis mais profundos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="main-niche">Nicho Principal</Label>
                <Input
                  id="main-niche"
                  placeholder="Ex: History, World War 2, Rare WWII Photos..."
                  value={mainNiche}
                  onChange={(e) => setMainNiche(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Funciona com nichos amplos, sub-nichos ou micro-nichos - a IA se adapta automaticamente
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Português">Português</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Español">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AIModelSelector 
                  value={aiModel2}
                  onChange={setAiModel2}
                  label="Modelo de IA"
                />
              </div>

              <Button 
                onClick={expandNiche}
                disabled={loading2 || !mainNiche.trim()}
                className="w-full"
                size="lg"
              >
                {loading2 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Expandindo...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Gerar Nichos e Micro-Nichos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {expansionResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Resultados da Expansão</h3>
                  <Badge variant="secondary" className="mt-1">
                    Nível detectado: {expansionResult.nivel_detectado}
                  </Badge>
                </div>
                <Button onClick={exportExpansionToExcel} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Lista 1 */}
                <Card>
                  <CardHeader>
                    <CardTitle>{expansionResult.lista_1.titulo}</CardTitle>
                    <CardDescription>{expansionResult.lista_1.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[600px] overflow-y-auto space-y-2">
                      {expansionResult.lista_1.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <p className="text-sm">
                            <span className="font-semibold text-muted-foreground mr-2">
                              {idx + 1}.
                            </span>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Lista 2 */}
                <Card>
                  <CardHeader>
                    <CardTitle>{expansionResult.lista_2.titulo}</CardTitle>
                    <CardDescription>{expansionResult.lista_2.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[600px] overflow-y-auto space-y-2">
                      {expansionResult.lista_2.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <p className="text-sm">
                            <span className="font-semibold text-muted-foreground mr-2">
                              {idx + 1}.
                            </span>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button 
                onClick={() => setExpansionResult(null)}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Resultados
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar Análise</AlertDialogTitle>
            <AlertDialogDescription>
              Digite um nome para identificar esta análise
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Análise de Títulos - Fitness"
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveCurrentAnalysis}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load Dialog */}
      <AlertDialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Análises Salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione uma análise para carregar
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2 py-4">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : savedAnalyses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma análise salva ainda
              </p>
            ) : (
              savedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{analysis.analysis_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {analysis.analysis_type === 'titles' ? 'Análise de Títulos' : 'Expansão de Nicho'}
                      </Badge>
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadAnalysis(analysis.id)}
                    >
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedAnalysisId(analysis.id);
                        deleteAnalysis(analysis.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Completo */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Sub-Niche Hunter</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubNicheHunter;