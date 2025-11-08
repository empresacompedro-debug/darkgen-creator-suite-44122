import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Scissors } from "lucide-react";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

export default function DivisorTexto() {
  const [script, setScript] = useState("");
  const [divideBy, setDivideBy] = useState<"words" | "characters">("words");
  const [divideValue, setDivideValue] = useState("150");
  const [parts, setParts] = useState<string[]>([]);
  const { toast } = useToast();

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const charCount = script.length;
  const estimatedTimeSeconds = Math.ceil((wordCount / 150) * 60);
  const estimatedTimeMinutes = (estimatedTimeSeconds / 60).toFixed(1);

  const handleDivide = () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o roteiro",
        variant: "destructive",
      });
      return;
    }

    const value = parseInt(divideValue);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido",
        variant: "destructive",
      });
      return;
    }

    let dividedParts: string[] = [];

    if (divideBy === "words") {
      const words = script.split(/\s+/);
      for (let i = 0; i < words.length; i += value) {
        dividedParts.push(words.slice(i, i + value).join(" "));
      }
    } else {
      for (let i = 0; i < script.length; i += value) {
        dividedParts.push(script.slice(i, i + value));
      }
    }

    setParts(dividedParts);
    toast({
      title: "Texto dividido!",
      description: `O roteiro foi dividido em ${dividedParts.length} partes`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">✂️ Divisor de Texto</h1>
        <p className="text-muted-foreground mt-2">
          Analise e divida roteiros em partes menores para facilitar a narração
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Palavras</p>
          <p className="text-2xl font-bold text-primary">{wordCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Caracteres</p>
          <p className="text-2xl font-bold text-primary">{charCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tempo de Narração</p>
          <p className="text-2xl font-bold text-primary">{estimatedTimeSeconds}s ({estimatedTimeMinutes}min)</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Roteiro Completo</label>
          <Textarea
            placeholder="Cole seu roteiro aqui..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dividir por</label>
            <Select value={divideBy} onValueChange={(value: "words" | "characters") => setDivideBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="words">Palavras</SelectItem>
                <SelectItem value="characters">Caracteres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dividir a cada</label>
            <Input
              type="number"
              value={divideValue}
              onChange={(e) => setDivideValue(e.target.value)}
              placeholder="150"
            />
          </div>
        </div>

        <Button onClick={handleDivide} className="w-full">
          <Scissors className="mr-2 h-4 w-4" />
          Dividir Texto
        </Button>
      </Card>

      {parts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Partes do Roteiro ({parts.length} partes)</h3>
          {parts.map((part, index) => (
            <Card key={index} className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Parte {index + 1}</p>
              <p className="text-sm">{part}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
