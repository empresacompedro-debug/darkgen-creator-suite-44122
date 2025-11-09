import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function AIModelSelector({ value, onChange, label = "Modelo de IA" }: AIModelSelectorProps) {
  const models = [
    // Modelos Claude
    { 
      id: "claude-sonnet-4.5", 
      name: "Claude Sonnet 4.5 (Recomendado)", 
      provider: "Anthropic",
      description: "Modelo mais avançado - Requer API key",
      requiresKey: true,
      recommended: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 800
    },
    { 
      id: "claude-sonnet-4", 
      name: "Claude Sonnet 4", 
      provider: "Anthropic",
      description: "Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 600
    },
    { 
      id: "claude-sonnet-3.7", 
      name: "Claude Sonnet 3.7", 
      provider: "Anthropic",
      description: "Extended thinking - Raciocínio profundo - Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 600
    },
    // Modelos Gemini
    { 
      id: "gemini-2.5-pro", 
      name: "Gemini 2.5 Pro", 
      provider: "Google",
      description: "Modelo avançado do Google - Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 100
    },
    { 
      id: "gemini-2.5-flash", 
      name: "Gemini 2.5 Flash", 
      provider: "Google",
      description: "Rápido e eficiente - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 150
    },
    { 
      id: "gemini-2.5-flash-lite", 
      name: "Gemini 2.5 Flash Lite", 
      provider: "Google",
      description: "Ultra rápido e leve - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 60
    },
    // Modelos OpenAI
    { 
      id: "gpt-4o", 
      name: "GPT-4o", 
      provider: "OpenAI",
      description: "Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 500
    },
    // ========== NOVOS MODELOS GPT 2025 ==========
    { 
      id: "gpt-5-2025-08-07", 
      name: "GPT-5", 
      provider: "OpenAI",
      description: "Flagship 2025 - Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 1000
    },
    { 
      id: "gpt-5-mini-2025-08-07", 
      name: "GPT-5 Mini", 
      provider: "OpenAI",
      description: "Rápido e eficiente - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 1200
    },
    { 
      id: "gpt-5-nano-2025-08-07", 
      name: "GPT-5 Nano", 
      provider: "OpenAI",
      description: "Ultra rápido - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 1500
    },
    { 
      id: "gpt-4.1-2025-04-14", 
      name: "GPT-4.1", 
      provider: "OpenAI",
      description: "GPT-4 atualizado - Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 600
    },
    { 
      id: "gpt-4.1-mini-2025-04-14", 
      name: "GPT-4.1 Mini", 
      provider: "OpenAI",
      description: "GPT-4 leve - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 600
    },
    { 
      id: "o3-2025-04-16", 
      name: "O3 Reasoning", 
      provider: "OpenAI",
      description: "Raciocínio avançado - Requer API key",
      requiresKey: true,
      icon: <Sparkles className="h-3 w-3" />,
      maxVideos: 1000
    },
    { 
      id: "o4-mini-2025-04-16", 
      name: "O4 Mini Reasoning", 
      provider: "OpenAI",
      description: "Raciocínio rápido - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 1000
    },
    { 
      id: "gpt-4o-mini", 
      name: "GPT-4o Mini", 
      provider: "OpenAI",
      description: "Legacy leve - Requer API key",
      requiresKey: true,
      icon: <Zap className="h-3 w-3" />,
      maxVideos: 500
    }
  ];

  const selectedModel = models.find(m => m.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedModel?.icon}
              <span>{selectedModel?.name}</span>
              {selectedModel?.recommended && (
                <Badge variant="secondary" className="text-xs">Recomendado</Badge>
              )}
              {selectedModel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">Capacidade: até {selectedModel.maxVideos} vídeos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  {model.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">Máx: {model.maxVideos} vídeos</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {model.recommended && (
                    <Badge variant="secondary" className="text-xs">Padrão</Badge>
                  )}
                  {model.requiresKey && (
                    <Badge variant="outline" className="text-xs">API Key</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{model.provider}</Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}