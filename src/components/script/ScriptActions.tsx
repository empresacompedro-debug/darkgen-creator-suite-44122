import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScriptActionsProps {
  script: string;
  theme: string;
  onClear: () => void;
  onImprove?: () => void;
  showImprove?: boolean;
}

export const ScriptActions = ({ script, theme, onClear, onImprove, showImprove }: ScriptActionsProps) => {
  const { toast } = useToast();

  const cleanScriptText = (text: string): string => {
    return text
      .split('\n')
      .filter(line => !line.trim().match(/^#+\s/))
      .filter(line => !line.trim().match(/PARTE\s+\d+/i))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleCopyWithTitles = () => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copiado!", description: "Roteiro completo copiado com títulos das partes" });
  };

  const handleCopyWithoutTitles = () => {
    const scriptWithoutTitles = script
      .split('\n')
      .filter(line => !line.match(/^Parte\s+\d+/i))
      .join('\n')
      .trim();
    
    navigator.clipboard.writeText(scriptWithoutTitles);
    toast({ title: "Copiado!", description: "Roteiro copiado sem títulos das partes" });
  };

  const handleDownloadComplete = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme || 'roteiro'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado!", description: "Seu roteiro completo está sendo baixado" });
  };

  const handleDownloadClean = () => {
    const cleanText = cleanScriptText(script);
    const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme || 'roteiro'}_limpo.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado!", description: "Roteiro limpo baixado (apenas texto narrativo)" });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleCopyWithTitles} variant="outline" className="flex-1 min-w-[150px]">
        <Copy className="h-4 w-4 mr-2" />
        Copiar Completo
      </Button>
      <Button onClick={handleCopyWithoutTitles} variant="outline" className="flex-1 min-w-[150px]">
        <Copy className="h-4 w-4 mr-2" />
        Copiar Sem Títulos
      </Button>
      <Button onClick={handleDownloadComplete} variant="outline" className="flex-1 min-w-[150px]">
        <Download className="h-4 w-4 mr-2" />
        Download Completo
      </Button>
      <Button onClick={handleDownloadClean} variant="outline" className="flex-1 min-w-[150px]">
        <FileText className="h-4 w-4 mr-2" />
        Download Texto Limpo
      </Button>
      <Button onClick={onClear} variant="outline" className="flex-1 min-w-[150px]">
        <Trash2 className="h-4 w-4 mr-2" />
        Limpar
      </Button>
      {showImprove && onImprove && (
        <Button onClick={onImprove} className="flex-1 min-w-[150px] bg-gradient-to-r from-primary to-primary-light">
          <Sparkles className="h-4 w-4 mr-2" />
          Sugestão IA para 100/100
        </Button>
      )}
    </div>
  );
};
