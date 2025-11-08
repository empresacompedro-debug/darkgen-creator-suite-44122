import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CompetitorMonitor } from '@/pages/MonitoramentoConcorrentes';
import { CompetitorNiche } from '@/hooks/useCompetitorNiches';
import { Package } from 'lucide-react';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitors: CompetitorMonitor[];
  niches: CompetitorNiche[];
  onAssign: (competitorIds: string[], nicheId: string) => Promise<void>;
  onCreateNiche: () => void;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  competitors,
  niches,
  onAssign,
  onCreateNiche
}: BulkAssignDialogProps) {
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [selectedNicheId, setSelectedNicheId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleToggleAll = () => {
    if (selectedCompetitors.size === competitors.length) {
      setSelectedCompetitors(new Set());
    } else {
      setSelectedCompetitors(new Set(competitors.map(c => c.id)));
    }
  };

  const handleToggleCompetitor = (id: string) => {
    const newSelected = new Set(selectedCompetitors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompetitors(newSelected);
  };

  const handleSubmit = async () => {
    if (!selectedNicheId || selectedCompetitors.size === 0) return;

    setIsAssigning(true);
    try {
      await onAssign(Array.from(selectedCompetitors), selectedNicheId);
      setSelectedCompetitors(new Set());
      setSelectedNicheId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atribuir concorrentes:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Organizar Concorrentes em Nicho
          </DialogTitle>
          <DialogDescription>
            Selecione os concorrentes e o nicho para organizá-los
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Concorrentes sem Nicho ({competitors.length})
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
              >
                {selectedCompetitors.size === competitors.length ? 'Desmarcar' : 'Selecionar'} Todos
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              <div className="space-y-2">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={competitor.id}
                      checked={selectedCompetitors.has(competitor.id)}
                      onCheckedChange={() => handleToggleCompetitor(competitor.id)}
                    />
                    <label
                      htmlFor={competitor.id}
                      className="text-sm flex items-center gap-2 cursor-pointer flex-1"
                    >
                      {competitor.channel_thumbnail && (
                        <img
                          src={competitor.channel_thumbnail}
                          alt={competitor.channel_title}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="flex-1">{competitor.channel_title}</span>
                      <span className="text-muted-foreground text-xs">
                        {competitor.subscriber_count?.toLocaleString('pt-BR')} subs
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Atribuir ao Nicho</label>
            <Select value={selectedNicheId} onValueChange={setSelectedNicheId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um nicho..." />
              </SelectTrigger>
              <SelectContent>
                {niches.map((niche) => (
                  <SelectItem key={niche.id} value={niche.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: niche.color }}
                      />
                      {niche.name}
                    </div>
                  </SelectItem>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onOpenChange(false);
                    onCreateNiche();
                  }}
                >
                  + Criar Novo Nicho
                </Button>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCompetitors.size === 0 || !selectedNicheId || isAssigning}
          >
            {isAssigning
              ? 'Atribuindo...'
              : `Atribuir ${selectedCompetitors.size} Concorrente(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
