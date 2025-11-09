import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, Users, Eye, Calendar, Clock, Trash2, Flame, Rocket, Zap, Sprout, Download, ChevronDown, ChevronUp, SlidersHorizontal, Save, BookOpen as BookOpenIcon, X } from "lucide-react";
import { LoadingProgress } from "@/components/ui/loading-progress";
import { UserManual } from "@/components/similar-channels/UserManual";
import { FilterStatsPanel } from "@/components/similar-channels/FilterStatsPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { exportToExcel } from "@/lib/exportToExcel";
import { useAuth } from "@/contexts/AuthContext";
import { FilterOptions, useFilterPresets } from "@/hooks/useFilterPresets";
import { AdvancedFilters } from "@/components/similar-channels/AdvancedFilters";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Channel {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  subscribers: number;
  subscribersHidden?: boolean;
  totalViews: number;
  avgViewsPerVideo: number;
  avgVPH?: number;
  isChannelExplosive?: boolean;
  isChannelNew?: boolean;
  isChannelActive?: boolean;
  viewSubRatio?: number;
  daysOld: number;
  avgUploadsPerMonth: number;
  isNewChannel?: boolean;
  lastUpload: string;
  lastUploadDays?: number;
  similarity: number;
  videoCount?: number;
  dataQuality?: number;
  isDarkChannel?: boolean;
  darkChannelConfidence?: number;
  darkChannelType?: string;
  darkAnalysisLoading?: boolean;
  darkChannelHasData?: boolean;
  darkScore?: number;
  language?: string; // Novo campo para idioma
}

const CanaisSimilares = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Mapeamento de idiomas com bandeiras (expandido)
  const languageMap: Record<string, { name: string; flag: string }> = {
    'pt': { name: 'Português', flag: '🇧🇷' },
    'pt-PT': { name: 'Portugal', flag: '🇵🇹' },
    'en': { name: 'English', flag: '🇺🇸' },
    'en-CA': { name: 'Canadá', flag: '🇨🇦' },
    'en-AU': { name: 'Austrália', flag: '🇦🇺' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'es-MX': { name: 'México', flag: '🇲🇽' },
    'es-AR': { name: 'Argentina', flag: '🇦🇷' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'de': { name: 'Alemanha', flag: '🇩🇪' },
    'it': { name: 'Itália', flag: '🇮🇹' },
    'ru': { name: 'Русский', flag: '🇷🇺' },
    'ja': { name: 'Japão', flag: '🇯🇵' },
    'ko': { name: 'Coreia do Sul', flag: '🇰🇷' },
    'zh': { name: '中文', flag: '🇨🇳' },
    'unknown': { name: 'Desconhecido', flag: '🌐' },
  };

  // Função de formatação inteligente de números
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  };

  // Função para cor do badge de confiabilidade
  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (quality >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  const [channelUrl, setChannelUrl] = useState("");
  const [daysFilter, setDaysFilter] = useState<number>(3650);
  const [subscribersFilter, setSubscribersFilter] = useState<number>(1000000);
  const [sortBy, setSortBy] = useState<string>("similarity");
  const [isSearching, setIsSearching] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [maxChannels, setMaxChannels] = useState<number>(200);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null); // Novo estado
  const [quotaInfo, setQuotaInfo] = useState<{
    searchesRemaining?: number;
    lastReset: string;
    quotaUsed: number;
    dailyQuota?: number;
    percentageUsed?: number;
    apiStatus?: 'active' | 'exhausted';
  } | null>(null);
  
  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minVPH: 0,
    minViewsPerSubscriber: 0,
    minAvgViews: 0,
    uploadsPerMonthMin: 0,
    uploadsPerMonthMax: 999,
    lastUploadDays: 999,
    minDataQuality: 0,
    videoCountMin: 0,
    videoCountMax: 999,
    channelAgeDaysMin: 0,
    channelAgeDaysMax: 9999,
    subscribersMin: 0,
    subscribersMax: 999999999,
    totalViewsMin: 0,
    totalViewsMax: 999999999,
  });
  
  // Filtro de Formato (Todos/Shorts/Longos) - ANTES DA BUSCA
  const [formatFilter, setFormatFilter] = useState<'all' | 'shorts' | 'long'>('all');
  
  // Filtro de Idioma - ANTES DA BUSCA
  const [languageFilter, setLanguageFilter] = useState<string>('any');
  
  // Filtro de País - ANTES DA BUSCA
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  
  // Novos filtros de vídeo - ANTES DA BUSCA
  const [minVideoDuration, setMinVideoDuration] = useState<number>(0); // em minutos
  const [maxVideoAgeDays, setMaxVideoAgeDays] = useState<number>(9999); // em dias - SEM LIMITE por padrão
  
  // Filtro dinâmico de inscritos (PÓS-BUSCA) - NOVO
  const [subscribersRangeMin, setSubscribersRangeMin] = useState<number>(0);
  const [subscribersRangeMax, setSubscribersRangeMax] = useState<number>(10000000);
  const [showSubscribersFilter, setShowSubscribersFilter] = useState(false);
  
  // Estatísticas de filtros
  const [filterStats, setFilterStats] = useState<{
    totalFound: number;
    rejectedByCountry: number;
    rejectedByDateOrSubs: number;
    rejectedByMinSubscribers: number; // NOVO
    rejectedByVideoDuration: number;
    rejectedByFormat: number;
    similarityErrors: number;
    finalCount: number;
  } | null>(null);

  // Estado de progresso da busca
  const [searchProgress, setSearchProgress] = useState<{
    stage: 'idle' | 'analyzing' | 'searching' | 'filtering' | 'calculating' | 'complete';
    stageLabel: string;
    percentage: number;
    channelsFound: number;
    channelsProcessed: number;
    estimatedTimeRemaining: number;
    details: string;
  }>({
    stage: 'idle',
    stageLabel: '',
    percentage: 0,
    channelsFound: 0,
    channelsProcessed: 0,
    estimatedTimeRemaining: 0,
    details: ''
  });

  
  // Mapeamento de países por idioma
  const countryOptions: Record<string, Array<{ code: string; name: string; flag: string }>> = {
    'en-US': [
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
      { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
      { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
      { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
      { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿' },
      { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
      { code: 'ZA', name: 'África do Sul', flag: '🇿🇦' },
      { code: 'IN', name: 'Índia', flag: '🇮🇳' },
    ],
    'pt-BR': [
      { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
    ],
    'pt-PT': [
      { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
      { code: 'AO', name: 'Angola', flag: '🇦🇴' },
      { code: 'MZ', name: 'Moçambique', flag: '🇲🇿' },
    ],
    'es-ES': [
      { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
    ],
    'es-MX': [
      { code: 'MX', name: 'México', flag: '🇲🇽' },
      { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
      { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
      { code: 'CL', name: 'Chile', flag: '🇨🇱' },
      { code: 'PE', name: 'Peru', flag: '🇵🇪' },
      { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
      { code: 'EC', name: 'Equador', flag: '🇪🇨' },
    ],
    'fr-FR': [
      { code: 'FR', name: 'França', flag: '🇫🇷' },
      { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
      { code: 'CH', name: 'Suíça', flag: '🇨🇭' },
      { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
    ],
    'de-DE': [
      { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
      { code: 'AT', name: 'Áustria', flag: '🇦🇹' },
      { code: 'CH', name: 'Suíça', flag: '🇨🇭' },
    ],
    'it-IT': [
      { code: 'IT', name: 'Itália', flag: '🇮🇹' },
    ],
    'ja-JP': [
      { code: 'JP', name: 'Japão', flag: '🇯🇵' },
    ],
    'ko-KR': [
      { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
    ],
    'zh-CN': [
      { code: 'CN', name: 'China', flag: '🇨🇳' },
      { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
      { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    ],
  };
  
  // Resetar países quando idioma mudar
  useEffect(() => {
    setCountryFilter([]);
  }, [languageFilter]);
  
  // Novos filtros especiais (combinados)
  const [onlyNewChannels0to60, setOnlyNewChannels0to60] = useState(false); // ⏰ Canais 0-60 dias
  const [onlyMonetizable, setOnlyMonetizable] = useState(false); // 💰 1k+ subs + 4k horas
  const [onlyDarkChannels, setOnlyDarkChannels] = useState(false); // 🎭 Apenas Dark Channels
  const [onlyTalentHunt, setOnlyTalentHunt] = useState(false); // 🏆 Caça-Talentos
  const [onlyMicroInfluencers, setOnlyMicroInfluencers] = useState(false); // 🎯 Micro-Influencers
  const [onlyExplosive, setOnlyExplosive] = useState(false); // 🚀 Apenas Explosivos
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetIcon, setPresetIcon] = useState("🎯");
  const { savePreset } = useFilterPresets();
  const [showManual, setShowManual] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('claude-sonnet-4.5');

  useEffect(() => {
    loadHistory();
    loadQuotaInfo();
    
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('similarChannelsFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);
  
  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('similarChannelsFilters', JSON.stringify(filters));
  }, [filters]);
  
  // Save special filters to localStorage
  useEffect(() => {
    localStorage.setItem('similarChannelsSpecialFilters', JSON.stringify({
      onlyNewChannels0to60,
      onlyMonetizable,
      onlyDarkChannels,
      onlyTalentHunt,
      onlyMicroInfluencers,
      onlyExplosive,
    }));
  }, [onlyNewChannels0to60, onlyMonetizable, onlyDarkChannels, onlyTalentHunt, onlyMicroInfluencers, onlyExplosive]);
  
  // Load special filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('similarChannelsSpecialFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOnlyNewChannels0to60(parsed.onlyNewChannels0to60 || false);
        setOnlyMonetizable(parsed.onlyMonetizable || false);
        setOnlyDarkChannels(parsed.onlyDarkChannels || false);
        setOnlyTalentHunt(parsed.onlyTalentHunt || false);
        setOnlyMicroInfluencers(parsed.onlyMicroInfluencers || false);
        setOnlyExplosive(parsed.onlyExplosive || false);
      } catch (e) {
        console.error('Error loading saved special filters:', e);
      }
    }
  }, []);

  const loadQuotaInfo = async () => {
    const { data } = await supabase.functions.invoke('check-quota', {
      body: { feature: 'similar-channels' }
    });
    if (data) setQuotaInfo(data);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('similar_channels')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleSearch = async () => {
    if (!channelUrl) {
      toast({
        title: "URL Necessária",
        description: "Por favor, insira a URL do canal para buscar similares.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simular progresso em etapas
    const stages = [
      { stage: 'analyzing' as const, label: 'Analisando canal alvo', duration: 6000, percentage: 15, details: 'Carregando informações do canal e vídeos recentes...' },
      { stage: 'searching' as const, label: 'Buscando canais similares', duration: 12000, percentage: 35, details: 'Pesquisando no YouTube por canais relacionados...' },
      { stage: 'filtering' as const, label: 'Aplicando filtros', duration: 7000, percentage: 55, details: 'Filtrando por país, inscritos, formato e duração de vídeos...' },
      { stage: 'calculating' as const, label: 'Calculando similaridades', duration: 40000, percentage: 85, details: 'Analisando conteúdo e calculando scores de similaridade com IA...' },
      { stage: 'complete' as const, label: 'Finalizando', duration: 2000, percentage: 100, details: 'Organizando resultados finais...' },
    ];

    let currentStageIndex = 0;
    let startTime = Date.now();
    
    const updateProgress = () => {
      if (currentStageIndex >= stages.length) return;
      
      const currentStage = stages[currentStageIndex];
      const elapsed = Date.now() - startTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      const previousPercentage = currentStageIndex > 0 ? stages[currentStageIndex - 1].percentage : 0;
      const currentPercentage = previousPercentage + (currentStage.percentage - previousPercentage) * stageProgress;
      
      const remainingStages = stages.slice(currentStageIndex);
      const totalRemainingTime = remainingStages.reduce((sum, s, i) => {
        if (i === 0) return sum + (s.duration * (1 - stageProgress));
        return sum + s.duration;
      }, 0);

      setSearchProgress({
        stage: currentStage.stage,
        stageLabel: currentStage.label,
        percentage: Math.round(currentPercentage),
        channelsFound: currentStageIndex >= 1 ? Math.min(50 + currentStageIndex * 100, 500) : 0,
        channelsProcessed: currentStageIndex >= 2 ? Math.min(10 + currentStageIndex * 30, 200) : 0,
        estimatedTimeRemaining: Math.round(totalRemainingTime / 1000),
        details: currentStage.details
      });

      if (stageProgress >= 1) {
        currentStageIndex++;
        startTime = Date.now();
      }
    };

    const progressInterval = setInterval(updateProgress, 200);
    
    try {
      const { data, error } = await supabase.functions.invoke('find-similar-channels', {
        body: {
          channelUrl,
          daysFilter,
          subscribersFilter,
          maxChannels,
          formatFilter, // Novo: filtro de formato (all/shorts/long)
          languageFilter, // Novo: filtro de idioma
          countryFilter, // Novo: filtro de países
          minVideoDuration, // Novo: duração mínima em minutos
          maxVideoAgeDays, // Novo: idade máxima dos vídeos em dias
        }
      });

      // Verificar primeiro se há erro de quota no data (antes de verificar error)
      if (data?.error === 'YOUTUBE_QUOTA_EXCEEDED') {
        toast({
          title: "❌ Todas as API Keys Esgotadas",
          description: data.message || "Todas as suas API Keys do YouTube esgotaram. Adicione novas chaves em Configurações ou aguarde até amanhã.",
          variant: "destructive",
          duration: 12000,
        });
        setIsSearching(false);
        return;
      }

      // Detectar rotação automática de API key
      if (data?.rotated) {
        toast({
          title: "🔄 API Key Trocada Automaticamente",
          description: data.message || "A API Key anterior esgotou. Agora usando a próxima da lista. Clique em Buscar novamente.",
          variant: "default",
          duration: 7000,
        });
        await loadQuotaInfo();
        setIsSearching(false);
        return;
      }

      if (error) throw error;

      // Atualizar informação de quota após busca
      if (data?.quotaInfo) {
        setQuotaInfo(data.quotaInfo);
      }

      // Atualizar estatísticas de filtros
      if (data?.filterStats) {
        setFilterStats(data.filterStats);
      }

      const channelsWithAnalysis = data.channels || [];
      
      // Armazenar idioma detectado se disponível
      if (channelsWithAnalysis.length > 0 && channelsWithAnalysis[0].language) {
        setDetectedLanguage(channelsWithAnalysis[0].language);
      }
      
      // Normalizar subscribers para garantir que seja número inteiro
      const channelsWithValidSubscribers = channelsWithAnalysis.map(channel => ({
        ...channel,
        subscribers: parseInt(String(channel.subscribers || 0), 10)
      }));
      
      setChannels(channelsWithValidSubscribers);
      
      // Detectar canais dark em background
      analyzeChannelsForDark(channelsWithValidSubscribers);
      
      await supabase.from('similar_channels').insert({
        channel_url: channelUrl,
        days_filter: daysFilter,
        subscribers_filter: subscribersFilter,
        channels_found: data.channels,
        channel_thumbnail: data.targetChannelInfo?.thumbnail,
        target_channel_name: data.targetChannelInfo?.name,
        target_channel_thumbnail: data.targetChannelInfo?.thumbnail,
        user_id: user?.id
      });
      
      await loadHistory();
      
      const langInfo = detectedLanguage && languageMap[detectedLanguage] 
        ? `${languageMap[detectedLanguage].flag} ${languageMap[detectedLanguage].name}` 
        : '';
      
      clearInterval(progressInterval);
      setSearchProgress({
        stage: 'complete',
        stageLabel: 'Concluído',
        percentage: 100,
        channelsFound: data.channels?.length || 0,
        channelsProcessed: data.channels?.length || 0,
        estimatedTimeRemaining: 0,
        details: 'Busca finalizada com sucesso!'
      });
      
      setTimeout(() => {
        setSearchProgress({
          stage: 'idle',
          stageLabel: '',
          percentage: 0,
          channelsFound: 0,
          channelsProcessed: 0,
          estimatedTimeRemaining: 0,
          details: ''
        });
      }, 2000);
      
      toast({
        title: "Busca Concluída",
        description: `Encontrados ${data.channels?.length || 0} canais similares${langInfo ? ` em ${langInfo}` : ''}.`,
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Erro na busca:', error);
      
      // Extrair mensagem de erro do contexto do Supabase Functions
      let errorMessage = error.message || '';
      let errorData = null;
      
      // Tentar extrair dados do erro se vier no formato do Supabase
      try {
        if (error.context?.body) {
          errorData = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
        }
      } catch (e) {
        // Ignorar erro de parse
      }
      
      // Detectar erro específico de quota do YouTube (status 429)
      if (errorData?.error === 'YOUTUBE_QUOTA_EXCEEDED' || 
          errorMessage.includes('YOUTUBE_QUOTA_EXCEEDED') || 
          errorMessage.includes('quota') ||
          errorMessage.includes('429')) {
        toast({
          title: "❌ Todas as API Keys Esgotadas",
          description: errorData?.message || "Todas as suas API Keys do YouTube esgotaram. Vá em Configurações → API Keys para adicionar novas chaves ou aguarde até amanhã.",
          variant: "destructive",
          duration: 12000,
        });
      } else if (errorMessage?.includes('rotated') || errorMessage?.includes('Automaticamente trocada')) {
        // Detectar se foi rotação de API key
        toast({
          title: "🔄 API Key Rotacionada",
          description: "Sua API Key anterior esgotou e foi automaticamente trocada. Por favor, clique em Buscar novamente.",
          variant: "default",
          duration: 8000,
        });
      } else if (errorMessage?.includes('Canal não encontrado')) {
        toast({
          title: "❌ Canal Não Encontrado",
          description: "O canal não foi encontrado no YouTube. Verifique se o URL está correto e se o canal existe.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Erro na Busca",
          description: errorMessage || "Erro ao buscar canais similares. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      clearInterval(progressInterval);
      setIsSearching(false);
      setSearchProgress({
        stage: 'idle',
        stageLabel: '',
        percentage: 0,
        channelsFound: 0,
        channelsProcessed: 0,
        estimatedTimeRemaining: 0,
        details: ''
      });
    }
  };

  const analyzeChannelsForDark = async (channelsToAnalyze: Channel[]) => {
    // Analisar apenas os primeiros 10 canais para economizar recursos
    const topChannels = channelsToAnalyze.slice(0, 10);
    let noCreditsWarningShown = false;
    
    for (const channel of topChannels) {
      try {
        // Marcar como loading (buscando dados)
        setChannels(prev => prev.map(c => 
          c.id === channel.id ? { ...c, darkAnalysisLoading: true } : c
        ));

        // 1. Buscar dados do canal (descrição e títulos)
        const channelIdMatch = channel.url.match(/channel\/(UC[\w-]+)/);
        const channelId = channelIdMatch ? channelIdMatch[1] : null;

        if (!channelId) {
          console.error('Could not extract channel ID from:', channel.url);
          setChannels(prev => prev.map(c => 
            c.id === channel.id 
              ? { ...c, darkAnalysisLoading: false, darkChannelHasData: false }
              : c
          ));
          continue;
        }

        const { data: channelDetails, error: detailsError } = await supabase.functions.invoke(
          'get-channel-details',
          { body: { channelId } }
        );

        if (detailsError || !channelDetails?.hasData) {
          console.error('Failed to get channel details:', detailsError);
          setChannels(prev => prev.map(c => 
            c.id === channel.id 
              ? { 
                  ...c, 
                  darkAnalysisLoading: false,
                  darkChannelHasData: false,
                  isDarkChannel: false,
                  darkChannelConfidence: 0
                }
              : c
          ));
          continue;
        }

        // 2. Analisar com IA usando dados completos
        const { data, error } = await supabase.functions.invoke('detect-dark-channel', {
          body: {
            channelData: {
              name: channel.name,
              description: channelDetails.description || '',
              recentTitles: channelDetails.recentTitles || [],
              keywords: channelDetails.keywords || '',
              contentType: 'unknown'
            }
          }
        });

        if (error) throw error;

        // Atualizar canal com resultado
        const darkResult = data;
        
        // Se sem créditos, apenas marcar como não analisado silenciosamente
        if (darkResult.error === 'NO_CREDITS' || darkResult.error === 'RATE_LIMIT') {
          setChannels(prev => prev.map(c => 
            c.id === channel.id 
              ? { 
                  ...c, 
                  darkAnalysisLoading: false,
                  darkChannelHasData: false,
                  isDarkChannel: false,
                  darkChannelConfidence: 0,
                  darkChannelType: 'unknown'
                }
              : c
          ));
          
          // Mostrar aviso apenas uma vez
          if (!noCreditsWarningShown) {
            noCreditsWarningShown = true;
            toast({
              title: "⚠️ Análise de Dark Channels Indisponível",
              description: darkResult.error === 'NO_CREDITS' 
                ? "Sem créditos Lovable AI. A funcionalidade está temporariamente desabilitada."
                : "Rate limit atingido. Tente novamente em alguns minutos.",
              variant: "default",
              duration: 7000,
            });
          }
          continue;
        }
        
        const updatedChannel: Partial<Channel> = {
          isDarkChannel: darkResult.isDarkChannel,
          darkChannelConfidence: darkResult.confidence,
          darkChannelType: darkResult.primaryType,
          darkAnalysisLoading: false,
          darkChannelHasData: darkResult.hasEnoughData ?? true
        };

        // Calculate Dark Score (0-100) if channel is dark
        if (darkResult.isDarkChannel) {
          const vphNormalized = Math.min(100, ((channel.avgVPH || 0) / 10)); // 1000 VPH = 100
          const engagementNormalized = Math.min(100, ((channel.viewSubRatio || 0) * 20)); // 5.0 = 100
          const frequencyNormalized = Math.min(100, ((channel.avgUploadsPerMonth || 0) * 10)); // 10 videos = 100
          
          updatedChannel.darkScore = Math.round(
            (darkResult.confidence * 0.4) +
            (vphNormalized * 0.3) +
            (engagementNormalized * 0.2) +
            (frequencyNormalized * 0.1)
          );
        } else {
          updatedChannel.darkScore = 0;
        }

        setChannels(prev => prev.map(c => 
          c.id === channel.id ? { ...c, ...updatedChannel } : c
        ));

      } catch (error) {
        console.error(`Erro ao analisar canal ${channel.name}:`, error);
        setChannels(prev => prev.map(c => 
          c.id === channel.id ? { ...c, darkAnalysisLoading: false, darkChannelHasData: false } : c
        ));
      }
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('similar_channels').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Busca removida do histórico" });
  };

  const sortedChannels = [...channels].sort((a, b) => {
    switch (sortBy) {
      case "days":
        return a.daysOld - b.daysOld;
      case "subscribers":
        return b.subscribers - a.subscribers;
      case "views":
        return b.totalViews - a.totalViews;
      case "vph":
        return (b.avgVPH || 0) - (a.avgVPH || 0);
      case "viral-score":
        return ((b.avgVPH || 0) * (b.viewSubRatio || 0)) - ((a.avgVPH || 0) * (a.viewSubRatio || 0));
      case "similarity":
      default:
        return b.similarity - a.similarity;
    }
  });


  // Apply advanced filters
  const filteredChannels = sortedChannels.filter(channel => {
    // ========== FILTRO 1: Range Dinâmico de Inscritos (Pós-Busca) ==========
    if (showSubscribersFilter) {
      if (channel.subscribers < subscribersRangeMin || channel.subscribers > subscribersRangeMax) {
        return false;
      }
    }
    
    // ========== FILTROS ESPECIAIS COMBINADOS ==========
    
    // ⏰ Canais Novíssimos (0-60 dias) - UMA ÚNICA VERIFICAÇÃO
    if (onlyNewChannels0to60 && channel.daysOld > 60) return false;
    
    // 💰 Monetização (1k+ inscritos E 4k horas watch time estimado)
    if (onlyMonetizable) {
      // FORÇAR conversão para inteiro e validar
      const subs = parseInt(String(channel.subscribers || 0), 10);
      
      console.log(`[MONETIZAÇÃO FILTRO] Avaliando: ${channel.name}`);
      console.log(`  - subscribers raw: ${channel.subscribers} (tipo: ${typeof channel.subscribers})`);
      console.log(`  - subs convertido: ${subs}`);
      console.log(`  - isNaN: ${isNaN(subs)}`);
      console.log(`  - subs < 1000: ${subs < 1000}`);
      
      if (isNaN(subs) || subs < 1000) {
        console.log(`  ❌ REJEITADO: ${channel.name} com ${subs} inscritos`);
        return false;
      }
      
      // Estimativa REALISTA de watch time:
      // - Assumir duração média de vídeo = 8 minutos (médio YouTube)
      // - Assumir retenção média = 50% (realista)
      // - 4000 horas = 240.000 minutos watch time necessário
      const avgVideoMinutes = 8;
      const avgRetention = 0.50;
      const estimatedWatchMinutes = (channel.totalViews * avgVideoMinutes * avgRetention);
      const estimatedWatchHours = estimatedWatchMinutes / 60;
      
      console.log(`  - totalViews: ${channel.totalViews}`);
      console.log(`  - estimatedWatchHours: ${Math.round(estimatedWatchHours)}`);
      console.log(`  - watchHours < 4000: ${estimatedWatchHours < 4000}`);
      
      if (estimatedWatchHours < 4000) {
        console.log(`  ❌ REJEITADO: ${channel.name} com ${Math.round(estimatedWatchHours)}h (< 4000h)`);
        return false;
      }
      
      console.log(`  ✅ APROVADO: ${channel.name} - ${subs} inscritos, ${Math.round(estimatedWatchHours)}h`);
    }
    
    // 🎭 Dark Channels - UMA ÚNICA VERIFICAÇÃO
    if (onlyDarkChannels && channel.isDarkChannel !== true) return false;
    
    // 🏆 Caça-Talentos (pequenos canais virais)
    if (onlyTalentHunt) {
      if (channel.subscribers > 10000) return false;
      if ((channel.avgVPH || 0) < 500) return false;
      const viralScore = (channel.avgVPH || 0) * (channel.viewSubRatio || 0);
      if (viralScore < 1000) return false;
    }
    
    // 🎯 Micro-Influencers (1k-50k, alto engajamento)
    if (onlyMicroInfluencers) {
      if (channel.subscribers < 1000 || channel.subscribers > 50000) return false;
      if ((channel.viewSubRatio || 0) < 1.0) return false;
    }
    
    // 🚀 Apenas Explosivos (crescimento confirmado)
    if (onlyExplosive && !channel.isChannelExplosive) return false;
    
    // ========== FILTROS AVANÇADOS (do painel avançado) ==========
    if (filters.minVPH > 0 && (channel.avgVPH || 0) < filters.minVPH) return false;
    if (filters.minViewsPerSubscriber > 0 && (channel.viewSubRatio || 0) < filters.minViewsPerSubscriber) return false;
    if (filters.minAvgViews > 0 && channel.avgViewsPerVideo < filters.minAvgViews) return false;
    if (channel.avgUploadsPerMonth < filters.uploadsPerMonthMin) return false;
    if (filters.uploadsPerMonthMax < 999 && channel.avgUploadsPerMonth > filters.uploadsPerMonthMax) return false;
    if (filters.lastUploadDays < 999 && (channel.lastUploadDays || 999) > filters.lastUploadDays) return false;
    if (filters.minDataQuality > 0 && (channel.dataQuality || 0) < filters.minDataQuality) return false;
    
    // Filtros de idade do canal
    if (channel.daysOld < filters.channelAgeDaysMin) return false;
    if (filters.channelAgeDaysMax < 9999 && channel.daysOld > filters.channelAgeDaysMax) return false;
    
    // Filtros de inscritos
    if (channel.subscribers < filters.subscribersMin) return false;
    if (filters.subscribersMax < 999999999 && channel.subscribers > filters.subscribersMax) return false;
    
    // Filtros de total de views
    if (channel.totalViews < filters.totalViewsMin) return false;
    if (filters.totalViewsMax < 999999999 && channel.totalViews > filters.totalViewsMax) return false;
    
    // Filtros de contagem de vídeos
    if (channel.videoCount) {
      if (channel.videoCount < filters.videoCountMin) return false;
      if (filters.videoCountMax < 999 && channel.videoCount > filters.videoCountMax) return false;
    }
    
    return true;
  });

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (typeof value === "boolean") return value;
    if (key === "uploadsPerMonthMax" || key === "lastUploadDays" || key === "videoCountMax" || key === "channelAgeDaysMax" || key === "subscribersMax" || key === "totalViewsMax") {
      return value < 999999999;
    }
    return value > 0;
  }).length;
  
  // Contador total de filtros ativos (incluindo especiais e dinâmicos)
  const totalActiveFilters = [
    showSubscribersFilter,
    onlyNewChannels0to60,
    onlyMonetizable,
    onlyDarkChannels,
    onlyTalentHunt,
    onlyMicroInfluencers,
    onlyExplosive,
    filters.minVPH > 0,
    filters.minViewsPerSubscriber > 0,
    filters.minAvgViews > 0,
    filters.uploadsPerMonthMin > 0,
    filters.uploadsPerMonthMax < 999,
    filters.lastUploadDays < 999,
    filters.minDataQuality > 0,
    filters.videoCountMin > 0,
    filters.videoCountMax < 999,
    filters.channelAgeDaysMin > 0,
    filters.channelAgeDaysMax < 9999,
    filters.subscribersMin > 0,
    filters.subscribersMax < 999999999,
    filters.totalViewsMin > 0,
    filters.totalViewsMax < 999999999,
  ].filter(Boolean).length;

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Nome Necessário",
        description: "Por favor, insira um nome para o preset",
        variant: "destructive",
      });
      return;
    }

    await savePreset(presetName, filters, presetIcon);
    setSavePresetDialogOpen(false);
    setPresetName("");
    setPresetIcon("🎯");
  };

  // Calculate post-filter statistics
  const avgVPH = filteredChannels.length > 0
    ? Math.round(filteredChannels.reduce((sum, c) => sum + (c.avgVPH || 0), 0) / filteredChannels.length)
    : 0;
  const explosiveRate = filteredChannels.length > 0
    ? Math.round((filteredChannels.filter(c => c.isChannelExplosive).length / filteredChannels.length) * 100)
    : 0;

  return (
    <SubscriptionGuard toolName="Canais Similares">
      <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              🔍 Canais Similares
            </h1>
            <p className="text-muted-foreground text-lg">
              Encontre canais com pouco tempo, poucos inscritos e muitas visualizações
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowManual(true)}>
            <BookOpenIcon className="h-4 w-4 mr-2" />
            Ver Manual Completo
          </Button>
        </div>

        {quotaInfo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg w-fit">
            <Badge variant={quotaInfo.apiStatus === 'active' ? 'default' : 'destructive'}>
              {quotaInfo.apiStatus === 'active' ? '✅ API Ativa' : '⚠️ API Esgotada'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Quota usada: {quotaInfo.percentageUsed?.toFixed(1)}% 
              ({quotaInfo.quotaUsed?.toLocaleString()}/{quotaInfo.dailyQuota?.toLocaleString()})
            </span>
          </div>
        )}
      </div>

      {/* Search Section */}
      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="channel-url" className="text-base font-semibold">
              URL do Canal
            </Label>
            <div className="flex gap-3">
              <Input
                id="channel-url"
                placeholder="https://youtube.com/@seucanal"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model" className="text-sm font-medium">
              🤖 Modelo de IA (Análise de Dark Channels)
            </Label>
            <Select value={selectedAiModel} onValueChange={setSelectedAiModel}>
              <SelectTrigger id="ai-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-sonnet-4.5">
                  Claude 4.5 Sonnet (Recomendado) - API Key necessária
                </SelectItem>
                <SelectItem value="gpt-4o">
                  GPT-4o - API Key necessária
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-accent hover:bg-accent/90 w-full"
          >
            {isSearching ? (
              "Buscando..."
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Buscar Canais Similares
              </>
            )}
          </Button>

          {/* Loading Progress */}
          {isSearching && searchProgress.stage !== 'idle' && (
            <LoadingProgress
              stages={[
                { stage: 'analyzing', icon: '🔍', label: 'Analisando' },
                { stage: 'searching', icon: '🌐', label: 'Buscando' },
                { stage: 'filtering', icon: '⚙️', label: 'Filtrando' },
                { stage: 'calculating', icon: '🤖', label: 'IA' },
                { stage: 'complete', icon: '✅', label: 'Pronto' },
              ]}
              currentStage={searchProgress.stage}
              percentage={searchProgress.percentage}
              estimatedTimeRemaining={searchProgress.estimatedTimeRemaining}
              stageLabel={searchProgress.stageLabel}
              details={searchProgress.details}
              itemsFound={searchProgress.channelsFound}
              itemsProcessed={searchProgress.channelsProcessed}
              foundLabel="encontrados"
              processedLabel="processados"
              title="🔍 Buscando Canais Similares"
            />
          )}

          {/* Filtro de Idioma */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">🌐 Idioma do Canal</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                { value: 'any', label: 'Qualquer', flag: '🌍' },
                { value: 'en-US', label: 'Inglês', flag: '🇺🇸' },
                { value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
                { value: 'es-ES', label: 'Espanhol', flag: '🇪🇸' },
                { value: 'fr-FR', label: 'Francês', flag: '🇫🇷' },
                { value: 'de-DE', label: 'Alemão', flag: '🇩🇪' },
                { value: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
                { value: 'ja-JP', label: 'Japão', flag: '🇯🇵' },
                { value: 'ko-KR', label: 'Coreia do Sul', flag: '🇰🇷' },
                { value: 'zh-CN', label: 'Chinês', flag: '🇨🇳' },
                { value: 'en-CA', label: 'Canadá', flag: '🇨🇦' },
                { value: 'en-AU', label: 'Austrália', flag: '🇦🇺' },
                { value: 'es-MX', label: 'México', flag: '🇲🇽' },
                { value: 'es-AR', label: 'Argentina', flag: '🇦🇷' },
                { value: 'pt-PT', label: 'Portugal', flag: '🇵🇹' },
              ].map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    languageFilter === option.value
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setLanguageFilter(option.value)}
                >
                  <Checkbox 
                    checked={languageFilter === option.value}
                    onCheckedChange={() => setLanguageFilter(option.value)}
                  />
                  <span className="text-xl">{option.flag}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro de País - aparece apenas quando um idioma específico é selecionado */}
          {languageFilter !== 'any' && countryOptions[languageFilter] && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">🌍 Países (Idioma: {languageFilter})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {countryOptions[languageFilter].map((country) => (
                  <div
                    key={country.code}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      countryFilter.includes(country.code)
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                    onClick={() => {
                      setCountryFilter(prev => 
                        prev.includes(country.code)
                          ? prev.filter(c => c !== country.code)
                          : [...prev, country.code]
                      );
                    }}
                  >
                    <Checkbox 
                      checked={countryFilter.includes(country.code)}
                      onCheckedChange={() => {
                        setCountryFilter(prev => 
                          prev.includes(country.code)
                            ? prev.filter(c => c !== country.code)
                            : [...prev, country.code]
                        );
                      }}
                    />
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Selecione um ou mais países. Se nenhum for selecionado, buscará em todos os países do idioma.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">🎬 Formato dos Vídeos</Label>
            <div className="grid grid-cols-3 gap-3">
              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  formatFilter === 'all' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setFormatFilter('all')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📺</div>
                  <p className="font-semibold text-sm">Todos</p>
                  <p className="text-xs text-muted-foreground">Shorts e Longos</p>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  formatFilter === 'shorts' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setFormatFilter('shorts')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <p className="font-semibold text-sm">Shorts</p>
                  <p className="text-xs text-muted-foreground">Apenas vídeos curtos</p>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  formatFilter === 'long' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setFormatFilter('long')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🎥</div>
                  <p className="font-semibold text-sm">Longos</p>
                  <p className="text-xs text-muted-foreground">Apenas vídeos longos</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Filtros ANTES da busca */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Há quantos dias começou? (máx: {daysFilter} dias)
              </Label>
              <Slider
                value={[daysFilter]}
                onValueChange={(value) => setDaysFilter(value[0])}
                max={7300}
                min={1}
                step={1}
                className="py-4"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Inscritos (máx: {subscribersFilter.toLocaleString()})
              </Label>
              <Slider
                value={[subscribersFilter]}
                onValueChange={(value) => setSubscribersFilter(value[0])}
                max={500000000}
                min={1000}
                step={100000}
                className="py-4"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Quantidade de Canais (mín: 200, máx: {maxChannels} canais)
              </Label>
              <Slider
                value={[maxChannels]}
                onValueChange={(value) => setMaxChannels(value[0])}
                max={500}
                min={200}
                step={50}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                💡 Mais canais = maior consumo de quota (~5-15% da quota diária por busca)
              </p>
            </div>
          </div>

          {/* NOVOS FILTROS: Duração e Idade dos Vídeos */}
          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                ⏱️ Duração Mínima dos Vídeos: {minVideoDuration === 0 ? 'Qualquer' : `${minVideoDuration} min`}
              </Label>
              <Slider
                value={[minVideoDuration]}
                onValueChange={(value) => setMinVideoDuration(value[0])}
                max={60}
                min={0}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                💡 Filtra canais que fazem vídeos com duração mínima (ex: &gt;20 min para conteúdo longo)
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                📅 Idade Máxima dos Vídeos: {maxVideoAgeDays === 365 ? 'Qualquer' : `${maxVideoAgeDays} dias`}
              </Label>
              <Slider
                value={[maxVideoAgeDays]}
                onValueChange={(value) => setMaxVideoAgeDays(value[0])}
                max={365}
                min={1}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                💡 Considera apenas vídeos recentes (ex: máx 365 dias = 1 ano)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros APÓS a busca - mostrados apenas quando há resultados */}
      {channels.length > 0 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">🎯 Refinar Resultados</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredChannels.length} de {channels.length} canais</Badge>
              {totalActiveFilters > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setOnlyNewChannels0to60(false);
                    setOnlyMonetizable(false);
                    setOnlyDarkChannels(false);
                    setOnlyTalentHunt(false);
                    setOnlyMicroInfluencers(false);
                    setOnlyExplosive(false);
                    setShowSubscribersFilter(false);
                    setShowAdvancedFilters(false);
                    setSubscribersRangeMin(0);
                    setSubscribersRangeMax(10000000);
                    setFilters({
                      minVPH: 0,
                      minViewsPerSubscriber: 0,
                      minAvgViews: 0,
                      uploadsPerMonthMin: 0,
                      uploadsPerMonthMax: 999,
                      lastUploadDays: 999,
                      minDataQuality: 0,
                      videoCountMin: 0,
                      videoCountMax: 999,
                      channelAgeDaysMin: 0,
                      channelAgeDaysMax: 9999,
                      subscribersMin: 0,
                      subscribersMax: 999999999,
                      totalViewsMin: 0,
                      totalViewsMax: 999999999,
                    });
                    toast({
                      title: "🔄 Todos os Filtros Resetados",
                      description: "Todos os filtros foram completamente limpos"
                    });
                  }}
                  className="gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset Total
                </Button>
              )}
            </div>
          </div>

          {/* Estatísticas de Filtros */}
          {filterStats && (
            <Card className="p-4 bg-muted/50 border-muted-foreground/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                📊 Estatísticas da Busca
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Encontrado</p>
                  <p className="text-base font-bold text-foreground">{filterStats.totalFound}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rejeitados (País/Idioma)</p>
                  <p className="text-base font-bold text-red-600">{filterStats.rejectedByCountry}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rejeitados (Min. Inscritos)</p>
                  <p className="text-base font-bold text-purple-600">{filterStats.rejectedByMinSubscribers || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rejeitados (Duração)</p>
                  <p className="text-base font-bold text-orange-600">{filterStats.rejectedByVideoDuration}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rejeitados (Formato)</p>
                  <p className="text-base font-bold text-yellow-600">{filterStats.rejectedByFormat}</p>
                </div>
              </div>
              {(filterStats.rejectedByCountry > 0 || filterStats.rejectedByMinSubscribers > 0 || filterStats.rejectedByVideoDuration > 0 || filterStats.rejectedByFormat > 0) && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Dica:</strong> Seus filtros eliminaram {
                      filterStats.rejectedByCountry + 
                      (filterStats.rejectedByMinSubscribers || 0) +
                      filterStats.rejectedByVideoDuration + 
                      filterStats.rejectedByFormat
                    } canais ({
                      Math.round((
                        (filterStats.rejectedByCountry + (filterStats.rejectedByMinSubscribers || 0) + filterStats.rejectedByVideoDuration + filterStats.rejectedByFormat) / 
                        filterStats.totalFound
                      ) * 100)
                    }%). Considere:
                    {filterStats.rejectedByCountry > 0 && ' selecionar mais países,'}
                    {(filterStats.rejectedByMinSubscribers || 0) > 0 && ' reduzir mínimo de inscritos,'}
                    {filterStats.rejectedByVideoDuration > 0 && ' reduzir duração mínima ou aumentar idade máxima dos vídeos,'}
                    {filterStats.rejectedByFormat > 0 && ' mudar o filtro de formato,'}
                    {' para obter mais resultados.'}
                  </p>
                </div>
              )}
            </Card>
          )}
          
          {/* NOVO: Alert Inteligente para Poucos Resultados */}
          {filteredChannels.length < 10 && filterStats && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-sm">Poucos Resultados ({filteredChannels.length})</h4>
                  <p className="text-xs text-muted-foreground">
                    Filtros restritivos podem estar limitando os resultados:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    {filterStats.rejectedByMinSubscribers > 0 && (
                      <li>🚫 {filterStats.rejectedByMinSubscribers} canais rejeitados por terem menos inscritos que o mínimo</li>
                    )}
                    {filterStats.rejectedByVideoDuration > 0 && (
                      <li>🚫 {filterStats.rejectedByVideoDuration} canais rejeitados por duração/idade dos vídeos</li>
                    )}
                    {filterStats.rejectedByCountry > 0 && (
                      <li>🚫 {filterStats.rejectedByCountry} canais rejeitados por país/idioma</li>
                    )}
                    {filterStats.rejectedByFormat > 0 && (
                      <li>🚫 {filterStats.rejectedByFormat} canais rejeitados por formato (Shorts/Longos)</li>
                    )}
                  </ul>
                  <div className="pt-2 border-t border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs font-semibold mb-1">💡 Sugestões:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-xs">
                      <li>Desative filtros especiais como "Monetizáveis" ou "Novíssimos"</li>
                      <li>Mude idioma/país para "Qualquer"</li>
                      <li>Aumente o número máximo de canais para 300+</li>
                      <li>Remova filtro de formato (aceite Shorts E Longos)</li>
                      <li>Aumente a idade máxima dos vídeos para 9999 dias</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Ordenação */}
          <div className="space-y-3">
            <Label htmlFor="sort" className="text-sm font-medium">
              Ordenar por
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">Similaridade</SelectItem>
                <SelectItem value="vph">VPH Médio</SelectItem>
                <SelectItem value="viral-score">Score Viral</SelectItem>
                <SelectItem value="days">Dias de Existência</SelectItem>
                <SelectItem value="subscribers">Inscritos</SelectItem>
                <SelectItem value="views">Total de Visualizações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Especiais Combinados */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Filtros Especiais</Label>
              {totalActiveFilters > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalActiveFilters} filtro{totalActiveFilters > 1 ? 's' : ''} ativo{totalActiveFilters > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              💡 Você pode combinar múltiplos filtros para resultados mais precisos
            </div>
            {totalActiveFilters > 1 && (
              <div className="mb-3 text-xs bg-primary/5 p-2 rounded border border-primary/20">
                <strong>{totalActiveFilters} filtros combinados ativos</strong>
              </div>
            )}
            
            <div className="grid gap-3 md:grid-cols-3">
              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyNewChannels0to60 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setOnlyNewChannels0to60(!onlyNewChannels0to60)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⏰</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Canais Novíssimos</h4>
                    <p className="text-xs text-muted-foreground">0-60 dias (oportunidade máxima)</p>
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyMonetizable 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={(e) => {
                  // Evita toggle duplo se clicar diretamente no checkbox
                  if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                  console.log("🔄 TOGGLE MONETIZAÇÃO:", !onlyMonetizable);
                  
                  if (!onlyMonetizable) {
                    console.log("⚠️ ATIVANDO FILTRO - Canais ANTES do filtro:");
                    console.log(`  Total de canais: ${channels.length}`);
                    console.log("  Primeiros 5 canais e seus inscritos:");
                    channels.slice(0, 5).forEach(ch => {
                      console.log(`    - ${ch.name}: ${ch.subscribers} inscritos`);
                    });
                  }
                  
                  setOnlyMonetizable(!onlyMonetizable);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={onlyMonetizable}
                      onCheckedChange={(checked) => {
                        console.log("🔄 TOGGLE MONETIZAÇÃO:", checked);
                        setOnlyMonetizable(checked as boolean);
                      }}
                    />
                    <div className="text-3xl">💰</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Aptos p/ Monetização</h4>
                      <p className="text-xs text-muted-foreground">1k+ inscritos, 4k+ horas watch time estimadas</p>
                    </div>
                  </div>
                  {onlyMonetizable && (
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {filteredChannels.length} aprovados
                    </Badge>
                  )}
                </div>
              </Card>


              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyDarkChannels 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setOnlyDarkChannels(!onlyDarkChannels)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎭</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Apenas Dark Channels</h4>
                    <p className="text-xs text-muted-foreground">Somente canais sem rosto confirmados</p>
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyTalentHunt 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setOnlyTalentHunt(!onlyTalentHunt)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Caça-Talentos</h4>
                    <p className="text-xs text-muted-foreground">Pequenos canais altamente virais (≤10k, VPH&gt;500)</p>
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyMicroInfluencers 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setOnlyMicroInfluencers(!onlyMicroInfluencers)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎯</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Micro-Influencers</h4>
                    <p className="text-xs text-muted-foreground">Canais pequenos e engajados (1k-50k, views/sub&gt;1.0)</p>
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer border-2 transition-all ${
                  onlyExplosive 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setOnlyExplosive(!onlyExplosive)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🚀</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Apenas Explosivos</h4>
                    <p className="text-xs text-muted-foreground">Canais com crescimento explosivo</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* NOVO: Filtro Dinâmico de Inscritos (Pós-Busca) */}
            <div className="pt-4 border-t">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Filtro de Inscritos (Pós-Busca)
                  </Label>
                  <Checkbox 
                    checked={showSubscribersFilter}
                    onCheckedChange={(checked) => setShowSubscribersFilter(checked as boolean)}
                  />
                </div>
                
                {showSubscribersFilter && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Mínimo</Label>
                        <Input
                          type="number"
                          value={subscribersRangeMin}
                          onChange={(e) => setSubscribersRangeMin(Number(e.target.value))}
                          placeholder="Ex: 100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Máximo</Label>
                        <Input
                          type="number"
                          value={subscribersRangeMax}
                          onChange={(e) => setSubscribersRangeMax(Number(e.target.value))}
                          placeholder="Ex: 5000"
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      📊 {filteredChannels.filter(c => c.subscribers >= subscribersRangeMin && c.subscribers <= subscribersRangeMax).length} canais neste range
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowAdvancedFilters(false)}
            />
          )}

        </Card>
      )}

      {/* Results */}
      {channels.length > 0 && (
        <div className="space-y-4">
          {/* Post-Filter Statistics */}
          {channels.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Encontrados</p>
                <p className="text-2xl font-bold">{channels.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Após Filtros</p>
                <p className="text-2xl font-bold text-accent">{filteredChannels.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">VPH Médio</p>
                <p className="text-2xl font-bold">{formatNumber(avgVPH)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Taxa Explosivos</p>
                <p className="text-2xl font-bold">{explosiveRate}%</p>
              </Card>
            </div>
          )}

          {/* Filter Statistics Panel */}
          {filterStats && (
            <FilterStatsPanel stats={filterStats} loading={isSearching} />
          )}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                Canais Filtrados ({filteredChannels.length})
              </h2>
              {detectedLanguage && languageMap[detectedLanguage] && (
                <Badge variant="secondary" className="text-sm">
                  {languageMap[detectedLanguage].flag} {languageMap[detectedLanguage].name}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const exportData = filteredChannels.map((channel) => ({
                    'Nome do Canal': channel.name,
                    'Idioma': channel.language && languageMap[channel.language] 
                      ? `${languageMap[channel.language].flag} ${languageMap[channel.language].name}` 
                      : 'Desconhecido',
                    'Inscritos': channel.subscribers,
                    'Similaridade %': channel.similarity,
                    'Dias de Existência': channel.daysOld,
                    'Total de Views': channel.totalViews,
                    'Média Views/Vídeo': channel.avgViewsPerVideo,
                    'VPH Médio': channel.avgVPH || 0,
                    'Uploads/Mês': channel.avgUploadsPerMonth,
                    'Último Upload': channel.lastUpload,
                    'Status': channel.isChannelExplosive ? 'Explosivo' : channel.isChannelNew ? 'Novo' : 'Normal',
                    'URL': channel.url
                  }));
                  exportToExcel(exportData, `canais-similares-${new Date().toISOString().split('T')[0]}`, 'Canais');
                  toast({ title: "✅ Exportado!", description: "Planilha gerada com sucesso" });
                }}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                onClick={() => {
                  const urls = filteredChannels.map(channel => channel.url).join('\n');
                  const blob = new Blob([urls], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `canais-urls-${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast({ title: "✅ Exportado!", description: "Arquivo TXT com URLs gerado" });
                }}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar URLs (.txt)
              </Button>
            </div>
          </div>


          <div className="grid gap-4">
            {filteredChannels.map((channel) => {
              // Determinar cor da borda baseada no status
              let borderColorClass = 'border-l-4 border-gray-300';
              if (channel.isChannelExplosive) {
                borderColorClass = 'border-l-4 border-orange-500';
              } else if (channel.isChannelNew) {
                borderColorClass = 'border-l-4 border-green-500';
              }
              
              return (
                <Card key={channel.id} className={`p-6 shadow-soft hover:shadow-medium transition-all ${borderColorClass}`}>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar do Canal */}
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={channel.thumbnail} alt={channel.name} />
                        <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">
                          {channel.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {channel.name}
                            </h3>
                            <a
                              href={channel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent hover:underline"
                            >
                              {channel.url}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full shrink-0">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-sm font-semibold text-accent">
                              {channel.similarity}% similar
                            </span>
                          </div>
                        </div>
                        
                        {/* Badges de Status */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {/* Badge de Idioma */}
                          {channel.language && languageMap[channel.language] && (
                            <Badge variant="outline" className="text-xs">
                              {languageMap[channel.language].flag} {languageMap[channel.language].name}
                            </Badge>
                          )}
                          {channel.darkAnalysisLoading && (
                            <Badge variant="secondary" className="text-xs">
                              🤖 Analisando IA...
                            </Badge>
                          )}
                          {!channel.darkAnalysisLoading && channel.darkChannelHasData === false && (
                            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                              ⚠️ Dados insuficientes
                            </Badge>
                          )}
                          {!channel.darkAnalysisLoading && channel.isDarkChannel && channel.darkScore !== undefined && channel.darkChannelHasData !== false && (
                            <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">
                              🎭 Dark Score: {channel.darkScore}/100
                            </Badge>
                          )}
                          {!channel.darkAnalysisLoading && channel.isDarkChannel && !channel.darkScore && channel.darkChannelHasData !== false && (
                            <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">
                              🎭 Canal Dark ({channel.darkChannelConfidence}% - {channel.darkChannelType})
                            </Badge>
                          )}
                          {channel.isChannelExplosive && (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300">
                              <Rocket className="h-3 w-3 mr-1" />
                              Canal Explosivo
                            </Badge>
                          )}
                          {channel.isChannelNew && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
                              <Sprout className="h-3 w-3 mr-1" />
                              Canal Novo
                            </Badge>
                          )}
                          {channel.isChannelActive && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300">
                              <Zap className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                          {channel.dataQuality !== undefined && (
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getQualityColor(channel.dataQuality)}`} title="Confiabilidade dos dados">
                              {channel.dataQuality}% confiável
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      {/* VPH Métrica */}
                      {channel.avgVPH !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Flame className="h-4 w-4" />
                            <span className="text-xs">VPH</span>
                          </div>
                          <p className="text-lg font-semibold text-foreground" title="Views Por Hora (média)">
                            {formatNumber(channel.avgVPH)}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">Dias</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {channel.daysOld}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Inscritos</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                          {channel.subscribersHidden ? (
                            <span className="text-sm" title="O criador ocultou a contagem de inscritos">🔒 Oculto</span>
                          ) : (
                            formatNumber(channel.subscribers)
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">Média/Vídeo</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground" title={`Baseado em ${channel.videoCount || 0} vídeos totais`}>
                          {formatNumber(channel.avgViewsPerVideo)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">Total Views</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {formatNumber(channel.totalViews)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">Vídeos</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {channel.videoCount || 0}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">Uploads/Mês</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground" title={channel.isNewChannel ? "Canal novo - métrica pode variar" : undefined}>
                          {channel.avgUploadsPerMonth}
                          {channel.isNewChannel && (
                            <span className="text-xs text-muted-foreground ml-1">(novo)</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">Último Upload</span>
                        </div>
                        <p className={`text-lg font-semibold ${channel.lastUploadDays && channel.lastUploadDays > 180 ? 'text-red-500' : channel.lastUploadDays && channel.lastUploadDays < 7 ? 'text-green-600' : 'text-foreground'}`} title={channel.lastUploadDays && channel.lastUploadDays > 180 ? 'Canal inativo há muito tempo' : undefined}>
                          {channel.lastUpload}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {channels.length === 0 && !isSearching && (
        <Card className="p-12 text-center shadow-soft">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum resultado ainda
          </h3>
          <p className="text-muted-foreground">
            Insira a URL de um canal e clique em buscar para encontrar canais similares
          </p>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico de Buscas</h2>
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail do canal buscado */}
                  {item.target_channel_thumbnail && (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.target_channel_thumbnail} alt={item.target_channel_name || 'Canal'} />
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {(item.target_channel_name || 'C').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1">
                    <p className="font-medium">{item.target_channel_name || item.channel_url}</p>
                    <p className="text-sm text-muted-foreground">
                      Filtros: Máx {item.days_filter} dias, {item.subscribers_filter.toLocaleString()} inscritos
                    </p>
                    <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="text-sm text-accent">Canais encontrados: {item.channels_found?.length || 0}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        // NORMALIZAR subscribers para garantir que seja número inteiro
                        const normalizedChannels = (item.channels_found || []).map(channel => ({
                          ...channel,
                          subscribers: parseInt(String(channel.subscribers || 0), 10)
                        }));
                        
                        console.log("🔄 CARREGANDO DO HISTÓRICO - Primeiros 3 canais:");
                        normalizedChannels.slice(0, 3).forEach(ch => {
                          console.log(`  ${ch.name}: ${ch.subscribers} inscritos (tipo: ${typeof ch.subscribers})`);
                        });
                        
                        // Restaurar os canais do histórico para a área principal
                        setChannels(normalizedChannels);
                        setChannelUrl(item.channel_url);
                        setDaysFilter(item.days_filter);
                        setSubscribersFilter(item.subscribers_filter);
                        
                        // Scroll para o topo para ver os resultados
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        
                        toast({
                          title: "✅ Busca Carregada",
                          description: `${normalizedChannels.length} canais carregados. Você pode filtrar normalmente agora.`
                        });
                      }}
                      className="gap-1"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Carregar Busca
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                    >
                      {expandedHistoryId === item.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteHistory(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Lista expandida de canais */}
                {expandedHistoryId === item.id && item.channels_found && (
                  <div className="pl-16 space-y-2 border-l-2 border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {item.channels_found.length} canais encontrados:
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const exportData = item.channels_found.map((channel: Channel) => ({
                            'Nome do Canal': channel.name,
                            'Inscritos': channel.subscribers,
                            'Similaridade %': channel.similarity,
                            'Dias de Existência': channel.daysOld,
                            'Total de Views': channel.totalViews,
                            'Média Views/Vídeo': channel.avgViewsPerVideo,
                            'VPH Médio': channel.avgVPH || 0,
                            'URL': channel.url
                          }));
                          exportToExcel(exportData, `canais-historico-${new Date().toISOString().split('T')[0]}`, 'Canais');
                          toast({ title: "✅ Exportado!", description: "Planilha gerada com sucesso" });
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar
                      </Button>
                    </div>
                    {item.channels_found.map((channel: Channel, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                        {channel.thumbnail && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={channel.thumbnail} alt={channel.name} />
                            <AvatarFallback className="text-xs">
                              {channel.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{channel.name}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{formatNumber(channel.subscribers)} inscritos</span>
                            <span>•</span>
                            <span>{channel.similarity}% similar</span>
                            {channel.avgVPH && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  {formatNumber(channel.avgVPH)} VPH
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline shrink-0"
                        >
                          Ver Canal
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Preset de Filtros</DialogTitle>
            <DialogDescription>
              Salve a configuração atual de filtros para usar novamente no futuro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nome do Preset</Label>
              <Input
                id="preset-name"
                placeholder="Ex: Canais Pequenos Virais"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-icon">Ícone (Emoji)</Label>
              <Input
                id="preset-icon"
                placeholder="🎯"
                value={presetIcon}
                onChange={(e) => setPresetIcon(e.target.value)}
                maxLength={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Canais Similares</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionGuard>
  );
};

export default CanaisSimilares;
