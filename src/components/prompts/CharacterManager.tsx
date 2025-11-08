import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CharacterForm, CharacterData } from "./CharacterForm";

interface CharacterManagerProps {
  characters: CharacterData[];
  onCharactersChange: (characters: CharacterData[]) => void;
}

export const CharacterManager = ({ characters, onCharactersChange }: CharacterManagerProps) => {
  const addCharacter = () => {
    const newCharacter: CharacterData = {
      id: `char-${Date.now()}`,
      name: "",
      age: "",
      faceShape: "",
      eyes: "",
      nose: "",
      mouth: "",
      hair: "",
      physique: "",
      height: "",
      skinTone: "",
      distinctiveMarks: "",
      clothing: "",
      accessories: "",
      posture: "",
    };
    onCharactersChange([...characters, newCharacter]);
  };

  const updateCharacter = (index: number, updatedCharacter: CharacterData) => {
    const newCharacters = [...characters];
    newCharacters[index] = updatedCharacter;
    onCharactersChange(newCharacters);
  };

  const deleteCharacter = (index: number) => {
    const newCharacters = characters.filter((_, i) => i !== index);
    onCharactersChange(newCharacters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Personagens Consistentes</h3>
          <p className="text-sm text-muted-foreground">
            Adicione detalhes completos para garantir máxima consistência visual
          </p>
        </div>
        <Button onClick={addCharacter} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Personagem
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Nenhum personagem adicionado ainda.</p>
          <p className="text-sm mt-1">Clique em "Adicionar Personagem" ou use "Detectar com IA"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {characters.map((character, index) => (
            <CharacterForm
              key={character.id}
              character={character}
              onUpdate={(updated) => updateCharacter(index, updated)}
              onDelete={() => deleteCharacter(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
