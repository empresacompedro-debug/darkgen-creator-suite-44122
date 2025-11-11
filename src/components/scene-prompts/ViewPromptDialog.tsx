import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Calendar, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ViewPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    title: string;
    created_at: string;
    prompts: string;
    script_content: string;
    ai_model?: string;
    generation_mode?: string;
    scene_style?: string;
    optimize_for?: string;
    language?: string;
  } | null;
}

export function ViewPromptDialog({ open, onOpenChange, item }: ViewPromptDialogProps) {
  const { toast } = useToast();

  if (!item) return null;

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "✅ Copiado!",
      description: "Prompts copiados para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {item.title || 'Prompt Gerado'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(item.prompts)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Tudo
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(item.created_at)}</span>
            <span className="text-muted-foreground">•</span>
            {item.ai_model && (
              <Badge variant="outline" className="text-xs">
                {item.ai_model}
              </Badge>
            )}
            {item.scene_style && (
              <Badge variant="secondary" className="text-xs">
                {item.scene_style}
              </Badge>
            )}
            {item.generation_mode && (
              <Badge variant="secondary" className="text-xs">
                {item.generation_mode === 'automatic' ? 'Automático' : 'Manual'}
              </Badge>
            )}
            {item.optimize_for && (
              <Badge variant="secondary" className="text-xs">
                Otimizado: {item.optimize_for}
              </Badge>
            )}
            {item.language && (
              <Badge variant="secondary" className="text-xs">
                {item.language}
              </Badge>
            )}
          </div>

          {/* Script Preview */}
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Roteiro Original:</h4>
            <p className="text-sm text-muted-foreground">{item.script_content}</p>
          </div>

          {/* Prompts Content */}
          <div>
            <h4 className="text-sm font-medium mb-2">Prompts Gerados:</h4>
            <ScrollArea className="h-[40vh] border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {item.prompts}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
