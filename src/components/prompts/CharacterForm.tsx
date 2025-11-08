import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface CharacterData {
  id: string;
  name: string;
  age: string;
  faceShape: string;
  eyes: string;
  nose: string;
  mouth: string;
  hair: string;
  physique: string;
  height: string;
  skinTone: string;
  distinctiveMarks: string;
  clothing: string;
  accessories: string;
  posture: string;
}

interface CharacterFormProps {
  character: CharacterData;
  onUpdate: (character: CharacterData) => void;
  onDelete: () => void;
}

export const CharacterForm = ({ character, onUpdate, onDelete }: CharacterFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof CharacterData, value: string) => {
    onUpdate({ ...character, [field]: value });
  };

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <h3 className="text-lg font-semibold">{character.name || "Novo Personagem"}</h3>
            </Button>
          </CollapsibleTrigger>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${character.id}-name`}>Nome Completo *</Label>
              <Input
                id={`${character.id}-name`}
                value={character.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Coronel Augusto Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-age`}>Idade Aparente *</Label>
              <Input
                id={`${character.id}-age`}
                value={character.age}
                onChange={(e) => handleChange("age", e.target.value)}
                placeholder="Ex: 52 anos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-faceShape`}>Formato do Rosto *</Label>
              <Input
                id={`${character.id}-faceShape`}
                value={character.faceShape}
                onChange={(e) => handleChange("faceShape", e.target.value)}
                placeholder="Ex: retangular, marcante, queixo pronunciado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-eyes`}>Olhos (cor, formato, expressão) *</Label>
              <Input
                id={`${character.id}-eyes`}
                value={character.eyes}
                onChange={(e) => handleChange("eyes", e.target.value)}
                placeholder="Ex: castanhos escuros penetrantes, sobrancelhas grossas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-nose`}>Nariz</Label>
              <Input
                id={`${character.id}-nose`}
                value={character.nose}
                onChange={(e) => handleChange("nose", e.target.value)}
                placeholder="Ex: aquilino proeminente, leve desvio à esquerda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-mouth`}>Boca e Lábios</Label>
              <Input
                id={`${character.id}-mouth`}
                value={character.mouth}
                onChange={(e) => handleChange("mouth", e.target.value)}
                placeholder="Ex: lábios finos, bigode grisalho espesso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-hair`}>Cabelo (cor, comprimento, estilo) *</Label>
              <Input
                id={`${character.id}-hair`}
                value={character.hair}
                onChange={(e) => handleChange("hair", e.target.value)}
                placeholder="Ex: grisalho prateado, riscado para trás com pomada"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-physique`}>Compleição Física *</Label>
              <Input
                id={`${character.id}-physique`}
                value={character.physique}
                onChange={(e) => handleChange("physique", e.target.value)}
                placeholder="Ex: ombros largos, musculoso, sinais de envelhecimento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-height`}>Altura</Label>
              <Input
                id={`${character.id}-height`}
                value={character.height}
                onChange={(e) => handleChange("height", e.target.value)}
                placeholder="Ex: alto e imponente (aproximadamente 1,88m)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-skinTone`}>Tom de Pele e Etnia *</Label>
              <Input
                id={`${character.id}-skinTone`}
                value={character.skinTone}
                onChange={(e) => handleChange("skinTone", e.target.value)}
                placeholder="Ex: pele morena bronzeada, brasileiro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-distinctiveMarks`}>Marcas Distintivas</Label>
              <Textarea
                id={`${character.id}-distinctiveMarks`}
                value={character.distinctiveMarks}
                onChange={(e) => handleChange("distinctiveMarks", e.target.value)}
                placeholder="Ex: cicatriz fina branca da bochecha esquerda até o queixo"
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-clothing`}>Vestuário Típico *</Label>
              <Textarea
                id={`${character.id}-clothing`}
                value={character.clothing}
                onChange={(e) => handleChange("clothing", e.target.value)}
                placeholder="Ex: uniforme militar brasileiro anos 1850, ombreiras douradas, faixa vermelha"
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-accessories`}>Acessórios Característicos</Label>
              <Input
                id={`${character.id}-accessories`}
                value={character.accessories}
                onChange={(e) => handleChange("accessories", e.target.value)}
                placeholder="Ex: medalhas militares, espada cerimonial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${character.id}-posture`}>Postura e Expressão Típica</Label>
              <Textarea
                id={`${character.id}-posture`}
                value={character.posture}
                onChange={(e) => handleChange("posture", e.target.value)}
                placeholder="Ex: postura rígida militar, expressão de autoridade controlada"
                className="min-h-[60px]"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
