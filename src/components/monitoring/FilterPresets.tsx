import { Button } from "@/components/ui/button";
import { Rocket, Gem, Flame, TrendingUp, Zap } from "lucide-react";

interface FilterState {
  vph: { min: number; max: number };
  views: { min: number; max: number };
  days: { min: number; max: number };
  subscribers: { min: number; max: number };
  likes: { min: number; max: number };
  comments: { min: number; max: number };
  channelSizes: string[];
  videoStatus: string[];
  viralityLevel: string[];
}

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

export function FilterPresets({ onApplyPreset, onClearFilters }: FilterPresetsProps) {
  const presets = [
    {
      id: "emerging",
      name: "🎯 Canais Nascendo",
      description: "Canais novos explodindo",
      icon: Rocket,
      filters: {
        subscribers: { min: 0, max: 10000 },
        vph: { min: 1000, max: 100000 },
        days: { min: 0, max: 7 },
        channelSizes: ["micro"],
        viralityLevel: ["viral", "high", "mega"],
      },
    },
    {
      id: "hidden",
      name: "💎 Talentos Ocultos",
      description: "Pequenos com grande performance",
      icon: Gem,
      filters: {
        subscribers: { min: 0, max: 50000 },
        views: { min: 100000, max: 10000000 },
        vph: { min: 500, max: 100000 },
      },
    },
    {
      id: "megaviral",
      name: "🚀 Mega Virais Recentes",
      description: "Explodindo agora",
      icon: Flame,
      filters: {
        vph: { min: 5000, max: 100000 },
        days: { min: 0, max: 14 },
        views: { min: 500000, max: 100000000 },
        viralityLevel: ["mega"],
      },
    },
    {
      id: "sustained",
      name: "📈 Crescimento Sustentado",
      description: "Mantém momentum",
      icon: TrendingUp,
      filters: {
        days: { min: 7, max: 30 },
        vph: { min: 1000, max: 100000 },
      },
    },
    {
      id: "flash",
      name: "⚡ Flash Viral",
      description: "Decolando agora",
      icon: Zap,
      filters: {
        days: { min: 0, max: 3 },
        vph: { min: 3000, max: 100000 },
        videoStatus: ["new"],
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">🎯 Filtros Rápidos</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 text-xs"
        >
          🔄 Limpar Filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <Button
              key={preset.id}
              variant="outline"
              onClick={() => onApplyPreset(preset.filters)}
              className="h-auto flex-col items-start p-3 hover:bg-primary/5 hover:border-primary/30"
            >
              <div className="flex items-center gap-2 mb-1 w-full">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs">{preset.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground text-left">
                {preset.description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
