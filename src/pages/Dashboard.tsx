import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Search, Settings, BarChart3, Target, Sparkles,
  FileText, Globe, Image as ImageIcon, Video, FileCheck,
  Timer, Scissors, Monitor, BookOpen, Layers, Eye, Flame,
  Crosshair, Zap, Wand2, Palette, Film
} from "lucide-react";
import { Link } from "react-router-dom";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    scriptsCount: 0,
    promptsCount: 0,
    guidesCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;
    
    const [scripts, prompts, guides] = await Promise.all([
      supabase.from('scripts').select('id', { count: 'exact', head: true }),
      supabase.from('scene_prompts').select('id', { count: 'exact', head: true }),
      supabase.from('editing_guides').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      scriptsCount: scripts.count || 0,
      promptsCount: prompts.count || 0,
      guidesCount: guides.count || 0,
    });
  };

  const viralFinderTools = [
    {
      icon: Target,
      title: "Niche Finder",
      description: "Descubra nichos virais e pouco explorados no YouTube",
      href: "/niche-finder",
      color: "bg-viral-primary/10 hover:bg-viral-primary/20",
      iconColor: "text-viral-primary",
      help: "🔍 Analise métricas de performance para encontrar nichos com alto potencial de crescimento e baixa concorrência",
      step: 1
    },
    {
      icon: TrendingUp,
      title: "Canais Similares",
      description: "Encontre canais com estratégia similar ao seu",
      href: "/canais-similares",
      color: "bg-viral-secondary/10 hover:bg-viral-secondary/20",
      iconColor: "text-viral-secondary",
      help: "📊 Identifique concorrentes diretos e indiretos para análise competitiva detalhada",
      step: 2
    },
    {
      icon: Eye,
      title: "Monitoramento",
      description: "Acompanhe uploads e performance de concorrentes",
      href: "/monitoramento-concorrentes",
      color: "bg-viral-accent/10 hover:bg-viral-accent/20",
      iconColor: "text-viral-accent",
      help: "👁️ Receba alertas em tempo real sobre novos uploads e mudanças de performance",
      step: 3
    },
  ];

  const subNicheTools = [
    {
      icon: BarChart3,
      title: "Análise de Títulos",
      description: "Analise títulos dos concorrentes e encontre padrões",
      href: "/sub-niche-hunter",
      color: "bg-subniche-primary/10 hover:bg-subniche-primary/20",
      iconColor: "text-subniche-primary",
      help: "📊 Descubra estruturas de títulos virais e micro-nichos campeões",
      step: 4
    },
    {
      icon: Layers,
      title: "Expansão de Nicho",
      description: "Expanda nichos amplos em 2 níveis mais profundos",
      href: "/sub-niche-hunter",
      color: "bg-subniche-accent/10 hover:bg-subniche-accent/20",
      iconColor: "text-subniche-accent",
      help: "🔍 Descubra sub-nichos e micro-nichos relacionados ao seu tema principal",
      step: 5
    },
  ];

  const contentCreationTools = [
    {
      icon: FileText,
      title: "Criador de Conteúdo",
      description: "Crie roteiros profissionais com fórmulas comprovadas",
      href: "/criador-conteudo",
      color: "bg-content-primary/10 hover:bg-content-primary/20",
      iconColor: "text-content-primary",
      help: "✍️ Gere roteiros completos usando fórmulas de retenção e gatilhos emocionais",
      step: 6
    },
    {
      icon: Globe,
      title: "Tradutor de Roteiros",
      description: "Traduza roteiros mantendo tom e emoção",
      href: "/tradutor-roteiros",
      color: "bg-content-secondary/10 hover:bg-content-secondary/20",
      iconColor: "text-content-secondary",
      help: "🌐 Adapte conteúdo para outros idiomas preservando gatilhos e engajamento",
      step: 7
    },
    {
      icon: Sparkles,
      title: "Brainstorm de Ideias",
      description: "Gere ideias de vídeos com IA",
      href: "/brainstorm",
      color: "bg-content-accent/10 hover:bg-content-accent/20",
      iconColor: "text-content-accent",
      help: "💡 Use análise de tendências para gerar ideias virais baseadas em dados",
      step: 8
    },
  ];

  const mediaImageTools = [
    {
      icon: Film,
      title: "Prompts para Cenas",
      description: "Gere prompts visuais para cada cena",
      href: "/prompts-cenas",
      color: "bg-media-primary/10 hover:bg-media-primary/20",
      iconColor: "text-media-primary",
      help: "🎬 Crie descrições visuais detalhadas para ferramentas de IA como Midjourney",
      step: 9
    },
    {
      icon: Palette,
      title: "Gerador de Imagens",
      description: "Transforme prompts em imagens com IA",
      href: "/gerador-imagens",
      color: "bg-media-secondary/10 hover:bg-media-secondary/20",
      iconColor: "text-media-secondary",
      help: "🎨 Use modelos avançados de IA para criar imagens de alta qualidade",
      step: 10
    },
    {
      icon: ImageIcon,
      title: "Prompts de Thumbnail",
      description: "Crie prompts para thumbnails impactantes",
      href: "/prompts-thumbnail",
      color: "bg-media-accent/10 hover:bg-media-accent/20",
      iconColor: "text-media-accent",
      help: "🖼️ Gere prompts otimizados baseados em análise de concorrentes de sucesso",
      step: 11
    },
  ];

  const optimizationTools = [
    {
      icon: Timer,
      title: "Conversor SRT",
      description: "Converta roteiro em SRT com timecodes",
      href: "/conversor-srt",
      color: "bg-optimize-primary/10 hover:bg-optimize-primary/20",
      iconColor: "text-optimize-primary",
      help: "📝 Calcule timecodes automaticamente baseado em velocidade de narração",
      step: 12
    },
    {
      icon: Monitor,
      title: "Guia de Edição",
      description: "Crie timeline combinando roteiro e prompts",
      href: "/guia-edicao",
      color: "bg-optimize-secondary/10 hover:bg-optimize-secondary/20",
      iconColor: "text-optimize-secondary",
      help: "🎞️ Gere guia detalhado com timecodes, prompts visuais e narração",
      step: 13
    },
    {
      icon: Scissors,
      title: "Divisor de Texto",
      description: "Divida textos longos em partes menores",
      href: "/divisor-texto",
      color: "bg-optimize-accent/10 hover:bg-optimize-accent/20",
      iconColor: "text-optimize-accent",
      help: "✂️ Fragmente conteúdo extenso para processamento em ferramentas com limite",
      step: 14
    },
  ];

  const ToolCard = ({ tool }: { tool: typeof viralFinderTools[0] }) => {
    const Icon = tool.icon;
    return (
      <Link to={tool.href}>
        <Card className={`relative p-6 shadow-soft transition-all cursor-pointer group ${tool.color}`}>
          {tool.step && (
            <div className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-white text-lg font-bold shadow-lg ring-4 ring-background group-hover:scale-110 transition-transform">
              {tool.step}
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.iconColor} bg-background/50 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              <HelpTooltip description={tool.help} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bem-vindo ao DarkGen
          </h1>
          <p className="text-muted-foreground text-lg">
            Ferramentas profissionais para criadores de conteúdo
          </p>
        </div>
        <HelpTooltip 
          title="Sobre o DarkGen"
          description="Plataforma completa com 14 ferramentas de IA para análise, criação e otimização de conteúdo para YouTube"
          steps={[
            "Analise nichos e concorrentes",
            "Crie roteiros e prompts visuais",
            "Otimize vídeos para máximo alcance"
          ]}
        />
      </div>

      {/* Metodologia Section */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20 shadow-medium">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">📚 Metodologia DarkGen</h2>
            <p className="text-muted-foreground text-lg">
              Siga este fluxo sequencial para obter os melhores resultados na criação de conteúdo viral
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <Card className="p-4 bg-viral-primary/10 border-viral-primary/30 hover:bg-viral-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-viral-primary text-white text-sm font-bold">1</div>
                <Search className="h-5 w-5 text-viral-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Viral Finder</h3>
              <p className="text-xs text-muted-foreground">Descubra nichos e monitore concorrentes</p>
            </Card>
            <Card className="p-4 bg-subniche-primary/10 border-subniche-primary/30 hover:bg-subniche-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subniche-primary text-white text-sm font-bold">2</div>
                <TrendingUp className="h-5 w-5 text-subniche-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Sub-Niche Hunter</h3>
              <p className="text-xs text-muted-foreground">Analise títulos e expanda estratégias</p>
            </Card>
            <Card className="p-4 bg-content-primary/10 border-content-primary/30 hover:bg-content-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-content-primary text-white text-sm font-bold">3</div>
                <Sparkles className="h-5 w-5 text-content-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Criação</h3>
              <p className="text-xs text-muted-foreground">Crie roteiros profissionais com IA</p>
            </Card>
            <Card className="p-4 bg-media-primary/10 border-media-primary/30 hover:bg-media-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-media-primary text-white text-sm font-bold">4</div>
                <ImageIcon className="h-5 w-5 text-media-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Mídia</h3>
              <p className="text-xs text-muted-foreground">Gere imagens e prompts visuais</p>
            </Card>
            <Card className="p-4 bg-optimize-primary/10 border-optimize-primary/30 hover:bg-optimize-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-optimize-primary text-white text-sm font-bold">5</div>
                <Zap className="h-5 w-5 text-optimize-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Otimização</h3>
              <p className="text-xs text-muted-foreground">Finalize e otimize para publicação</p>
            </Card>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ferramentas</p>
              <p className="text-2xl font-bold text-foreground">14</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-viral-primary/10">
              <FileText className="h-6 w-6 text-viral-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roteiros</p>
              <p className="text-2xl font-bold text-foreground">{stats.scriptsCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-media-primary/10">
              <Palette className="h-6 w-6 text-media-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prompts</p>
              <p className="text-2xl font-bold text-foreground">{stats.promptsCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-optimize-primary/10">
              <Monitor className="h-6 w-6 text-optimize-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guias</p>
              <p className="text-2xl font-bold text-foreground">{stats.guidesCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Viral Finder */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">🔥 Viral Finder</h2>
            <Badge variant="secondary" className="bg-viral-primary/20 text-viral-primary">Etapa 1</Badge>
            <HelpTooltip description="Descubra oportunidades virais e nichos pouco explorados no YouTube" />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Por que começar aqui?</strong> Esta é a primeira etapa para descobrir nichos lucrativos e identificar concorrentes de sucesso.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {viralFinderTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>

      {/* Sub-Niche Hunter */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">🎯 Sub-Niche Hunter</h2>
            <Badge variant="secondary" className="bg-subniche-primary/20 text-subniche-primary">Etapa 2</Badge>
            <HelpTooltip description="Expanda sua estratégia encontrando sub-nichos e micro-nichos lucrativos" />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Próximo passo:</strong> Analise os títulos dos concorrentes encontrados para descobrir estruturas virais e micro-nichos campeões.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subNicheTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>

      {/* Criação de Conteúdo */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">✨ Criação de Conteúdo</h2>
            <Badge variant="secondary" className="bg-content-primary/20 text-content-primary">Etapa 3</Badge>
            <HelpTooltip description="Crie roteiros profissionais com IA e fórmulas de retenção comprovadas" />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Hora de criar:</strong> Com insights dos concorrentes, crie roteiros profissionais usando fórmulas comprovadas de retenção.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contentCreationTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>

      {/* Mídia e Imagem */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">🎨 Mídia e Imagem</h2>
            <Badge variant="secondary" className="bg-media-primary/20 text-media-primary">Etapa 4</Badge>
            <HelpTooltip description="Gere prompts visuais e crie imagens impactantes com IA" />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Crie o visual:</strong> Transforme seu roteiro em prompts visuais detalhados e gere imagens de alta qualidade com IA.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mediaImageTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>

      {/* Otimização e Gestão */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">⚡ Otimização e Gestão</h2>
            <Badge variant="secondary" className="bg-optimize-primary/20 text-optimize-primary">Etapa 5</Badge>
            <HelpTooltip description="Otimize vídeos e gerencie conteúdo de forma profissional" />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Finalize com perfeição:</strong> Combine todos os elementos (roteiro, SRT, prompts) no guia de edição para um vídeo profissional.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {optimizationTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-8 bg-gradient-primary shadow-medium">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-primary-foreground">
              🚀 Ações Rápidas
            </h2>
            <HelpTooltip description="Acesse as ferramentas mais usadas diretamente" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/criador-conteudo"
              className="flex flex-col items-center gap-2 rounded-lg bg-background/10 hover:bg-background/20 p-4 text-sm font-semibold text-primary-foreground transition-colors"
            >
              <FileText className="h-6 w-6" />
              Criar Roteiro
            </Link>
            <Link
              to="/prompts-para-cenas"
              className="flex flex-col items-center gap-2 rounded-lg bg-background/10 hover:bg-background/20 p-4 text-sm font-semibold text-primary-foreground transition-colors"
            >
              <Film className="h-6 w-6" />
              Gerar Prompts
            </Link>
            <Link
              to="/niche-finder"
              className="flex flex-col items-center gap-2 rounded-lg bg-background/10 hover:bg-background/20 p-4 text-sm font-semibold text-primary-foreground transition-colors"
            >
              <Search className="h-6 w-6" />
              Buscar Nicho
            </Link>
            <Link
              to="/configuracoes"
              className="flex flex-col items-center gap-2 rounded-lg bg-background/10 hover:bg-background/20 p-4 text-sm font-semibold text-primary-foreground transition-colors"
            >
              <Settings className="h-6 w-6" />
              Configurar APIs
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
