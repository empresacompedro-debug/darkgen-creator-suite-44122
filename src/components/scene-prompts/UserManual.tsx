import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Prompts para Cenas</CardTitle>
        <CardDescription>
          Guia completo para geração de prompts de imagens a partir de roteiros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="characters">Personagens</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é Prompts para Cenas?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Ferramenta que transforma roteiros de vídeo em prompts detalhados para geração de imagens, facilitando a criação de material visual para seus vídeos.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Principais Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Conversão automática de roteiro em prompts</li>
                      <li>Detecção de personagens com IA</li>
                      <li>Múltiplos modos de geração</li>
                      <li>Estilos visuais variados</li>
                      <li>Otimização para diferentes plataformas</li>
                      <li>Exportação organizada</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="modes">
                <AccordionTrigger>Modos de Geração</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Por Cena:</p>
                    <p className="text-sm">Gera um prompt para cada cena identificada no roteiro. Ideal para vídeos com múltiplas cenas distintas.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Por Parágrafo:</p>
                    <p className="text-sm">Cria prompts baseados em parágrafos. Melhor para conteúdo descritivo e narrativo.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="characters" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="detection">
                <AccordionTrigger>Detecção de Personagens</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>A IA analisa o roteiro e identifica automaticamente personagens, permitindo descrições consistentes nas cenas.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="workflow">
                <AccordionTrigger>Fluxo de Trabalho</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Cole ou importe seu roteiro</li>
                    <li>Detecte personagens (se houver)</li>
                    <li>Configure estilo e modo</li>
                    <li>Gere os prompts</li>
                    <li>Exporte para usar em geradores de imagem</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
