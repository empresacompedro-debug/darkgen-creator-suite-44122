import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Globe, Book } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ImportRecentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (content: string) => void;
}

export function ImportRecentDialog({ open, onOpenChange, onImport }: ImportRecentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRecent();
    }
  }, [open]);

  const loadRecent = async () => {
    setLoading(true);
    try {
      const [scriptsData, guidesData, translationsData] = await Promise.all([
        supabase
          .from('scripts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('editing_guides')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('translations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setScripts(scriptsData.data || []);
      setGuides(guidesData.data || []);
      setTranslations(translationsData.data || []);
    } catch (error: any) {
      console.error('Error loading recent:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conteúdos recentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (content: string, type: string) => {
    onImport(content);
    onOpenChange(false);
    toast({
      title: "Importado",
      description: `${type} importado com sucesso`,
    });
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>📥 Importar Últimos Gerados</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="scripts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scripts">
                <FileText className="h-4 w-4 mr-2" />
                Scripts ({scripts.length})
              </TabsTrigger>
              <TabsTrigger value="guides">
                <Book className="h-4 w-4 mr-2" />
                Guias ({guides.length})
              </TabsTrigger>
              <TabsTrigger value="translations">
                <Globe className="h-4 w-4 mr-2" />
                Traduções ({translations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scripts">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {scripts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum script encontrado
                    </p>
                  ) : (
                    scripts.map((script) => (
                      <Card key={script.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{script.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {script.content.substring(0, 150)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(script.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleImport(script.content, "Script")}
                          >
                            Importar
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guides">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {guides.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum guia encontrado
                    </p>
                  ) : (
                    guides.map((guide) => (
                      <Card key={guide.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{guide.video_topic}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {guide.script?.substring(0, 150) || guide.guide_content.substring(0, 150)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(guide.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleImport(guide.script || guide.guide_content, "Guia")}
                          >
                            Importar
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="translations">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {translations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma tradução encontrada
                    </p>
                  ) : (
                    translations.map((translation) => (
                      <Card key={translation.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">
                              {translation.target_languages?.join(', ') || 'Tradução'}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {translation.original_script.substring(0, 150)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(translation.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleImport(translation.translated_content, "Tradução")}
                          >
                            Importar
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
