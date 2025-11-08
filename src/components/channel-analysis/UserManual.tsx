import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Análise de Canais</CardTitle>
        <CardDescription>
          Guia completo para análise de padrões de canais do YouTube
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="usage">Como Usar</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é a Análise de Canais?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Ferramenta que identifica padrões e características de canais do YouTube para entender por que certos canais não são encontrados pelo sistema de busca.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Análise de padrões de conteúdo</li>
                      <li>Identificação de palavras-chave</li>
                      <li>Análise de títulos e descrições</li>
                      <li>Sugestões de termos de busca ideais</li>
                      <li>Detecção de nicho exato</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup">
                <AccordionTrigger>Configuração da Análise</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Canal Alvo:</p>
                    <p className="text-sm">Digite o handle do canal que gerou a busca (ex: @meucanal).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Canais de Exemplo:</p>
                    <p className="text-sm">Liste os canais que deveriam ser encontrados, um por linha.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="analysis">
                <AccordionTrigger>Análise Gerada</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>A análise fornece:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nicho exato dos canais</li>
                    <li>Tipo de conteúdo predominante</li>
                    <li>Palavras-chave comuns</li>
                    <li>Padrão de títulos</li>
                    <li>Motivo de não serem encontrados</li>
                    <li>Termos de busca ideais recomendados</li>
                    <li>Características únicas dos canais</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="application">
                <AccordionTrigger>Como Aplicar</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Analise os termos de busca ideais</li>
                    <li>Use essas palavras-chave nas suas buscas</li>
                    <li>Ajuste filtros com base nas características</li>
                    <li>Teste diferentes combinações</li>
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
