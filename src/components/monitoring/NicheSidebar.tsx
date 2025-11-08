import { Folder, FolderOpen, Plus, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CompetitorNiche } from '@/hooks/useCompetitorNiches';
import { CompetitorMonitor } from '@/pages/MonitoramentoConcorrentes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface NicheSidebarProps {
  niches: CompetitorNiche[];
  selectedNicheId: string | null;
  onSelectNiche: (nicheId: string | null) => void;
  onCreateNiche: () => void;
  onBulkAssign: () => void;
  onDeleteNiche: (nicheId: string) => void;
  competitors: CompetitorMonitor[];
}

export function NicheSidebar({
  niches,
  selectedNicheId,
  onSelectNiche,
  onCreateNiche,
  onBulkAssign,
  onDeleteNiche,
  competitors
}: NicheSidebarProps) {
  const [nicheToDelete, setNicheToDelete] = useState<CompetitorNiche | null>(null);
  const getCompetitorCount = (nicheId: string | null) => {
    if (nicheId === null) {
      return competitors.filter(c => !c.niche_id).length;
    }
    return competitors.filter(c => c.niche_id === nicheId).length;
  };

  const totalCompetitors = competitors.length;
  const competitorsWithoutNiche = competitors.filter(c => !c.niche_id).length;

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Nichos</h2>
        <Button
          onClick={onCreateNiche}
          className="w-full justify-start"
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Nicho
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Todos os Concorrentes */}
          <button
            onClick={() => onSelectNiche(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              selectedNicheId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedNicheId === null ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <span>Todos</span>
            </div>
            <Badge variant="secondary" className="ml-2">
              {totalCompetitors}
            </Badge>
          </button>

          {/* Divisor */}
          {niches.length > 0 && (
            <div className="my-2 border-t" />
          )}

          {/* Lista de Nichos */}
          {niches.map((niche) => {
            const count = getCompetitorCount(niche.id);
            return (
              <div key={niche.id} className="group relative">
                <button
                  onClick={() => onSelectNiche(niche.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedNicheId === niche.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: niche.color }}
                    />
                    <span className="truncate">{niche.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="flex-shrink-0">
                      {count}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNicheToDelete(niche);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Botão de Organizar Concorrentes */}
      {competitorsWithoutNiche > 0 && (
        <div className="p-4 border-t">
          <Button
            onClick={onBulkAssign}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            Organizar Concorrentes
          </Button>
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!nicheToDelete} onOpenChange={(open) => !open && setNicheToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nicho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o nicho "<strong>{nicheToDelete?.name}</strong>"?
              <br />
              <br />
              Os concorrentes não serão excluídos, apenas ficarão sem nicho atribuído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (nicheToDelete) {
                  onDeleteNiche(nicheToDelete.id);
                  setNicheToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
