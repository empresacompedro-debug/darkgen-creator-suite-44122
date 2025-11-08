import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Guia de Edição</CardTitle>
        <CardDescription>
          Guia completo para geração de roteiros de edição com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="inputs">Entradas</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é o Guia de Edição?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Ferramenta que gera roteiros detalhados de edição combinando script, SRT e prompts de cenas, criando um guia completo para editores.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="inputs" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="required">
                <AccordionTrigger>Entradas Necessárias</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Tema do vídeo</li>
                    <li>Roteiro (opcional)</li>
                    <li>Legendas SRT (opcional)</li>
                    <li>Prompts de cenas (opcional)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="workflow">
                <AccordionTrigger>Como Usar</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Defina o tema do vídeo</li>
                    <li>Adicione roteiro, SRT ou prompts</li>
                    <li>Configure parâmetros de edição</li>
                    <li>Gere o guia completo</li>
                    <li>Use como referência na edição</li>
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
