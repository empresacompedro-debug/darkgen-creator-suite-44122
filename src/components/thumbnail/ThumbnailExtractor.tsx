import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Download, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExtractedThumbnail, fetchThumbnail, urlToBase64 } from "@/lib/youtubeUtils";
import JSZip from "jszip";

interface ThumbnailExtractorProps {
  onSendToModeling: (thumbnails: ExtractedThumbnail[]) => void;
}

const ThumbnailExtractor = ({ onSendToModeling }: ThumbnailExtractorProps) => {
  const { toast } = useToast();
  const [urls, setUrls] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedThumbnails, setExtractedThumbnails] = useState<ExtractedThumbnail[]>([]);
  const [selectedThumbnails, setSelectedThumbnails] = useState<Set<string>>(new Set());

  const handleExtractThumbnails = async () => {
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) {
      toast({
        title: "Erro",
        description: "Cole pelo menos uma URL de vídeo do YouTube",
        variant: "destructive",
      });
      return;
    }

    if (urlList.length > 10) {
      toast({
        title: "Limite Excedido",
        description: "Máximo de 10 URLs por vez",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    const results: ExtractedThumbnail[] = [];
    const errors: string[] = [];

    for (const url of urlList) {
      try {
        const thumbnail = await fetchThumbnail(url);
        if (thumbnail) {
          results.push(thumbnail);
        } else {
          errors.push(`URL inválida ou thumbnail não encontrada: ${url.substring(0, 50)}...`);
        }
      } catch (error: any) {
        errors.push(`Erro ao processar: ${url.substring(0, 50)}...`);
      }
    }

    setExtractedThumbnails(results);
    setIsExtracting(false);

    if (results.length > 0) {
      toast({
        title: `✅ ${results.length} Thumbnail(s) Extraída(s)`,
        description: errors.length > 0 ? `${errors.length} falha(s)` : "Todas extraídas com sucesso",
      });
    }

    if (errors.length > 0 && results.length === 0) {
      toast({
        title: "Erro na Extração",
        description: "Nenhuma thumbnail pôde ser extraída. Verifique as URLs.",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedThumbnails);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedThumbnails(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedThumbnails.size === extractedThumbnails.length) {
      setSelectedThumbnails(new Set());
    } else {
      setSelectedThumbnails(new Set(extractedThumbnails.map(t => t.id)));
    }
  };

  const downloadThumbnail = async (thumbnail: ExtractedThumbnail) => {
    try {
      const response = await fetch(thumbnail.thumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnail-${thumbnail.videoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Completo",
        description: thumbnail.title,
      });
    } catch (error) {
      toast({
        title: "Erro ao Baixar",
        description: "Não foi possível fazer o download",
        variant: "destructive",
      });
    }
  };

  const downloadSelectedAsZip = async () => {
    const selected = extractedThumbnails.filter(t => selectedThumbnails.has(t.id));
    if (selected.length === 0) {
      toast({
        title: "Nenhuma Thumbnail Selecionada",
        description: "Selecione ao menos uma thumbnail",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Preparando ZIP...",
      description: `Baixando ${selected.length} thumbnail(s)`,
    });

    try {
      const zip = new JSZip();

      for (const thumbnail of selected) {
        const response = await fetch(thumbnail.thumbnailUrl);
        const blob = await response.blob();
        zip.file(`${thumbnail.videoId}-${thumbnail.resolution}.jpg`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnails-${Date.now()}.zip`;
      a.click();

      toast({
        title: "✅ ZIP Criado!",
        description: `${selected.length} thumbnail(s) baixada(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Criar ZIP",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendToModeling = async () => {
    const selected = extractedThumbnails.filter(t => selectedThumbnails.has(t.id));
    if (selected.length === 0) {
      toast({
        title: "Nenhuma Thumbnail Selecionada",
        description: "Selecione ao menos uma thumbnail para modelar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Preparando para Modelagem...",
      description: `Convertendo ${selected.length} thumbnail(s)`,
    });

    try {
      // Converter para base64
      for (const thumbnail of selected) {
        if (!thumbnail.base64) {
          thumbnail.base64 = await urlToBase64(thumbnail.thumbnailUrl);
        }
      }

      onSendToModeling(selected);

      toast({
        title: "✅ Enviado para Modelagem",
        description: `${selected.length} thumbnail(s) pronta(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Preparar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>URLs de Vídeos do YouTube (uma por linha)</Label>
        <Textarea
          placeholder={`https://youtube.com/watch?v=xxxxx\nhttps://youtu.be/yyyyy\nhttps://youtube.com/watch?v=zzzzz`}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="min-h-[120px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Máximo de 10 URLs por vez. Suporta formatos: youtube.com/watch?v=, youtu.be/, m.youtube.com
        </p>
      </div>

      <Button
        onClick={handleExtractThumbnails}
        disabled={isExtracting || !urls.trim()}
        className="w-full"
        size="lg"
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Extraindo Thumbnails...
          </>
        ) : (
          <>
            <Search className="h-5 w-5 mr-2" />
            🔍 Extrair Thumbnails
          </>
        )}
      </Button>

      {extractedThumbnails.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Thumbnails Extraídas ({extractedThumbnails.length})
            </h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedThumbnails.size === extractedThumbnails.length}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer text-sm">
                Selecionar Todas
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadSelectedAsZip}
              disabled={selectedThumbnails.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              📥 Baixar Selecionadas (ZIP)
            </Button>
            <Button
              onClick={sendToModeling}
              disabled={selectedThumbnails.size === 0}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              🎨 Modelar Selecionadas
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedThumbnails.map((thumbnail) => (
              <Card key={thumbnail.id} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedThumbnails.has(thumbnail.id)}
                    onCheckedChange={() => toggleSelection(thumbnail.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{thumbnail.title}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                      {thumbnail.resolution}
                    </span>
                  </div>
                </div>
                <img
                  src={thumbnail.thumbnailUrl}
                  alt={thumbnail.title}
                  className="w-full rounded-lg shadow-md"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadThumbnail(thumbnail)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {extractedThumbnails.length === 0 && !isExtracting && (
        <Card className="p-8 text-center border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Cole URLs de vídeos do YouTube acima e clique em "Extrair Thumbnails"
          </p>
        </Card>
      )}
    </div>
  );
};

export default ThumbnailExtractor;
