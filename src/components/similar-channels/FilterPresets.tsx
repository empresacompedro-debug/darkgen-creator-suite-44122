import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterOptions, useFilterPresets } from "@/hooks/useFilterPresets";
import { Trophy, Rocket, Sprout, Target, Plus, Trash2, Clock, DollarSign, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FilterPresetsProps {
  onSelectPreset: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  onSavePreset: () => void;
}

const defaultPresets = [
  {
    id: "monetization",
    name: "💰 Aptos p/ Monetização",
    icon: "💰",
    description: "1k+ inscritos, 4k horas watch time",
    filters: {
      minVPH: 0,
      minViewsPerSubscriber: 0,
      minAvgViews: 0,
      uploadsPerMonthMin: 4,
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
    } as FilterOptions,
  },
  {
    id: "caca-talentos",
    name: "Caça-Talentos",
    icon: "🏆",
    description: "Pequenos canais altamente virais",
    filters: {
      minVPH: 1000,
      minViewsPerSubscriber: 3,
      minAvgViews: 0,
      uploadsPerMonthMin: 0,
      uploadsPerMonthMax: 999,
      lastUploadDays: 730,
      minDataQuality: 0,
      videoCountMin: 0,
      videoCountMax: 999,
      channelAgeDaysMin: 0,
      channelAgeDaysMax: 9999,
      subscribersMin: 0,
      subscribersMax: 999999999,
      totalViewsMin: 0,
      totalViewsMax: 999999999,
    } as FilterOptions,
  },
  {
    id: "explosivos",
    name: "Apenas Explosivos",
    icon: "🚀",
    description: "Canais com crescimento explosivo",
    filters: {
      minVPH: 2000,
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
    } as FilterOptions,
  },
  {
    id: "micro",
    name: "Micro-Influencers",
    icon: "🎯",
    description: "Canais pequenos e ativos",
    filters: {
      minVPH: 0,
      minViewsPerSubscriber: 0,
      minAvgViews: 0,
      uploadsPerMonthMin: 4,
      uploadsPerMonthMax: 8,
      lastUploadDays: 30,
      minDataQuality: 0,
      videoCountMin: 0,
      videoCountMax: 999,
      channelAgeDaysMin: 0,
      channelAgeDaysMax: 9999,
      subscribersMin: 0,
      subscribersMax: 999999999,
      totalViewsMin: 0,
      totalViewsMax: 999999999,
    } as FilterOptions,
  },
];

export const FilterPresets = ({
  onSelectPreset,
  currentFilters,
  onSavePreset,
}: FilterPresetsProps) => {
  const { presets, deletePreset } = useFilterPresets();

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case "⏰":
        return <Clock className="h-4 w-4" />;
      case "💰":
        return <DollarSign className="h-4 w-4" />;
      case "🎭":
        return <EyeOff className="h-4 w-4" />;
      case "🏆":
        return <Trophy className="h-4 w-4" />;
      case "🚀":
        return <Rocket className="h-4 w-4" />;
      case "🌱":
        return <Sprout className="h-4 w-4" />;
      case "🎯":
        return <Target className="h-4 w-4" />;
      default:
        return <span>{icon}</span>;
    }
  };

  const activeFiltersCount = Object.entries(currentFilters).filter(([key, value]) => {
    if (typeof value === "boolean") return value;
    if (key === "uploadsPerMonthMax" || key === "lastUploadDays" || key === "videoCountMax") {
      return value < 999;
    }
    return value > 0;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Presets Rápidos</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} filtros ativos</Badge>
          )}
        </div>
        <Button onClick={onSavePreset} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Salvar Preset Atual
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Default Presets */}
        {defaultPresets.map((preset) => (
          <Card
            key={preset.id}
            className="p-4 cursor-pointer hover:border-accent transition-colors"
            onClick={() => onSelectPreset(preset.filters)}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{preset.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {preset.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {preset.description}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* User Saved Presets */}
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className="p-4 cursor-pointer hover:border-accent transition-colors group relative"
          >
            <div
              onClick={() => onSelectPreset(preset.filters)}
              className="flex items-start gap-3"
            >
              <div className="text-2xl">{preset.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {preset.name}
                </h4>
                <Badge variant="outline" className="text-xs">
                  Personalizado
                </Badge>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Preset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o preset "{preset.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePreset(preset.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ))}
      </div>
    </div>
  );
};
