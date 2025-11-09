import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Search, Loader2, Download, Save, FolderOpen, Trash2, Target, BookOpen, Filter, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/exportToExcel";
import { VideoCard } from "@/components/niche-finder/VideoCard";
import { UserManual } from "@/components/niche-finder/UserManual";
import { NicheListsManager } from "@/components/niche-finder/NicheListsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Niche Finder with automatic API key rotation
const NicheFinder = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [nichesList, setNichesList] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchProgress, setBatchProgress] = useState({
    processed: 0,
    total: 0
  });
  
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

  // Estados de UI
  const [showManual, setShowManual] = useState(false);
  const [showNicheLists, setShowNicheLists] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [maxPagesPerNiche, setMaxPagesPerNiche] = useState(10);

  // Estados para filtros pós-busca
  const [postFilters, setPostFilters] = useState({
    channelAgeMin: 0,
    channelAgeMax: 3650, // 10 anos
    subscribersMin: 0,
    subscribersMax: 5000000,
    minDurationSeconds: 0,
    onlyDarkChannels: false
  });

  const [tempFilters, setTempFilters] = useState({
    channelAgeMin: 0,
    channelAgeMax: 3650,
    subscribersMin: 0,
    subscribersMax: 5000000,
    minDurationSeconds: 0,
    onlyDarkChannels: false
  });

  // Estados para análise de dark channels
  const [darkAnalysis, setDarkAnalysis] = useState<Map<string, any>>(new Map());
  const [darkAnalysisProgress, setDarkAnalysisProgress] = useState({
    analyzed: 0,
    total: 0
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('manual') === 'true') {
      setShowManual(true);
    }
    loadSearchHistory();
  }, []);

  const handleNicheSelect = (niche: string) => {
    setKeyword(niche);
    toast({
      title: "✅ Nicho Selecionado",
      description: `"${niche}" adicionado ao campo de busca`
    });
  };

  const handleBatchNicheSelect = (nichesContent: string) => {
    setNichesList(nichesContent);
    
    setTimeout(() => {
      const batchSection = document.getElementById('nichesList');
      if (batchSection) {
        batchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        batchSection.focus();
      }
    }, 300);
    
    toast({
      title: "✅ Nichos Carregados",
      description: `${nichesContent.split('\n').filter(n => n.trim()).length} nichos carregados.`
    });
  };

  const loadSearchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('niche_finder_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const searchParams = {
        keyword,
        nichesList,
        aiModel,
        maxPagesPerNiche
      };

      const { error } = await supabase
        .from('niche_finder_searches')
        .insert({
          user_id: user.id,
          search_name: searchName.trim(),
          search_params: searchParams,
          results: results
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
    setNichesList(params.nichesList || "");
    setAiModel(params.aiModel || "gemini-2.5-flash");
    setMaxPagesPerNiche(params.maxPagesPerNiche || 10);
    setResults(search.results || []);
    
    setShowHistoryDialog(false);
    toast({
      title: "✅ Busca Carregada",
      description: `"${search.search_name}" foi restaurada`
    });
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('niche_finder_searches')
        .delete()
        .eq('id', id);

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

  const analyzeChannelsForDark = async (videos: any[]) => {
    // Agrupar vídeos por canal (channelId)
    const channelGroups = new Map<string, any[]>();
    videos.forEach(video => {
      if (!channelGroups.has(video.channelId)) {
        channelGroups.set(video.channelId, []);
      }
      channelGroups.get(video.channelId)!.push(video);
    });

    console.log(`🎭 Analisando ${channelGroups.size} canais únicos...`);
    
    setDarkAnalysisProgress({ analyzed: 0, total: channelGroups.size });
    const newDarkAnalysis = new Map(darkAnalysis);
    let analyzed = 0;

    // Analisar cada canal
    for (const [channelId, channelVideos] of channelGroups) {
      try {
        // Pegar até 5 títulos de vídeos do canal
        const recentTitles = channelVideos
          .slice(0, 5)
          .map(v => v.title);

        const channelData = {
          name: channelVideos[0].channelTitle,
          description: '', // Não temos descrição no NicheFinder
          recentTitles: recentTitles,
          contentType: 'unknown'
        };

        console.log(`🔍 Analisando canal: ${channelData.name}`);

        const { data, error } = await supabase.functions.invoke('detect-dark-channel', {
          body: { 
            channelData,
            aiModel: aiModel // Usar modelo selecionado
          }
        });

        if (error) {
          console.error(`❌ Erro ao analisar canal ${channelId}:`, error);
          
          // Se for erro de créditos ou rate limit, parar análise
          if (error.message?.includes('NO_CREDITS') || error.message?.includes('RATE_LIMIT')) {
            toast({
              title: "⚠️ Análise de Dark Channels Indisponível",
              description: "Sem créditos Lovable AI ou rate limit atingido. Análise pausada.",
              variant: "destructive"
            });
            break;
          }
          
          continue;
        }

        // Armazenar resultado
        newDarkAnalysis.set(channelId, data);
        
        analyzed++;
        setDarkAnalysisProgress({ analyzed, total: channelGroups.size });

        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`❌ Erro inesperado ao analisar canal ${channelId}:`, error);
      }
    }

    setDarkAnalysis(newDarkAnalysis);
    setDarkAnalysisProgress({ analyzed: 0, total: 0 }); // Reset progress
    
    const darkCount = Array.from(newDarkAnalysis.values())
      .filter(analysis => analysis.isDarkChannel === true).length;

    toast({
      title: "✅ Análise de Dark Channels Concluída",
      description: `${darkCount} canais dark encontrados de ${channelGroups.size} analisados`
    });
  };

  const handleUnifiedSearch = async () => {
    let nichesArray: string[];
    
    // Se tem palavra-chave única, transformar em array de 1 elemento
    if (keyword.trim()) {
      nichesArray = [keyword.trim()];
    } 
    // Se tem lista de nichos, usar ela
    else if (nichesList.trim()) {
      nichesArray = nichesList.split('\n').map(n => n.trim()).filter(Boolean);
    }
    // Se não tem nada, erro
    else {
      toast({ 
        title: "Erro", 
        description: "Insira uma palavra-chave ou lista de nichos" 
      });
      return;
    }
    
    setIsLoading(true);
    setBatchResults([]);
    setBatchProgress({ processed: 0, total: nichesArray.length });
    
    try {
      // Criar registro do batch search
      const { data: batchSearch, error: batchError } = await supabase
        .from('niche_batch_searches')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          niches_list: nichesArray,
          total_count: nichesArray.length,
          status: 'processing'
        })
        .select()
        .single();
        
      if (batchError) throw batchError;

      // Processar em lotes de 20 nichos
      const BATCH_SIZE = 20;
      const allVideos: any[] = [];
      
      for (let i = 0; i < nichesArray.length; i += BATCH_SIZE) {
        const batch = nichesArray.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase.functions.invoke('batch-niche-search', {
          body: {
            nichesBatch: batch,
            batchSearchId: batchSearch.id,
            filters: {
              minDuration: 480,
              minSubscribers: 800,
              videoDuration: 'any',
              maxPages: maxPagesPerNiche
            }
          }
        });
        
        if (error) {
          console.error('Erro no batch:', error);
          
          // Verificar se é erro de quota esgotada
          if (error.message?.includes('esgotadas') || error.message?.includes('quota')) {
            toast({
              title: "⚠️ Quotas Esgotadas",
              description: "Todas as chaves de API do YouTube atingiram o limite diário. Tente novamente amanhã.",
              variant: "destructive",
              duration: 8000
            });
            break; // Parar processamento
          }
          
          continue;
        }
        
        if (data?.videos) {
          allVideos.push(...data.videos);
          setBatchResults(prev => [...prev, ...data.videos]);
          
          // Mostrar aviso se nenhum vídeo foi encontrado neste batch
          if (data.videos.length === 0 && data.debug) {
            toast({
              title: "ℹ️ Nenhum vídeo encontrado",
              description: `Os filtros (≥8min + ≥800 inscritos) eliminaram todos os vídeos de "${batch.join(', ')}"`,
              duration: 5000
            });
          }
        }
        
        setBatchProgress({
          processed: i + batch.length,
          total: nichesArray.length
        });
        
        // Pequena pausa entre lotes
        if (i + BATCH_SIZE < nichesArray.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setResults(allVideos);
      
      // Mensagem final com estatísticas
      if (allVideos.length === 0) {
        toast({
          title: "⚠️ Nenhum resultado encontrado",
          description: `Buscados ${nichesArray.length} nichos, mas os filtros (≥8min + ≥800 inscritos) eliminaram todos os vídeos. Tente reduzir os filtros.`,
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({
          title: "✅ Busca concluída!",
          description: `${allVideos.length} vídeos encontrados em ${nichesArray.length} nichos (média: ${Math.round(allVideos.length/nichesArray.length)} vídeos/nicho)`
        });
      }
      
    } catch (error: any) {
      console.error('Erro na busca:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = error.message || 'Erro desconhecido';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Tempo limite excedido. Tente reduzir o número de páginas ou nichos.';
      } else if (error.message?.includes('esgotadas') || error.message?.includes('quota')) {
        errorMessage = 'Todas as chaves de API esgotaram. Aguarde o reset diário.';
      }
      
      toast({
        title: "Erro na busca",
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyPostFilters = (videos: any[]) => {
    console.log('🔍 APLICANDO FILTROS:', postFilters);
    console.log('📊 Total de vídeos antes do filtro:', videos.length);
    
    const filtered = videos.filter(video => {
      // Validação rigorosa: se não tem channelAgeInDays, considerar inválido
      const channelAge = video.channelAgeInDays;
      if (channelAge === null || channelAge === undefined) {
        console.warn('⚠️ Vídeo sem channelAgeInDays:', video.title?.substring(0, 50));
        return false; // Não mostrar vídeos sem dados de idade
      }
      
      const subs = video.subscriberCount || 0;
      const duration = video.durationSeconds || 0;
      
      const agePass = channelAge >= postFilters.channelAgeMin && channelAge <= postFilters.channelAgeMax;
      const subsPass = subs >= postFilters.subscribersMin && subs <= postFilters.subscribersMax;
      const durationPass = duration >= postFilters.minDurationSeconds;
      
      // Filtro de Dark Channels
      let darkPass = true;
      if (postFilters.onlyDarkChannels) {
        const analysis = darkAnalysis.get(video.channelId);
        if (!analysis || analysis.isDarkChannel !== true) {
          console.log(`❌ Filtrado (não é dark): ${video.title.substring(0, 50)}...`);
          darkPass = false;
        }
      }
      
      const passes = agePass && subsPass && durationPass && darkPass;
      
      // Log detalhado apenas para vídeos filtrados (para não poluir console)
      if (!passes) {
        console.log(`❌ Filtrado: ${video.title?.substring(0, 50)}... - Idade: ${channelAge}d (${agePass ? '✅' : '❌'}) - Subs: ${subs} (${subsPass ? '✅' : '❌'}) - Duração: ${duration}s (${durationPass ? '✅' : '❌'}) - Dark: (${darkPass ? '✅' : '❌'})`);
      }
      
      return passes;
    });
    
    console.log('✅ Total após filtro:', filtered.length);
    return filtered;
  };

  const applyPreset = (preset: string) => {
    let newFilters;
    switch (preset) {
      case 'new':
        newFilters = { channelAgeMin: 0, channelAgeMax: 365, subscribersMin: 0, subscribersMax: 10000, minDurationSeconds: 0, onlyDarkChannels: false };
        break;
      case 'growing':
        newFilters = { channelAgeMin: 365, channelAgeMax: 1095, subscribersMin: 10000, subscribersMax: 100000, minDurationSeconds: 0, onlyDarkChannels: false };
        break;
      case 'established':
        newFilters = { channelAgeMin: 1095, channelAgeMax: 3650, subscribersMin: 100000, subscribersMax: 5000000, minDurationSeconds: 0, onlyDarkChannels: false };
        break;
      case 'reset':
      default:
        newFilters = { channelAgeMin: 0, channelAgeMax: 3650, subscribersMin: 0, subscribersMax: 5000000, minDurationSeconds: 0, onlyDarkChannels: false };
        break;
    }
    setTempFilters(newFilters);
    setPostFilters(newFilters);
  };

  const applyFilters = () => {
    console.log('🔧 Aplicando filtros temporários:', tempFilters);
    
    const previewFilters = {
      channelAgeMin: tempFilters.channelAgeMin,
      channelAgeMax: tempFilters.channelAgeMax,
      subscribersMin: tempFilters.subscribersMin,
      subscribersMax: tempFilters.subscribersMax,
      minDurationSeconds: tempFilters.minDurationSeconds,
      onlyDarkChannels: tempFilters.onlyDarkChannels
    };

    // Remover duplicados por ID antes de pré-visualizar
    const unique = Array.from(new Map(results.map((v) => [v.id, v])).values());
    const preview = unique.filter(video => {
      const channelAge = video.channelAgeInDays;
      if (channelAge === null || channelAge === undefined) return false;
      const subs = video.subscriberCount || 0;
      const duration = video.durationSeconds || 0;
      
      return (
        channelAge >= previewFilters.channelAgeMin &&
        channelAge <= previewFilters.channelAgeMax &&
        subs >= previewFilters.subscribersMin &&
        subs <= previewFilters.subscribersMax &&
        duration >= previewFilters.minDurationSeconds
      );
    });
    
    setPostFilters(tempFilters);
    
    toast({
      title: "✅ Filtros Aplicados",
      description: `${preview.length} vídeos encontrados de ${unique.length} únicos`
    });
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

  // Usar useMemo para otimizar e garantir atualização correta + remover duplicados por ID
  const filteredAndSortedResults = useMemo(() => {
    const unique = Array.from(new Map(results.map((v) => [v.id, v])).values());
    return applyPostFilters(sortResults(unique));
  }, [results, postFilters, sortConfig]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Niche Finder</h1>
          <p className="text-muted-foreground text-lg">
            Descubra nichos virais com busca em lote (vídeos ≥ 8 minutos)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => setShowManual(true)} variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Manual Completo
          </Button>
          
          {results.length > 0 && (
            <Button onClick={() => setShowSaveDialog(true)} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Busca
            </Button>
          )}
          
          {searchHistory.length > 0 && (
            <Button onClick={() => setShowHistoryDialog(true)} variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Histórico ({searchHistory.length})
            </Button>
          )}
          
          <Button onClick={() => setShowNicheLists(true)} variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            Lista de Nichos
          </Button>

          {results.length > 0 && (
            <Button
              variant={darkAnalysis.size > 0 ? "default" : "outline"}
              onClick={() => analyzeChannelsForDark(results)}
              disabled={isLoading || darkAnalysisProgress.total > 0}
              size="sm"
            >
              {darkAnalysisProgress.total > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando {darkAnalysisProgress.analyzed}/{darkAnalysisProgress.total}
                </>
              ) : (
                <>
                  🎭 Analisar Dark Channels
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Banner informativo */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Modo Lote Ativo
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Filtros: Vídeos ≥ 8 minutos • Canais ≥ 800 inscritos • Até 500 vídeos/nicho
            </p>
          </div>
        </div>
      </Card>

      {/* Seletor de Modelo IA */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">🤖 Modelo de IA</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Escolha o modelo para análise de nichos
            </p>
          </div>
          <AIModelSelector value={aiModel} onChange={setAiModel} />
        </div>
      </Card>

      {/* Controle de Páginas por Nicho */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">⚙️ Páginas por Nicho</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Controle quantas páginas buscar para economizar quota da API
            </p>
          </div>
          <Select 
            value={maxPagesPerNiche.toString()} 
            onValueChange={(v) => setMaxPagesPerNiche(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">
                5 páginas (~250 vídeos, 625 quota/nicho)
              </SelectItem>
              <SelectItem value="10">
                10 páginas (~500 vídeos, 1.250 quota/nicho) - Recomendado ⚡
              </SelectItem>
              <SelectItem value="20">
                20 páginas (~1000 vídeos, 2.500 quota/nicho)
              </SelectItem>
              <SelectItem value="50">
                50 páginas (~2500 vídeos, 6.250 quota/nicho) - Alto consumo!
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-md">
            <p>💡 <strong>Com 18 chaves configuradas:</strong></p>
            <p>• Total disponível: <strong>180.000 quota points/dia</strong></p>
            <p>• Com 10 páginas: <strong>~144 nichos/dia</strong> ⚡</p>
            <p>• Com 5 páginas: <strong>~288 nichos/dia</strong></p>
            <p className="pt-2 text-yellow-600 dark:text-yellow-400">
              ⚠️ <strong>50 páginas pode causar timeout!</strong> Use 5-10 para melhor performance.
            </p>
          </div>
        </div>
      </Card>

      {/* Busca Única */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="keyword" className="text-base font-semibold">
              🔍 Buscar 1 Nicho
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Digite uma palavra-chave para buscar vídeos virais (≥ 8 min, canais ≥ 800 inscritos)
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="keyword"
              placeholder="Ex: meditação, receitas veganas, investimentos..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button
              onClick={handleUnifiedSearch}
              disabled={isLoading || !keyword.trim()}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Busca em Lote */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="nichesList" className="text-base font-semibold">
              📋 Buscar Vários Nichos (Modo Lote)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Cole sua lista de nichos abaixo. Cada linha = 1 nicho. Filtros: ≥ 8 min + ≥ 800 inscritos.
            </p>
          </div>
          <Textarea
            id="nichesList"
            value={nichesList}
            onChange={(e) => setNichesList(e.target.value)}
            placeholder="fitness para idosos&#10;receitas veganas rápidas&#10;meditação para ansiedade&#10;..."
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              📊 {nichesList.split('\n').filter(n => n.trim()).length} nichos detectados
            </p>
            <Button
              onClick={handleUnifiedSearch}
              disabled={isLoading || !nichesList.trim()}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando {batchProgress.processed}/{batchProgress.total}...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Iniciar Busca em Lote
                </>
              )}
            </Button>
          </div>
          
          {/* Progress bar quando em loading */}
          {isLoading && batchProgress.total > 0 && (
            <div className="space-y-2">
              <Progress value={(batchProgress.processed / batchProgress.total) * 100} />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round((batchProgress.processed / batchProgress.total) * 100)}% completo
                • {batchProgress.processed}/{batchProgress.total} nichos processados
                • {batchResults.length} vídeos encontrados
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                📊 Resultados ({results.length} vídeos)
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🔍 DEBUG - Todos os vídeos:', results);
                    console.log('🔍 DEBUG - Filtros atuais:', postFilters);
                    const unique = Array.from(new Map(results.map((v) => [v.id, v])).values());
                    console.log('🔍 DEBUG - Total resultados (brutos):', results.length);
                    console.log('🔍 DEBUG - Total resultados (únicos):', unique.length);
                    const filteredPreview = applyPostFilters(sortResults(unique));
                    console.log('🔍 DEBUG - Vídeos filtrados (após ordenação+filtro):', filteredPreview.length);
                    
                    unique.forEach((video, i) => {
                      console.log(`[${i}] ${video.title?.substring(0, 50)} - Idade Canal: ${video.channelAgeInDays}d - Subs: ${video.subscriberCount}`);
                    });
                    
                    toast({
                      title: "🐛 Debug Info",
                      description: `Brutos: ${results.length} • Únicos: ${unique.length} • Filtrados: ${filteredPreview.length}`,
                    });
                  }}
                >
                  🐛 Debug Filtros
                </Button>
                <Button
                  onClick={() => exportToExcel(filteredAndSortedResults, 'niche-finder-resultados')}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-4 flex-wrap">
              <Label>Ordenar por:</Label>
              <div className="flex gap-2">
                <select
                  value={sortConfig.primary}
                  onChange={(e) => setSortConfig({ ...sortConfig, primary: e.target.value })}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="viralScore">Score Viral</option>
                  <option value="explosive">VPH (Explosivo)</option>
                  <option value="views">Visualizações</option>
                  <option value="channelExplosive">Ratio Views/Subs</option>
                  <option value="videoAge">Idade do Vídeo</option>
                  <option value="channelNew">Canal Mais Novo</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => setSortConfig({ 
                    ...sortConfig, 
                    direction: sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                  })}
                >
                  {sortConfig.direction === 'desc' ? '↓ Desc' : '↑ Asc'}
                </Button>
              </div>
            </div>

            {/* Filtros Pós-Busca */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800">
              <Collapsible defaultOpen>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-bold text-lg">Filtrar Resultados</h3>
                      <Badge variant="default" className="ml-2">
                        {filteredAndSortedResults.length} de {results.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => applyPreset('reset')}
                    >
                      Limpar Filtros
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-6 pt-4">
                      {/* Filtro de Idade do Canal */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">📅 Idade do Canal (em dias)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1">Mínimo</Label>
                            <Input
                              type="number"
                              min={0}
                              max={3650}
                              step={1}
                              value={tempFilters.channelAgeMin}
                              onChange={(e) => setTempFilters({ ...tempFilters, channelAgeMin: Number(e.target.value) })}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1">Máximo</Label>
                            <Input
                              type="number"
                              min={0}
                              max={3650}
                              step={1}
                              value={tempFilters.channelAgeMax}
                              onChange={(e) => setTempFilters({ ...tempFilters, channelAgeMax: Number(e.target.value) })}
                              placeholder="3650"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Referência: 365 dias = 1 ano | 1095 dias = 3 anos | 1825 dias = 5 anos
                        </p>
                      </div>

                      {/* Filtro de Inscritos */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">👥 Número de Inscritos</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1">Mínimo</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10000000}
                              step={1}
                              value={tempFilters.subscribersMin}
                              onChange={(e) => setTempFilters({ ...tempFilters, subscribersMin: Number(e.target.value) })}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1">Máximo</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10000000}
                              step={1}
                              value={tempFilters.subscribersMax}
                              onChange={(e) => setTempFilters({ ...tempFilters, subscribersMax: Number(e.target.value) })}
                              placeholder="5000000"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Referência: 10K = 10.000 | 100K = 100.000 | 1M = 1.000.000
                        </p>
                      </div>

                      {/* Filtro de Duração Mínima */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">⏱️ Duração Mínima do Vídeo</Label>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min={0}
                            max={7200}
                            step={60}
                            value={tempFilters.minDurationSeconds}
                            onChange={(e) => setTempFilters({ ...tempFilters, minDurationSeconds: Number(e.target.value) })}
                            placeholder="0"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTempFilters({ ...tempFilters, minDurationSeconds: 0 })}
                            >
                              Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTempFilters({ ...tempFilters, minDurationSeconds: 1200 })}
                            >
                              &gt;20 min
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTempFilters({ ...tempFilters, minDurationSeconds: 1800 })}
                            >
                              &gt;30 min
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTempFilters({ ...tempFilters, minDurationSeconds: 3600 })}
                            >
                              &gt;60 min
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Duração em segundos: 1200s = 20min | 1800s = 30min | 3600s = 60min
                        </p>
                      </div>

                      {/* Filtro de Dark Channels */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">🎭 Canais Dark/Faceless</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="onlyDark"
                              checked={tempFilters.onlyDarkChannels}
                              onChange={(e) => setTempFilters({
                                ...tempFilters,
                                onlyDarkChannels: e.target.checked
                              })}
                              disabled={darkAnalysis.size === 0}
                              className="rounded"
                            />
                            <label htmlFor="onlyDark" className="text-sm font-medium">
                              Apenas Canais Dark/Faceless
                            </label>
                          </div>
                          {darkAnalysis.size === 0 && (
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Clique em "Analisar Dark Channels" primeiro
                            </p>
                          )}
                          {darkAnalysis.size > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✅ {darkAnalysis.size} canais analisados
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Canais dark: apenas narração/imagens, vídeos de arquivo, animações, IA, sem pessoa aparecendo
                        </p>
                      </div>

                      {/* Botão Aplicar Filtro */}
                      <Button
                        onClick={applyFilters}
                        className="w-full"
                        size="lg"
                      >
                        <Check className="mr-2 h-5 w-5" />
                        Aplicar Filtro
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </Card>

            {/* Lista de vídeos */}
            <div className="space-y-4">
              {filteredAndSortedResults.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={{
                    ...video,
                    isDarkChannel: darkAnalysis.get(video.channelId)?.isDarkChannel,
                    darkConfidence: darkAnalysis.get(video.channelId)?.confidence,
                    darkType: darkAnalysis.get(video.channelId)?.primaryType
                  }} 
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Dialog para salvar busca */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Busca Atual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchName">Nome da Busca</Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ex: Nichos de Meditação - Março 2024"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCurrentSearch} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog do histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Buscas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {searchHistory.map((search) => (
              <Card key={search.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{search.search_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(search.created_at).toLocaleDateString('pt-BR')}
                      {' • '}
                      {search.results?.length || 0} vídeos
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedSearch(search)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Carregar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSavedSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog do manual */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <UserManual />
        </DialogContent>
      </Dialog>

      {/* Dialog de listas de nichos */}
      <Dialog open={showNicheLists} onOpenChange={setShowNicheLists}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listas de Nichos Pré-Selecionadas</DialogTitle>
          </DialogHeader>
          <NicheListsManager 
            open={true}
            onOpenChange={() => {}}
            onNicheSelect={handleNicheSelect}
            onBatchSelect={handleBatchNicheSelect}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NicheFinder;
