import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Prompts de Thumbnail</CardTitle>
        <CardDescription>
          Guia completo para geração de prompts de thumbnail e modelagem de thumbnails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="prompts">Geração</TabsTrigger>
            <TabsTrigger value="extraction">Extração</TabsTrigger>
            <TabsTrigger value="modeling">Modelagem</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que são Prompts de Thumbnail?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Ferramenta 3-em-1 que permite gerar prompts otimizados para criação de thumbnails, extrair thumbnails de concorrentes e modelar thumbnails com IA.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Funcionalidades Principais:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Geração de prompts para plataformas de IA</li>
                      <li>Extração de thumbnails do YouTube</li>
                      <li>Modelagem e recriação de thumbnails</li>
                      <li>Análise visual com IA</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="generation">
                <AccordionTrigger>Geração de Prompts</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>Gere prompts otimizados para diferentes plataformas de geração de imagens.</p>
                  <div className="space-y-2">
                    <p className="font-semibold">Plataformas Suportadas:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Midjourney</li>
                      <li>Dall-E 3</li>
                      <li>Stable Diffusion</li>
                      <li>Leonardo.AI</li>
                      <li>Ideogram</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="extraction" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="extract">
                <AccordionTrigger>Extração de Thumbnails</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>Extraia thumbnails de vídeos do YouTube para análise e referência.</p>
                  <div className="space-y-2">
                    <p className="font-semibold">Resoluções Disponíveis:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Máxima (1280x720)</li>
                      <li>Alta (480x360)</li>
                      <li>Média (320x180)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="modeling" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="model">
                <AccordionTrigger>Modelagem de Thumbnails</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>Recrie thumbnails usando IA com diferentes níveis de fidelidade.</p>
                  <div className="space-y-2">
                    <p className="font-semibold">Níveis de Modelagem:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Idêntica: Máxima fidelidade ao original</li>
                      <li>Similar: Mantém o conceito principal</li>
                      <li>Conceito: Apenas a ideia geral</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
