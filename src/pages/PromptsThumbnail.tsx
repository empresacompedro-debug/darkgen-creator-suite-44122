import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Loader2, Download, Trash2, History, X, Eye, BookOpen, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ThumbnailExtractor from "@/components/thumbnail/ThumbnailExtractor";
import { ExtractedThumbnail, urlToBase64 } from "@/lib/youtubeUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserManual } from "@/components/thumbnail-prompt/UserManual";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { Switch } from "@/components/ui/switch";

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

  // NOVO: Estados para o sistema de 2 passos (Tab 3)
  const [competitorImages, setCompetitorImages] = useState<ExtractedThumbnail[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [modelingLevel, setModelingLevel] = useState<'identical' | 'similar' | 'concept'>('similar');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedAIModel, setSelectedAIModel] = useState("gemini-2.5-flash");
  
  // PASSO 1: Análise com streaming
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedPrompt, setAnalyzedPrompt] = useState('');
  const [promptWithText, setPromptWithText] = useState('');
  const [promptWithoutText, setPromptWithoutText] = useState('');
  const [promptMetadata, setPromptMetadata] = useState<any>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [includeTextMode, setIncludeTextMode] = useState(true);
  const [desiredText, setDesiredText] = useState(''); // Texto que o usuário quer na imagem
  
  // PASSO 2: Geração
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'huggingface' | 'pollinations'>('pollinations');
  const [selectedModel, setSelectedModel] = useState('pollinations');
  const [generationQuantity, setGenerationQuantity] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Resultados e histórico
  const [modelingResults, setModelingResults] = useState<string[]>([]);
  const [modelingHistory, setModelingHistory] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
    const maxSize = 5 * 1024 * 1024;

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

  // ========== PASSO 1: ANÁLISE COM STREAMING ==========
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "Erro",
        description: "Selecione uma imagem para analisar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalyzedPrompt('');
    setPromptWithText('');
    setPromptWithoutText('');
    setPromptMetadata(null);
    setAnalysisComplete(false);
    setModelingResults([]);

    // Criar AbortController para poder cancelar
    const controller = new AbortController();
    setAbortController(controller);
    
    // Timeout de 60 segundos
    const timeoutId = setTimeout(() => {
      controller.abort();
      toast({
        title: '⏱️ Timeout',
        description: 'A análise demorou muito. Tente novamente.',
        variant: 'destructive'
      });
    }, 60000);

    try {
      let imageBase64 = '';
      
      if (selectedImage.type === 'youtube') {
        imageBase64 = selectedImage.data.base64 || await urlToBase64(selectedImage.data.thumbnailUrl);
      } else {
        imageBase64 = await fileToBase64(selectedImage.data);
      }

      console.log('🔍 [Frontend] Starting streaming analysis...');
      
      // Obter o token da sessão do usuário autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        throw new Error('Usuário não autenticado');
      }
      
      // Mostrar toast de início
      toast({
        title: '🔍 Analisando...',
        description: 'Conectando ao modelo de IA...'
      });
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-thumbnail-streaming`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64,
          modelingLevel,
          aiModel: selectedAIModel,
          customInstructions,
          includeText: includeTextMode,
          desiredText: desiredText.trim() // Passar o texto desejado
        }),
        signal: controller.signal // Adicionar signal para cancelamento
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        console.error('❌ [Frontend] HTTP Error:', response.status, errorText);
        throw new Error(`Erro ao analisar imagem: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ [Frontend] Stream connection established');

      // Ler streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullPromptText = ''; // Acumular todo o texto aqui localmente
      let receivedFirstChunk = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ [Frontend] Stream finished');
          break;
        }
        
        if (!receivedFirstChunk) {
          receivedFirstChunk = true;
          console.log('📦 [Frontend] First chunk received');
          toast({
            title: '📡 Recebendo dados...',
            description: 'Streaming iniciado com sucesso'
          });
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]') {
              clearTimeout(timeoutId);
              setAnalysisComplete(true);
              setIsAnalyzing(false);
              setAbortController(null);
              
              console.log('✅ [Frontend] Analysis complete. Total text length:', fullPromptText.length);
              
              // Tentar fazer parse do JSON do texto completo acumulado
              try {
                const jsonMatch = fullPromptText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  setPromptWithText(parsed.prompt_com_texto || '');
                  setPromptWithoutText(parsed.prompt_sem_texto || '');
                  setPromptMetadata(parsed.metadata || null);
                  
                  toast({
                    title: '✅ Análise Concluída!',
                    description: 'Prompts estruturados gerados com sucesso.'
                  });
                } else {
                  console.warn('⚠️ [Frontend] No JSON found in response');
                  toast({
                    title: '✅ Análise Concluída!',
                    description: 'Prompt gerado com sucesso.'
                  });
                }
              } catch (e) {
                console.error('❌ [Frontend] Error parsing JSON:', e);
                toast({
                  title: '✅ Análise Concluída!',
                  description: 'Prompt gerado (formato não estruturado).'
                });
              }
              
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                fullPromptText += data.text; // Acumular aqui
                setAnalyzedPrompt(prev => prev + data.text);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.log('🛑 [Frontend] Analysis canceled by user');
        toast({
          title: '⏸️ Análise Cancelada',
          description: 'A geração do prompt foi interrompida.'
        });
      } else {
        console.error('❌ [Frontend] Analysis error:', error);
        
        let errorMessage = error.message;
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        } else if (errorMessage.includes('500')) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
        } else if (!errorMessage) {
          errorMessage = 'Erro desconhecido. Verifique sua conexão.';
        }
        
        toast({
          title: 'Erro na Análise',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
    }
  };

  // Função para cancelar a análise
  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsAnalyzing(false);
    }
  };

  // ========== PASSO 2: GERAR VARIAÇÕES ==========
  const handleGenerateVariations = async () => {
    setIsGenerating(true);

    try {
      console.log('🎨 [Frontend] Starting generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-thumbnail-variations', {
        body: {
          prompt: analyzedPrompt,
          provider: selectedProvider,
          model: selectedModel,
          quantity: generationQuantity
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao gerar imagens');

      console.log(`✅ [Frontend] Generated ${data.generatedImages.length} images`);

      // Obter preview da imagem original
      let originalImageUrl = '';
      if (selectedImage.type === 'youtube') {
        originalImageUrl = selectedImage.data.base64 || await urlToBase64(selectedImage.data.thumbnailUrl);
      } else {
        originalImageUrl = await fileToBase64(selectedImage.data);
      }

      // Salvar no histórico
      await supabase.from('thumbnail_modelings').insert({
        original_image_url: originalImageUrl.substring(0, 500),
        modeling_level: modelingLevel,
        custom_instructions: customInstructions,
        quantity: generationQuantity,
        image_generator: selectedProvider,
        generated_images: data.generatedImages,
        ai_analysis: analyzedPrompt.substring(0, 5000),
        ai_model: selectedAIModel,
        user_id: user?.id
      });

      setModelingResults(data.generatedImages);
      setShowGenerationDialog(false);
      await loadModelingHistory();

      toast({
        title: '🎉 Variações Geradas!',
        description: `${data.generatedImages.length} imagens criadas com sucesso`
      });

    } catch (error: any) {
      console.error('❌ [Frontend] Generation error:', error);
      toast({
        title: 'Erro na Geração',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadModeledImage = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `thumbnail-modelada-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: "Download Completo",
      description: `Imagem ${index + 1} baixada`
    });
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(analyzedPrompt);
    toast({ title: '📋 Prompt copiado!' });
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
            Ver Manual
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
          <TabsTrigger value="extraction">🔍 Extração</TabsTrigger>
          <TabsTrigger value="modeling">🎨 Modelagem 2.0</TabsTrigger>
        </TabsList>

        {/* TAB 1: Geração de Prompts */}
        <TabsContent value="prompts">
          <Card className="p-6 shadow-medium">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoTitle">Título do Vídeo</Label>
                <Input id="videoTitle" placeholder="Digite o título do vídeo" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midjourney">Midjourney</SelectItem>
                      <SelectItem value="dalle">DALL-E</SelectItem>
                      <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modelo de IA</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGeneratePrompt} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  '✨ Gerar Prompt'
                )}
              </Button>

              {generatedPrompt && (
                <div className="space-y-2">
                  <Label>Prompt Gerado</Label>
                  <Textarea value={generatedPrompt} readOnly className="min-h-[200px]" />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: Extração */}
        <TabsContent value="extraction">
          <Card className="p-6">
            <ThumbnailExtractor onSendToModeling={handleSendToModeling} />
          </Card>
        </TabsContent>

        {/* TAB 3: MODELAGEM 2.0 COM STREAMING */}
        <TabsContent value="modeling">
          <SubscriptionGuard toolName="Modelagem de Thumbnails">
            <div className="space-y-6">
              {/* PASSO 1: Análise com Streaming */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Passo 1: Analisar Imagem
                </h3>

                {/* Upload ou thumbnails extraídas */}
                <div className="mb-6">
                  <Label className="mb-2 block">Fonte da Imagem</Label>
                  
                  {competitorImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {competitorImages.length} thumbnail(s) extraída(s)
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {competitorImages.map((thumb, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedImage({ type: 'youtube', data: thumb })}
                            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage?.type === 'youtube' && selectedImage.data === thumb
                                ? 'border-primary ring-2 ring-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <img src={thumb.thumbnailUrl} alt={thumb.title} className="w-full h-24 object-cover" />
                            <p className="text-xs p-2 truncate">{thumb.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {uploadedImages.length} imagem(ns) carregada(s)
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {uploadedImages.map((file, idx) => (
                          <div key={idx} className="relative">
                            <div
                              onClick={() => setSelectedImage({ type: 'upload', data: file })}
                              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage?.type === 'upload' && selectedImage.data === file
                                  ? 'border-primary ring-2 ring-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={file.name}
                                className="w-full h-24 object-cover"
                              />
                              <p className="text-xs p-2 truncate">{file.name}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadedImage(idx);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <label className="flex-1">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="cursor-pointer"
                      />
                    </label>
                    {(competitorImages.length > 0 || uploadedImages.length > 0) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCompetitorImages([]);
                          setUploadedImages([]);
                          setSelectedImage(null);
                        }}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Nível de Modelagem</Label>
                    <Select value={modelingLevel} onValueChange={(v: any) => setModelingLevel(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="identical">🎯 Idêntico (cópia fiel)</SelectItem>
                        <SelectItem value="similar">🎨 Similar (mesmo estilo)</SelectItem>
                        <SelectItem value="concept">💡 Conceito (reimaginação)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo de IA para Análise</Label>
                    <Select value={selectedAIModel} onValueChange={setSelectedAIModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido)</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Melhor)</SelectItem>
                        <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                        <SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label>Instruções Personalizadas (Opcional)</Label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Ex: Adicione mais contraste, use cores vibrantes, destaque o texto..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* NOVO: Toggle para modo com/sem texto */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">
                      {includeTextMode ? "📝 Modo: Com Texto" : "🚫 Modo: Sem Texto"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {includeTextMode 
                        ? "O prompt incluirá descrição de qualquer texto presente na imagem" 
                        : "O prompt ignorará qualquer texto visível na imagem"
                      }
                    </p>
                  </div>
                  <Switch 
                    checked={includeTextMode} 
                    onCheckedChange={setIncludeTextMode}
                    disabled={isAnalyzing}
                  />
                </div>

                {/* Campo de texto desejado (aparece apenas no modo Com Texto) */}
                {includeTextMode && (
                  <div className="space-y-2 mb-4">
                    <Label>Texto Desejado na Imagem (Opcional)</Label>
                    <Input
                      value={desiredText}
                      onChange={(e) => setDesiredText(e.target.value)}
                      placeholder='Ex: "SEGREDOS DO EGITO" ou "TOP 10 FATOS"'
                      disabled={isAnalyzing}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Digite o texto que você quer que apareça na thumbnail gerada
                    </p>
                  </div>
                )}

                {/* Botão de análise */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing || !selectedImage}
                    className="flex-1"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      '🔍 Analisar Imagem e Gerar Prompt'
                    )}
                  </Button>
                  
                  {isAnalyzing && (
                    <Button 
                      onClick={handleCancelAnalysis}
                      variant="destructive"
                      size="lg"
                      className="px-8"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>

                {/* Área de streaming e exibição dos prompts estruturados */}
                {(isAnalyzing || analyzedPrompt || promptWithText || promptWithoutText) && (
                  <Card className="p-4 bg-muted">
                    {isAnalyzing ? (
                      // Modo streaming - mostra o raw
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <Label className="text-sm font-semibold">
                            Gerando Análise Estruturada em Tempo Real...
                          </Label>
                        </div>
                        
                        <Textarea
                          value={analyzedPrompt}
                          placeholder="A análise aparecerá aqui em tempo real..."
                          className="min-h-[200px] font-mono text-xs"
                          disabled
                        />
                        
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                          <span>⏳ Aguarde enquanto a IA analisa sua imagem...</span>
                          <span className="text-primary font-mono">{analyzedPrompt.length} caracteres</span>
                        </div>
                      </>
                    ) : (
                      // Modo completo - mostra os prompts estruturados em abas
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-semibold">✅ Análise Concluída</Label>
                        </div>

                        {(promptWithText || promptWithoutText) ? (
                          // Se temos prompts estruturados
                          <Tabs defaultValue="with-text" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="with-text">📝 Com Texto</TabsTrigger>
                              <TabsTrigger value="without-text">🚫 Sem Texto</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="with-text" className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm text-muted-foreground">
                                  Prompt com descrição de texto
                                </Label>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(promptWithText);
                                    toast({ title: '📋 Prompt (com texto) copiado!' });
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                              <Textarea
                                value={promptWithText}
                                onChange={(e) => setPromptWithText(e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                              />
                            </TabsContent>
                            
                            <TabsContent value="without-text" className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm text-muted-foreground">
                                  Prompt sem texto (apenas visual)
                                </Label>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(promptWithoutText);
                                    toast({ title: '📋 Prompt (sem texto) copiado!' });
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                              <Textarea
                                value={promptWithoutText}
                                onChange={(e) => setPromptWithoutText(e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                              />
                            </TabsContent>
                          </Tabs>
                        ) : (
                          // Fallback: se não temos estrutura, mostra o raw
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm text-muted-foreground">
                                Prompt gerado (formato não estruturado)
                              </Label>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(analyzedPrompt);
                                  toast({ title: '📋 Prompt copiado!' });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            <Textarea
                              value={analyzedPrompt}
                              onChange={(e) => setAnalyzedPrompt(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </>
                        )}

                        {/* Metadata se disponível */}
                        {promptMetadata && (
                          <Card className="p-3 mt-4 bg-background">
                            <Label className="text-xs font-semibold mb-2 block">📊 Metadados da Análise</Label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {promptMetadata.tema && (
                                <div><span className="font-medium">Tema:</span> {promptMetadata.tema}</div>
                              )}
                              {promptMetadata.estilo && (
                                <div><span className="font-medium">Estilo:</span> {promptMetadata.estilo}</div>
                              )}
                              {promptMetadata.emocao && (
                                <div><span className="font-medium">Emoção:</span> {promptMetadata.emocao}</div>
                              )}
                              {promptMetadata.plano && (
                                <div><span className="font-medium">Plano:</span> {promptMetadata.plano}</div>
                              )}
                              {promptMetadata.quantidade_pessoas !== undefined && (
                                <div><span className="font-medium">Pessoas:</span> {promptMetadata.quantidade_pessoas}</div>
                              )}
                              {promptMetadata.ambiente && (
                                <div><span className="font-medium">Ambiente:</span> {promptMetadata.ambiente}</div>
                              )}
                              {promptMetadata.paleta_cores && promptMetadata.paleta_cores.length > 0 && (
                                <div className="col-span-2">
                                  <span className="font-medium">Paleta:</span> {promptMetadata.paleta_cores.join(', ')}
                                </div>
                              )}
                            </div>
                          </Card>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setAnalyzedPrompt('');
                              setPromptWithText('');
                              setPromptWithoutText('');
                              setPromptMetadata(null);
                              setAnalysisComplete(false);
                            }}
                            className="flex-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Limpar Tudo
                          </Button>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          💡 Você pode editar os prompts antes de gerar as imagens
                        </div>
                      </>
                    )}
                  </Card>
                )}

                {/* Botão MODELAR */}
                {analysisComplete && (promptWithText || promptWithoutText || analyzedPrompt) && (
                  <Button 
                    onClick={() => setShowGenerationDialog(true)}
                    className="w-full mt-4"
                    size="lg"
                  >
                    🎨 MODELAR (Gerar Imagens)
                  </Button>
                )}
              </Card>

              {/* Resultados */}
              {modelingResults.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">🎉 Imagens Geradas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {modelingResults.map((imageUrl, idx) => (
                      <div key={idx} className="space-y-2">
                        <img src={imageUrl} alt={`Gerada ${idx + 1}`} className="w-full rounded-lg" />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => downloadModeledImage(imageUrl, idx)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar #{idx + 1}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Histórico */}
              {modelingHistory.length > 0 && (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">📚 Histórico de Modelagens</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Tudo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir todo o histórico?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteAllModeling}>
                            Excluir Tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="space-y-4">
                    {modelingHistory.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={item.original_image_url}
                            alt="Original"
                            className="w-32 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-sm">
                              <strong>Nível:</strong> {item.modeling_level} • 
                              <strong> Gerador:</strong> {item.image_generator} •
                              <strong> Qtd:</strong> {item.quantity}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewItem(item);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteModelingItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </SubscriptionGuard>
        </TabsContent>
      </Tabs>

      {/* Dialog de Geração (Passo 2) */}
      <Dialog open={showGenerationDialog} onOpenChange={setShowGenerationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>🎨 Gerar Variações da Thumbnail</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview do prompt */}
            <div>
              <Label className="text-sm font-semibold mb-2">📝 Prompt que será usado:</Label>
              <div className="p-3 bg-muted rounded-lg max-h-[150px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {analyzedPrompt.substring(0, 300)}...
                </p>
              </div>
            </div>
            
            {/* Seletor de Provider */}
            <div>
              <Label>Provider de Geração</Label>
              <Select 
                value={selectedProvider} 
                onValueChange={(v: any) => {
                  setSelectedProvider(v);
                  setSelectedModel(v === 'huggingface' ? 'flux-schnell' : 'pollinations');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pollinations">
                    🌸 Pollinations.ai (Gratuito, Rápido)
                  </SelectItem>
                  <SelectItem value="huggingface">
                    🤗 HuggingFace (Requer Token)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Seletor de Modelo */}
            <div>
              <Label>Modelo</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider === 'pollinations' ? (
                    <>
                      <SelectItem value="pollinations">Flux (Padrão)</SelectItem>
                      <SelectItem value="pollinations-flux-realism">Flux Realism</SelectItem>
                      <SelectItem value="pollinations-flux-anime">Flux Anime</SelectItem>
                      <SelectItem value="pollinations-flux-3d">Flux 3D</SelectItem>
                      <SelectItem value="pollinations-turbo">Turbo (Ultra Rápido)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="flux-schnell">FLUX Schnell (Rápido)</SelectItem>
                      <SelectItem value="flux-dev">FLUX Dev (Qualidade)</SelectItem>
                      <SelectItem value="sdxl">SDXL (Melhor Qualidade)</SelectItem>
                      <SelectItem value="sdxl-turbo">SDXL Turbo</SelectItem>
                      <SelectItem value="sd-21">Stable Diffusion 2.1</SelectItem>
                      <SelectItem value="sd-15">Stable Diffusion 1.5</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Quantidade */}
            <div>
              <Label>Quantidade de Variações</Label>
              <Select 
                value={generationQuantity.toString()} 
                onValueChange={(v) => setGenerationQuantity(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 variação</SelectItem>
                  <SelectItem value="2">2 variações</SelectItem>
                  <SelectItem value="3">3 variações</SelectItem>
                  <SelectItem value="4">4 variações</SelectItem>
                  <SelectItem value="5">5 variações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimativa de tempo */}
            <div className="text-sm text-muted-foreground">
              ⏱️ Tempo estimado: ~{generationQuantity * (selectedProvider === 'pollinations' ? 5 : 15)} segundos
            </div>
            
            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGenerationDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerateVariations}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando {generationQuantity}x...
                  </>
                ) : (
                  `✨ Gerar ${generationQuantity} Variações`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview das Imagens Geradas</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Original:</h3>
                <img src={previewItem.original_image_url} alt="Original" className="w-full rounded-lg" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Geradas ({previewItem.generated_images?.length || 0}):</h3>
                <div className="grid grid-cols-2 gap-4">
                  {previewItem.generated_images?.map((img: string, idx: number) => (
                    <div key={idx}>
                      <img src={img} alt={`Gerada ${idx + 1}`} className="w-full rounded-lg" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => downloadModeledImage(img, idx)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {previewItem.ai_analysis && (
                <div>
                  <h3 className="font-semibold mb-2">Análise da IA:</h3>
                  <div className="p-4 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{previewItem.ai_analysis}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual de Uso - Prompts de Thumbnail</DialogTitle>
          </DialogHeader>
          <UserManual />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsThumbnail;
