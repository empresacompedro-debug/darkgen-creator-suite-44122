import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Upload, Download, X, Trash2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserManual } from "@/components/image-generator/UserManual";
import { ModelSelector } from "@/components/image-generator/ModelSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

// Import model names for display
const MODELS = [
  { id: "realvisxl-v4", name: "RealVisXL V4.0" },
  { id: "juggernaut-xl-v9", name: "Juggernaut XL V9" },
  { id: "dreamshaper-xl", name: "DreamShaper XL" },
  { id: "realistic-vision", name: "Realistic Vision V5.1" },
  { id: "dreamlike-photoreal", name: "Dreamlike Photoreal 2.0" },
  { id: "sdxl", name: "Stable Diffusion XL" },
  { id: "sd-21", name: "Stable Diffusion 2.1" },
  { id: "openjourney", name: "OpenJourney" },
  { id: "openjourney-v4", name: "OpenJourney V4" },
  { id: "dreamlike-diffusion", name: "Dreamlike Diffusion" },
  { id: "anything-v5", name: "Anything V5" },
  { id: "anything-v4", name: "Anything V4" },
  { id: "waifu-diffusion", name: "Waifu Diffusion" },
  { id: "redshift-diffusion", name: "Redshift Diffusion" },
  { id: "arcane-diffusion", name: "Arcane Diffusion" },
];

const GeradorImagens = () => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [promptStyle, setPromptStyle] = useState("cinematic");
  const [numImages, setNumImages] = useState(1);
  const [quality, setQuality] = useState("standard");
  const [provider, setProvider] = useState<"pollinations" | "huggingface" | "google">("pollinations");
  const [imageModel, setImageModel] = useState<"pollinations" | "pollinations-flux-realism" | "pollinations-flux-anime" | "pollinations-flux-3d" | "pollinations-turbo" | "nano-banana">("pollinations");
  const [huggingfaceModel, setHuggingfaceModel] = useState("sdxl");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [generatedImages, setGeneratedImages] = useState<Array<{ 
    id?: string;
    url: string; 
    sceneIndex?: number;
  }>>([]);
  const [savedScenePrompts, setSavedScenePrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showScenePromptsDialog, setShowScenePromptsDialog] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadImages();
    loadScenePrompts();
  }, []);

  const loadScenePrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('scene_prompts')
        .select('id, title, prompts, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setSavedScenePrompts(data);
    } catch (error: any) {
      console.error('Erro ao carregar prompts de cena:', error);
    }
  };

  const handleImportScenePrompts = (scenePromptsText: string) => {
    setPrompt(scenePromptsText);
    setShowScenePromptsDialog(false);
    toast({
      title: "Prompts Importados",
      description: "Os prompts de cena foram carregados com sucesso",
    });
  };

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setGeneratedImages(data.map(img => ({
          id: img.id,
          url: img.image_url,
          sceneIndex: typeof img.settings === 'object' && img.settings !== null && 'sceneIndex' in img.settings 
            ? (img.settings as any).sceneIndex 
            : undefined
        })));
      }
    } catch (error: any) {
      console.error('Erro ao carregar imagens:', error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Imagem Removida",
        description: "A imagem foi excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir imagem:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a imagem",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllImages = async () => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setGeneratedImages([]);
      toast({
        title: "Todas as Imagens Removidas",
        description: "Todas as suas imagens foram excluídas permanentemente",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagem-gerada-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Completo",
        description: "A imagem foi baixada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive",
      });
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast({
        title: "Cancelando...",
        description: "A geração de imagens está sendo cancelada.",
      });
    }
  };

  const handleGenerateImages = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Por favor, insira um prompt para gerar imagens.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para gerar imagens.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]);
    abortControllerRef.current = new AbortController();

    // Detectar número de cenas - aceita múltiplos formatos case-insensitive:
    // SCENE 1:, scene 1:, Scene 1:, CENA 1:, Cena 1:, cena 1:
    // [SCENE 1], [Cena 2], ## SCENE 3, ## Cena 4
    
    console.log('=== INÍCIO DA DETECÇÃO DE CENAS ===');
    console.log('📝 Prompt original (primeiros 500 chars):', prompt.substring(0, 500));
    console.log('📏 Tamanho total do prompt:', prompt.length, 'caracteres');
    
    // Primeiro, normalizar quebras de linha
    const normalizedPrompt = prompt.replace(/\r\n/g, '\n');
    console.log('✅ Prompt normalizado (primeiros 500 chars):', normalizedPrompt.substring(0, 500));
    
    // Regex MUITO MAIS PERMISSIVO - aceita qualquer formato com SCENE/CENA + número
    // Captura formatos como: --- SCENE 1: Title ---, SCENE 1:, [SCENE 1], ## SCENE 1, etc
    const sceneRegex = /(?:^|\n).*?(?:scene|cena)\s*\d+/gi;
    
    console.log('🔧 Regex usado:', sceneRegex.source);
    console.log('🔧 Flags do regex:', sceneRegex.flags);
    
    // Teste manual do regex para debug
    console.log('🧪 Testando regex manualmente:');
    const testMatches = normalizedPrompt.match(sceneRegex);
    console.log('   Matches do teste manual:', testMatches);
    console.log('   Quantidade de matches:', testMatches ? testMatches.length : 0);
    
    // Encontrar todas as posições dos marcadores de cena
    const matches = Array.from(normalizedPrompt.matchAll(sceneRegex));
    
    console.log('🔍 Número de matches encontrados:', matches.length);
    if (matches.length > 0) {
      console.log('📍 Matches encontrados:');
      matches.forEach((match, idx) => {
        console.log(`  Match ${idx + 1}:`, {
          texto: match[0],
          posicao: match.index,
          contexto: normalizedPrompt.substring(match.index!, Math.min(match.index! + 100, normalizedPrompt.length))
        });
      });
    } else {
      console.log('⚠️ NENHUM match encontrado! Verificando conteúdo do prompt:');
      console.log('   - Contém "scene"?', normalizedPrompt.toLowerCase().includes('scene'));
      console.log('   - Contém "cena"?', normalizedPrompt.toLowerCase().includes('cena'));
      console.log('   - Primeiras 1000 chars:', normalizedPrompt.substring(0, 1000));
    }
    
    let scenes: string[] = [];
    
    if (matches.length > 0) {
      // Se encontrou marcadores, dividir baseado nas posições
      console.log('🎬 Extraindo cenas...');
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        
        const startPos = currentMatch.index! + currentMatch[0].length;
        const endPos = nextMatch ? nextMatch.index! : normalizedPrompt.length;
        
        const sceneContent = normalizedPrompt.substring(startPos, endPos).trim();
        if (sceneContent.length > 0) {
          scenes.push(sceneContent);
          console.log(`  Cena ${i + 1} extraída (${sceneContent.length} chars):`, sceneContent.substring(0, 100) + '...');
        } else {
          console.log(`  ⚠️ Cena ${i + 1} está vazia!`);
        }
      }
    }
    
    // Se não detectou cenas válidas, trata o prompt inteiro como uma única cena
    if (scenes.length === 0) {
      console.log('⚠️ Nenhuma cena detectada, usando prompt inteiro como cena única');
      scenes.push(normalizedPrompt.trim());
    }
    
    console.log('📊 RESULTADO FINAL:');
    console.log('   - Total de cenas detectadas:', scenes.length);
    console.log('   - Imagens por cena:', numImages);
    console.log('   - Total de imagens a gerar:', scenes.length * numImages);
    console.log('=== FIM DA DETECÇÃO DE CENAS ===');

    // Validação de detecção de cenas
    if (scenes.length === 1 && (prompt.toLowerCase().includes('scene') || prompt.toLowerCase().includes('cena'))) {
      console.warn('⚠️ AVISO: Múltiplas cenas parecem estar no prompt, mas apenas 1 foi detectada.');
      console.warn('Verifique o formato de marcação das cenas. Formatos aceitos:');
      console.warn('- SCENE 1:, SCENE 2:');
      console.warn('- [SCENE 1], [SCENE 2]');
      console.warn('- ## SCENE 1, ## SCENE 2');
      
      toast({
        title: "Aviso de detecção de cenas",
        description: "O sistema detectou apenas 1 cena. Verifique se as cenas estão formatadas corretamente (ex: SCENE 1:, SCENE 2:)",
        variant: "default",
      });
    }
    
    const totalImages = scenes.length * numImages;
    setGenerationProgress({ current: 0, total: totalImages });

    try {
      console.log('Iniciando geração progressiva de imagens...');
      console.log('Modelo:', imageModel);
      console.log('Formato do prompt:', prompt.substring(0, 200) + '...');
      console.log('Cenas detectadas:', scenes.length);
      console.log('Cenas:', scenes.map((s, i) => `Cena ${i+1}: ${s.substring(0, 50)}...`));
      console.log('Imagens por cena:', numImages);
      console.log('Total de imagens:', totalImages);

      const newImages: string[] = [];

      // Loop para cada cena
      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        // Loop para cada imagem da cena
        for (let imgIndex = 0; imgIndex < numImages; imgIndex++) {
          if (abortControllerRef.current?.signal.aborted) {
            console.log('Geração cancelada pelo usuário');
            break;
          }

          try {
            console.log(`Gerando imagem ${imgIndex + 1}/${numImages} da cena ${sceneIndex + 1}/${scenes.length}`);

            // Determinar provider correto baseado no modelo
            let actualProvider = provider;
            let actualModel = provider === "pollinations" ? imageModel : huggingfaceModel;
            
            if (imageModel === "nano-banana") {
              actualProvider = "google";
              actualModel = "nano-banana";
            }

            const { data, error } = await supabase.functions.invoke('generate-images', {
              body: {
                prompt: scenes[sceneIndex],
                aspectRatio,
                provider: actualProvider,
                imageModel: actualModel,
                promptStyle,
                numImages: 1
              }
            });

            if (error) {
              console.error(`Erro na imagem ${imgIndex + 1} da cena ${sceneIndex + 1}:`, error);
              toast({
                title: "Erro parcial",
                description: `Falha ao gerar imagem ${imgIndex + 1} da cena ${sceneIndex + 1}`,
                variant: "destructive",
              });
              continue;
            }

            if (data?.images?.[0]) {
              const imageUrl = data.images[0];
              newImages.push(imageUrl);
              
              // Atualizar galeria imediatamente
              setGeneratedImages(prev => [...prev, { id: undefined, url: imageUrl, sceneIndex: sceneIndex + 1 }]);
              
              // Salvar imagem no banco imediatamente
              try {
                const { data: savedImage, error: dbError } = await supabase
                  .from('generated_images')
                  .insert({
                    user_id: user.id,
                    image_url: imageUrl,
                    prompt: scenes[sceneIndex],
                    settings: {
                      aspectRatio,
                      imageModel,
                      promptStyle,
                      sceneIndex: sceneIndex + 1,
                      imageIndex: imgIndex + 1
                    }
                  })
                  .select('id')
                  .single();
                
                if (!dbError && savedImage) {
                  // Atualizar galeria com ID
                  setGeneratedImages(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0) {
                      updated[lastIndex] = { ...updated[lastIndex], id: savedImage.id };
                    }
                    return updated;
                  });
                }
              } catch (dbError) {
                console.error('Erro ao salvar imagem no banco:', dbError);
              }

              console.log(`Imagem ${imgIndex + 1}/${numImages} da cena ${sceneIndex + 1}/${scenes.length} gerada com sucesso`);
            }

            // Atualizar progresso
            setGenerationProgress(prev => ({
              ...prev,
              current: prev.current + 1
            }));

            // Delay entre requisições (1.5s)
            if (!(sceneIndex === scenes.length - 1 && imgIndex === numImages - 1)) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }

          } catch (error: any) {
            console.error(`Erro ao gerar imagem ${imgIndex + 1} da cena ${sceneIndex + 1}:`, error);
            setGenerationProgress(prev => ({
              ...prev,
              current: prev.current + 1
            }));
          }
        }

        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
      }

      if (abortControllerRef.current?.signal.aborted) {
        toast({
          title: "Geração cancelada",
          description: `${newImages.length} de ${totalImages} imagens foram geradas antes do cancelamento.`,
        });
      } else {
        toast({
          title: "Imagens geradas!",
          description: `${newImages.length} de ${totalImages} imagens geradas com sucesso!`,
        });
      }

    } catch (error: any) {
      console.error('Erro ao gerar imagens:', error);
      toast({
        title: "Erro ao gerar imagens",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setGenerationProgress({ current: 0, total: 0 });
      abortControllerRef.current = null;
    }
  };

  const handleLoadBatch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPrompt(text);
        toast({
          title: "Arquivo Carregado",
          description: "Prompts carregados com sucesso",
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">🎨 Gerador de Imagens</h1>
          <p className="text-muted-foreground text-lg">
            Crie imagens incríveis usando IA - Geração progressiva com feedback em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScenePromptsDialog(true)}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Importar Prompts de Cena
          </Button>
          <Button variant="outline" onClick={() => setShowManual(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Manual Completo
          </Button>
        </div>
      </div>

      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Principal</Label>
            <Textarea 
              id="prompt" 
              placeholder="Descreva a imagem que deseja gerar..." 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              className="min-h-[120px]" 
            />
            <div className="flex gap-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Upload className="h-4 w-4" />
                  Carregar Prompts em Lote (.txt)
                </div>
                <input id="file-upload" type="file" accept=".txt" onChange={handleLoadBatch} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Opções Avançadas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={provider} onValueChange={(value: any) => {
                  setProvider(value);
                  // Auto-select appropriate model when changing provider
                  if (value === "google") setImageModel("nano-banana");
                  else if (value === "pollinations") setImageModel("pollinations");
                  else if (value === "huggingface") setHuggingfaceModel("flux-schnell");
                }}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google AI - Nano Banana 🍌</SelectItem>
                    <SelectItem value="pollinations">Pollinations.ai (Gratuito)</SelectItem>
                    <SelectItem value="huggingface">HuggingFace (Premium)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {provider === "google"
                    ? "🍌 Google Gemini 2.5 Flash Image - Requer chave API"
                    : provider === "pollinations" 
                    ? "✨ 100% gratuito, sem configuração" 
                    : "🚀 Modelos premium - Requer API key"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo de Geração</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowModelSelector(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {provider === "google"
                    ? "Nano Banana 🍌"
                    : provider === "pollinations" 
                    ? imageModel === "pollinations" ? "Flux (Padrão)" 
                    : imageModel === "pollinations-flux-realism" ? "Flux Realism"
                    : imageModel === "pollinations-flux-anime" ? "Flux Anime"
                    : imageModel === "pollinations-flux-3d" ? "Flux 3D"
                    : imageModel === "nano-banana" ? "Nano Banana 🍌"
                    : "Turbo (Rápido)"
                    : MODELS.find(m => m.id === huggingfaceModel)?.name || huggingfaceModel
                  }
                </Button>
                <p className="text-xs text-muted-foreground">
                  Clique para ver todos os modelos disponíveis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Proporção</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspectRatio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">Paisagem 16:9</SelectItem>
                    <SelectItem value="9:16">Vertical 9:16</SelectItem>
                    <SelectItem value="1:1">Quadrado 1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promptStyle">Estilo do Prompt</Label>
                <Select value={promptStyle} onValueChange={setPromptStyle}>
                  <SelectTrigger id="promptStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Padrão)</SelectItem>
                    <SelectItem value="realistic">Realismo</SelectItem>
                    <SelectItem value="hyper-realistic">Hiper-realista</SelectItem>
                    <SelectItem value="photo-8k">Fotografia 8K</SelectItem>
                    <SelectItem value="cinematic">Estilo Cinemático</SelectItem>
                    <SelectItem value="sharp-focus">Foco Nítido</SelectItem>
                    <SelectItem value="digital-art">Arte Digital</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numImages">Nº de Imagens por Cena</Label>
                <Input 
                  id="numImages" 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={numImages} 
                  onChange={(e) => setNumImages(parseInt(e.target.value) || 1)} 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerateImages} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Gerar Imagens
                </>
              )}
            </Button>
            {isLoading && (
              <Button onClick={handleCancelGeneration} variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Gerando imagens... {generationProgress.current}/{generationProgress.total}
                </p>
              </div>
              <Progress value={(generationProgress.current / generationProgress.total) * 100} />
            </div>
          )}
        </div>
      </Card>

      {generatedImages.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Imagens Geradas ({generatedImages.length})</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Apagar Todas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente todas as {generatedImages.length} imagens.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllImages}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, apagar todas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedImages.map((image, idx) => (
              <div key={idx} className="relative group">
                <img src={image.url} alt={`Gerada ${idx + 1}`} className="w-full rounded-lg" />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="secondary"
                    onClick={() => handleDownloadImage(image.url, idx)}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                     <Button 
                       size="icon" 
                       variant="destructive"
                       onClick={() => handleDeleteImage(image.id!)}
                       disabled={!image.id}
                       className="h-8 w-8"
                     >
                       <X className="h-4 w-4" />
                     </Button>
                </div>
                {image.sceneIndex && (
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Cena {image.sceneIndex}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Gerador de Imagens</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>

      <Dialog open={showScenePromptsDialog} onOpenChange={setShowScenePromptsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar Prompts de Cena Salvos</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {savedScenePrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum prompt de cena salvo encontrado.</p>
                <p className="text-sm mt-2">Crie prompts de cena na ferramenta "Prompts para Cenas" primeiro.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScenePrompts.map((scenePrompt) => (
                  <Card 
                    key={scenePrompt.id} 
                    className="p-4 hover:border-primary cursor-pointer transition-colors" 
                    onClick={() => handleImportScenePrompts(scenePrompt.prompts)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {scenePrompt.title || 'Sem título'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(scenePrompt.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {scenePrompt.prompts.substring(0, 200)}...
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Importar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Model Selector Dialog */}
      <Dialog open={showModelSelector} onOpenChange={setShowModelSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Modelo de Geração</DialogTitle>
          </DialogHeader>
          <ModelSelector
            value={provider === "pollinations" ? imageModel : huggingfaceModel}
            onChange={(value) => {
              if (provider === "pollinations") {
                setImageModel(value as any);
              } else {
                setHuggingfaceModel(value);
              }
              setShowModelSelector(false);
            }}
            provider={provider}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeradorImagens;
