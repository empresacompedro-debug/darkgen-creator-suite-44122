import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Loader2, Download, Trash2, History, Search as SearchIcon, X, Eye, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ThumbnailExtractor from "@/components/thumbnail/ThumbnailExtractor";
import { ExtractedThumbnail, urlToBase64 } from "@/lib/youtubeUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserManual } from "@/components/thumbnail-prompt/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

const PromptsThumbnail = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'prompts' | 'extraction' | 'modeling'>('prompts');
  
  // Prompts generation states (Tab 1)
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [platform, setPlatform] = useState("midjourney");
  const [language, setLanguage] = useState("pt");
  const [includePhrase, setIncludePhrase] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  // Modeling states (Tab 3)
  const [competitorImages, setCompetitorImages] = useState<ExtractedThumbnail[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [modelingLevel, setModelingLevel] = useState<'identical' | 'similar' | 'concept'>('similar');
  const [includeText, setIncludeText] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [modelingQuantity, setModelingQuantity] = useState(2);
  const [imageGenerator, setImageGenerator] = useState('lovable-ai');
  const [isModeling, setIsModeling] = useState(false);
  const [modelingResults, setModelingResults] = useState<any>(null);
  const [modelingHistory, setModelingHistory] = useState<any[]>([]);
  const [currentModelingIndex, setCurrentModelingIndex] = useState(0);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'modeling') {
      loadModelingHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('thumbnail_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadModelingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('thumbnail_modelings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setModelingHistory(data || []);
    } catch (error: any) {
      console.error('Error loading modeling history:', error);
    }
  };

  const deleteModelingItem = async (id: string) => {
    try {
      const { error } = await supabase.from('thumbnail_modelings').delete().eq('id', id);
      if (error) throw error;
      await loadModelingHistory();
      toast({ title: 'Excluído', description: 'Item removido do histórico' });
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' });
    }
  };

  const deleteAllModeling = async () => {
    try {
      if (!user?.id) return;
      const { error } = await supabase.from('thumbnail_modelings').delete().eq('user_id', user.id);
      if (error) throw error;
      await loadModelingHistory();
      toast({ title: 'Histórico limpo', description: 'Todos os itens foram removidos' });
    } catch (e: any) {
      toast({ title: 'Erro ao excluir tudo', description: e.message, variant: 'destructive' });
    }
  };
  const handleGeneratePrompt = async () => {
    if (!videoTitle.trim()) {
      toast({
        title: "Erro",
        description: "Digite o título do vídeo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-thumbnail-prompt', {
        body: { videoTitle, platform, language, includePhrase, aiModel }
      });

      if (error) throw error;

      const prompt = data.prompt || "";
      setGeneratedPrompt(prompt);

      await supabase.from('thumbnail_prompts').insert({
        video_title: videoTitle,
        prompt,
        ai_model: aiModel,
        user_id: user?.id
      });

      await loadHistory();

      toast({
        title: "Prompt Gerado!",
        description: "O prompt de thumbnail foi criado e salvo com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar prompt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const { error } = await supabase.from('thumbnail_prompts').delete().eq('id', id);
      if (error) throw error;
      await loadHistory();
      toast({ title: "Prompt excluído com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleDownloadPrompt = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${title}.txt`;
    a.click();
  };

  const handleSendToModeling = (thumbnails: ExtractedThumbnail[]) => {
    setCompetitorImages(thumbnails);
    setUploadedImages([]);
    setActiveTab('modeling');
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: "Formato Inválido",
          description: `${file.name}: Use JPG, PNG ou WebP`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "Arquivo Muito Grande",
          description: `${file.name}: Máximo 5MB`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...validFiles]);
      setCompetitorImages([]);
      toast({
        title: "✅ Imagens Carregadas",
        description: `${validFiles.length} imagem(ns) adicionada(s)`,
      });
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleModelThumbnails = async () => {
    const totalImages = competitorImages.length + uploadedImages.length;
    
    if (totalImages === 0) {
      toast({
        title: "Erro",
        description: "Adicione imagens para modelar (extraídas do YouTube ou upload direto)",
        variant: "destructive",
      });
      return;
    }

    setIsModeling(true);
    setModelingResults(null);
    setCurrentModelingIndex(0);

    const allResults: any[] = [];

    // Processar thumbnails extraídas do YouTube
    for (let i = 0; i < competitorImages.length; i++) {
      const thumbnail = competitorImages[i];
      setCurrentModelingIndex(i + 1);

      toast({
        title: `Modelando ${i + 1}/${totalImages}`,
        description: thumbnail.title.substring(0, 50),
      });

      try {
        const imageBase64 = thumbnail.base64 || await urlToBase64(thumbnail.thumbnailUrl);

        const { data, error } = await supabase.functions.invoke('analyze-and-model-thumbnail', {
          body: {
            imageBase64,
            modelingLevel,
            includeText,
            customText,
            customInstructions,
            quantity: modelingQuantity,
            imageGenerator,
          }
        });

        if (error) throw error;

        allResults.push({
          original: { type: 'youtube', data: thumbnail },
          analysis: data.analysis,
          generatedImages: data.generatedImages
        });

        // Salvar histórico
        await supabase.from('thumbnail_modelings').insert({
          original_image_url: imageBase64.substring(0, 500),
          modeling_level: modelingLevel,
          include_text: includeText,
          custom_instructions: customInstructions,
          quantity: modelingQuantity,
          image_generator: imageGenerator,
          generated_images: data.generatedImages,
          ai_analysis: data.analysis,
          ai_model: 'google/gemini-2.5-flash',
          user_id: user?.id
        });

      } catch (error: any) {
        console.error(`Error modeling thumbnail ${i + 1}:`, error);
        allResults.push({
          original: { type: 'youtube', data: thumbnail },
          error: error.message
        });
      }
    }

    // Processar imagens carregadas
    for (let i = 0; i < uploadedImages.length; i++) {
      const file = uploadedImages[i];
      const currentIndex = competitorImages.length + i + 1;
      setCurrentModelingIndex(currentIndex);

      toast({
        title: `Modelando ${currentIndex}/${totalImages}`,
        description: file.name.substring(0, 50),
      });

      try {
        const imageBase64 = await fileToBase64(file);

        const { data, error } = await supabase.functions.invoke('analyze-and-model-thumbnail', {
          body: {
            imageBase64,
            modelingLevel,
            includeText,
            customText,
            customInstructions,
            quantity: modelingQuantity,
            imageGenerator,
          }
        });

        if (error) throw error;

        allResults.push({
          original: { type: 'upload', data: file, preview: imageBase64 },
          analysis: data.analysis,
          generatedImages: data.generatedImages
        });

        // Salvar histórico
        await supabase.from('thumbnail_modelings').insert({
          original_image_url: imageBase64.substring(0, 500),
          modeling_level: modelingLevel,
          include_text: includeText,
          custom_instructions: customInstructions,
          quantity: modelingQuantity,
          image_generator: imageGenerator,
          generated_images: data.generatedImages,
          ai_analysis: data.analysis,
          ai_model: 'google/gemini-2.5-flash',
          user_id: user?.id
        });

      } catch (error: any) {
        console.error(`Error modeling uploaded image ${i + 1}:`, error);
        allResults.push({
          original: { type: 'upload', data: file },
          error: error.message
        });
      }
    }

    setModelingResults({ results: allResults });
    setIsModeling(false);
    await loadModelingHistory();

    const successCount = allResults.filter(r => !r.error).length;
    toast({
      title: "✅ Modelagem Concluída!",
      description: `${successCount}/${totalImages} thumbnail(s) modelada(s) com sucesso`,
      duration: 5000,
    });
  };

  const downloadModeledImage = (imageUrl: string, index: number, originalName: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `thumbnail-modelada-${originalName.substring(0, 20)}-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: "Download Completo",
      description: `Imagem ${index + 1} baixada`
    });
  };

  const getOriginalImagePreview = (result: any) => {
    if (result.original.type === 'youtube') {
      return result.original.data.thumbnailUrl;
    } else if (result.original.type === 'upload') {
      return result.original.preview || URL.createObjectURL(result.original.data);
    }
    return '';
  };

  const getOriginalImageTitle = (result: any) => {
    if (result.original.type === 'youtube') {
      return result.original.data.title;
    } else if (result.original.type === 'upload') {
      return result.original.data.name;
    }
    return 'Imagem';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">🖼️ Prompts de Thumbnail</h1>
          <p className="text-muted-foreground text-lg">
            Gere prompts e modele thumbnails de concorrentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManual(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Manual Completo
          </Button>
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Ocultar' : 'Ver'} Histórico
          </Button>
        </div>
      </div>

      {showHistory && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Histórico de Prompts</h2>
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold">{item.video_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setGeneratedPrompt(item.prompt)}>
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPrompt(item.prompt, item.video_title)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeletePrompt(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">Geração de Prompts</TabsTrigger>
          <TabsTrigger value="extraction">🔍 Extração de Thumbnails</TabsTrigger>
          <TabsTrigger value="modeling">🎨 Modelagem</TabsTrigger>
        </TabsList>

        {/* TAB 1: Geração de Prompts */}
        <TabsContent value="prompts">
          <Card className="p-6 shadow-medium">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoTitle">Título do Vídeo</Label>
                <Input id="videoTitle" placeholder="Digite o título do vídeo" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma de Imagem</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midjourney">Midjourney</SelectItem>
                      <SelectItem value="dall-e-3">Dall-E 3</SelectItem>
                      <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                      <SelectItem value="leonardo">Leonardo.AI</SelectItem>
                      <SelectItem value="ideogram">Ideogram</SelectItem>
                      <SelectItem value="image-fx">Image-FX</SelectItem>
                      <SelectItem value="whisk">Whisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma do Texto na Imagem</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português BR</SelectItem>
                      <SelectItem value="en">English US</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="pl">Polski</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="includePhrase" checked={includePhrase} onCheckedChange={(checked) => setIncludePhrase(!!checked)} />
                <label htmlFor="includePhrase" className="text-sm">Incluir frase na imagem</label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Modelo de IA</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger id="ai-model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                    <SelectItem value="claude-sonnet-3.5">Claude Sonnet 3.5</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGeneratePrompt} disabled={isLoading} className="w-full">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Gerando Prompt...</> : <><ImageIcon className="h-4 w-4 mr-2" />Gerar Prompts</>}
              </Button>
            </div>
          </Card>

          {generatedPrompt && (
            <Card className="p-6 shadow-soft mt-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Prompt Gerado</h2>
              <Textarea value={generatedPrompt} readOnly className="min-h-[200px] font-mono text-sm" />
              <Button onClick={() => handleDownloadPrompt(generatedPrompt, videoTitle)} className="mt-4">
                <Download className="h-4 w-4 mr-2" />Baixar Prompt
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: Extração de Thumbnails */}
        <TabsContent value="extraction">
          <Card className="p-6">
            <ThumbnailExtractor onSendToModeling={handleSendToModeling} />
          </Card>
        </TabsContent>

        {/* TAB 3: Modelagem */}
        <TabsContent value="modeling">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Upload de Imagens */}
              <div className="space-y-3">
                <Label>Adicionar Thumbnails para Modelar</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    uploadedImages.length > 0 || competitorImages.length > 0
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary hover:bg-accent/5'
                  }`}
                  onClick={() => document.getElementById('upload-images')?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImageUpload(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Arraste imagens ou clique para selecionar</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG ou WebP (máx 5MB por imagem)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode adicionar múltiplas imagens de uma vez
                  </p>
                </div>
                <input
                  id="upload-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </div>

              {/* Imagens Carregadas via Upload */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Imagens Carregadas ({uploadedImages.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedImages([])}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Todas
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {uploadedImages.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full rounded-lg shadow-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(idx);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thumbnails Extraídas do YouTube */}
              {competitorImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Thumbnails do YouTube ({competitorImages.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompetitorImages([])}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {competitorImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.thumbnailUrl}
                          alt={img.title}
                          className="w-full rounded-lg shadow-md"
                        />
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {img.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de Modelagem</Label>
                  <Select value={modelingLevel} onValueChange={(v: any) => setModelingLevel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identical">🎯 Idêntica - Cópia Exata</SelectItem>
                      <SelectItem value="similar">🎨 Parecida - Mesma Essência</SelectItem>
                      <SelectItem value="concept">💡 Conceito - Mesma Ideia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {modelingLevel === 'identical' && 'Replica exatamente cores, layout e fontes'}
                    {modelingLevel === 'similar' && 'Mantém o estilo mas varia detalhes'}
                    {modelingLevel === 'concept' && 'Captura a ideia e recria de forma diferente'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Gerador de Imagem</Label>
                  <Select value={imageGenerator} onValueChange={setImageGenerator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable-ai">Lovable AI ⭐ (Recomendado)</SelectItem>
                      <SelectItem value="nano-banana">Nano Banana 🍌</SelectItem>
                      <SelectItem value="whisk">Whisk (Requer Cookie)</SelectItem>
                      <SelectItem value="imagefx">ImageFX (Requer Cookie)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Todos os geradores suportam modelagem idêntica, parecida e conceitual
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Variações por Thumbnail</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={modelingQuantity}
                    onChange={(e) => setModelingQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-text"
                      checked={includeText}
                      onCheckedChange={(checked) => {
                        setIncludeText(checked as boolean);
                        if (!checked) setCustomText('');
                      }}
                    />
                    <Label htmlFor="include-text" className="cursor-pointer">
                      Incluir texto na imagem
                    </Label>
                  </div>

                  {includeText && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="custom-text" className="text-sm">
                        Texto para incluir (usa mesma fonte/estilo da thumbnail)
                      </Label>
                      <Input
                        id="custom-text"
                        placeholder="Ex: CLIQUE AQUI, IMPERDÍVEL, REVELADO..."
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Deixe em branco para manter texto original
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instruções Customizadas (Opcional)</Label>
                <Textarea
                  placeholder="Ex: Usar cores mais quentes, adicionar sombras dramáticas, estilo cartoon..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleModelThumbnails}
                disabled={isModeling || (competitorImages.length === 0 && uploadedImages.length === 0)}
                className="w-full"
                size="lg"
              >
                {isModeling ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Modelando {currentModelingIndex}/{competitorImages.length + uploadedImages.length}...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 mr-2" />
                    🎨 Gerar Variações ({competitorImages.length + uploadedImages.length} {competitorImages.length + uploadedImages.length === 1 ? 'imagem' : 'imagens'})
                  </>
                )}
              </Button>

              {/* Resultados */}
              {modelingResults && (
                <div className="space-y-8 pt-6 border-t">
                  {modelingResults.results.map((result: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={getOriginalImagePreview(result)}
                          className="w-32 h-18 object-cover rounded-lg shadow-md"
                          alt="Original"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {getOriginalImageTitle(result)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.error ? `❌ Erro: ${result.error}` : `✅ ${result.generatedImages?.length || 0} variações geradas`}
                          </p>
                        </div>
                      </div>

                      {result.analysis && (
                        <Card className="p-4 bg-muted">
                          <details>
                            <summary className="cursor-pointer font-medium">
                              Ver Análise da IA
                            </summary>
                            <pre className="text-xs whitespace-pre-wrap mt-2 overflow-auto max-h-48">
                              {result.analysis}
                            </pre>
                          </details>
                        </Card>
                      )}

                      {result.generatedImages && result.generatedImages.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.generatedImages.map((img: string, imgIdx: number) => (
                            <Card key={imgIdx} className="p-4 space-y-3">
                              <img
                                src={img}
                                alt={`Variação ${imgIdx + 1}`}
                                className="w-full rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => downloadModeledImage(img, imgIdx, getOriginalImageTitle(result))}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Variação {imgIdx + 1}
                              </Button>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Histórico */}
              {modelingHistory.length > 0 && (
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Histórico Recente</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Tudo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir todo o histórico?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Todas as modelagens salvas serão removidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteAllModeling}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="space-y-3">
                    {modelingHistory.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            {Array.isArray(item.generated_images) && item.generated_images?.length > 0 ? (
                              <img src={item.generated_images[0]} alt="preview" className="w-20 h-14 object-cover rounded" />
                            ) : (
                              <div className="w-20 h-14 rounded bg-muted" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {item.quantity} variações • {item.modeling_level} • {item.image_generator}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setPreviewItem(item); setIsPreviewOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" /> Ver
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteModelingItem(item.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Imagens Geradas</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(previewItem?.generated_images) && previewItem?.generated_images?.map((img: string, idx: number) => (
                          <Card key={idx} className="p-3 space-y-3">
                            <img src={img} alt={`Imagem ${idx + 1}`} className="w-full rounded" />
                            <Button size="sm" variant="outline" className="w-full" onClick={() => downloadModeledImage(img, idx, 'historico')}>
                              <Download className="h-4 w-4 mr-2" /> Baixar {idx + 1}
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Completo - Prompts de Thumbnail</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsThumbnail;
