import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Trash2, 
  Download, 
  Plus, 
  FileText, 
  List,
  Loader2,
  Copy,
  Check,
  Eye,
  Search,
  ListOrdered,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/exportToExcel";
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

interface NicheList {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NicheListsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNicheSelect?: (niche: string) => void;
  onBatchSelect?: (niches: string) => void;
}

export const NicheListsManager: React.FC<NicheListsManagerProps> = ({ open, onOpenChange, onNicheSelect, onBatchSelect }) => {
  const { toast } = useToast();
  const [lists, setLists] = useState<NicheList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListContent, setNewListContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedList, setSelectedList] = useState<NicheList | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<NicheList | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewNichesDialogOpen, setViewNichesDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [copiedNiche, setCopiedNiche] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadLists();
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!viewNichesDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleToggleAll();
      }
      
      // Ctrl+C or Cmd+C - Copy selected niches
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNiches.length > 0) {
        e.preventDefault();
        const cleanedNiches = selectedNiches.map(cleanNicheName).join('\n');
        navigator.clipboard.writeText(cleanedNiches);
        toast({
          title: "✅ Copiado",
          description: `${selectedNiches.length} nicho(s) copiado(s) para área de transferência`,
        });
      }

      // Escape - Close dialog
      if (e.key === 'Escape') {
        setViewNichesDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewNichesDialogOpen, selectedNiches]);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        });
        return;
      }

      // Load only user's own lists
      const { data, error } = await supabase
        .from("niche_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLists(data || []);
    } catch (error: any) {
      console.error("Error loading lists:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar listas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a lista",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("niche_lists").insert({
        user_id: user.id,
        name: newListName,
        content: newListContent,
      });

      if (error) throw error;

      toast({
        title: "✅ Lista criada",
        description: `"${newListName}" foi salva com sucesso`,
      });

      setNewListName("");
      setNewListContent("");
      loadLists();
    } catch (error: any) {
      console.error("Error creating list:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar lista",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteList = async (list: NicheList) => {
    try {
      const { error } = await supabase
        .from("niche_lists")
        .delete()
        .eq("id", list.id);

      if (error) throw error;

      toast({
        title: "✅ Lista excluída",
        description: `"${list.name}" foi removida`,
      });

      loadLists();
      setDeleteDialogOpen(false);
      setListToDelete(null);
    } catch (error: any) {
      console.error("Error deleting list:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir lista",
        variant: "destructive",
      });
    }
  };

  const exportToTxt = (list: NicheList) => {
    const blob = new Blob([list.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Exportado",
      description: `${list.name}.txt baixado`,
    });
  };

  const exportToExcelFile = (list: NicheList) => {
    // Parse niches from content (one per line)
    const lines = list.content.split('\n').filter(line => line.trim());
    const data = lines.map((line, index) => ({
      '#': index + 1,
      'Nicho': line.trim(),
    }));

    exportToExcel(data, list.name, 'Nichos');

    toast({
      title: "✅ Exportado",
      description: `${list.name}.xlsx baixado`,
    });
  };

  const copyToClipboard = (list: NicheList) => {
    navigator.clipboard.writeText(list.content);
    setCopiedId(list.id);
    setTimeout(() => setCopiedId(null), 2000);
    
    toast({
      title: "✅ Copiado",
      description: "Lista copiada para área de transferência",
    });
  };

  const getNicheCount = (content: string) => {
    return content.split('\n').filter(line => line.trim()).length;
  };

  const getNichesArray = (content: string) => {
    return content.split('\n').filter(line => line.trim()).map(line => line.trim());
  };

  // Clean niche name by removing numbers, asterisks, emojis, and extra info
  const cleanNicheName = (niche: string): string => {
    let cleaned = niche;
    
    // Remove leading numbers and dots (e.g., "5. " or "1. ")
    cleaned = cleaned.replace(/^\d+\.\s*/, '');
    
    // Remove asterisks (e.g., "**text**" becomes "text")
    cleaned = cleaned.replace(/\*\*/g, '');
    
    // Remove everything after " - " (including CPM, saturation, etc)
    const dashIndex = cleaned.indexOf(' - ');
    if (dashIndex !== -1) {
      cleaned = cleaned.substring(0, dashIndex);
    }
    
    // Remove emojis and special unicode characters
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Emojis
    cleaned = cleaned.replace(/[⬛⬜🔥💎🌟✨]/g, ''); // Specific symbols
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  const handleViewNiches = (list: NicheList) => {
    setSelectedList(list);
    setViewNichesDialogOpen(true);
    setSearchFilter("");
    setSelectedNiches([]);
    setCopiedNiche(null);
  };

  const handleNicheClick = (niche: string) => {
    if (onNicheSelect) {
      // Clean the niche name before selecting
      const cleanedNiche = cleanNicheName(niche);
      onNicheSelect(cleanedNiche);
      setViewNichesDialogOpen(false);
      onOpenChange(false);
    }
  };

  const handleSendToBatch = () => {
    if (!selectedList || !onBatchSelect) return;
    
    // Se houver nichos selecionados, enviar apenas os selecionados
    if (selectedNiches.length > 0) {
      const cleanedNiches = selectedNiches.map(cleanNicheName);
      const nichesContent = cleanedNiches.join('\n');
      onBatchSelect(nichesContent);
    } else {
      // Se não houver seleção, enviar todos os nichos limpos
      const cleanedContent = getNichesArray(selectedList.content)
        .map(cleanNicheName)
        .join('\n');
      onBatchSelect(cleanedContent);
    }
    
    setViewNichesDialogOpen(false);
    onOpenChange(false);
    setSelectedNiches([]);
  };

  const handleToggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) 
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    );
  };

  const handleToggleAll = () => {
    if (!selectedList) return;
    const allNiches = getFilteredNiches();
    if (selectedNiches.length === allNiches.length) {
      setSelectedNiches([]);
    } else {
      setSelectedNiches(allNiches);
    }
  };

  const handleSendSelectedToBatch = () => {
    if (selectedNiches.length > 0 && onBatchSelect) {
      // Clean selected niches before sending to batch
      const cleanedNiches = selectedNiches.map(cleanNicheName);
      const nichesContent = cleanedNiches.join('\n');
      onBatchSelect(nichesContent);
      setViewNichesDialogOpen(false);
      onOpenChange(false);
      setSelectedNiches([]);
    }
  };

  const handleSearchSelected = () => {
    if (selectedNiches.length === 1 && onNicheSelect) {
      // Clean the niche name before searching
      const cleanedNiche = cleanNicheName(selectedNiches[0]);
      onNicheSelect(cleanedNiche);
      setViewNichesDialogOpen(false);
      onOpenChange(false);
      setSelectedNiches([]);
    } else if (selectedNiches.length > 1 && onBatchSelect) {
      handleSendSelectedToBatch();
    }
  };

  const copyNicheToClipboard = (niche: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Clean the niche name before copying
    const cleanedNiche = cleanNicheName(niche);
    navigator.clipboard.writeText(cleanedNiche);
    setCopiedNiche(niche);
    setTimeout(() => setCopiedNiche(null), 2000);
    toast({
      title: "✅ Copiado",
      description: "Nicho copiado para área de transferência",
    });
  };

  const getFilteredNiches = () => {
    if (!selectedList) return [];
    const allNiches = getNichesArray(selectedList.content);
    if (!searchFilter.trim()) return allNiches;
    return allNiches.filter(niche => 
      niche.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <List className="h-6 w-6" />
              Lista de Nichos
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="lists" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lists">
                <FileText className="h-4 w-4 mr-2" />
                Minhas Listas ({lists.length})
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lists" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4 pr-4">
                    {lists.map((list) => (
                      <Card key={list.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg truncate">{list.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {getNicheCount(list.content)} nichos • Criado em{" "}
                              {new Date(list.created_at).toLocaleDateString()}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewNiches(list)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Nichos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(list)}
                              >
                                {copiedId === list.id ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                Copiar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportToTxt(list)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                TXT
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportToExcelFile(list)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Excel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setListToDelete(list);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {lists.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma lista encontrada</p>
                        <p className="text-sm">Crie sua primeira lista na aba "Criar Nova"</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  <div>
                    <Label htmlFor="listName">Nome da Lista *</Label>
                    <Input
                      id="listName"
                      placeholder="Ex: Meus Nichos de Tecnologia"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="listContent">
                      Lista de Nichos
                      <span className="text-muted-foreground text-sm ml-2">
                        (um nicho por linha)
                      </span>
                    </Label>
                    <Textarea
                      id="listContent"
                      placeholder="Digite ou cole seus nichos aqui&#10;Um nicho por linha&#10;&#10;Exemplo:&#10;AI and Machine Learning&#10;Cryptocurrency Trading&#10;Digital Marketing Strategies"
                      value={newListContent}
                      onChange={(e) => setNewListContent(e.target.value)}
                      rows={15}
                      className="mt-2 font-mono text-sm"
                    />
                    {newListContent && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {getNicheCount(newListContent)} nichos detectados
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={createList}
                    disabled={isCreating || !newListName.trim()}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Lista
                      </>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={viewNichesDialogOpen} onOpenChange={setViewNichesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Nichos de {selectedList?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Busque, selecione e gerencie seus nichos • Atalhos: Ctrl+A (selecionar todos), Ctrl+C (copiar)
            </p>
          </DialogHeader>

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nichos..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchFilter("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Seleção múltipla */}
          {selectedList && getFilteredNiches().length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="select-all"
                checked={selectedNiches.length === getFilteredNiches().length && getFilteredNiches().length > 0}
                onCheckedChange={handleToggleAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                {selectedNiches.length > 0 
                  ? `${selectedNiches.length} selecionado(s)`
                  : "Selecionar todos"}
              </Label>
            </div>
          )}
          
          {/* Conteúdo scrollável */}
          <div className="flex-1 min-h-0 border rounded-lg bg-muted/30">
            <ScrollArea className="h-[400px] w-full">
              <div className="p-4 space-y-2">
                {getFilteredNiches().map((niche, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                  >
                    <Checkbox
                      checked={selectedNiches.includes(niche)}
                      onCheckedChange={() => handleToggleNiche(niche)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="flex-1 cursor-pointer flex items-center gap-2"
                      onClick={() => handleNicheClick(niche)}
                    >
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-accent-foreground transition-colors" />
                      <span className="flex-1 text-sm">{niche}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => copyNicheToClipboard(niche, e)}
                    >
                      {copiedNiche === niche ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
                
                {getFilteredNiches().length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum nicho encontrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Rodapé com ações */}
          <div className="flex items-center justify-between pt-4 border-t gap-3">
            <div className="text-sm text-muted-foreground">
              {selectedNiches.length > 0 ? (
                <span className="font-medium text-foreground">{selectedNiches.length} selecionado(s)</span>
              ) : (
                <span>{getFilteredNiches().length} de {selectedList && getNicheCount(selectedList.content)} nichos</span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedNiches.length === 1 ? (
                <Button
                  onClick={handleSearchSelected}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar Selecionado
                </Button>
              ) : selectedNiches.length > 1 ? (
                <Button
                  onClick={handleSendToBatch}
                  className="gap-2"
                >
                  <ListOrdered className="h-4 w-4" />
                  Enviar {selectedNiches.length} para Lote
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSendToBatch}
                  className="gap-2"
                >
                  <ListOrdered className="h-4 w-4" />
                  Enviar Todos para Lote
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setViewNichesDialogOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a lista "{listToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listToDelete && deleteList(listToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
