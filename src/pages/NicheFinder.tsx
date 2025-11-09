import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Search, Loader2, Download, Save, FolderOpen, Trash2, Target, BookOpen } from "lucide-react";
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
              videoDuration: 'any',
              maxPages: maxPagesPerNiche
            }
          }
        });
        
        if (error) {
          console.error('Erro no batch:', error);
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
        
        // Pequena pausa entre lotes
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
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
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
              Filtro único: Vídeos ≥ 8 minutos • Até 500 vídeos por nicho
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
                10 páginas (~500 vídeos, 1.250 quota/nicho) - Recomendado
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
            <p>• Com 10 páginas: <strong>~144 nichos/dia</strong></p>
            <p>• Com 5 páginas: <strong>~288 nichos/dia</strong></p>
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
              Digite uma palavra-chave para buscar vídeos virais (≥ 8 min)
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
              Cole sua lista de nichos abaixo. Cada linha = 1 nicho. Até 500 vídeos/nicho.
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
              <Button
                onClick={() => exportToExcel(sortResults(results), 'niche-finder-resultados')}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
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

            {/* Lista de vídeos */}
            <div className="space-y-4">
              {sortResults(results).map((video) => (
                <VideoCard key={video.videoId} video={video} />
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
