import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterOptions } from "@/hooks/useFilterPresets";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onClose,
}: AdvancedFiltersProps) => {
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
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
    };
    onFiltersChange(clearedFilters);
  };

  return (
    <Card className="p-6 space-y-6 border-accent/20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filtros Avançados</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* VPH */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">VPH Mínimo</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("minVPH", Math.max(0, filters.minVPH - 10))}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              step="0.1"
              value={filters.minVPH}
              onChange={(e) => updateFilter("minVPH", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("minVPH", filters.minVPH + 10)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Idade do Canal (Dias) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Idade do Canal (dias)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              placeholder="Min"
              value={filters.channelAgeDaysMin}
              onChange={(e) => updateFilter("channelAgeDaysMin", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="number"
              step="1"
              placeholder="Max"
              value={filters.channelAgeDaysMax}
              onChange={(e) => updateFilter("channelAgeDaysMax", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
          </div>
        </div>

        {/* Inscritos */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Inscritos</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              placeholder="Min"
              value={filters.subscribersMin}
              onChange={(e) => updateFilter("subscribersMin", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="number"
              step="1"
              placeholder="Max"
              value={filters.subscribersMax}
              onChange={(e) => updateFilter("subscribersMax", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
          </div>
        </div>

        {/* Média Views por Vídeo */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Média Views/Vídeo</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("minAvgViews", Math.max(0, filters.minAvgViews - 100))}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              step="0.1"
              value={filters.minAvgViews}
              onChange={(e) => updateFilter("minAvgViews", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("minAvgViews", filters.minAvgViews + 100)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Total de Views */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Total de Views</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              placeholder="Min"
              value={filters.totalViewsMin}
              onChange={(e) => updateFilter("totalViewsMin", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="number"
              step="1"
              placeholder="Max"
              value={filters.totalViewsMax}
              onChange={(e) => updateFilter("totalViewsMax", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
          </div>
        </div>

        {/* Quantidade de Vídeos */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Total de Vídeos</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              placeholder="Min"
              value={filters.videoCountMin}
              onChange={(e) => updateFilter("videoCountMin", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="number"
              step="1"
              placeholder="Max"
              value={filters.videoCountMax}
              onChange={(e) => updateFilter("videoCountMax", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
          </div>
        </div>

        {/* Uploads por Mês */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Uploads/Mês</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Min"
              value={filters.uploadsPerMonthMin}
              onChange={(e) => updateFilter("uploadsPerMonthMin", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="number"
              step="0.1"
              placeholder="Max"
              value={filters.uploadsPerMonthMax}
              onChange={(e) => updateFilter("uploadsPerMonthMax", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
          </div>
        </div>

        {/* Último Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Último Upload (máx dias atrás)</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("lastUploadDays", Math.max(0, filters.lastUploadDays - 1))}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              step="0.1"
              value={filters.lastUploadDays}
              onChange={(e) => updateFilter("lastUploadDays", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter("lastUploadDays", filters.lastUploadDays + 1)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={clearFilters} variant="outline" className="flex-1">
          Limpar Filtros
        </Button>
        <Button onClick={onClose} className="flex-1">
          Aplicar
        </Button>
      </div>
    </Card>
  );
};
