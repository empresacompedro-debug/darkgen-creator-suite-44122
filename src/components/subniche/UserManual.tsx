import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Target, TrendingUp, Search, Lightbulb, AlertCircle, CheckCircle2, Zap, BarChart3, Trophy, Clock } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Sub-Niche Hunter</CardTitle>
        <p className="text-muted-foreground">
          Descubra micro-nichos altamente lucrativos e padrões de títulos vencedores
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="setup">Como Usar</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Alert className="bg-primary/10 border-primary">
              <Trophy className="h-4 w-4" />
              <AlertTitle>🏆 NOVIDADE: Sistema de Campeões</AlertTitle>
              <AlertDescription>
                A ferramenta agora identifica até 10 micro-nichos CAMPEÕES com performance excepcional comprovada. 
                Priorize sempre os campeões para maximizar suas chances de sucesso!
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  O Que é o Sub-Niche Hunter?
                </h3>
                <p className="text-muted-foreground">
                  O Sub-Niche Hunter é uma ferramenta avançada de análise que identifica micro-nichos inexplorados 
                  através da análise de padrões de títulos de vídeos virais. Ele permite descobrir oportunidades de 
                  conteúdo em nichos com baixa concorrência mas alta demanda.
                </p>
              </div>

              <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  🏆 Foco em CAMPEÕES
                </h3>
                <p className="text-sm mb-3">
                  A ferramenta prioriza a identificação de até <strong>10 micro-nichos CAMPEÕES</strong> - oportunidades 
                  com performance excepcional comprovada por dados reais de visualizações.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                    <span><strong>Campeões</strong> são micro-nichos com média de visualizações consistentemente alta</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                    <span>Sistema analisa <strong>TOP 25 micro-nichos</strong> e destaca os melhores</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                    <span>Cada campeão representa uma <strong>oportunidade de alto impacto</strong> validada</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                    <span>Estruturas de título <strong>prontas para replicar</strong> com exemplos reais</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Para Quem É Esta Ferramenta?
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Criadores</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que buscam encontrar nichos lucrativos com baixa concorrência
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Estrategistas</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que querem validar ideias antes de produzir conteúdo
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Analistas</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que estudam padrões de títulos vencedores em seu nicho
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Principais Funcionalidades
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 dark:bg-yellow-950 py-2">
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      🏆 Identificação de Campeões
                      <Badge variant="default" className="bg-yellow-600">NOVO</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Identifica até 10 micro-nichos CAMPEÕES com performance excepcional validada por dados reais
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">📊 Análise de Títulos de Competidores</h4>
                    <p className="text-sm text-muted-foreground">
                      Analisa até 80 vídeos para identificar padrões, ranquear TOP 25 micro-nichos e detectar falhas
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">⏳ Sistema de Loading Progress Realista</h4>
                    <p className="text-sm text-muted-foreground">
                      5 estágios visuais de progresso mostrando exatamente o que está acontecendo na análise
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🎯 Expansão de Nichos</h4>
                    <p className="text-sm text-muted-foreground">
                      Expande nichos amplos em sub-nichos e micro-nichos específicos e lucrativos
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🔍 Duas Listas Estratégicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Gera lista de nichos gerais e lista de nichos muito específicos para diferentes estratégias
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🤖 IA Avançada</h4>
                    <p className="text-sm text-muted-foreground">
                      Utiliza modelos de IA para identificar padrões complexos e oportunidades ocultas
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Casos de Uso Ideais
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Encontrar "oceanos azuis" - nichos com demanda mas sem concorrência</li>
                  <li>Validar ideias de canal antes de começar a produzir</li>
                  <li>Descobrir variações de nicho que seus competidores não exploram</li>
                  <li>Identificar tendências emergentes em seu mercado</li>
                  <li>Criar séries de vídeos baseadas em padrões comprovados</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="titles-analysis">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Aba 1: Análise de Títulos de Competidores</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Objetivo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Analisar títulos de vídeos virais para identificar padrões, temas recorrentes e formatos 
                      que geram engajamento. A IA detecta tendências que não são óbvias a olho nu.
                    </p>
                  </div>

                  <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      🏆 Sistema de Campeões
                    </h4>
                    <p className="text-sm mb-3">
                      A ferramenta identifica até <strong>10 micro-nichos CAMPEÕES</strong> dentro da análise.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium mb-1">O que é um CAMPEÃO:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                          <li>Micro-nicho com média de visualizações consistentemente alta</li>
                          <li>Performance superior comparado a outros micro-nichos</li>
                          <li>Estrutura de título validada com múltiplos exemplos de sucesso</li>
                          <li>Alto potencial de replicação e série de conteúdo</li>
                        </ul>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <p className="font-medium mb-1 text-xs">Como identificar CAMPEÕES nos resultados:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                          <li>Procure por badges/marcadores de "CAMPEÃO" ou "isChampion: true"</li>
                          <li>Foque primeiro nos campeões - são suas melhores oportunidades</li>
                          <li>Analise as estruturas de título dos campeões</li>
                          <li>Use os títulos de exemplo como templates</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📝 Campo: Títulos dos Vídeos</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cole uma lista de títulos de vídeos do seu nicho. Quanto mais títulos, melhor a análise.
                      <strong> A ferramenta agora analisa até 80 vídeos!</strong>
                    </p>
                    <Badge variant="outline" className="mb-2">Recomendado: 30-80 títulos</Badge>
                    <p className="text-xs text-muted-foreground mb-2">
                      💡 <strong>Mais títulos = melhor identificação de campeões</strong>
                    </p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1">
                      <p className="font-medium">💡 Como coletar títulos:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Use a ferramenta "Extração de Thumbnail" na aba 2 de Prompts de Thumbnail</li>
                        <li>Ou copie manualmente de canais de sucesso no seu nicho</li>
                        <li>Foque em vídeos com +100k views ou alta taxa de cliques</li>
                        <li>Inclua apenas títulos em português (ou o idioma do seu canal)</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      ⏳ Processo de Análise (5 Etapas)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Durante a análise, você verá um sistema de progresso realista mostrando exatamente o que está acontecendo:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Badge variant="outline">1. 🗄️ Analisando Dados (15%)</Badge>
                        <span className="text-xs text-muted-foreground">Extraindo títulos, views e métricas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Badge variant="outline">2. 🎯 Estrutura Hierárquica (40%)</Badge>
                        <span className="text-xs text-muted-foreground">Organizando nicho → sub-nichos → micro-nichos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Badge variant="outline">3. 📊 Análise de Performance (70%)</Badge>
                        <span className="text-xs text-muted-foreground">Ranqueando TOP 25 e identificando CAMPEÕES</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Badge variant="outline">4. ⚠️ Detectando Falhas (90%)</Badge>
                        <span className="text-xs text-muted-foreground">Analisando títulos com baixa performance</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Badge variant="default">5. ✅ Concluído (100%)</Badge>
                        <span className="text-xs text-muted-foreground">Análise finalizada com sucesso!</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⏱️ <strong>Tempo estimado:</strong> 20-40 segundos dependendo da quantidade de títulos
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🤖 Campo: Modelo de IA</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Escolha o modelo de IA que fará a análise.
                    </p>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">✅ Gemini 2.5 Flash (Recomendado)</p>
                        <p className="text-xs text-muted-foreground">
                          Melhor custo-benefício. Rápido e preciso para análise de padrões de texto.
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">⚡ Gemini 2.5 Flash Lite</p>
                        <p className="text-xs text-muted-foreground">
                          Mais rápido e econômico, mas pode perder nuances em análises complexas.
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">🚀 Gemini 2.5 Pro</p>
                        <p className="text-xs text-muted-foreground">
                          Máxima precisão. Use para análises críticas ou nichos muito específicos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">⚠️ Erros Comuns</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Misturar títulos de nichos diferentes - mantenha coerência</li>
                      <li>Usar poucos títulos (menos de 30) - análise imprecisa e poucos campeões identificados</li>
                      <li>Incluir títulos de vídeos com baixo desempenho</li>
                      <li>Não separar títulos por linha - cada título deve estar em uma linha</li>
                      <li>Ignorar os campeões identificados e focar em micro-nichos comuns</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="niche-expansion">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Aba 2: Expansão de Nicho</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Objetivo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expandir um nicho amplo em sub-nichos e micro-nichos específicos. Útil para encontrar 
                      oportunidades inexploradas dentro de mercados já estabelecidos.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📝 Campo: Seu Nicho Ou Sub-Nicho</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Digite o nicho que você quer expandir. Pode ser amplo ou já específico.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm space-y-2">
                      <p className="font-medium">💡 Exemplos:</p>
                      <div className="space-y-1 ml-2">
                        <p><strong>Nicho Amplo:</strong> "Finanças pessoais"</p>
                        <p><strong>Sub-nicho:</strong> "Investimentos para iniciantes"</p>
                        <p><strong>Micro-nicho:</strong> "Como investir os primeiros R$100"</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🎚️ Campo: Nível de Expansão</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Escolha o nível de especificidade desejado:
                    </p>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">📊 Nicho</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Expansão em categorias amplas. Use quando está explorando um mercado pela primeira vez.
                        </p>
                        <p className="text-xs"><strong>Exemplo:</strong> "Finanças pessoais" → "Investimentos", "Economia doméstica", "Aposentadoria"</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">🎯 Sub-nicho (Recomendado)</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Expansão em categorias específicas. Melhor custo-benefício para encontrar oportunidades.
                        </p>
                        <p className="text-xs"><strong>Exemplo:</strong> "Investimentos" → "Ações para iniciantes", "Fundos imobiliários", "Renda fixa"</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">🔬 Micro-nicho</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Expansão ultra-específica. Use para encontrar "oceanos azuis" com zero concorrência.
                        </p>
                        <p className="text-xs"><strong>Exemplo:</strong> "Ações para iniciantes" → "Como comprar sua primeira ação com R$100"</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🤖 Campo: Modelo de IA</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Mesmas opções da Aba 1. Gemini 2.5 Flash é suficiente para maioria dos casos.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📋 Compreendendo as Duas Listas</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      A ferramenta gera DUAS listas diferentes:
                    </p>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">📊 Lista 1: Nichos Gerais</p>
                        <p className="text-xs text-muted-foreground">
                          Categorias amplas dentro do seu nicho. Útil para planejar pilares de conteúdo e 
                          entender o "mapa" completo do mercado. Use para estratégia de longo prazo.
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">🎯 Lista 2: Nichos Muito Específicos</p>
                        <p className="text-xs text-muted-foreground">
                          Micro-nichos acionáveis e prontos para criar conteúdo. Cada item pode virar 
                          um vídeo ou série de vídeos. Use para produção imediata de conteúdo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">⚠️ Erros Comuns</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Escolher "Micro-nicho" quando o input já é específico demais</li>
                      <li>Não entender a diferença entre as duas listas geradas</li>
                      <li>Usar nicho muito vago ("YouTube") - seja mais específico</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500 mb-4">
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>🏆 PRIORIDADE: Entenda os CAMPEÕES Primeiro!</AlertTitle>
              <AlertDescription>
                Campeões são micro-nichos com performance excepcional comprovada. Comece sempre lendo a seção sobre campeões 
                antes de explorar outras análises.
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="champions">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold">🏆 Entendendo os CAMPEÕES (LEIA PRIMEIRO!)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-3">O Que São Campeões?</h4>
                    <p className="text-sm mb-3">
                      Campeões são os <strong>micro-nichos de melhor performance</strong> identificados pela IA. 
                      São suas <strong>PRIORIDADES máximas</strong> - oportunidades validadas com dados reais de múltiplos vídeos virais.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🎯 Como a IA Identifica Campeões?</h4>
                    <div className="space-y-2">
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">1. Análise de Performance</p>
                        <p className="text-xs text-muted-foreground">
                          Calcula média de visualizações por vídeo de cada micro-nicho
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">2. Verificação de Consistência</p>
                        <p className="text-xs text-muted-foreground">
                          Garante que não é apenas 1 vídeo viral, mas um padrão consistente (3-5+ vídeos)
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">3. Validação de Estrutura</p>
                        <p className="text-xs text-muted-foreground">
                          Confirma estrutura de título clara e replicável com múltiplos exemplos
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">4. Ranking Comparativo</p>
                        <p className="text-xs text-muted-foreground">
                          Compara performance entre os TOP 25 micro-nichos e seleciona até 10 campeões
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">✅ Critérios de CAMPEÃO</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Média de Views Superior</p>
                          <p className="text-xs text-muted-foreground">
                            Significativamente acima da média geral do nicho
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Padrão Comprovado</p>
                          <p className="text-xs text-muted-foreground">
                            Pelo menos 3-5 vídeos comprovando o padrão de sucesso
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Estrutura Clara</p>
                          <p className="text-xs text-muted-foreground">
                            Formato de título bem definido e fácil de replicar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Tema Específico</p>
                          <p className="text-xs text-muted-foreground">
                            Micro-nicho bem definido e não genérico demais
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Potencial de Série</p>
                          <p className="text-xs text-muted-foreground">
                            Permite criar múltiplos vídeos e série de conteúdo
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-3">🚀 Como Usar os Campeões?</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <strong>PRIORIZE CAMPEÕES:</strong>
                        <span className="text-muted-foreground"> Comece sempre pelos campeões identificados</span>
                      </li>
                      <li>
                        <strong>ANALISE ESTRUTURAS:</strong>
                        <span className="text-muted-foreground"> Estude os títulos de exemplo de cada campeão</span>
                      </li>
                      <li>
                        <strong>REPLIQUE PADRÕES:</strong>
                        <span className="text-muted-foreground"> Use as estruturas como templates para seus títulos</span>
                      </li>
                      <li>
                        <strong>VALIDE COM NICHE FINDER:</strong>
                        <span className="text-muted-foreground"> Confirme demanda antes de produzir</span>
                      </li>
                      <li>
                        <strong>CRIE SÉRIES:</strong>
                        <span className="text-muted-foreground"> Campeões são ideais para séries de vídeos (3-10 vídeos)</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-primary/10 border border-primary p-4 rounded-lg">
                    <p className="font-bold mb-2">⚡ Por Que Campeões São Diferentes?</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>Risco Minimizado:</strong> Performance já validada com dados reais</li>
                      <li>• <strong>Estrutura Pronta:</strong> Você replica sucesso, não adivinha</li>
                      <li>• <strong>Alta Probabilidade:</strong> 70-80% de chance de performar acima da média</li>
                      <li>• <strong>Escalável:</strong> Permite criar série completa de conteúdo</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="title-patterns">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Interpretando Padrões de Títulos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">📊 O Que a IA Identifica</h4>
                    <div className="space-y-2">
                      <div className="border-l-4 border-yellow-500 pl-3 bg-yellow-50 dark:bg-yellow-950 py-2">
                        <p className="font-medium text-sm flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          CAMPEÕES (até 10 micro-nichos)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Os micro-nichos de melhor performance do TOP 25, com estruturas validadas
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">Ranking TOP 25 Micro-nichos</p>
                        <p className="text-xs text-muted-foreground">
                          Todos os micro-nichos ordenados por performance, com média de views
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">Temas Recorrentes</p>
                        <p className="text-xs text-muted-foreground">
                          Assuntos que aparecem repetidamente nos títulos de sucesso
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">Formatos Vencedores</p>
                        <p className="text-xs text-muted-foreground">
                          Estruturas de títulos que geram mais cliques (ex: perguntas, números, urgência)
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">Palavras-Chave Poderosas</p>
                        <p className="text-xs text-muted-foreground">
                          Termos que aparecem em vídeos virais do nicho
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-medium text-sm">Gatilhos Emocionais</p>
                        <p className="text-xs text-muted-foreground">
                          Elementos que despertam curiosidade, urgência ou desejo
                        </p>
                      </div>
                      <div className="border-l-4 border-destructive pl-3">
                        <p className="font-medium text-sm">Análise de Falhas (TOP 8)</p>
                        <p className="text-xs text-muted-foreground">
                          Micro-nichos com pior performance e motivos do fracasso para evitar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🎯 Como Usar os Insights</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li><strong>PRIORIDADE:</strong> Foque primeiro nos CAMPEÕES identificados (até 10)</li>
                      <li>Analise a estrutura de título de cada campeão e os exemplos fornecidos</li>
                      <li>Estude o ranking completo de TOP 25 para entender diferenças de performance</li>
                      <li>Identifique os 3-5 temas mais mencionados pela IA</li>
                      <li>Analise quais formatos de título são dominantes</li>
                      <li>Crie um "banco de palavras-chave" baseado nos padrões dos campeões</li>
                      <li>Use esses padrões na ferramenta "Títulos Virais"</li>
                      <li>Aprenda com a análise de falhas (TOP 8) para evitar erros comuns</li>
                      <li>Valide os campeões com "Niche Finder" antes de produzir</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="niche-opportunities">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Identificando Oportunidades de Nicho</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🔍 Critérios de Oportunidade</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Um bom micro-nicho deve ter:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Demanda Comprovada</p>
                          <p className="text-xs text-muted-foreground">
                            Pessoas buscando esse conteúdo (valide com Niche Finder)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Baixa Concorrência</p>
                          <p className="text-xs text-muted-foreground">
                            Poucos canais grandes dominando o tema
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Especificidade</p>
                          <p className="text-xs text-muted-foreground">
                            Nicho definido o suficiente para atrair público engajado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Potencial de Série</p>
                          <p className="text-xs text-muted-foreground">
                            Permite criar múltiplos vídeos sobre o tema
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🚩 Sinais de Alerta</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Nicho muito específico (audiência pequena demais)</li>
                      <li>Saturação de canais grandes no tema</li>
                      <li>Tendência passageira (pode morrer rápido)</li>
                      <li>Difícil de monetizar (sem produtos/afiliados relacionados)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Resultados Gerados</h3>
              
              <div className="space-y-4">
                <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    🏆 Análise de Títulos - Estrutura dos 3 Resumos
                  </h4>
                  <p className="text-sm mb-3">
                    A análise retorna <strong>3 resumos complementares</strong> que você deve usar em conjunto:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-background p-3 rounded border-l-4 border-primary">
                      <p className="font-bold text-sm mb-2">📋 RESUMO 1: Estrutura Hierárquica</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>Nicho principal</strong> identificado</li>
                        <li><strong>Sub-nichos</strong> (2-4 categorias amplas)</li>
                        <li><strong>Micro-nichos TOP 25</strong> ordenados por performance</li>
                        <li><strong>ATÉ 10 CAMPEÕES</strong> marcados com destaque especial</li>
                      </ul>
                    </div>

                    <div className="bg-background p-3 rounded border-l-4 border-yellow-500">
                      <p className="font-bold text-sm mb-2">🏆 RESUMO 2: Ranking de Performance (PRIORIDADE!)</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        TOP 25 micro-nichos ordenados por média de views. Para cada micro-nicho:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>Média de visualizações</strong> (número exato)</li>
                        <li><strong>Badge de CAMPEÃO</strong> (se aplicável) - FOQUE NESTES!</li>
                        <li><strong>Estrutura de título dominante</strong> (formato replicável)</li>
                        <li><strong>2-3 exemplos reais</strong> de títulos de sucesso</li>
                        <li><strong>Temas e palavras-chave</strong> recorrentes</li>
                      </ul>
                    </div>

                    <div className="bg-background p-3 rounded border-l-4 border-destructive">
                      <p className="font-bold text-sm mb-2">⚠️ RESUMO 3: Análise de Falhas</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        TOP 8 micro-nichos com PIOR performance. Para cada falha:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>2 exemplos</strong> de títulos que NÃO funcionaram</li>
                        <li><strong>Motivo da falha</strong> (máx 30 palavras)</li>
                        <li><strong>O que evitar</strong> em seus títulos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">💡 Como Interpretar os Resultados</h4>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-yellow-500 pl-3 bg-yellow-50 dark:bg-yellow-950 py-2">
                      <p className="font-bold text-sm mb-1">🏆 Foque nos CAMPEÕES (Sempre Primeiro!)</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>São suas oportunidades de ouro validadas com dados reais</li>
                        <li>Estruturas comprovadas com múltiplos vídeos virais</li>
                        <li>Alta probabilidade de sucesso (70-80%)</li>
                        <li>Comece sempre pelos 3-5 campeões mais promissores</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-bold text-sm mb-1">📊 Use os Rankings para Comparar</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>TOP 25 mostra todas as oportunidades ranqueadas</li>
                        <li>Compare médias de views entre campeões vs não-campeões</li>
                        <li>Entenda O QUE diferencia alta vs baixa performance</li>
                        <li>Identifique padrões de estrutura entre os melhores</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-bold text-sm mb-1">⚠️ Aprenda com as Falhas</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>Evite padrões de títulos que comprovadamente não funcionam</li>
                        <li>Entenda erros comuns do seu nicho</li>
                        <li>Refine suas estratégias eliminando o que não funciona</li>
                        <li>Use como "checklist negativo" ao criar títulos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Expansão de Nicho
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Você recebe DUAS listas complementares:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-background p-3 rounded">
                      <p className="font-medium text-sm mb-1">📊 Lista 1: Visão Panorâmica</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        10-15 categorias gerais que mapeiam o nicho completo
                      </p>
                      <p className="text-xs">
                        <strong>Use para:</strong> Planejar pilares de conteúdo, entender mercado, estratégia de canal
                      </p>
                    </div>
                    <div className="bg-background p-3 rounded">
                      <p className="font-medium text-sm mb-1">🎯 Lista 2: Ideias Acionáveis</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        15-25 micro-nichos específicos e prontos para criar vídeos
                      </p>
                      <p className="text-xs">
                        <strong>Use para:</strong> Produção imediata, brainstorm de títulos, validação com Niche Finder
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">💾 Como Salvar e Organizar os Resultados</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li><strong>Copie os 3 resumos</strong> completos para um documento separado</li>
                    <li><strong>Destaque os CAMPEÕES</strong> com marcador especial (ex: ⭐ ou cor diferente)</li>
                    <li><strong>Categorize por prioridade:</strong>
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                        <li>Alta: Campeões (até 10)</li>
                        <li>Média: TOP 25 não-campeões com bom potencial</li>
                        <li>Baixa: Micro-nichos para explorar depois</li>
                      </ul>
                    </li>
                    <li><strong>Valide os campeões</strong> usando "Niche Finder" antes de produzir</li>
                    <li><strong>Crie banco de estruturas:</strong> Salve as estruturas de título dos campeões como templates</li>
                    <li><strong>Anote as falhas:</strong> Mantenha lista do que NÃO fazer baseado no Resumo 3</li>
                    <li><strong>Planeje série:</strong> Use campeões para criar séries de 3-10 vídeos</li>
                    <li><strong>Revisite mensalmente:</strong> Atualize baseado em resultados e novas análises</li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>🏆 ESTRATÉGIA #0: Comece com os CAMPEÕES!</AlertTitle>
              <AlertDescription>
                A estratégia mais importante de todas. Leia e aplique ANTES de explorar outras estratégias.
              </AlertDescription>
            </Alert>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">🚀 Estratégias Avançadas</h3>
              <p className="text-sm text-muted-foreground">
                Aproveite ao máximo o Sub-Niche Hunter com estas estratégias comprovadas
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="strategy-0">
                <AccordionTrigger>
                  <span className="font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    0. Estratégia dos CAMPEÕES (COMECE AQUI!)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <p className="font-bold text-lg mb-2">A estratégia mais importante de todas.</p>
                    <p className="text-sm text-muted-foreground">
                      Use os campeões identificados pela IA para criar conteúdo com <strong>70-80% de chance</strong> de 
                      performar acima da média do seu nicho.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <p className="font-medium text-sm mb-3">📋 Passo a Passo Completo:</p>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                      <li>
                        <strong className="text-foreground">Execute a Análise de Títulos</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Cole 30-80 títulos do seu nicho (mais títulos = melhor)</li>
                          <li>Aguarde análise completa (20-40 segundos com 5 etapas de progresso)</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-foreground">IDENTIFIQUE OS CAMPEÕES</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Procure badges/marcadores "CAMPEÃO" ou "isChampion: true" no Resumo 2</li>
                          <li>Você terá até 10 campeões identificados</li>
                          <li>Foque primeiro nestes - ignore o resto por enquanto</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-foreground">ANALISE CADA CAMPEÃO EM DETALHE</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Leia a estrutura de título (formato, palavras-chave, gatilhos)</li>
                          <li>Estude os 2-3 exemplos reais fornecidos</li>
                          <li>Identifique padrões: números, gatilhos emocionais, formato exato</li>
                          <li>Anote a média de views do campeão</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-foreground">VALIDE O CAMPEÃO</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Use "Niche Finder" para buscar o micro-nicho do campeão</li>
                          <li>Confirme: VPH médio +100 e múltiplos vídeos com +50k views</li>
                          <li>Busque no YouTube para ver concorrência atual</li>
                          <li>Confirme que você consegue produzir sobre o tema</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-foreground">REPLIQUE A ESTRUTURA</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Use a estrutura do campeão como template exato</li>
                          <li>Adapte para seu estilo/tom de voz</li>
                          <li>Crie 5-10 variações de títulos mantendo a estrutura</li>
                          <li>Mantenha elementos-chave: números, gatilhos, formato</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-foreground">PRODUZA CONTEÚDO ESTRATEGICAMENTE</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                          <li>Comece pelos 3 campeões mais promissores (maior média de views)</li>
                          <li>Produza 2-3 vídeos por campeão antes de mudar</li>
                          <li>Aguarde 7-14 dias para analisar resultados</li>
                          <li>Se performar bem, crie série de 5-10 vídeos no campeão</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <p className="font-medium text-sm mb-2">🎯 Exemplo Prático Real:</p>
                    <div className="space-y-3 text-sm">
                      <div className="bg-background p-3 rounded">
                        <p className="font-bold mb-1 text-xs">Campeão Identificado:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                          <li><strong>Micro-nicho:</strong> "Histórias verdadeiras de superação"</li>
                          <li><strong>Média de views:</strong> 450,000 (vs média do nicho: 80,000)</li>
                          <li><strong>Estrutura:</strong> "[NÚMERO] TRUE Stories of [TEMA EMOCIONAL]"</li>
                          <li><strong>Exemplos reais:</strong>
                            <ul className="list-circle list-inside ml-4 mt-1">
                              <li>"5 TRUE Stories That Will Make You Cry"</li>
                              <li>"10 TRUE Survival Stories Against All Odds"</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-background p-3 rounded">
                        <p className="font-bold mb-1 text-xs">Sua Replicação (adaptada ao português):</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                          <li>"7 Histórias REAIS de Superação Impossível"</li>
                          <li>"5 VERDADEIRAS Histórias Que Mudaram Vidas Para Sempre"</li>
                          <li>"10 Relatos VERÍDICOS Que Vão Te Emocionar Até o Fim"</li>
                          <li>"3 Histórias REAIS de Pessoas Que Não Desistiram"</li>
                        </ul>
                        <p className="text-xs mt-2">
                          ✅ <strong>Manteve:</strong> Número + palavra "real/verdadeiro" + tema emocional
                        </p>
                      </div>

                      <div className="bg-primary/10 p-3 rounded border border-primary">
                        <p className="font-bold mb-1 text-xs">Resultado Esperado:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                          <li>Performance 3-5x acima da sua média atual</li>
                          <li>CTR 20-30% maior por usar estrutura validada</li>
                          <li>Audiência engajada (comentários, compartilhamentos altos)</li>
                          <li>Algoritmo favorece por retenção e engajamento</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary p-4 rounded-lg">
                    <p className="font-bold mb-2">⚡ Por Que Esta Estratégia Funciona:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <span><strong>Estrutura Validada:</strong> Já comprovada com múltiplos vídeos virais reais</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <span><strong>Risco Minimizado:</strong> Não está adivinhando, está replicando sucesso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <span><strong>Performance Previsível:</strong> Dados históricos indicam alta probabilidade</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <span><strong>Escalável:</strong> Cada campeão pode virar série de 5-10 vídeos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">⏱️ Tempo Total: 3-5 horas</Badge>
                    <Badge variant="default" className="text-xs bg-green-600">🎯 Taxa de Sucesso: 70-80%</Badge>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-1">
                <AccordionTrigger>
                  <span className="font-medium">1. Descoberta de Oceano Azul com CAMPEÕES</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Encontre nichos com demanda mas SEM concorrência estabelecida, priorizando CAMPEÕES.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Passo a Passo Atualizado:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li><strong>Execute Análise de Títulos</strong> com 50-80 títulos do nicho amplo</li>
                      <li><strong>Identifique os CAMPEÕES</strong> (até 10) no Resumo 2</li>
                      <li><strong>Analise o ranking TOP 25</strong> para encontrar campeões com baixa concorrência</li>
                      <li>Para cada campeão, busque no YouTube: "[micro-nicho campeão] + tutorial"</li>
                      <li>Identifique quais têm <strong>menos de 5 canais grandes</strong> (100k+ subs)</li>
                      <li>Valide demanda com "Niche Finder" (VPH +100)</li>
                      <li><strong>Priorize campeões</strong> com alta demanda + baixa concorrência</li>
                      <li>Produza 3-5 vídeos usando estrutura do campeão antes da concorrência chegar</li>
                    </ol>
                  </div>
                  <Badge variant="outline">⏱️ Tempo: 2-3 horas | 🎯 Resultado: Campeão em oceano azul = jackpot!</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-2">
                <AccordionTrigger>
                  <span className="font-medium">2. Engenharia Reversa com Sistema de Loading</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Descubra o que funciona para seus competidores, aprenda com falhas e adapte para seu canal.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Passo a Passo Atualizado:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Identifique 3-5 canais de sucesso no seu nicho (200k-1M subs)</li>
                      <li>Extraia 50-80 títulos dos vídeos mais populares deles (máximo capacidade!)</li>
                      <li>Execute "Análise de Títulos" e acompanhe as <strong>5 etapas de progresso</strong></li>
                      <li>Foque nos <strong>CAMPEÕES identificados</strong> (estruturas de ouro)</li>
                      <li>Analise o <strong>Resumo 3 (Falhas)</strong> para evitar erros dos concorrentes</li>
                      <li>Aplique estruturas dos campeões no seu conteúdo</li>
                      <li>Combine com seus micro-nichos únicos da Expansão de Nicho</li>
                      <li>Crie títulos "híbridos": <strong>estrutura de campeão + seu nicho único</strong></li>
                    </ol>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">💡 Exemplo Prático Atualizado:</p>
                    <div className="text-xs space-y-2">
                      <p className="text-muted-foreground">
                        <strong>Campeão do Concorrente:</strong> "Como Ganhar R$10.000/mês com Dropshipping [7 Passos]"<br/>
                        <strong>Estrutura identificada:</strong> "Como Ganhar [VALOR]/mês com [MÉTODO] [NÚMERO Passos]"<br/>
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Seu Nicho:</strong> Artesanato<br/>
                        <strong>Títulos Híbridos:</strong><br/>
                        • "Como Ganhar R$5.000/mês com Artesanato [5 Passos Simples]"<br/>
                        • "Como Faturar R$8.000/mês Vendendo Crochê [Guia Completo]"
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">⏱️ Tempo: 1-2 horas | 🎯 Resultado: Estruturas de campeões adaptadas ao seu nicho</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-3">
                <AccordionTrigger>
                  <span className="font-medium">3. Validação Antes de Produzir</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nunca produza um vídeo sem validar a demanda do nicho primeiro.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Workflow Completo:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li><strong>Sub-Niche Hunter:</strong> Gere lista de micro-nichos</li>
                      <li><strong>Niche Finder:</strong> Busque cada micro-nicho e analise métricas</li>
                      <li><strong>Critério:</strong> VPH médio +100, pelo menos 3 vídeos com +50k views</li>
                      <li><strong>Brainstorm:</strong> Gere 10 ideias para os nichos validados</li>
                      <li><strong>Produção:</strong> Crie conteúdo com confiança na demanda</li>
                    </ol>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">🎯 Critérios de Validação:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                      <li>✅ VPH médio acima de 100 = Demanda consistente</li>
                      <li>✅ Múltiplos vídeos virais = Nicho comprovado</li>
                      <li>✅ Canais pequenos com views altos = Baixa barreira de entrada</li>
                      <li>❌ Apenas 1 canal viral = Pode ser outlier</li>
                      <li>❌ VPH baixo (-50) = Demanda fraca</li>
                    </ul>
                  </div>
                  <Badge variant="outline">⏱️ Tempo: 30 min/nicho | 🎯 Resultado: 90% menos risco de fracasso</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-4">
                <AccordionTrigger>
                  <span className="font-medium">4. Criação de Séries de Alto Engajamento</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Transforme micro-nichos em séries de vídeos que retêm audiência.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Estrutura de Série:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Escolha 1 micro-nicho da Lista 2</li>
                      <li>Use Expansão de Nicho novamente nesse micro-nicho (vai mais fundo)</li>
                      <li>Crie estrutura de série: Introdução → Intermediário → Avançado</li>
                      <li>Cada vídeo referencia o anterior e o próximo</li>
                      <li>Crie playlist e promova a série completa</li>
                    </ol>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">💡 Exemplo de Série:</p>
                    <p className="text-xs text-muted-foreground">
                      Micro-nicho: "Investir em FIIs"<br/>
                      Série de 5 vídeos:<br/>
                      1. O Que São FIIs e Por Que Investir<br/>
                      2. Como Escolher Seu Primeiro FII<br/>
                      3. Estratégia de Diversificação em FIIs<br/>
                      4. Erros Fatais em FIIs (E Como Evitar)<br/>
                      5. Vivendo de Renda com FIIs: Plano Completo
                    </p>
                  </div>
                  <Badge variant="outline">⏱️ Resultado: +40% retenção de audiência | 🎯 Benefício: Algoritmo favorece</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-5">
                <AccordionTrigger>
                  <span className="font-medium">5. Combinação com Outras Ferramentas</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Maximize resultados combinando Sub-Niche Hunter com outras ferramentas do sistema.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🎯 Sub-Niche Hunter + Niche Finder</p>
                      <p className="text-xs text-muted-foreground">
                        Gere micro-nichos → Valide demanda → Escolha os melhores
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">💡 Sub-Niche Hunter + Brainstorm</p>
                      <p className="text-xs text-muted-foreground">
                        Micro-nichos validados → Gere 10 ideias por nicho → Banco de 100+ ideias
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">✍️ Sub-Niche Hunter + Títulos Virais</p>
                      <p className="text-xs text-muted-foreground">
                        Análise de títulos → Identifique formatos → Aplique em novos micro-nichos
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">📊 Sub-Niche Hunter + Monitoramento</p>
                      <p className="text-xs text-muted-foreground">
                        Identifique micro-nichos → Monitore concorrentes neles → Reaja rápido a tendências
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-6">
                <AccordionTrigger>
                  <span className="font-medium">6. Análise de Tendências Emergentes</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Identifique tendências antes delas se tornarem mainstream.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Sistema de Detecção:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Colete títulos de canais pequenos (10-50k subs) do seu nicho</li>
                      <li>Analise com Sub-Niche Hunter mensalmente</li>
                      <li>Compare temas com análise do mês anterior</li>
                      <li>Novos temas que aparecem = tendências emergentes</li>
                      <li>Produza conteúdo sobre eles ANTES dos canais grandes</li>
                      <li>Posicione-se como autoridade quando a tendência explodir</li>
                    </ol>
                  </div>
                  <Badge variant="outline">⏱️ Frequência: Mensal | 🎯 Resultado: Vantagem competitiva de 3-6 meses</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>
                  <span className="font-medium">📅 Rotina Recomendada com CAMPEÕES</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-2">🗓️ Mensal (1ª semana):</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li><strong>Análise de títulos</strong> com 50-80 títulos dos concorrentes do mês anterior</li>
                        <li><strong>Identificação de CAMPEÕES</strong> - priorize análise destes primeiro</li>
                        <li><strong>Comparação com mês anterior:</strong> Campeões mudaram? Novos surgiram?</li>
                        <li>Análise do <strong>TOP 25 completo</strong> para identificar tendências</li>
                        <li>Revisão das <strong>Falhas (Resumo 3)</strong> para atualizar checklist negativo</li>
                        <li>Expansão de 2-3 campeões mais promissores</li>
                      </ul>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-2">🗓️ Quinzenal:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li><strong>Validação de campeões</strong> com Niche Finder (VPH +100)</li>
                        <li>Atualização do banco de estruturas de campeões</li>
                        <li>Teste A/B: Títulos de campeão vs títulos próprios</li>
                        <li>Análise de performance dos vídeos baseados em campeões</li>
                      </ul>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-2">🗓️ Trimestral:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li>Revisão completa da estratégia: Campeões ainda performando?</li>
                        <li><strong>Análise de ROI:</strong> Qual campeão gerou mais views/receita?</li>
                        <li>Identificação de "super-campeões" - campeões que viraram série de sucesso</li>
                        <li>Ajuste de direcionamento baseado em resultados de campeões</li>
                        <li>Planejamento de conteúdo: Quais campeões expandir nos próximos 3 meses?</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="mistakes">
                <AccordionTrigger>
                  <span className="font-medium">⚠️ Erros Comuns e Como Evitar</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="border-l-4 border-yellow-500 pl-3 bg-yellow-50 dark:bg-yellow-950 py-2">
                      <p className="font-medium text-sm">❌ ERRO #1: Ignorar os CAMPEÕES</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        O erro mais grave! Focar em micro-nichos comuns e ignorar campeões identificados.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> SEMPRE comece pelos campeões. São suas melhores oportunidades validadas.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Análise com Poucos Dados</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Usar menos de 30 títulos resulta em poucos/nenhum campeão identificado.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Use 50-80 títulos para maximizar identificação de campeões.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Não Validar Campeões</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Produzir baseado em campeão sem validar demanda atual com Niche Finder.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> SEMPRE valide campeões antes de produzir (VPH +100).</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Não Replicar Estrutura dos Campeões</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Ver os exemplos de campeões mas criar títulos completamente diferentes.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Replique EXATAMENTE a estrutura (números, gatilhos, formato) dos campeões.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Não Entender os 3 Resumos</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Ler apenas um resumo e perder insights dos outros (hierarquia, ranking, falhas).
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Leia os 3 resumos. Resumo 2 (ranking) é o mais importante - foque nele!</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Micro-Nicho Demais</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Escolher nichos tão específicos que não têm audiência suficiente.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Valide que existem pelo menos 3-5 vídeos com +50k views no nicho.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Ignorar as Falhas</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Não ler o Resumo 3 (Falhas) e repetir erros dos concorrentes.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Use Resumo 3 como checklist do que NÃO fazer em seus títulos.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Análise Única</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Fazer análise uma vez e nunca mais revisar. Campeões mudam!
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Análise mensal para detectar novos campeões e tendências.</p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Produzir Demais em Um Campeão</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Criar 20 vídeos em um campeão sem testar primeiro.
                      </p>
                      <p className="text-xs">✅ <strong>Solução:</strong> Teste com 2-3 vídeos, valide performance, depois escale.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-champions">
                <AccordionTrigger>
                  <span className="font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    ❓ FAQ sobre CAMPEÕES
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Quantos campeões a ferramenta identifica?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Até 10 campeões, dependendo da qualidade e quantidade dos títulos analisados. 
                        Alguns nichos podem ter menos se não houver micro-nichos com performance excepcional clara. 
                        É melhor ter 5 campeões verdadeiros que 10 medíocres.
                      </p>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: O que fazer se nenhum campeão for identificado?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Isso significa que os títulos analisados não têm padrões claros de performance superior. Tente:
                      </p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 mt-1">
                        <li>Analisar títulos de canais maiores/mais virais do nicho</li>
                        <li>Aumentar quantidade de títulos (use 60-80 em vez de 30-40)</li>
                        <li>Focar em um nicho mais específico</li>
                        <li>Garantir que está analisando apenas vídeos com +100k views</li>
                      </ul>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Devo ignorar micro-nichos não-campeões?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Não! Campeões são <strong>prioridade</strong>, mas micro-nichos do TOP 25 não-campeões 
                        ainda podem ser boas oportunidades. Use campeões primeiro (70% do seu conteúdo), depois explore 
                        outros do TOP 25 (30%). Nunca use micro-nichos fora do TOP 25.
                      </p>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Por que o número de campeões varia entre análises?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> A IA só marca como campeão micro-nichos que realmente se destacam em performance. 
                        Fatores que influenciam: qualidade dos títulos analisados, distribuição de views, consistência de padrões. 
                        É um sistema de qualidade, não quantidade.
                      </p>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Como sei se um campeão é realmente bom?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Valide com Niche Finder e YouTube:
                      </p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 mt-1">
                        <li>✅ VPH médio +100 no Niche Finder = Demanda consistente</li>
                        <li>✅ Múltiplos vídeos (3+) com +50k views = Padrão validado</li>
                        <li>✅ Média de views do campeão 2-3x maior que média do nicho = Campeão legítimo</li>
                        <li>✅ Estrutura de título clara nos exemplos = Fácil de replicar</li>
                      </ul>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Posso combinar estruturas de diferentes campeões?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Sim, mas com cuidado! Você pode combinar elementos (ex: números de um + gatilho emocional 
                        de outro), mas mantenha a estrutura base de UM campeão. Testar combinações é avançado - 
                        comece replicando estruturas individuais primeiro.
                      </p>
                    </div>

                    <div className="bg-muted p-3 rounded">
                      <p className="font-bold text-sm mb-1">Q: Quanto tempo um campeão permanece válido?</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>R:</strong> Varia por nicho. Geralmente:
                      </p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 mt-1">
                        <li>Nichos evergreen (finanças, saúde): 6-12 meses</li>
                        <li>Nichos moderados (tecnologia, educação): 3-6 meses</li>
                        <li>Nichos trendy (moda, games): 1-3 meses</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Recomendação:</strong> Reanálise mensal para identificar se campeões ainda performam.
                      </p>
                    </div>

                    <div className="bg-primary/10 border border-primary p-3 rounded">
                      <p className="font-bold text-sm mb-1">💡 Dica de Ouro sobre Campeões:</p>
                      <p className="text-xs">
                        Se você encontrar um campeão em <strong>oceano azul</strong> (baixa concorrência + alta demanda + 
                        estrutura validada), você achou uma mina de ouro! Esse é o santo graal do YouTube: 
                        <strong> estrutura validada + nicho inexplorado = sucesso quase garantido.</strong>
                      </p>
                    </div>
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
