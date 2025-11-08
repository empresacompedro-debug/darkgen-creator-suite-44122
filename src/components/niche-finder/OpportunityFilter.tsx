import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export interface OpportunityFilters {
  minOpportunityScore: number;
  maxSaturation: number;
  minTrendScore: number;
  maxCompetitors: number;
  nicheType: 'all' | 'micro' | 'sub' | 'broad';
}

interface OpportunityFilterProps {
  onFilterChange: (filters: OpportunityFilters) => void;
  currentFilters: OpportunityFilters;
}

export function OpportunityFilter({ onFilterChange, currentFilters }: OpportunityFilterProps) {
  const [filters, setFilters] = useState<OpportunityFilters>(currentFilters);
  
  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters: OpportunityFilters = {
      minOpportunityScore: 0,
      maxSaturation: 100,
      minTrendScore: -100,
      maxCompetitors: 999,
      nicheType: 'all'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5" />
        <h3 className="font-semibold">🎯 Filtros de Oportunidade</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <Label className="text-sm">Score de Oportunidade Mínimo: {filters.minOpportunityScore}</Label>
          <Slider
            value={[filters.minOpportunityScore]}
            onValueChange={([v]) => setFilters({...filters, minOpportunityScore: v})}
            max={100}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {filters.minOpportunityScore >= 70 ? '💎 Apenas oportunidades de ouro' :
             filters.minOpportunityScore >= 40 ? '🟡 Oportunidades médias ou melhores' :
             '📊 Todos os níveis de oportunidade'}
          </p>
        </div>
        
        <div>
          <Label className="text-sm">Saturação Máxima: {filters.maxSaturation}%</Label>
          <Slider
            value={[filters.maxSaturation]}
            onValueChange={([v]) => setFilters({...filters, maxSaturation: v})}
            max={100}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {filters.maxSaturation < 30 ? '🟢 Oceano Azul - Baixa competição' : 
             filters.maxSaturation < 60 ? '🟡 Competição Moderada' : 
             '🔴 Oceano Vermelho - Alta competição'}
          </p>
        </div>
        
        <div>
          <Label className="text-sm">Tendência Mínima: {filters.minTrendScore > 0 ? '+' : ''}{filters.minTrendScore}%</Label>
          <Slider
            value={[filters.minTrendScore]}
            onValueChange={([v]) => setFilters({...filters, minTrendScore: v})}
            min={-50}
            max={100}
            step={10}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {filters.minTrendScore > 20 ? '📈 Apenas nichos em crescimento forte' :
             filters.minTrendScore > 0 ? '↗️ Nichos com tendência positiva' :
             '📊 Incluir nichos estáveis ou em declínio'}
          </p>
        </div>
        
        <div>
          <Label className="text-sm">Competidores Máximos</Label>
          <Input
            type="number"
            value={filters.maxCompetitors}
            onChange={(e) => setFilters({...filters, maxCompetitors: parseInt(e.target.value) || 999})}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Número máximo de canais únicos no nicho
          </p>
        </div>
        
        <div>
          <Label className="text-sm">Tipo de Nicho</Label>
          <Select 
            value={filters.nicheType} 
            onValueChange={(v: any) => setFilters({...filters, nicheType: v})}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="micro">🎯 Micro-Nicho (mais específico)</SelectItem>
              <SelectItem value="sub">📦 Sub-Nicho</SelectItem>
              <SelectItem value="broad">🌍 Nicho Amplo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button onClick={handleReset} variant="outline">
            Resetar
          </Button>
        </div>
      </div>
    </Card>
  );
}
