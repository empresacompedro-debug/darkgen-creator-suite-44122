import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Languages, Loader2, Download, Trash2, Eye, BookOpen, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/translator/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { ImportRecentDialog } from "@/components/srt/ImportRecentDialog";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";

const TradutorRoteiros = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en"]);
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>("");
  const [streamingTranslations, setStreamingTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('translations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const languages = [
    { code: "pt", name: "Português BR" },
    { code: "en", name: "English US" },
    { code: "es", name: "Español (España)" },
    { code: "fr", name: "Français (France)" },
    { code: "de", name: "Deutsch (Alemanha)" },
    { code: "it", name: "Italiano (Italia)" },
    { code: "ja", name: "日本語 (Japão)" },
    { code: "ko", name: "한국어 (Coréia do Sul)" },
    { code: "ro", name: "Română (România)" },
    { code: "pl", name: "Polski (Polska)" },
  ];

  const handleToggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, cole o roteiro completo",
        variant: "destructive",
      });
      return;
    }

    if (selectedLanguages.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um idioma",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTranslations({});
    setStreamingTranslations({});
    setCurrentLanguage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-script`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ script, targetLanguages: selectedLanguages, aiModel })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao traduzir roteiro');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const finalTranslations: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                toast({
                  title: "Erro na Tradução",
                  description: parsed.error,
                  variant: "destructive"
                });
                continue;
              }

              if (parsed.language) {
                if (parsed.status === 'start') {
                  setCurrentLanguage(parsed.language);
                  finalTranslations[parsed.language] = '';
                  setStreamingTranslations({ ...finalTranslations });
                } else if (parsed.text) {
                  finalTranslations[parsed.language] = (finalTranslations[parsed.language] || '') + parsed.text;
                  setStreamingTranslations({ ...finalTranslations });
                } else if (parsed.status === 'done') {
                  setTranslations(prev => ({ ...prev, [parsed.language]: finalTranslations[parsed.language] }));
                }
              }
            } catch (e) {
              console.error('Erro ao parsear chunk:', e);
            }
          }
        }
      }

      setCurrentLanguage("");
      
      await supabase.from('translations').insert({
        original_script: script,
        target_languages: selectedLanguages,
        translated_content: JSON.stringify(finalTranslations),
        ai_model: aiModel,
        user_id: user?.id
      } as any);
      
      await loadHistory();
      toast({
        title: "Tradução Concluída!",
        description: `Roteiro traduzido para ${selectedLanguages.length} idiomas`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao traduzir roteiro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamingTranslations({});
    }
  };

  const handleExport = (language: string, content?: string) => {
    const textContent = content || translations[language];
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roteiro-${language}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('translations').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Tradução removida do histórico" });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Tradutor de Roteiros</h1>
          <p className="text-muted-foreground text-lg">
            Traduza seus Roteiros para múltiplos Idiomas Com um Clique
          </p>
        </div>
        <Button onClick={() => setShowManual(true)} variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="script">Roteiro Completo</Label>
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Importar Último Gerado
              </Button>
            </div>
            <Textarea
              id="script"
              placeholder="Coloque seu roteiro completo aqui..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-3">
            <Label>Selecione os Idiomas Para Tradução:</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang.code}`}
                    checked={selectedLanguages.includes(lang.code)}
                    onCheckedChange={() => handleToggleLanguage(lang.code)}
                  />
                  <label htmlFor={`lang-${lang.code}`} className="text-sm cursor-pointer">
                    {lang.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo de IA</Label>
            <AIModelSelector 
              value={aiModel} 
              onChange={setAiModel}
            />
          </div>

          <Button
            onClick={handleTranslate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Traduzindo Roteiro...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Traduzir Roteiro
              </>
            )}
          </Button>
        </div>
      </Card>

      {(Object.keys(translations).length > 0 || Object.keys(streamingTranslations).length > 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Traduções</h2>
          
          {/* Streaming translations (in progress) */}
          {Object.entries(streamingTranslations).map(([lang, content]) => {
            const langName = languages.find(l => l.code === lang)?.name || lang;
            const isCurrentlyTranslating = currentLanguage === lang;
            return (
              <Card key={lang} className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{langName}</h3>
                    {isCurrentlyTranslating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Traduzindo...</span>
                      </div>
                    )}
                  </div>
                  {!isCurrentlyTranslating && content && (
                    <Button
                      onClick={() => handleExport(lang, content)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                </div>
                <Textarea 
                  value={content} 
                  readOnly 
                  className="min-h-[200px] font-mono text-sm" 
                />
              </Card>
            );
          })}

          {/* Completed translations */}
          {Object.entries(translations).filter(([lang]) => !streamingTranslations[lang]).map(([lang, content]) => {
            const langName = languages.find(l => l.code === lang)?.name || lang;
            return (
              <Card key={lang} className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{langName}</h3>
                  <Button
                    onClick={() => handleExport(lang)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
                <Textarea value={content} readOnly className="min-h-[200px] font-mono text-sm" />
              </Card>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Idiomas: {item.target_languages?.join(', ')}</p>
                  <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewingHistory(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteHistory(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewingHistory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Visualizando Histórico</h2>
            <Button onClick={() => setViewingHistory(null)} variant="outline">Fechar</Button>
          </div>
          {Object.entries(JSON.parse(viewingHistory.translated_content || '{}') || {}).map(([lang, content]: [string, any]) => {
            const langName = languages.find(l => l.code === lang)?.name || lang;
            return (
              <Card key={lang} className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{langName}</h3>
                  <Button
                    onClick={() => handleExport(lang, content)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
                <Textarea value={content} readOnly className="min-h-[200px] font-mono text-sm" />
              </Card>
            );
          })}
        </div>
      )}

      {/* Manual Completo */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Tradutor de Roteiros</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>

      {/* Importar Últimos Gerados */}
      <ImportRecentDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={(content) => setScript(content)}
      />
    </div>
  );
};

export default TradutorRoteiros;
