import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Settings, TrendingUp, Sparkles, ChevronDown, ImageIcon, Zap, LogOut, LogIn, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
const navigation = [{
  name: "Dashboard",
  href: "/",
  icon: Home
}, {
  name: "Viral Finder 🔥",
  icon: Search,
  stepInfo: "Etapa 1",
  submenu: [{
    name: "🎯 Niche Finder",
    href: "/niche-finder",
    step: 1
  }, {
    name: "📊 Canais Similares",
    href: "/canais-similares",
    step: 2
  }, {
    name: "👁️ Monitoramento",
    href: "/monitoramento-concorrentes",
    step: 3
  }]
}, {
  name: "🎯 Sub-Niche Hunter",
  icon: TrendingUp,
  stepInfo: "Etapa 2",
  submenu: [{
    name: "📊 Análise de Títulos",
    href: "/title-analysis",
    step: 4
  }, {
    name: "🔍 Expansão de Nicho",
    href: "/sub-niche-hunter",
    step: 5
  }]
}, {
  name: "Criação de Conteúdo",
  icon: Sparkles,
  stepInfo: "Etapa 3",
  submenu: [{
    name: "✍️ Criador de Conteúdo",
    href: "/criador-conteudo",
    step: 6
  }, {
    name: "🌐 Tradutor de Roteiros",
    href: "/tradutor-roteiros",
    step: 7
  }, {
    name: "💡 Brainstorm de Ideias",
    href: "/brainstorm",
    step: 8
  }]
}, {
  name: "Mídia e Imagem",
  icon: ImageIcon,
  stepInfo: "Etapa 4",
  submenu: [{
    name: "🎬 Prompts para Cenas",
    href: "/prompts-cenas",
    step: 9
  }, {
    name: "🎨 Gerador de Imagens",
    href: "/gerador-imagens",
    step: 10
  }, {
    name: "🖼️ Prompts de Thumbnail",
    href: "/prompts-thumbnail",
    step: 11
  }]
}, {
  name: "Otimização e Gestão",
  icon: Zap,
  stepInfo: "Etapa 5",
  submenu: [{
    name: "📝 Conversor SRT",
    href: "/conversor-srt",
    step: 12
  }, {
    name: "🎞️ Guia de Edição",
    href: "/guia-edicao",
    step: 13
  }, {
    name: "✂️ Divisor de Texto",
    href: "/divisor-texto",
    step: 14
  }]
}, {
  name: "Configurações",
  href: "/configuracoes",
  icon: Settings
}];
export const Layout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const { theme, setTheme } = useTheme();
  const { isPremium, isAdmin } = useSubscription();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Viral Finder 🔥", "🎯 Sub-Niche Hunter", "Criação de Conteúdo", "Mídia e Imagem", "Otimização e Gestão"]);
  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => prev.includes(menuName) ? prev.filter(name => name !== menuName) : [...prev, menuName]);
  };
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    navigate("/");
  };
  return <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-strong">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">DarkGen</h1>
                <p className="text-xs text-muted-foreground">A Melhor Para Canais Dark</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map(item => {
            const Icon = item.icon;
            const isActive = item.href ? location.pathname === item.href : false;
            const isExpanded = expandedMenus.includes(item.name);
            if (item.submenu) {
              return <div key={item.name} className="space-y-1">
                    <button onClick={() => toggleMenu(item.name)} className={cn("w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", "text-foreground hover:bg-accent hover:text-accent-foreground")}>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {item.stepInfo && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent-foreground">
                            {item.stepInfo}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </button>
                    {isExpanded && <div className="ml-4 space-y-1 border-l border-border pl-3">
                        {item.submenu.map(subitem => {
                    const isSubActive = location.pathname === subitem.href;
                    return <Link key={subitem.name} to={subitem.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all relative", isSubActive ? "bg-accent text-accent-foreground shadow-soft" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                              {subitem.step && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-[10px] font-bold text-white shadow-md ring-2 ring-background">
                                  {subitem.step}
                                </span>
                              )}
                              <span>{subitem.name}</span>
                            </Link>;
                  })}
                      </div>}
                  </div>;
            }
            return <Link key={item.name} to={item.href!} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-accent text-accent-foreground shadow-soft" : "text-foreground hover:bg-accent hover:text-accent-foreground")}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>;
          })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4 space-y-3">
            {user ? <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-xs text-foreground text-center truncate px-2">
                    {user.email}
                  </div>
                  {isPremium && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                      Premium
                    </Badge>
                  )}
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                      Admin
                    </Badge>
                  )}
                </div>
                
                {!isPremium && (
                  <div className="mb-2">
                    <UpgradeButton />
                  </div>
                )}
                
                <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div> : <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Button>}
            <p className="text-xs text-muted-foreground text-center">
              © 2025 DarkGen
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>;
};