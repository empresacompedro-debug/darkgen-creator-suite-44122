import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CookieHelpDialogProps {
  cookieType: 'whisk' | 'imagefx';
}

export const CookieHelpDialog = ({ cookieType }: CookieHelpDialogProps) => {
  const config = {
    whisk: {
      title: "Como Obter Cookie do Whisk",
      url: "whisk.google.com",
      steps: [
        "Acesse whisk.google.com no seu navegador",
        "Faça login na sua conta Google",
        "Pressione F12 para abrir o DevTools",
        "Vá para a aba 'Application' (ou 'Aplicativo')",
        "No menu lateral, clique em 'Cookies'",
        "Selecione o domínio 'https://whisk.google.com'",
        "Copie todos os cookies (formato: nome=valor; nome2=valor2)",
        "Cole na caixa de texto acima"
      ]
    },
    imagefx: {
      title: "Como Obter Cookie do ImageFX",
      url: "aisandbox.google.com",
      steps: [
        "Acesse aisandbox.google.com no seu navegador",
        "Faça login na sua conta Google",
        "Pressione F12 para abrir o DevTools",
        "Vá para a aba 'Application' (ou 'Aplicativo')",
        "No menu lateral, clique em 'Cookies'",
        "Selecione o domínio 'https://aisandbox.google.com'",
        "Copie todos os cookies (formato: nome=valor; nome2=valor2)",
        "Cole na caixa de texto acima"
      ]
    }
  };

  const { title, url, steps } = config[cookieType];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          💡 Como obter?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para obter o cookie de autenticação
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Aviso de Segurança</strong>
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Cookies são informações sensíveis de autenticação</li>
                <li>Eles ficam armazenados apenas no seu navegador (localStorage)</li>
                <li>Nunca compartilhe seus cookies com terceiros</li>
                <li><strong>Recomendamos usar Lovable AI</strong> (não requer cookies)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold">Passo a Passo:</h4>
            <ol className="space-y-2 ml-4">
              {steps.map((step, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <span className="font-bold text-primary">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>📌 Formato Esperado</strong>
              <p className="mt-2 text-xs font-mono bg-muted p-2 rounded">
                cookie_name=value123; another_cookie=abc456; session_id=xyz789
              </p>
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Se você não conseguir obter os cookies ou tiver problemas, 
              use a opção <strong>Lovable AI</strong> que funciona sem configuração adicional.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
