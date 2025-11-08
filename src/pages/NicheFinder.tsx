import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, Loader2, TrendingUp, Download, Flame, Save, FolderOpen, Trash2, Target, LayoutGrid, LayoutList, BookOpen } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel, exportNicheAnalysis } from "@/lib/exportToExcel";
import { NicheCard } from "@/components/niche-finder/NicheCard";
import { NicheDashboard } from "@/components/niche-finder/NicheDashboard";
import { OpportunityFilter, type OpportunityFilters } from "@/components/niche-finder/OpportunityFilter";
import { UserManual } from "@/components/niche-finder/UserManual";
import { NicheListsManager } from "@/components/niche-finder/NicheListsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
const NicheFinder = () => {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [maxChannelVideos, setMaxChannelVideos] = useState("100");
  const [minViews, setMinViews] = useState("5000");
  const [viralScore, setViralScore] = useState("3.5");
  const [minEngagement, setMinEngagement] = useState("0.001");
  const [maxVideoAge, setMaxVideoAge] = useState("60");
  const [maxSubscribers, setMaxSubscribers] = useState("100000");
  const [minSubscribers, setMinSubscribers] = useState("1000");
  const [country, setCountry] = useState("any");
  const [language, setLanguage] = useState("any");
  const [videoDuration, setVideoDuration] = useState("long");
  const [maxChannelAge, setMaxChannelAge] = useState("180");
  const [minViewSubRatio, setMinViewSubRatio] = useState("0");
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [maxVideos, setMaxVideos] = useState<number>(1000);
  const [quotaInfo, setQuotaInfo] = useState<{
    searchesRemaining?: number;
    lastReset: string;
    quotaUsed: number;
    dailyQuota?: number;
    percentageUsed?: number;
    apiStatus?: 'active' | 'exhausted';
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    primary: string;
    secondary: string;
    direction: 'asc' | 'desc';
  }>({
    primary: 'viralScore',
    secondary: 'none',
    direction: 'desc'
  });

  // Estados para histórico
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Estados para análise de nichos
  const [nicheAnalysis, setNicheAnalysis] = useState<any[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'niches' | 'videos'>('videos');
  const [showFilters, setShowFilters] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showNicheLists, setShowNicheLists] = useState(false);
  const [apiKeyPrefix, setApiKeyPrefix] = useState<string>("");
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");

  const handleNicheSelect = (niche: string) => {
    setKeyword(niche);
    toast({
      title: "✅ Nicho Selecionado",
      description: `Iniciando busca para "${niche}"...`
    });
    // Trigger search automatically after a short delay
    setTimeout(() => {
      handleSearch();
    }, 500);
  };

  const handleBatchNicheSelect = (nichesContent: string) => {
    setBatchMode(true);
    setNichesList(nichesContent);
    
    // Scroll to batch mode section after a short delay
    setTimeout(() => {
      const batchSection = document.getElementById('nichesList');
      if (batchSection) {
        batchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        batchSection.focus();
      }
    }, 300);
    
    toast({
      title: "✅ Nichos Carregados para Lote",
      description: `${nichesContent.split('\n').filter(n => n.trim()).length} nichos carregados no modo busca em lote.`
    });
  };

  // Batch search states
  const [batchMode, setBatchMode] = useState(false);
  const [nichesList, setNichesList] = useState("");
  const [batchSearchId, setBatchSearchId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({
    processed: 0,
    total: 0
  });
  const [batchResults, setBatchResults] = useState<any[]>([]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('manual') === 'true') {
      setShowManual(true);
    }
  }, []);
  const [opportunityFilters, setOpportunityFilters] = useState<OpportunityFilters>({
    minOpportunityScore: 0,
    maxSaturation: 100,
    minTrendScore: -100,
    maxCompetitors: 999,
    nicheType: 'all'
  });
  useEffect(() => {
    loadQuotaInfo();
    loadSearchHistory();
  }, []);
  const loadSearchHistory = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('niche_finder_searches').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(10);
      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  const saveCurrentSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a busca",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const searchParams = {
        keyword,
        maxChannelVideos,
        minViews,
        viralScore,
        minEngagement,
        maxVideoAge,
        maxSubscribers,
        minSubscribers,
        maxChannelAge,
        minViewSubRatio,
        country,
        language,
        videoDuration,
        maxVideos
      };
      const {
        error
      } = await supabase.from('niche_finder_searches').insert({
        user_id: user.id,
        search_name: searchName.trim(),
        search_params: searchParams,
        results: results,
        quota_info: quotaInfo
      });
      if (error) throw error;
      toast({
        title: "✅ Busca Salva!",
        description: `"${searchName}" foi salva no histórico`
      });
      setSearchName("");
      setShowSaveDialog(false);
      await loadSearchHistory();
    } catch (error: any) {
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const loadSavedSearch = (search: any) => {
    const params = search.search_params;
    setKeyword(params.keyword || "");
    setMaxChannelVideos(params.maxChannelVideos?.toString() || "500");
    setMinViews(params.minViews?.toString() || "5000");
    setViralScore(params.viralScore?.toString() || "3.5");
    setMinEngagement(params.minEngagement?.toString() || "0.001");
    setMaxVideoAge(params.maxVideoAge?.toString() || "14");
    setMaxSubscribers(params.maxSubscribers?.toString() || "100000");
    setMinSubscribers(params.minSubscribers?.toString() || "1000");
    setMaxChannelAge(params.maxChannelAge?.toString() || "365");
    setMinViewSubRatio(params.minViewSubRatio?.toString() || "0");
    setCountry(params.country || "any");
    setLanguage(params.language || "any");
    setVideoDuration(params.videoDuration || "any");
    setMaxVideos(params.maxVideos || 1000);
    setResults(search.results || []);
    if (search.quota_info) {
      setQuotaInfo(search.quota_info);
    }
    setShowHistoryDialog(false);
    toast({
      title: "✅ Busca Carregada",
      description: `"${search.search_name}" foi restaurada`
    });
  };
  const deleteSavedSearch = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('niche_finder_searches').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "🗑️ Busca Deletada",
        description: "A busca foi removida do histórico"
      });
      await loadSearchHistory();
    } catch (error: any) {
      toast({
        title: "Erro ao Deletar",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const loadQuotaInfo = async () => {
    const {
      data
    } = await supabase.functions.invoke('check-quota', {
      body: {
        feature: 'niche-finder'
      }
    });
    if (data) setQuotaInfo(data);
  };
  const handleGenerateSuggestions = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma palavra-chave primeiro",
        variant: "destructive"
      });
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-suggestions', {
        body: {
          keyword,
          language: language !== 'any' ? language : 'auto'
        }
      });
      if (error) throw error;
      toast({
        title: "Sugestões Geradas",
        description: `Aqui estão algumas sugestões baseadas em "${keyword}"`
      });
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar sugestões",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  const handleTestYouTubeApi = async () => {
    setIsTestingApi(true);
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse?.data?.user?.id;
      if (!userId) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        });
        return;
      }

      // Call test API directly without complex query
      const {
        data,
        error
      } = await supabase.functions.invoke('test-youtube-api', {
        body: {}
      });
      if (error) throw error;
      if (data.valid) {
        toast({
          title: "✅ API Key Válida!",
          description: data.message || "A chave está funcionando corretamente",
          duration: 5000
        });
        // Extract prefix from response if available
        if (data.keyPrefix) {
          setApiKeyPrefix(data.keyPrefix);
        }
      } else {
        toast({
          title: "❌ API Key Inválida",
          description: data.message || "A chave não está funcionando",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Testar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingApi(false);
    }
  };
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Calcular maxPages baseado em maxVideos (50 vídeos por página)
      const calculatedMaxPages = Math.ceil(maxVideos / 50);

      // Build search parameters
      const baseParams: any = {
        keyword,
        minViews: parseInt(minViews),
        viralScore: parseFloat(viralScore),
        maxVideoAge: parseInt(maxVideoAge),
        minSubscribers: parseInt(minSubscribers),
        country,
        language,
        videoDuration,
        maxPages: calculatedMaxPages,
        topN: 100,
        allowPartial: true,
        granularity: 'standard',
        aiModel: aiModel
      };
      baseParams.maxChannelVideos = maxChannelVideos === "any" ? "any" : parseInt(maxChannelVideos);
      baseParams.minEngagement = parseFloat(minEngagement);
      baseParams.maxSubscribers = maxSubscribers === "any" ? "any" : parseInt(maxSubscribers);
      baseParams.maxChannelAge = maxChannelAge === "any" ? "any" : parseInt(maxChannelAge);
      baseParams.minViewSubRatio = parseFloat(minViewSubRatio);
      const {
        data,
        error
      } = await supabase.functions.invoke('youtube-search', {
        body: baseParams
      });

      // Detectar rotação automática de API key
      if (data?.rotated) {
        toast({
          title: "🔄 API Key Trocada Automaticamente",
          description: data.message || "A API Key anterior esgotou. Agora usando a próxima da lista.",
          variant: "default",
          duration: 7000
        });
        await loadQuotaInfo();
        setIsLoading(false);
        return;
      }
      if (error) throw error;
      setResults(data.videos || []);

      // Set API key prefix if available
      if (data?.apiKeyPrefix) {
        setApiKeyPrefix(data.apiKeyPrefix);
      }

      // Set niche analysis if available
      if (data.nicheAnalysis?.niches && data.nicheAnalysis.niches.length > 0) {
        setNicheAnalysis(data.nicheAnalysis.niches);
        setViewMode('niches'); // Switch to niches view by default

        toast({
          title: `✅ ${data.nicheAnalysis.niches.length} Sub-Nichos Detectados`,
          description: `A IA agrupou ${data.videos?.length || 0} vídeos em nichos específicos`
        });
      } else {
        setNicheAnalysis([]);
        setViewMode('videos');
      }

      // Atualizar quota info
      if (data?.quotaInfo) {
        setQuotaInfo(data.quotaInfo);
      }
      if (data.partial && data.totalFound === 0) {
        toast({
          title: "⚠️ Quota da API Excedida",
          description: "A API do YouTube atingiu o limite diário. Troque sua API Key nas configurações ou aguarde até amanhã (00:00 PST).",
          variant: "destructive"
        });
      } else if (data.partial) {
        toast({
          title: "⚠️ Resultados Parciais - Quota Atingida",
          description: `Analisados ${data.totalAnalyzed || 0} de ${maxVideos} vídeos. Troque sua API Key para buscar mais resultados.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Busca Concluída",
          description: `Encontrados ${data.videos?.length || 0} vídeos virais de ${data.totalAnalyzed || 0} analisados`
        });
      }
    } catch (error: any) {
      // Detectar erro específico de quota do YouTube
      if (error.message?.includes('YOUTUBE_QUOTA_EXCEEDED')) {
        toast({
          title: "🔑 API Key Esgotada",
          description: "Sua API Key do YouTube atingiu o limite diário. Vá em Configurações → API Keys para trocar por outra chave e continuar buscando.",
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({
          title: "Erro na Busca",
          description: error.message || "Erro ao buscar vídeos",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  const sortResults = (videos: any[]) => {
    const sorted = [...videos].sort((a, b) => {
      const getValue = (video: any, criterion: string) => {
        switch (criterion) {
          case 'explosive':
            return video.vph || 0;
          case 'channelExplosive':
            return video.viewSubRatio || 0;
          case 'channelNew':
            return -(video.channelAgeInDays || 999999);
          case 'channelAge':
            return video.channelAgeInDays || 999999;
          case 'videoAge':
            return video.ageInDays || 999999;
          case 'views':
            return video.viewCount || 0;
          case 'viralScore':
            return video.viralScore || 0;
          default:
            return 0;
        }
      };
      const primaryA = getValue(a, sortConfig.primary);
      const primaryB = getValue(b, sortConfig.primary);
      if (primaryA !== primaryB) {
        return sortConfig.direction === 'desc' ? primaryB - primaryA : primaryA - primaryB;
      }
      if (sortConfig.secondary !== 'none') {
        const secondaryA = getValue(a, sortConfig.secondary);
        const secondaryB = getValue(b, sortConfig.secondary);
        return sortConfig.direction === 'desc' ? secondaryB - secondaryA : secondaryA - secondaryB;
      }
      return 0;
    });
    return sorted;
  };
  const handleBatchSearch = async () => {
    if (!nichesList.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a lista de nichos",
        variant: "destructive"
      });
      return;
    }
    const nichesArray = nichesList.split('\n').map(n => n.trim()).filter(Boolean);
    if (nichesArray.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum nicho válido na lista",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setBatchResults([]);
    setBatchProgress({
      processed: 0,
      total: nichesArray.length
    });
    try {
      // Criar registro do batch search
      const {
        data: batchSearch,
        error: batchError
      } = await supabase.from('niche_batch_searches').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        niches_list: nichesArray,
        total_count: nichesArray.length,
        status: 'processing'
      }).select().single();
      if (batchError) throw batchError;
      setBatchSearchId(batchSearch.id);

      // Processar em lotes de 20 nichos
      const BATCH_SIZE = 20;
      const allVideos: any[] = [];
      for (let i = 0; i < nichesArray.length; i += BATCH_SIZE) {
        const batch = nichesArray.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nichesArray.length / BATCH_SIZE)}`);
        const {
          data,
          error
        } = await supabase.functions.invoke('batch-niche-search', {
          body: {
            nichesBatch: batch,
            batchSearchId: batchSearch.id
          }
        });
        if (error) {
          console.error('Erro no batch:', error);
          toast({
            title: "Erro",
            description: `Erro ao processar lote ${Math.floor(i / BATCH_SIZE) + 1}`,
            variant: "destructive"
          });
          continue;
        }
        if (data?.videos) {
          allVideos.push(...data.videos);
          setBatchResults(prev => [...prev, ...data.videos]);
        }
        setBatchProgress({
          processed: i + batch.length,
          total: nichesArray.length
        });

        // Pequena pausa entre lotes para evitar rate limit
        if (i + BATCH_SIZE < nichesArray.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setResults(allVideos);
      toast({
        title: "✅ Busca concluída!",
        description: `${allVideos.length} vídeos encontrados em ${nichesArray.length} nichos`
      });
    } catch (error: any) {
      console.error('Erro no batch search:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao processar busca em lote',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleHunterMode = () => {
    // Configurações otimizadas para encontrar oportunidades
    setMaxChannelAge("180");
    setMaxSubscribers("30000");
    setMinSubscribers("500");
    setMinViewSubRatio("15");
    setMinViews("100000");
    setMaxVideoAge("30");
    setViralScore("4.5");
    setMaxVideos(1500);
    toast({
      title: "🎯 Modo Caçador de Oportunidades Ativado",
      description: "Busca otimizada para nichos virais + baixa competição",
      duration: 5000
    });

    // Auto-executar busca após 1 segundo
    setTimeout(() => handleSearch(), 1000);
  };
  const handleFilteredNiches = (filters: OpportunityFilters) => {
    setOpportunityFilters(filters);
  };
  const filteredNiches = nicheAnalysis.filter(niche => {
    if (niche.metrics.opportunityScore < opportunityFilters.minOpportunityScore) return false;
    if (niche.metrics.saturationScore > opportunityFilters.maxSaturation) return false;
    if (niche.metrics.trendScore < opportunityFilters.minTrendScore) return false;
    if (niche.metrics.uniqueChannels > opportunityFilters.maxCompetitors) return false;
    if (opportunityFilters.nicheType !== 'all') {
      if (opportunityFilters.nicheType === 'micro' && niche.specificity !== 'micro-niche') return false;
      if (opportunityFilters.nicheType === 'sub' && niche.specificity !== 'sub-niche') return false;
      if (opportunityFilters.nicheType === 'broad' && niche.specificity !== 'broad') return false;
    }
    return true;
  });
  const handleExportNiches = () => {
    if (nicheAnalysis.length === 0) {
      toast({
        title: "Nenhum nicho para exportar",
        description: "Faça uma busca primeiro para gerar análise de nichos",
        variant: "destructive"
      });
      return;
    }
    exportNicheAnalysis(filteredNiches, results, 'analise-nichos');
    toast({
      title: "✅ Exportado!",
      description: `Análise de ${filteredNiches.length} nichos exportada com sucesso`
    });
  };
  return <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Niche Finder</h1>
          <p className="text-muted-foreground text-lg">
            Descubra nichos virais pouco explorados no YouTube
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => setShowManual(true)} variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Manual Completo
          </Button>
          
          <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
            <span className="text-sm font-semibold text-accent">
              🔍 Busca Profunda Ativada (até {maxVideos} vídeos)
            </span>
          </div>
          
          {results.length > 0 && <Button onClick={() => setShowSaveDialog(true)} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Busca
            </Button>}
          
          {searchHistory.length > 0 && <Button onClick={() => setShowHistoryDialog(true)} variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Histórico ({searchHistory.length})
            </Button>}
          <Button onClick={handleTestYouTubeApi} variant="outline" size="sm" disabled={isTestingApi}>
            {isTestingApi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Testar YouTube API
          </Button>
          
          {quotaInfo && <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
              <Badge variant={quotaInfo.apiStatus === 'active' ? 'default' : 'destructive'}>
                {quotaInfo.apiStatus === 'active' ? '✅ API Ativa' : '⚠️ API Esgotada'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Quota usada: {quotaInfo.percentageUsed?.toFixed(1)}% 
                ({quotaInfo.quotaUsed?.toLocaleString()}/{quotaInfo.dailyQuota?.toLocaleString()})
              </span>
            </div>}
          
          <Button onClick={() => setShowNicheLists(true)} variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            Lista de Nichos
          </Button>
          
          {apiKeyPrefix && <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <span className="text-xs font-mono text-green-700 dark:text-green-300">
                🔑 API: {apiKeyPrefix}...
              </span>
            </div>}
        </div>
      </div>


      {/* Batch Mode Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">🎯 Modo de Busca</h3>
            <p className="text-sm text-muted-foreground">
              {batchMode ? "Buscar em lista de 100 nichos (500 vídeos por nicho)" : "Busca única por palavra-chave"}
            </p>
          </div>
          <Button variant={batchMode ? "default" : "outline"} onClick={() => setBatchMode(!batchMode)}>
            {batchMode ? "Modo Lista Ativo ✅" : "Ativar Modo Lista"}
          </Button>
        </div>
      </Card>

      {/* Batch Mode - Lista de Nichos */}
      {batchMode && <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nichesList" className="text-base font-semibold">
                📋 Lista de Nichos (um por linha)
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Cole sua lista de nichos abaixo. Cada linha = 1 nicho. Máximo 500 vídeos por nicho.
              </p>
            </div>
            <Textarea id="nichesList" value={nichesList} onChange={e => setNichesList(e.target.value)} placeholder={"fitness para idosos\nreceitas veganas rápidas\nmeditação para ansiedade\n..."} className="min-h-[200px] font-mono text-sm" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                📊 {nichesList.split('\n').filter(n => n.trim()).length} nichos detectados
              </p>
              <Button onClick={handleBatchSearch} disabled={isLoading || !nichesList.trim()} size="lg">
                {isLoading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando {batchProgress.processed}/{batchProgress.total}...
                  </> : <>
                    <Search className="mr-2 h-4 w-4" />
                    Iniciar Busca em Lote
                  </>}
              </Button>
            </div>
            {isLoading && batchProgress.total > 0 && <div className="space-y-2">
                <Progress value={batchProgress.processed / batchProgress.total * 100} />
                <p className="text-sm text-center text-muted-foreground">
                  {Math.round(batchProgress.processed / batchProgress.total * 100)}% completo
                  • {batchProgress.processed}/{batchProgress.total} nichos processados
                  • {batchResults.length} vídeos encontrados
                </p>
              </div>}
          </div>
        </Card>}

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">


          {/* Palavra-chave */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="keyword">
                Palavra-chave <span className="text-muted-foreground text-sm">(opcional)</span>
              </Label>
              {!keyword.trim() && <Badge variant="secondary" className="text-xs">
                  🔍 Modo Descoberta
                </Badge>}
            </div>
            <div className="flex gap-2">
              <Input id="keyword" placeholder="Ex: meditação, receitas veganas... ou deixe vazio para Modo Descoberta" value={keyword} onChange={e => setKeyword(e.target.value)} />
              <Button onClick={handleGenerateSuggestions} disabled={isLoadingSuggestions || !keyword.trim()} variant="outline">
                {isLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-2">Sugestões IA</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 <strong>Deixe vazio</strong> para ativar o <strong>Modo de Descoberta</strong> 
              (busca inteligente em 15 categorias populares do YouTube)
            </p>
          </div>

          {/* Quantidade MAX de Vídeos do Canal */}
          <div className="space-y-2">
            <Label htmlFor="maxChannelVideos">Quantidade MAX de Vídeos do Canal</Label>
            <Input id="maxChannelVideos" type="number" placeholder="ex: 500" value={maxChannelVideos} onChange={e => setMaxChannelVideos(e.target.value)} />
          </div>

          {/* Visualizações, Score e Engajamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minViews">Mínimo de Visualizações</Label>
              <Input id="minViews" type="number" placeholder="ex: 5000" value={minViews} onChange={e => setMinViews(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="viralScore">Peso Score Viral (0-15.0)</Label>
              <Input id="viralScore" type="number" step="0.1" placeholder="ex: 3.5" value={viralScore} onChange={e => setViralScore(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minEngagement">Mínimo de Engajamento (0.001-1.0)</Label>
              <Input id="minEngagement" type="number" step="0.001" placeholder="ex: 0.001" value={minEngagement} onChange={e => setMinEngagement(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                💡 Exemplo: 0.05 = 5% de engajamento
              </p>
            </div>
          </div>

          {/* Idade do Vídeo e Inscritos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxVideoAge">Idade Máxima do Vídeo (dias)</Label>
              <Input id="maxVideoAge" type="number" placeholder="ex: 14" value={maxVideoAge} onChange={e => setMaxVideoAge(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSubscribers">Mínimo de Inscritos</Label>
              <Input id="minSubscribers" type="number" placeholder="ex: 1000" value={minSubscribers} onChange={e => setMinSubscribers(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSubscribers">Máximo de Inscritos</Label>
              <Input id="maxSubscribers" type="number" placeholder="ex: 100000" value={maxSubscribers} onChange={e => setMaxSubscribers(e.target.value)} />
            </div>
          </div>

          {/* Filtros Avançados - Talentos Emergentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="maxChannelAge">Idade Máxima do Canal (dias)</Label>
              <Input id="maxChannelAge" type="number" placeholder="ex: 365 (1 ano)" value={maxChannelAge} onChange={e => setMaxChannelAge(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                💡 60 dias = 2 meses | 180 dias = 6 meses | 365 dias = 1 ano
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minViewSubRatio">Ratio Mín. Views/Inscritos</Label>
              <Input id="minViewSubRatio" type="number" step="0.1" placeholder="ex: 10" value={minViewSubRatio} onChange={e => setMinViewSubRatio(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                💡 10 = vídeos com 10x mais views que inscritos (alta viralização)
              </p>
            </div>
          </div>

          {/* País, Idioma e Tipo de Vídeo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                  <SelectItem value="BR">Brasil</SelectItem>
                  <SelectItem value="GB">Reino Unido</SelectItem>
                  <SelectItem value="CA">Canadá</SelectItem>
                  <SelectItem value="AU">Austrália</SelectItem>
                  <SelectItem value="DE">Alemanha</SelectItem>
                  <SelectItem value="FR">França</SelectItem>
                  <SelectItem value="ES">Espanha</SelectItem>
                  <SelectItem value="IT">Itália</SelectItem>
                  <SelectItem value="JP">Japão</SelectItem>
                  <SelectItem value="KR">Coréia do Sul</SelectItem>
                  <SelectItem value="MX">México</SelectItem>
                  <SelectItem value="AR">Argentina</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                  <SelectItem value="fr">Francês</SelectItem>
                  <SelectItem value="de">Alemão</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="ja">Japonês</SelectItem>
                  <SelectItem value="ko">Coreano</SelectItem>
                  <SelectItem value="zh">Chinês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoDuration">Tipo de Vídeo</Label>
              <Select value={videoDuration} onValueChange={setVideoDuration}>
                <SelectTrigger id="videoDuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="long">Vídeos Longos</SelectItem>
                  <SelectItem value="short">Shorts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slider de Vídeos */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">
              Quantidade de Vídeos Analisados (máx: {maxVideos} vídeos)
            </Label>
            <Slider value={[maxVideos]} onValueChange={value => setMaxVideos(value[0])} max={1500} min={500} step={100} className="py-4" />
            <p className="text-xs text-muted-foreground">
              💡 1500 vídeos ≈ 30% da quota diária. Recomendado: 1000 vídeos para uso regular.
            </p>
          </div>

          {/* Presets Rápidos - MELHORADOS */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">⚡ Configurações Rápidas</h3>
              <HelpTooltip description="Presets otimizados para diferentes estratégias de busca. Clique para aplicar instantaneamente os filtros ideais." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Talentos Emergentes */}
              <Card
                onClick={() => {
                  setMaxChannelAge("180");
                  setMaxSubscribers("50000");
                  setMinSubscribers("500");
                  setMinViewSubRatio("10");
                  setMinViews("100000");
                  setMaxVideoAge("60");
                  setViralScore("4.0");
                  toast({
                    title: "✅ Preset Aplicado",
                    description: "Configuração 'Talentos Emergentes' ativada"
                  });
                }}
                className="p-6 cursor-pointer hover:border-accent transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">💎</span>
                  <HelpTooltip title="Talentos Emergentes" description="Encontre canais novos (menos de 6 meses) com alto potencial viral e baixa concorrência. Ideal para descobrir oportunidades antes que fiquem saturadas." steps={["Canais com menos de 180 dias", "Máximo 50k inscritos", "Vídeos com +100k views", "Alta proporção view/inscrito (10+)"]} />
                </div>
                <span className="font-bold text-base mb-1">Talentos Emergentes</span>
                <span className="text-xs text-center text-muted-foreground">
                  Canais novos + alto viral
                </span>
                <div className="flex gap-1 mt-2">
                  <div className="h-1 w-6 bg-accent/30 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/40 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/50 rounded-full"></div>
                </div>
              </Card>
              
              {/* Ultra Viral */}
              <Card
                onClick={() => {
                  setMaxChannelAge("60");
                  setMaxSubscribers("20000");
                  setMinViewSubRatio("30");
                  setMinViews("500000");
                  setMaxVideoAge("30");
                  toast({
                    title: "✅ Preset Aplicado",
                    description: "Configuração 'Ultra Viral' ativada"
                  });
                }}
                className="p-6 cursor-pointer hover:border-accent transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">🔥</span>
                  <HelpTooltip title="Ultra Viral" description="Busque vídeos com performance explosiva nos últimos 2 meses. Perfeito para identificar conteúdo que está bombando agora." steps={["Vídeos com +500k views", "Publicados há menos de 30 dias", "Canais pequenos (máx 20k)", "Proporção view/inscrito de 30+"]} />
                </div>
                <span className="font-bold text-base mb-1">Ultra Viral</span>
                <span className="text-xs text-center text-muted-foreground">
                  500k+ views | 2 meses
                </span>
                <div className="flex gap-1 mt-2">
                  <div className="h-1 w-6 bg-accent/30 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/40 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/50 rounded-full"></div>
                </div>
              </Card>
              
              {/* Crescimento Rápido */}
              <Card
                onClick={() => {
                  setMaxChannelAge("365");
                  setMaxSubscribers("100000");
                  setMinViewSubRatio("5");
                  setMinViews("50000");
                  setMaxVideoAge("14");
                  toast({
                    title: "✅ Preset Aplicado",
                    description: "Configuração 'Crescimento Rápido' ativada"
                  });
                }}
                className="p-6 cursor-pointer hover:border-accent transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">📈</span>
                  <HelpTooltip title="Crescimento Rápido" description="Identifique canais em ascensão com alto engajamento em vídeos recentes. Ótimo para analisar tendências emergentes." steps={["Vídeos publicados há menos de 14 dias", "Mínimo 50k views", "Canais com até 100k inscritos", "Alto engajamento recente"]} />
                </div>
                <span className="font-bold text-base mb-1">Crescimento Rápido</span>
                <span className="text-xs text-center text-muted-foreground">
                  Alto engajamento + recente
                </span>
                <div className="flex gap-1 mt-2">
                  <div className="h-1 w-6 bg-accent/30 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/40 rounded-full"></div>
                  <div className="h-1 w-6 bg-accent/50 rounded-full"></div>
                </div>
              </Card>
            </div>
          </div>

          {/* Modo Caçador */}
          <Button onClick={handleHunterMode} disabled={isLoading} variant="default" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold" size="lg">
            <Target className="h-5 w-5 mr-2" />
            🎯 Modo Caçador de Oportunidades
          </Button>

          {/* Seletor de Modelo de IA */}
          <div className="space-y-2 pt-4 border-t">
            <AIModelSelector
              value={aiModel}
              onChange={setAiModel}
              label="🤖 Modelo de IA para Análise de Nichos"
            />
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando...
              </> : <>
                <Search className="h-4 w-4 mr-2" />
                Buscar Nichos Virais
              </>}
          </Button>

          {suggestions.length > 0 && <Card className="mt-6 p-6 bg-accent/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sugestões de Palavras-Chave IA
              </h3>
              <div className="space-y-2">
                {suggestions.map((s, i) => <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary transition-colors">
                    <span className="text-sm font-medium text-foreground flex-1">{s}</span>
                    <Button variant="outline" size="sm" onClick={() => {
                setKeyword(s);
                setSuggestions([]);
              }} className="ml-4">
                      Usar
                    </Button>
                  </div>)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSuggestions([])} className="mt-4 w-full">
                Limpar Sugestões
              </Button>
            </Card>}
        </div>
      </Card>

      {/* Niche Analysis Section */}
      {nicheAnalysis.length > 0 && <div className="space-y-6">
          <NicheDashboard niches={nicheAnalysis} />
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {viewMode === 'niches' ? 'Nichos Descobertos' : 'Todos os Vídeos'}
                ({viewMode === 'niches' ? filteredNiches.length : results.length})
              </h2>
              
              <div className="flex gap-2">
                <Button variant={viewMode === 'niches' ? 'default' : 'outline'} onClick={() => setViewMode('niches')} size="sm">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Ver por Nichos
                </Button>
                <Button variant={viewMode === 'videos' ? 'default' : 'outline'} onClick={() => setViewMode('videos')} size="sm">
                  <LayoutList className="h-4 w-4 mr-2" />
                  Ver Vídeos
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              {viewMode === 'niches' && <>
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Filtros ({Object.values(opportunityFilters).filter(v => v !== 0 && v !== 100 && v !== -100 && v !== 999 && v !== 'all').length})
                  </Button>
                  <Button onClick={handleExportNiches} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Nichos
                  </Button>
                </>}
            </div>
          </div>

          {/* Filtros de Oportunidade */}
          {showFilters && viewMode === 'niches' && <OpportunityFilter onFilterChange={handleFilteredNiches} currentFilters={opportunityFilters} />}

          {/* Niche Cards */}
          {viewMode === 'niches' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNiches.sort((a, b) => b.metrics.opportunityScore - a.metrics.opportunityScore).map(niche => <NicheCard key={niche.id} niche={niche} onExpand={() => setSelectedNiche(niche)} />)}
            </div>}

          {/* Dialog for expanded niche details */}
          <Dialog open={!!selectedNiche} onOpenChange={open => !open && setSelectedNiche(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedNiche?.name}</DialogTitle>
              </DialogHeader>
              {selectedNiche && <div className="space-y-6">
                  <p className="text-muted-foreground">{selectedNiche.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedNiche.videoIds.length}</p>
                      <p className="text-xs text-muted-foreground">Vídeos</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedNiche.metrics.uniqueChannels}</p>
                      <p className="text-xs text-muted-foreground">Canais</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedNiche.metrics.opportunityScore}</p>
                      <p className="text-xs text-muted-foreground">Score Oportunidade</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedNiche.metrics.saturationScore}%</p>
                      <p className="text-xs text-muted-foreground">Saturação</p>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Palavras-Chave:</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedNiche.keywords.map((kw: string, i: number) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Vídeos deste Nicho ({selectedNiche.videoIds.length}):</h3>
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {results.filter(v => selectedNiche.videoIds.includes(v.id)).slice(0, 20).map((video, i) => <Card key={i} className="p-3 hover:shadow-md transition-shadow">
                            <div className="flex gap-3">
                              <img src={video.thumbnail} alt={video.title} className="w-32 h-18 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{video.channelTitle}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {video.viewCount.toLocaleString()} views
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    VPH: {video.vph?.toFixed(0)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Card>)}
                    </div>
                  </div>

                  <Button onClick={() => {
              const nicheVideos = results.filter(v => selectedNiche.videoIds.includes(v.id));
              const exportData = nicheVideos.map((video: any) => ({
                'Título': video.title,
                'Canal': video.channelTitle,
                'Views': video.viewCount,
                'VPH': video.vph?.toFixed(0),
                'Score Viral': video.viralScore?.toFixed(0),
                'URL': `https://youtube.com/watch?v=${video.id}`
              }));
              exportToExcel(exportData, `nicho-${selectedNiche.name.replace(/\s+/g, '-')}`, 'Vídeos');
              toast({
                title: "✅ Exportado!",
                description: `Vídeos do nicho "${selectedNiche.name}" exportados`
              });
            }} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Vídeos deste Nicho
                  </Button>
                </div>}
            </DialogContent>
          </Dialog>
        </div>}

      {/* Results Grid */}
      {results.length > 0 && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Resultados ({results.length} vídeos encontrados)</h2>
            <Button onClick={() => {
          const exportData = sortResults(results).map((video: any) => ({
            'Título': video.title,
            'Canal': video.channelTitle,
            'Visualizações': video.viewCount,
            'Inscritos': video.subscriberCount,
            'Score Viral': video.viralScore?.toFixed(2),
            'VPH': video.vph ? video.vph.toLocaleString() : 'N/A',
            'Dias': video.ageInDays,
            'Engajamento': video.engagement ? (video.engagement * 100).toFixed(2) + '%' : 'N/A',
            'Ratio V/I': video.viewSubRatio?.toFixed(1) || 'N/A',
            'URL': `https://youtube.com/watch?v=${video.id}`
          }));
          exportToExcel(exportData, `niche-finder-${new Date().toISOString().split('T')[0]}`, 'Vídeos Virais');
          toast({
            title: "✅ Exportado!",
            description: "Planilha gerada com sucesso"
          });
        }} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
          
          {/* Controles de Ordenação */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Ordenar por:</span>
              </div>

              <Select value={sortConfig.primary} onValueChange={value => setSortConfig({
            ...sortConfig,
            primary: value
          })}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explosive">🔥 Vídeo Explosivo (VPH)</SelectItem>
                  <SelectItem value="channelExplosive">🚀 Canal Explosivo (Ratio)</SelectItem>
                  <SelectItem value="channelNew">🆕 Canal Novo</SelectItem>
                  <SelectItem value="channelAge">📅 Idade do Canal</SelectItem>
                  <SelectItem value="videoAge">⏱️ Idade do Vídeo</SelectItem>
                  <SelectItem value="views">👁️ Views</SelectItem>
                  <SelectItem value="viralScore">⭐ Score Viral</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortConfig.secondary} onValueChange={value => setSortConfig({
            ...sortConfig,
            secondary: value
          })}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Depois por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="explosive">🔥 VPH</SelectItem>
                  <SelectItem value="channelExplosive">🚀 Ratio</SelectItem>
                  <SelectItem value="channelNew">🆕 Canal Novo</SelectItem>
                  <SelectItem value="channelAge">📅 Idade Canal</SelectItem>
                  <SelectItem value="videoAge">⏱️ Idade Vídeo</SelectItem>
                  <SelectItem value="views">👁️ Views</SelectItem>
                  <SelectItem value="viralScore">⭐ Score Viral</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortConfig.direction} onValueChange={(value: 'asc' | 'desc') => setSortConfig({
            ...sortConfig,
            direction: value
          })}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓ Maior → Menor</SelectItem>
                  <SelectItem value="asc">↑ Menor → Maior</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setSortConfig({
            primary: 'viralScore',
            secondary: 'none',
            direction: 'desc'
          })}>
                Resetar
              </Button>
            </div>

            {/* Presets de Ordenação */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => setSortConfig({
            primary: 'explosive',
            secondary: 'viralScore',
            direction: 'desc'
          })}>
                🔥 Mais Explosivos
              </Button>
              
              <Button variant="secondary" size="sm" onClick={() => setSortConfig({
            primary: 'channelNew',
            secondary: 'channelExplosive',
            direction: 'desc'
          })}>
                🆕 Canais Novos + Explosivos
              </Button>
              
              <Button variant="secondary" size="sm" onClick={() => setSortConfig({
            primary: 'videoAge',
            secondary: 'views',
            direction: 'asc'
          })}>
                ⚡ Vídeos Recentes + Views
              </Button>
              
              <Button variant="secondary" size="sm" onClick={() => setSortConfig({
            primary: 'viralScore',
            secondary: 'channelExplosive',
            direction: 'desc'
          })}>
                ⭐ Score Viral + Ratio
              </Button>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortResults(results).map((video, index) => {
          const isExplosive = video.vph && video.vph > 1000;
          const isMegaViral = video.vph && video.vph > 5000;
          const isNew = video.ageInDays <= 3;
          const isSmallChannel = video.subscriberCount && video.subscriberCount < 10000;
          const isHighRatio = video.viewSubRatio && video.viewSubRatio > 20;
          return <Card key={index} className={`relative overflow-hidden border-2 hover:shadow-lg transition-all ${isMegaViral ? 'border-purple-500/40' : isExplosive ? 'border-red-500/20' : 'border-border'}`}>
                  {/* Badge Superior */}
                  {(isExplosive || isMegaViral) && <div className="absolute top-3 right-3 z-10">
                      <Badge className={`font-bold animate-pulse ${isMegaViral ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'}`}>
                        {isMegaViral ? '🚀 MEGA VIRAL' : '🔥 EXPLOSIVO'}
                      </Badge>
                    </div>}

                  {/* Thumbnail */}
                  <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="block relative group">
                    <img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} className="w-full h-48 object-cover" />
                    {video.vph && video.vph > 500 && <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-600/90 backdrop-blur text-white text-xs font-bold rounded">
                        🚀 {video.vph.toLocaleString()} VPH
                      </div>}
                  </a>

                  <CardContent className="p-4 space-y-3">
                    {/* Título */}
                    <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold line-clamp-2 text-sm hover:text-primary transition-colors block">
                      {video.title}
                    </a>

                    {/* Nicho - DESTAQUE */}
                    {video.niche && <div className="flex items-center justify-center">
                        <Badge variant="default" className="text-xs font-bold px-3 py-1">
                          🎯 {video.niche}
                        </Badge>
                      </div>}

                    {/* Canal */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="line-clamp-1">{video.channelTitle}</span>
                    </div>

                    {/* MÉTRICAS DESTACADAS - TOP 4 */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20">
                      <div className="flex flex-col items-center p-2 bg-background/80 backdrop-blur rounded-md">
                        <span className="text-[10px] text-muted-foreground font-medium mb-1">👁️ VIEWS</span>
                        <p className="text-lg font-bold text-primary">{video.viewCount?.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-background/80 backdrop-blur rounded-md">
                        <span className="text-[10px] text-muted-foreground font-medium mb-1">👥 INSCRITOS</span>
                        <p className="text-lg font-bold text-primary">{video.subscriberCount?.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-background/80 backdrop-blur rounded-md">
                        <span className="text-[10px] text-muted-foreground font-medium mb-1">⏰ IDADE CANAL</span>
                        <p className="text-lg font-bold text-primary">
                          {video.channelAgeInDays ? `${Math.floor(video.channelAgeInDays / 30)}m` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-background/80 backdrop-blur rounded-md">
                        <span className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          VPH
                        </span>
                        <p className="text-lg font-bold text-orange-600">
                          {video.vph ? video.vph.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Métricas Secundárias */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                      <div>
                        <span className="text-muted-foreground">Engajamento:</span>
                        <p className="font-semibold">{(video.engagement * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Score Viral:</span>
                        <p className="font-semibold text-primary">{video.viralScore?.toFixed(0)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ganhos Est.:</span>
                        <p className="font-semibold text-green-600">${video.estimatedEarnings?.toFixed(0)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ratio V/I:</span>
                        <p className="font-semibold text-purple-600">
                          {video.viewSubRatio ? video.viewSubRatio.toFixed(1) + 'x' : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Idade Vídeo:</span>
                        <p className="font-semibold">{video.ageInDays}d</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Likes:</span>
                        <p className="font-semibold">{video.likeCount?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Badges Dinâmicos */}
                    <div className="flex gap-1 flex-wrap pt-2">
                      {isNew && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          ⚡ NOVO
                        </Badge>}
                      {isHighRatio && <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                          💎 ALTO RATIO
                        </Badge>}
                      {isSmallChannel && <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          🌟 CANAL PEQUENO
                        </Badge>}
                      {video.channelAgeInDays && video.channelAgeInDays < 180 && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                          🆕 CANAL NOVO
                        </Badge>}
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>
        </div>}

      {/* Dialog para Salvar Busca */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>💾 Salvar Busca no Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Dê um nome para esta busca para encontrá-la facilmente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input placeholder="Ex: Nichos de Oração - Ultra Viral" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              saveCurrentSearch();
            }
          }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveCurrentSearch} disabled={isSaving}>
              {isSaving ? <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </> : <>Salvar</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para Histórico */}
      <AlertDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>📂 Histórico de Buscas</AlertDialogTitle>
            <AlertDialogDescription>
              Suas últimas {searchHistory.length} buscas salvas
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            {searchHistory.length === 0 ? <p className="text-center text-muted-foreground py-8">
                Nenhuma busca salva ainda
              </p> : searchHistory.map(search => <Card key={search.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">{search.search_name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          📅 {new Date(search.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </p>
                        <p>🎯 {search.results?.length || 0} resultados encontrados</p>
                        {search.search_params?.keyword && <p>🔍 Palavra-chave: "{search.search_params.keyword}"</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadSavedSearch(search)}>
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Carregar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                  if (confirm(`Deletar "${search.search_name}"?`)) {
                    deleteSavedSearch(search.id);
                  }
                }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>)}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog do Manual */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Niche Finder</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>

      {/* Dialog de Listas de Nichos */}
      <NicheListsManager 
        open={showNicheLists} 
        onOpenChange={setShowNicheLists}
        onNicheSelect={handleNicheSelect}
        onBatchSelect={handleBatchNicheSelect}
      />
    </div>;
};
export default NicheFinder;