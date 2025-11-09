import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Copy, Download, Trash2, Eye, BookOpen, Zap } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/editing-guide/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { AIModelSelector } from "@/components/subniche/AIModelSelector";

export default function GuiaEdicao() {
  const [script, setScript] = useState("");
  const [scenePrompts, setScenePrompts] = useState("");
  const [srtContent, setSrtContent] = useState("");
  const [imagesPerScene, setImagesPerScene] = useState(1);
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [validation, setValidation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [structuredData, setStructuredData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('editing_guides')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleImportTxt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        let content = event.target.result as string;
        let processedContent = cleanScenePrompts(content);
        
        // Auto-detect scenes and add delimiters if not present
        if (!processedContent.includes('--- SCENE') && !processedContent.includes('---SCENE')) {
          const sceneBlocks = processedContent
            .split(/(?=Photorealistic with high fidelity)/gi)
            .filter(s => s.trim().length > 100);
          
          if (sceneBlocks.length > 1) {
            processedContent = sceneBlocks
              .map((block, idx) => `--- SCENE ${idx + 1}:\n${block.trim()}`)
              .join('\n\n');
            
            toast({
              title: "Cenas Detectadas",
              description: `${sceneBlocks.length} cenas foram identificadas e organizadas automaticamente.`,
            });
          }
        }
        
        setScenePrompts(processedContent);
        toast({
          title: "Sucesso",
          description: "Prompts de cena importados!",
        });
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImportSrt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.srt,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setSrtContent(event.target.result);
        toast({ title: "SRT Importado!", description: "Timecodes precisos serão usados no guia" });
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const cleanScriptText = (text: string): string => {
    return text
      .split('\n')
      .filter(line => !line.trim().match(/^#+\s/))
      .filter(line => !line.trim().match(/PARTE\s+\d+/i))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const cleanScenePrompts = (text: string): string => {
    // Remove títulos de cena (linhas que começam com "---" ou contêm "SCENE X:")
    return text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('---') && !trimmed.match(/^SCENE\s+\d+:/i);
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const loadLatestData = async () => {
    // Load latest script
    const { data: scripts } = await supabase
      .from('scripts')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!scripts || scripts.length === 0) {
      toast({
        title: "📝 Nenhum roteiro encontrado",
        description: "Vá até 'Criador de Conteúdo' e crie um roteiro primeiro!",
        action: (
          <Button size="sm" onClick={() => window.location.href = '/criador-conteudo'}>
            Ir para Criador
          </Button>
        ),
        duration: 5000,
      });
      return;
    }
    
    if (scripts?.[0]) {
      setScript(cleanScriptText(scripts[0].content));
      toast({ title: "✅ Roteiro carregado!", description: "Último roteiro importado limpo e pronto" });
    }

    // Load latest scene prompts
    const { data: prompts } = await supabase
      .from('scene_prompts')
      .select('prompts')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!prompts || prompts.length === 0) {
      toast({
        title: "🎬 Nenhum prompt de cena encontrado",
        description: "Vá até 'Prompts para Cenas' e gere prompts primeiro!",
        action: (
          <Button size="sm" onClick={() => window.location.href = '/prompts-para-cenas'}>
            Ir para Prompts
          </Button>
        ),
        duration: 5000,
      });
    }
    
    if (prompts?.[0]) {
      let processedContent = cleanScenePrompts(prompts[0].prompts);
      
      // Auto-detect scenes and add delimiters if not present
      if (!processedContent.includes('--- SCENE') && !processedContent.includes('---SCENE')) {
        const sceneBlocks = processedContent
          .split(/(?=Photorealistic with high fidelity)/gi)
          .filter(s => s.trim().length > 100);
        
        if (sceneBlocks.length > 1) {
          processedContent = sceneBlocks
            .map((block, idx) => `--- SCENE ${idx + 1}:\n${block.trim()}`)
            .join('\n\n');
          
          toast({
            title: "Cenas Detectadas",
            description: `${sceneBlocks.length} cenas foram identificadas e organizadas automaticamente.`,
          });
        }
      }
      
      setScenePrompts(processedContent);
      toast({ title: "Prompts carregados!", description: "Últimos prompts de cena importados limpos" });
    }

    // Load latest SRT
    const { data: srts } = await supabase
      .from('srt_conversions')
      .select('srt_result')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (srts?.[0]) {
      setSrtContent(srts[0].srt_result);
      toast({ title: "✅ SRT carregado!", description: "Último SRT convertido importado (opcional)" });
    } else {
      toast({
        title: "ℹ️ SRT não encontrado",
        description: "Opcional: Use o 'Conversor SRT' para timecodes mais precisos",
        duration: 3000,
      });
    }
  };

  const handleGenerate = async () => {
    if (!script || !scenePrompts) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o roteiro e os prompts de cena",
        variant: "destructive",
      });
      return;
    }

    // Validate scene detection
    const sceneCount = scenePrompts.split(/\n\n+/).filter(s => s.trim().length > 50).length;
    console.log(`🎬 Detectadas ${sceneCount} cenas nos prompts`);

    if (sceneCount === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma cena detectada nos prompts. Verifique o formato (separe cenas por linhas vazias).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-editing-guide', {
        body: { 
          script, 
          scenePrompts, 
          aiModel,
          srtContent: srtContent || null,
          imagesPerScene
        }
      });

      if (error) throw error;
      
      // Prioritize local assembly from separate scenes
      let finalGuide = data.guide;
      if (data.guidesByScene && Array.isArray(data.guidesByScene)) {
        finalGuide = data.guidesByScene.join('\n');
        console.log('✅ Guia montado localmente a partir de', data.guidesByScene.length, 'cenas');
      }
      
      // Sanity check: count images per scene in the final guide
      const sceneSections = finalGuide.split(/\*\*CENA \d+/).filter(s => s.trim());
      const actualImageCounts = sceneSections.map(section => {
        const matches = section.match(/📸 \*\*IMAGEM \d+/g);
        return matches ? matches.length : 0;
      });
      
      console.log('🔍 Contagem de imagens por cena:', actualImageCounts);
      console.log('🎯 Esperado:', data.validation?.perSceneCounts || []);
      
      // Check if any scene has fewer images than expected
      const expectedCounts = data.validation?.perSceneCounts || [];
      const hasInconsistency = actualImageCounts.some((count, idx) => 
        count < (expectedCounts[idx] || imagesPerScene)
      );
      
      if (hasInconsistency && data.structured) {
        console.warn('⚠️ Inconsistência detectada. Reconstruindo localmente...');
        
        // Reconstruct from structured data
        finalGuide = data.structured.map((scene: any, idx: number) => {
          const sceneHeader = `**CENA ${idx + 1} (${scene.startTime} - ${scene.endTime}):**\n\n`;
          const images = scene.images.map((img: any, imgIdx: number) => {
            return `📸 **IMAGEM ${imgIdx + 1} (${img.startTime} → ${img.endTime})**
├─ PROMPT: ${scene.visualPrompt}
└─ NARRAÇÃO: ${img.narration}\n`;
          }).join('\n');
          return sceneHeader + images + '\n──────────────────────────────────────\n';
        }).join('\n');
        
        toast({
          title: "Guia Reconstruído",
          description: "Detectamos inconsistência e reconstruímos o guia localmente.",
        });
      }
      
      setResult(finalGuide);
      setValidation(data.validation);
      setStructuredData(data.structured);
      
      await supabase.from('editing_guides').insert({
        video_topic: script.substring(0, 100) || 'Guia de Edição',
        guide_content: finalGuide,
        script: script,
        scene_prompts: scenePrompts,
        srt_content: srtContent || null,
        images_per_scene: imagesPerScene,
        total_duration_seconds: data.totalDuration || null,
        validation_status: data.validation || {},
        ai_model: aiModel,
        user_id: user?.id
      } as any);
      
      await loadHistory();
      toast({
        title: "Guia gerado!",
        description: "O guia de edição foi criado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar guia",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!", description: "Guia copiado para a área de transferência" });
  };

  const handleDownload = (content?: string) => {
    const textContent = content || result;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guia-edicao.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('editing_guides').delete().eq('id', id);
    await loadHistory();
    toast({ title: "Excluído!", description: "Guia removido do histórico" });
  };

  const displayResult = viewingHistory?.guide_content || result;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🎞️ Guia de Edição</h1>
            <p className="text-muted-foreground mt-2">
              Crie uma linha do tempo de edição combinando roteiro com prompts de cena
            </p>
          </div>
          <HelpTooltip 
            description="🎞️ Gere uma timeline detalhada combinando roteiro + prompts de cena + timecodes (SRT opcional) para facilitar a edição do vídeo"
            steps={[
              "Cole o roteiro ou importe o último gerado",
              "Cole os prompts de cena ou importe do histórico",
              "Opcional: Importe SRT para timecodes precisos",
              "Ajuste quantas imagens por cena você precisa",
              "Gere o guia e exporte para usar na edição"
            ]}
          />
        </div>
        <Button variant="outline" onClick={() => setShowManual(true)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Manual Completo
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={loadLatestData} className="gap-2">
            <Zap className="h-4 w-4" />
            ⚡ Importar Últimas Gerações
            <HelpTooltip 
              description="Carrega automaticamente o último roteiro, prompts de cena e SRT do banco de dados para economizar tempo"
            />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Roteiro Completo</label>
          <Textarea
            placeholder="Cole seu roteiro completo aqui..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Prompts de Cena</label>
            <Button variant="outline" size="sm" onClick={handleImportTxt}>
              Importar TXT
            </Button>
          </div>
          <Textarea
            placeholder="Cole os prompts de cena aqui..."
            value={scenePrompts}
            onChange={(e) => setScenePrompts(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">SRT Gerado (Opcional - para timecodes precisos)</label>
            <Button variant="outline" size="sm" onClick={handleImportSrt}>
              Importar SRT
            </Button>
          </div>
          <Textarea
            placeholder="Cole o conteúdo do SRT aqui para usar timecodes exatos..."
            value={srtContent}
            onChange={(e) => setSrtContent(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
          {srtContent && (
            <p className="text-xs text-muted-foreground">
              ✅ SRT carregado - timecodes precisos serão usados
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Imagens por Cena: {imagesPerScene}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={imagesPerScene}
            onChange={(e) => setImagesPerScene(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Total de imagens necessárias: ~{(scenePrompts.match(/---/g) || []).length * imagesPerScene}
          </p>
        </div>

        <AIModelSelector 
          value={aiModel} 
          onChange={setAiModel}
          label="Modelo de IA"
        />

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Guia de Edição
            </>
          )}
        </Button>
      </Card>

      {validation && !viewingHistory && (
        <Card className="p-4 bg-muted/50">
          <h3 className="text-sm font-bold mb-3">📊 Resumo da Geração</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Duração Total</p>
              <p className="font-bold">{validation.totalDuration ? `${Math.floor(validation.totalDuration / 60)}:${(validation.totalDuration % 60).toFixed(0).padStart(2, '0')}` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cenas Detectadas</p>
              <p className="font-bold">{validation.totalScenes || validation.estimatedScenes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Imagens/Cena</p>
              <p className="font-bold">
                {validation.perSceneCounts 
                  ? validation.perSceneCounts.join('/') 
                  : validation.imagesPerScene}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Imagens</p>
              <p className="font-bold">{validation.totalImagesGenerated || validation.totalImagesNeeded}</p>
            </div>
            <div>
              <p className="text-muted-foreground">SRT Usado</p>
              <p className="font-bold">{validation.hasSRT ? '✅ Sim' : '❌ Não'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Palavras Roteiro</p>
              <p className="font-bold">{validation.scriptWordCount}</p>
            </div>
          </div>
        </Card>
      )}

      {displayResult && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{viewingHistory ? 'Visualizando Histórico' : 'Resultado'}</h3>
            <div className="flex gap-2">
              {viewingHistory && (
                <Button variant="outline" size="sm" onClick={() => setViewingHistory(null)}>
                  Fechar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Guia
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload(displayResult)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar .txt
              </Button>
              {!viewingHistory && (
                <Button variant="outline" size="sm" onClick={() => setResult('')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
          <Textarea value={displayResult} readOnly className="min-h-[500px] font-mono text-sm" />
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Guia de Edição</p>
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

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Guia de Edição</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
}
