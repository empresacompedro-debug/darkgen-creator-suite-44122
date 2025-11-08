import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export interface FilterState {
  vph: { min: number; max: number };
  views: { min: number; max: number };
  days: { min: number; max: number };
  subscribers: { min: number; max: number };
  likes: { min: number; max: number };
  comments: { min: number; max: number };
  channelSizes: string[];
  videoStatus: string[];
  viralityLevel: string[];
  sortBy: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const updateRange = (key: 'vph' | 'views' | 'days' | 'subscribers' | 'likes' | 'comments', field: 'min' | 'max', value: number) => {
    const current = filters[key];
    updateFilter(key, { ...current, [field]: value });
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof FilterState] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Ordenação */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">🔄 Ordenar Por</Label>
          <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="explosive">🔥 Mais Explosivos (VPH + Novidade)</SelectItem>
              <SelectItem value="emerging">🚀 Canais Emergentes (Pequenos + Alta VPH)</SelectItem>
              <SelectItem value="reach">👑 Maior Alcance (Views)</SelectItem>
              <SelectItem value="engagement">💎 Melhor Engajamento</SelectItem>
              <SelectItem value="recent">⏰ Mais Recentes</SelectItem>
              <SelectItem value="ratio">📊 Melhor Views/Inscritos</SelectItem>
              <SelectItem value="score">⭐ Maior Score de Explosividade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros Numéricos - Grid 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VPH */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">🚀 VPH (Views por Hora)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.vph.min}
                onChange={(e) => updateRange('vph', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.vph.max}
                onChange={(e) => updateRange('vph', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={50000}
              step={100}
              value={[filters.vph.min, filters.vph.max]}
              onValueChange={([min, max]) => updateFilter('vph', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.vph.min.toLocaleString()} - {filters.vph.max.toLocaleString()} VPH
            </p>
          </div>

          {/* Views */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">👁️ Visualizações</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.views.min}
                onChange={(e) => updateRange('views', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.views.max}
                onChange={(e) => updateRange('views', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={10000000}
              step={10000}
              value={[filters.views.min, filters.views.max]}
              onValueChange={([min, max]) => updateFilter('views', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.views.min.toLocaleString()} - {filters.views.max.toLocaleString()}
            </p>
          </div>

          {/* Idade do Vídeo */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">📅 Idade do Vídeo (dias)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.days.min}
                onChange={(e) => updateRange('days', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.days.max}
                onChange={(e) => updateRange('days', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={365}
              step={1}
              value={[filters.days.min, filters.days.max]}
              onValueChange={([min, max]) => updateFilter('days', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.days.min} - {filters.days.max} dias
            </p>
          </div>

          {/* Inscritos do Canal */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">👥 Inscritos do Canal</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.subscribers.min}
                onChange={(e) => updateRange('subscribers', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.subscribers.max}
                onChange={(e) => updateRange('subscribers', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={10000000}
              step={10000}
              value={[filters.subscribers.min, filters.subscribers.max]}
              onValueChange={([min, max]) => updateFilter('subscribers', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.subscribers.min.toLocaleString()} - {filters.subscribers.max.toLocaleString()}
            </p>
          </div>

          {/* Likes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">👍 Likes</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.likes.min}
                onChange={(e) => updateRange('likes', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.likes.max}
                onChange={(e) => updateRange('likes', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={100000}
              step={100}
              value={[filters.likes.min, filters.likes.max]}
              onValueChange={([min, max]) => updateFilter('likes', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.likes.min.toLocaleString()} - {filters.likes.max.toLocaleString()}
            </p>
          </div>

          {/* Comentários */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">💬 Comentários</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.comments.min}
                onChange={(e) => updateRange('comments', 'min', Number(e.target.value))}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.comments.max}
                onChange={(e) => updateRange('comments', 'max', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Slider
              min={0}
              max={10000}
              step={10}
              value={[filters.comments.min, filters.comments.max]}
              onValueChange={([min, max]) => updateFilter('comments', { min, max })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {filters.comments.min.toLocaleString()} - {filters.comments.max.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filtros Categóricos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
          {/* Tamanho do Canal */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">📊 Tamanho do Canal</Label>
            <div className="space-y-2">
              {[
                { value: "micro", label: "Micro (<10K)" },
                { value: "small", label: "Pequeno (10K-100K)" },
                { value: "medium", label: "Médio (100K-1M)" },
                { value: "large", label: "Grande (1M+)" },
              ].map((size) => (
                <div key={size.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size.value}`}
                    checked={filters.channelSizes.includes(size.value)}
                    onCheckedChange={() => toggleArrayFilter('channelSizes', size.value)}
                  />
                  <label
                    htmlFor={`size-${size.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {size.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Status do Vídeo */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">⏰ Status do Vídeo</Label>
            <div className="space-y-2">
              {[
                { value: "new", label: "Novo (0-3 dias)" },
                { value: "recent", label: "Recente (4-7 dias)" },
                { value: "established", label: "Estabelecido (8-30 dias)" },
                { value: "old", label: "Antigo (30+ dias)" },
              ].map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.videoStatus.includes(status.value)}
                    onCheckedChange={() => toggleArrayFilter('videoStatus', status.value)}
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Nível de Viralidade */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">🔥 Nível de Viralidade</Label>
            <div className="space-y-2">
              {[
                { value: "mega", label: "Mega Viral (VPH > 5000)" },
                { value: "high", label: "Muito Viral (VPH 2000-5000)" },
                { value: "viral", label: "Viral (VPH 500-2000)" },
                { value: "explosive", label: "Explosivo (VPH < 500)" },
              ].map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`viral-${level.value}`}
                    checked={filters.viralityLevel.includes(level.value)}
                    onCheckedChange={() => toggleArrayFilter('viralityLevel', level.value)}
                  />
                  <label
                    htmlFor={`viral-${level.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {level.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
