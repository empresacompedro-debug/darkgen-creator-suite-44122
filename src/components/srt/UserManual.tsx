import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Conversor SRT</CardTitle>
        <CardDescription>
          Guia completo para conversão de roteiros em legendas SRT otimizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é o Conversor SRT?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Ferramenta que converte roteiros em arquivos de legendas SRT otimizados para edição no CapCut e outros editores.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Recursos Principais:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Conversão automática de roteiros</li>
                      <li>Controle de linhas e palavras</li>
                      <li>Timecodes precisos</li>
                      <li>Análise de estatísticas</li>
                      <li>Histórico de conversões</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="settings">
                <AccordionTrigger>Configurações Avançadas</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Palavras por Legenda:</p>
                    <p className="text-sm">Controla quantas palavras aparecem em cada legenda (30-80 palavras).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Máximo de Linhas:</p>
                    <p className="text-sm">Define o número máximo de linhas por legenda (3-7 linhas).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Palavras por Linha:</p>
                    <p className="text-sm">Quantidade de palavras em cada linha (8-15 palavras).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Velocidade de Narração:</p>
                    <p className="text-sm">Palavras por segundo na narração (2.0-3.0 palavras/s).</p>
                  </div>
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
                    <li>Cole o roteiro completo</li>
                    <li>Ajuste as configurações conforme necessário</li>
                    <li>Converta para SRT</li>
                    <li>Analise as estatísticas geradas</li>
                    <li>Baixe o arquivo .srt</li>
                    <li>Importe no CapCut ou outro editor</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tips">
                <AccordionTrigger>Dicas de Uso</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Use 3-5 linhas por legenda para melhor leitura</li>
                    <li>Mantenha 8-12 palavras por linha</li>
                    <li>Velocidade ideal: 2.5 palavras/segundo</li>
                    <li>Revise as estatísticas antes de exportar</li>
                    <li>Salve diferentes versões no histórico</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
