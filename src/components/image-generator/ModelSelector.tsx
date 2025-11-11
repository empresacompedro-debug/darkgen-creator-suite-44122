import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Zap, Sparkles, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  speed: "fast" | "medium" | "slow";
  quality: "standard" | "high" | "ultra";
  maxSize: string;
  provider: "pollinations" | "huggingface" | "google";
  preview?: string;
}

const MODELS: ModelConfig[] = [
  // Google AI Models (Nano Banana)
  {
    id: "nano-banana",
    name: "Nano Banana 🍌",
    description: "Gemini 2.5 Flash Image - Geração rápida com IA do Google",
    category: "universal",
    speed: "fast",
    quality: "ultra",
    maxSize: "1024x1024",
    provider: "google"
  },
  
  // Pollinations Models (Recomendados - Todos funcionam)
  {
    id: "pollinations",
    name: "Flux",
    description: "Modelo universal rápido e de alta qualidade",
    category: "universal",
    speed: "fast",
    quality: "high",
    maxSize: "1024x1024",
    provider: "pollinations"
  },
  {
    id: "pollinations-flux-realism",
    name: "Flux Realism",
    description: "Especializado em imagens fotorrealistas",
    category: "photorealistic",
    speed: "medium",
    quality: "ultra",
    maxSize: "1024x1024",
    provider: "pollinations"
  },
  {
    id: "pollinations-flux-anime",
    name: "Flux Anime",
    description: "Otimizado para estilo anime e ilustrações",
    category: "anime",
    speed: "medium",
    quality: "high",
    maxSize: "1024x1024",
    provider: "pollinations"
  },
  {
    id: "pollinations-flux-3d",
    name: "Flux 3D",
    description: "Para renderizações e arte 3D",
    category: "3d-render",
    speed: "medium",
    quality: "high",
    maxSize: "1024x1024",
    provider: "pollinations"
  },
  {
    id: "pollinations-turbo",
    name: "Turbo",
    description: "Geração ultra-rápida",
    category: "fast",
    speed: "fast",
    quality: "standard",
    maxSize: "1024x1024",
    provider: "pollinations"
  },
  
  // HuggingFace Models (Apenas modelos oficiais públicos)
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell",
    description: "Melhor para: Imagens realistas, retratos e cenários naturais com rapidez",
    category: "universal",
    speed: "fast",
    quality: "high",
    maxSize: "1024x1024",
    provider: "huggingface"
  },
  {
    id: "flux-dev",
    name: "FLUX.1 Dev",
    description: "Melhor para: Imagens ultra-realistas, fotografia profissional e detalhes complexos",
    category: "universal",
    speed: "medium",
    quality: "ultra",
    maxSize: "1024x1024",
    provider: "huggingface"
  },
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    description: "Melhor para: Arte conceitual, ilustrações e designs versáteis",
    category: "universal",
    speed: "medium",
    quality: "high",
    maxSize: "1024x1024",
    provider: "huggingface"
  },
  {
    id: "sd-21",
    name: "Stable Diffusion 2.1",
    description: "Melhor para: Testes rápidos, protótipos e arte digital simples",
    category: "fast",
    speed: "fast",
    quality: "standard",
    maxSize: "768x768",
    provider: "huggingface"
  },
  {
    id: "sd-15",
    name: "Stable Diffusion 1.5",
    description: "Melhor para: Ilustrações estilo cartoon, arte stylizada e experimentação",
    category: "universal",
    speed: "fast",
    quality: "standard",
    maxSize: "512x512",
    provider: "huggingface"
  }
];

const CATEGORIES = [
  { id: "all", name: "Todos", icon: ImageIcon },
  { id: "google", name: "Google AI", icon: Sparkles },
  { id: "pollinations", name: "Pollinations", icon: Sparkles },
  { id: "huggingface", name: "HuggingFace", icon: ImageIcon },
  { id: "universal", name: "Universal", icon: Sparkles },
  { id: "photorealistic", name: "Fotorrealista", icon: Sparkles },
  { id: "anime", name: "Anime", icon: Sparkles },
  { id: "3d-render", name: "3D", icon: Sparkles },
  { id: "fast", name: "Rápido", icon: Zap }
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  provider: "pollinations" | "huggingface" | "google";
}

export function ModelSelector({ value, onChange, provider }: ModelSelectorProps) {
  const availableModels = MODELS.filter(model => model.provider === provider);

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "fast": return <Zap className="h-3 w-3 text-green-500" />;
      case "medium": return <Zap className="h-3 w-3 text-yellow-500" />;
      case "slow": return <Zap className="h-3 w-3 text-orange-500" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      standard: "outline",
      high: "secondary",
      ultra: "default",
    };
    return (
      <Badge variant={variants[quality]} className="text-xs">
        {quality === "ultra" ? "Ultra HD" : quality === "high" ? "HD" : "SD"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-4">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              <cat.icon className="h-3 w-3 mr-1" />
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableModels
                .filter(model => {
                  if (category.id === "all") return true;
                  if (category.id === "google") return model.provider === "google";
                  if (category.id === "pollinations") return model.provider === "pollinations";
                  if (category.id === "huggingface") return model.provider === "huggingface";
                  return model.category === category.id;
                })
                .map((model) => (
                  <Card
                    key={model.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                      value === model.id && "ring-2 ring-primary shadow-lg"
                    )}
                    onClick={() => onChange(model.id)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{model.name}</h4>
                            {value === model.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {model.description}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getQualityBadge(model.quality)}
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getSpeedIcon(model.speed)}
                          {model.speed === "fast" ? "Rápido" : model.speed === "medium" ? "Médio" : "Lento"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {model.maxSize}
                        </Badge>
                      </div>

                      {/* Preview placeholder */}
                      {model.preview && (
                        <div className="w-full h-32 bg-muted rounded-md overflow-hidden">
                          <img 
                            src={model.preview} 
                            alt={model.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
