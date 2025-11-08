import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, HelpCircle, Zap, Lightbulb, CheckCircle, AlertCircle, Eye, TrendingUp, Calendar, BarChart, Filter } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Monitoramento de Concorrentes</CardTitle>
        <p className="text-muted-foreground">
          Guia detalhado para monitorar concorrentes e descobrir conteúdos virais
        </p>
      </CardHeader>
      <CardContent>
        {/* META DA FERRAMENTA */}
        <Alert className="mb-6 bg-primary/5 border-primary/20">
          <Target className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">🎯 Objetivo Principal</AlertTitle>
          <AlertDescription className="text-base">
            Monitorar continuamente canais concorrentes para detectar vídeos virais em tempo real, 
            identificar tendências antes da competição e descobrir formatos vencedores para replicar.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="quick-start" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="quick-start">🚀 Início Rápido</TabsTrigger>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="setup">Configuração</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="advanced">🔥 Recursos Avançados</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
            <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
          </TabsList>

          {/* INÍCIO RÁPIDO */}
          <TabsContent value="quick-start" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Guia Rápido para Iniciantes
              </h3>

              {/* COMPARAÇÃO COM CANAIS SIMILARES */}
              <Alert className="mb-4 bg-blue-500/10 border-blue-500/20">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>🤔 Monitoramento vs Canais Similares - Qual Usar?</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-3">
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-2">📊 Canais Similares:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        <li><strong>Objetivo:</strong> DESCOBRIR novos canais parecidos</li>
                        <li><strong>Quando usar:</strong> Início - para mapear o nicho</li>
                        <li><strong>Frequência:</strong> Pontual (1x ou esporadicamente)</li>
                        <li><strong>Resultado:</strong> Lista de canais para conhecer</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-primary/5 rounded border-2 border-primary/30">
                      <p className="font-semibold mb-2">👁️ Monitoramento de Concorrentes:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        <li><strong>Objetivo:</strong> ACOMPANHAR canais já conhecidos</li>
                        <li><strong>Quando usar:</strong> Depois de conhecer os concorrentes</li>
                        <li><strong>Frequência:</strong> Contínua (diária/semanal)</li>
                        <li><strong>Resultado:</strong> Detectar vídeos virais, tendências, formatos</li>
                      </ul>
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    💡 Fluxo recomendado: Use "Canais Similares" primeiro para descobrir → 
                    Depois adicione os melhores ao "Monitoramento" para acompanhar!
                  </p>
                </AlertDescription>
              </Alert>

              {/* NUNCA USOU ANÁLISE DO YOUTUBE */}
              <Alert className="mb-4 bg-background">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Nunca usou ferramentas de monitoramento?</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Conceitos básicos que você precisa saber:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Concorrente:</strong> Canal que faz conteúdo similar ao seu (mesmo nicho)</li>
                    <li><strong>Vídeo Explosivo:</strong> Vídeo crescendo muito rápido em views</li>
                    <li><strong>VPH:</strong> Views Por Hora - velocidade de crescimento do vídeo</li>
                    <li><strong>Nicho:</strong> Categoria de organização dos seus concorrentes</li>
                    <li><strong>Atualização:</strong> Buscar novos vídeos e atualizar métricas dos existentes</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* QUANTOS CONCORRENTES MONITORAR */}
              <Card className="p-4 mb-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  🎯 Quantos Concorrentes Devo Monitorar?
                </h4>

                <div className="space-y-3">
                  <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                    <Badge className="mb-2">Iniciante</Badge>
                    <p className="font-semibold">3-5 concorrentes</p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Fácil de gerenciar e analisar</li>
                      <li>Foco nos principais competidores diretos</li>
                      <li>Tempo de análise: 10-15 min/dia</li>
                      <li><strong>Ideal para:</strong> Quem está começando ou tem nicho muito específico</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                    <Badge className="mb-2">Intermediário</Badge>
                    <p className="font-semibold">10-15 concorrentes</p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Cobertura ampla do nicho</li>
                      <li>Detecta tendências com mais confiança</li>
                      <li>Tempo de análise: 20-30 min/dia</li>
                      <li><strong>Ideal para:</strong> Criadores estabelecidos que querem crescer</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                    <Badge className="mb-2">Avançado</Badge>
                    <p className="font-semibold">20-30 concorrentes</p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Visão completa do ecossistema</li>
                      <li>Identifica micro-tendências rapidamente</li>
                      <li>Tempo de análise: 45-60 min/dia</li>
                      <li><strong>Ideal para:</strong> Profissionais, agências, creators em tempo integral</li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-3 bg-orange-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>⚠️ Importante:</strong> Mais concorrentes ≠ melhor resultado. 
                    Prefira 5 concorrentes MUITO relevantes do que 30 genéricos. Qualidade &gt; Quantidade!
                  </AlertDescription>
                </Alert>
              </Card>

              {/* CHECKLIST */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">✅ Checklist Passo a Passo:</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">1</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Adicione Seus Primeiros Concorrentes
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cole URL de 3-5 canais do seu nicho e clique em "Adicionar Concorrente".
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">2</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                        Organize em Nichos (Opcional mas Recomendado)
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie nichos como "True Crime", "Vlogs" e atribua concorrentes a eles.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">3</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Aguarde a Coleta Inicial de Dados
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sistema busca todos os vídeos automaticamente (1-3 min por canal).
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">4</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                        Filtre por Vídeos "Explosivos" ou "Virais"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use o filtro de Status para ver apenas vídeos de destaque.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">5</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        Analise os Padrões dos Vídeos Virais
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Observe títulos, thumbnails, duração, tópicos em comum. Replique o que funciona!
                      </p>
                      <Badge className="mt-2" variant="secondary">🔴 Avançado</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">6</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Atualize Regularmente
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em "Atualizar Todos" 2-3x por semana para manter dados frescos.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">7</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                        Explore o Dashboard de Tendências
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use a aba "Tendências" para ver gráficos de evolução de VPH e views ao longo do tempo.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">8</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        Configure Alertas para Vídeos Explosivos
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acesse a aba "Alertas" para ser notificado automaticamente de novos vídeos virais.
                      </p>
                      <Badge className="mt-2" variant="secondary">🔴 Avançado</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">9</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        Use Comparação de Vídeos
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Selecione até 6 vídeos (checkboxes) para comparar lado a lado e identificar padrões vencedores.
                      </p>
                      <Badge className="mt-2" variant="secondary">🔴 Avançado</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMO LER OS DADOS */}
              <Card className="p-4 mt-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  📊 Como Ler os Dados dos Vídeos
                </h4>

                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">🔥 VPH (Views Por Hora)</p>
                    <p><strong>O que significa:</strong> Velocidade de crescimento do vídeo</p>
                    <p className="mt-1">
                      <Badge variant="outline" className="mr-2">10-50 VPH</Badge> Bom desempenho
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">50-100 VPH</Badge> Muito bom
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">100-500 VPH</Badge> Viral! 🚀
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">500+ VPH</Badge> Mega viral! 💥
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> VPH alto = formato/tópico funcionando. Analise e replique!
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">👁️ Views (Visualizações)</p>
                    <p><strong>O que significa:</strong> Total de pessoas que assistiram</p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> Compare views com idade do vídeo. 100K views em 1 dia &gt;&gt; 100K views em 1 mês.
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">❤️ Likes e 💬 Comentários</p>
                    <p><strong>O que significa:</strong> Nível de engajamento da audiência</p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> Alto engajamento = tópico que gera emoção/discussão. Ótimo para replicar!
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">🏷️ Status (Explosivo/Viral/Em Alta/Normal)</p>
                    <p><strong>O que significa:</strong> Classificação automática de performance</p>
                    <p>
                      <Badge className="bg-red-600 mr-2">🚀 Explosivo</Badge> Crescendo MUITO rápido agora
                    </p>
                    <p>
                      <Badge className="bg-orange-600 mr-2">🔥 Viral</Badge> Performance excepcional
                    </p>
                    <p>
                      <Badge className="bg-yellow-600 mr-2">⚡ Em Alta</Badge> Acima da média
                    </p>
                    <p>
                      <Badge className="bg-gray-600 mr-2">✅ Normal</Badge> Performance padrão
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> Foque em "Explosivos" e "Virais" para identificar tendências quentes!
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">⭐ Score de Explosividade (0-100)</p>
                    <p><strong>O que significa:</strong> Pontuação numérica da intensidade da explosividade</p>
                    <p className="mt-1">
                      <Badge variant="outline" className="mr-2">0-30</Badge> Performance normal
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">30-60</Badge> Bom desempenho
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">60-85</Badge> Viral! 🔥
                    </p>
                    <p>
                      <Badge variant="outline" className="mr-2">85-100</Badge> Mega explosivo! 💥
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> Quanto maior o score, mais impressionante é o desempenho do vídeo!
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-1">🎯 Motivo da Explosividade</p>
                    <p><strong>O que significa:</strong> Por que o vídeo foi classificado como explosivo</p>
                    <p className="mt-1 text-sm space-y-1">
                      <p>• "VPH excepcional para canal pequeno" - Canal micro com alto VPH</p>
                      <p>• "VPH excepcional para canal médio" - Canal médio com alto VPH</p>
                      <p>• "VPH excepcional para canal grande" - Canal grande com alto VPH</p>
                      <p>• "VPH extremamente alto" - VPH acima de 500</p>
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Como usar:</strong> Entenda o contexto da explosividade. Um canal pequeno com 50 VPH pode ser mais impressionante que um grande com 200 VPH!
                    </p>
                  </div>
                </div>
              </Card>
            </Card>
          </TabsContent>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-primary/5">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-6 w-6" />
                O que é o Monitoramento de Concorrentes?
              </h3>
              <div className="space-y-4 text-sm">
                <p>
                  O Monitoramento de Concorrentes é uma ferramenta que permite acompanhar canais específicos para detectar vídeos virais em tempo real, analisar tendências e identificar formatos que funcionam.
                </p>
                <p>
                  Ele ajuda a manter você sempre atualizado sobre o que está funcionando no seu nicho, permitindo agir rápido e ajustar sua estratégia de conteúdo.
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">🎯 Principais Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Adicionar canais concorrentes para monitorar</li>
                    <li>Atualização automática de vídeos e métricas</li>
                    <li>Filtros para destacar vídeos virais e explosivos</li>
                    <li>Organização por nichos personalizados</li>
                    <li>Alertas e insights para decisões rápidas</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* CONFIGURAÇÃO */}
          <TabsContent value="setup" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Configuração Inicial do Monitoramento
              </h3>
              <div className="space-y-4 text-sm">
                <p>
                  Para começar, adicione os canais concorrentes que você deseja monitorar. Você pode adicionar canais manualmente ou importar listas.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use URLs completas, handles (@canal) ou IDs do YouTube</li>
                  <li>Organize canais em nichos para facilitar análise</li>
                  <li>Configure frequência de atualização (diária, semanal)</li>
                </ul>
                <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                  <strong>💡 Dica:</strong> Comece com 3-5 canais para não sobrecarregar e aumente conforme ganha experiência.
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* RECURSOS AVANÇADOS */}
          <TabsContent value="advanced" className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                🔥 Recursos Avançados do Monitoramento
              </h3>
              <p className="text-muted-foreground mb-6">
                Funcionalidades poderosas para análise profunda e estratégias avançadas de crescimento.
              </p>

              <Accordion type="single" collapsible className="w-full">
                {/* DASHBOARD DE TENDÊNCIAS */}
                <AccordionItem value="trends">
                  <AccordionTrigger className="text-lg font-semibold">
                    📈 Dashboard de Tendências - Análise Temporal
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <TrendingUp className="h-4 w-4" />
                      <AlertTitle>O que é?</AlertTitle>
                      <AlertDescription>
                        Visualização gráfica da evolução de VPH e views dos seus concorrentes ao longo do tempo (últimos 30 dias).
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">🎯 Como Acessar:</h4>
                      <div className="p-3 bg-background rounded border">
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Vá para a página de Monitoramento de Concorrentes</li>
                          <li>Clique na aba <Badge variant="outline">Tendências</Badge></li>
                          <li>Selecione o concorrente que deseja analisar no dropdown</li>
                          <li>Visualize os gráficos de evolução temporal</li>
                        </ol>
                      </div>

                      <h4 className="font-semibold text-base mt-4">📊 O que você vê:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">Gráfico 1: VPH Médio ao Longo do Tempo</p>
                          <p className="text-sm mt-1">
                            Mostra a velocidade média de crescimento dos vídeos dia a dia. 
                            Picos indicam dias com vídeos muito explosivos!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">Gráfico 2: Views Médias ao Longo do Tempo</p>
                          <p className="text-sm mt-1">
                            Mostra o volume médio de visualizações. Identifica tendências de crescimento ou declínio do canal.
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mt-4">💡 Casos de Uso:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="font-semibold text-sm">✅ Identificar Padrões de Postagem</p>
                          <p className="text-sm">
                            Observe em quais dias da semana o concorrente tem melhor performance. 
                            Replique essa estratégia de timing!
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="font-semibold text-sm">✅ Detectar Mudanças de Estratégia</p>
                          <p className="text-sm">
                            VPH crescente consistente = concorrente descobriu fórmula vencedora. 
                            Analise o que mudou no conteúdo dele!
                          </p>
                        </div>

                        <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                          <p className="font-semibold text-sm">✅ Prever Declínios</p>
                          <p className="text-sm">
                            VPH caindo consistentemente = canal perdendo relevância. 
                            Oportunidade para você ganhar mercado!
                          </p>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                          <p className="font-semibold text-sm">✅ Comparar Períodos</p>
                          <p className="text-sm">
                            Compare último mês vs mês anterior. Performance melhorando ou piorando? 
                            Use isso para benchmark do seu próprio crescimento.
                          </p>
                        </div>
                      </div>

                      <Alert className="mt-4">
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>💡 Dica Pro:</strong> Use o Dashboard de Tendências TODA semana. 
                          Monitore 2-3 concorrentes principais e registre padrões. Com o tempo, você vai prever o que vai viralizar!
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* SISTEMA DE ALERTAS */}
                <AccordionItem value="alerts">
                  <AccordionTrigger className="text-lg font-semibold">
                    🔔 Sistema de Alertas - Notificações em Tempo Real
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>O que é?</AlertTitle>
                      <AlertDescription>
                        Sistema automático que te notifica quando um concorrente posta um vídeo explosivo. 
                        Você fica sabendo ANTES da concorrência!
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">🎯 Como Funciona:</h4>
                      <div className="p-3 bg-background rounded border">
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Sistema monitora automaticamente os vídeos dos concorrentes</li>
                          <li>Quando detecta um vídeo explosivo, cria um alerta instantaneamente</li>
                          <li>Você vê a notificação na aba <Badge variant="outline">Alertas</Badge></li>
                          <li>Clique no alerta para ver detalhes do vídeo e agir rápido!</li>
                        </ol>
                      </div>

                      <h4 className="font-semibold text-base mt-4">📋 Funcionalidades dos Alertas:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">✉️ Sistema de Leitura/Não Leitura</p>
                          <p className="text-sm mt-1">
                            Alertas não lidos aparecem destacados. Marque como lido após analisar. 
                            Nunca perca um vídeo explosivo de vista!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">🎯 Informações do Alerta</p>
                          <p className="text-sm mt-1">
                            Cada alerta mostra: canal, título do vídeo, VPH, views, motivo da explosividade. 
                            Tudo que você precisa para tomar decisão rápida!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">⚡ Link Direto para o Vídeo</p>
                          <p className="text-sm mt-1">
                            Clique e vá direto para o vídeo no YouTube. Analise thumbnail, título, descrição. 
                            Descubra POR QUE está viralizando!
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mt-4">🚀 Como Usar Alertas para Crescer:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="font-semibold text-sm">1️⃣ Reação Rápida (Primeiras 24h)</p>
                          <p className="text-sm">
                            Viu alerta? Analise O VÍDEO AGORA. Identifique o gancho, tema, formato. 
                            Grave sua versão em 24-48h enquanto o tópico está quente!
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="font-semibold text-sm">2️⃣ Análise de Padrões (Semanal)</p>
                          <p className="text-sm">
                            Revise todos os alertas da semana. Vários vídeos sobre o mesmo tema? 
                            É uma TENDÊNCIA! Crie conteúdo sobre isso.
                          </p>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                          <p className="font-semibold text-sm">3️⃣ Aprendizado Contínuo</p>
                          <p className="text-sm">
                            Mantenha um registro dos alertas. Com o tempo, você vai PREVER o que vai viralizar 
                            antes mesmo de acontecer. Esse é o poder do monitoramento!
                          </p>
                        </div>
                      </div>

                      <Alert className="mt-4 bg-orange-500/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>⚠️ Importante:</strong> Alertas funcionam com base nas atualizações do sistema. 
                          Atualize seus concorrentes regularmente (diariamente ideal) para receber alertas em tempo real!
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* COMPARAÇÃO DE VÍDEOS */}
                <AccordionItem value="comparison">
                  <AccordionTrigger className="text-lg font-semibold">
                    🔄 Comparação de Vídeos - Análise Lado a Lado
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Alert className="bg-purple-500/10 border-purple-500/20">
                      <Eye className="h-4 w-4" />
                      <AlertTitle>O que é?</AlertTitle>
                      <AlertDescription>
                        Ferramenta para comparar até 6 vídeos simultaneamente e identificar padrões comuns em vídeos virais.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">🎯 Como Usar:</h4>
                      <div className="p-3 bg-background rounded border">
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Na lista de vídeos, marque os checkboxes dos vídeos que deseja comparar (máximo 6)</li>
                          <li>O painel de comparação aparece automaticamente quando você seleciona 2+ vídeos</li>
                          <li>Analise os padrões identificados automaticamente</li>
                          <li>Use a tabela comparativa para ver métricas lado a lado</li>
                          <li>Clique em "Limpar Seleção" quando terminar</li>
                        </ol>
                      </div>

                      <h4 className="font-semibold text-base mt-4">🔍 O que a Comparação Mostra:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">🎯 Padrões em Títulos</p>
                          <p className="text-sm mt-1">
                            Sistema detecta palavras que aparecem em vários títulos. 
                            Ex: Se 4 dos 6 vídeos têm a palavra "segredo" = essa palavra funciona!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">📊 Tabela Comparativa</p>
                          <p className="text-sm mt-1">
                            Veja lado a lado: VPH, views, likes, comentários, engajamento. 
                            Identifique qual tipo de conteúdo tem melhor performance em qual métrica!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">⭐ Cards Individuais</p>
                          <p className="text-sm mt-1">
                            Cada vídeo tem seu card com thumbnail, título, canal, métricas principais. 
                            Visualização clara e organizada!
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">🎭 Métricas Derivadas</p>
                          <p className="text-sm mt-1">
                            Sistema calcula automaticamente: taxa de engajamento, views por inscrito, etc. 
                            Métricas que revelam QUALIDADE do desempenho!
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mt-4">💡 Estratégias de Comparação:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="font-semibold text-sm">✅ Estratégia 1: Fórmula Vencedora</p>
                          <p className="text-sm">
                            <strong>Como:</strong> Selecione os 6 vídeos mais virais do mês.
                            <br />
                            <strong>Objetivo:</strong> Identificar padrões comuns (palavras nos títulos, duração, tópicos).
                            <br />
                            <strong>Ação:</strong> Crie vídeos seguindo esses padrões!
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="font-semibold text-sm">✅ Estratégia 2: Teste A/B Reverso</p>
                          <p className="text-sm">
                            <strong>Como:</strong> Compare 3 vídeos virais VS 3 vídeos normais do mesmo canal.
                            <br />
                            <strong>Objetivo:</strong> Descobrir O QUE fez a diferença (título? thumbnail? tópico?).
                            <br />
                            <strong>Ação:</strong> Aplique os diferenciais vencedores no seu conteúdo!
                          </p>
                        </div>

                        <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                          <p className="font-semibold text-sm">✅ Estratégia 3: Benchmark Multi-Canal</p>
                          <p className="text-sm">
                            <strong>Como:</strong> Selecione 1 vídeo viral de 6 concorrentes diferentes.
                            <br />
                            <strong>Objetivo:</strong> Ver o que TODOS estão fazendo certo (padrões universais do nicho).
                            <br />
                            <strong>Ação:</strong> Esses são os fundamentos que você PRECISA dominar!
                          </p>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                          <p className="font-semibold text-sm">✅ Estratégia 4: Análise de Tendência</p>
                          <p className="text-sm">
                            <strong>Como:</strong> Compare vídeos sobre o MESMO tema de diferentes canais.
                            <br />
                            <strong>Objetivo:</strong> Ver qual abordagem performou melhor.
                            <br />
                            <strong>Ação:</strong> Crie sua versão usando a melhor abordagem!
                          </p>
                        </div>
                      </div>

                      <Alert className="mt-4">
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>💡 Dica de Ouro:</strong> Sempre compare vídeos do MESMO período (últimos 30 dias). 
                          Tendências mudam rápido. O que funcionou há 6 meses pode não funcionar mais!
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* CRITÉRIOS ADAPTATIVOS */}
                <AccordionItem value="adaptive">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎯 Critérios Adaptativos - Explosividade Inteligente
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Alert className="bg-primary/10 border-primary/20">
                      <Target className="h-4 w-4" />
                      <AlertTitle>O que é?</AlertTitle>
                      <AlertDescription>
                        Sistema inteligente que adapta os critérios de "explosividade" com base no tamanho do canal. 
                        50 VPH pode ser explosivo para um canal pequeno, mas normal para um grande!
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">🧠 Como o Sistema Funciona:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">1️⃣ Classificação de Canais por Tamanho</p>
                          <p className="text-sm mt-1">
                            • <strong>Micro:</strong> Menos de 10K inscritos
                            <br />
                            • <strong>Pequeno:</strong> 10K - 100K inscritos
                            <br />
                            • <strong>Médio:</strong> 100K - 1M inscritos
                            <br />
                            • <strong>Grande:</strong> Mais de 1M inscritos
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">2️⃣ Critérios Adaptativos de VPH</p>
                          <p className="text-sm mt-1">
                            • <strong>Micro/Pequeno:</strong> 30+ VPH já é considerado explosivo
                            <br />
                            • <strong>Médio:</strong> 100+ VPH para ser explosivo
                            <br />
                            • <strong>Grande:</strong> 200+ VPH para ser explosivo
                            <br />
                            • <strong>Todos:</strong> 500+ VPH = SEMPRE explosivo (extremo)
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold text-sm">3️⃣ Score de Explosividade (0-100)</p>
                          <p className="text-sm mt-1">
                            Sistema calcula pontuação baseada em múltiplos fatores:
                            <br />
                            • VPH relativo ao tamanho do canal
                            <br />
                            • Velocidade de crescimento
                            <br />
                            • Taxa de engajamento
                            <br />
                            <strong>Resultado:</strong> Score de 0-100. Quanto maior, mais impressionante!
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mt-4">🏷️ Badges de Explosividade:</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm mb-2">Você verá badges como:</p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <Badge className="bg-red-600">VPH excepcional para canal pequeno</Badge>
                              <br />
                              <span className="text-muted-foreground ml-1">
                                Canal com menos de 100K inscritos tendo alto VPH
                              </span>
                            </p>
                            <p className="mt-2">
                              <Badge className="bg-orange-600">VPH excepcional para canal médio</Badge>
                              <br />
                              <span className="text-muted-foreground ml-1">
                                Canal entre 100K-1M com VPH acima do esperado
                              </span>
                            </p>
                            <p className="mt-2">
                              <Badge className="bg-yellow-600">VPH excepcional para canal grande</Badge>
                              <br />
                              <span className="text-muted-foreground ml-1">
                                Canal com +1M mantendo VPH alto (difícil!)
                              </span>
                            </p>
                            <p className="mt-2">
                              <Badge className="bg-purple-600">VPH extremamente alto</Badge>
                              <br />
                              <span className="text-muted-foreground ml-1">
                                Qualquer canal com +500 VPH = viral extremo
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mt-4">💡 Por Que Isso Importa?</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="font-semibold text-sm">✅ Descoberta de Oportunidades</p>
                          <p className="text-sm">
                            Canal pequeno viralizando = baixa competição + formato validado = OPORTUNIDADE! 
                            Você pode replicar e ter sucesso mais fácil que copiar um canal grande.
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="font-semibold text-sm">✅ Comparação Justa</p>
                          <p className="text-sm">
                            Não faz sentido comparar canal de 1M com canal de 10K. Sistema normaliza isso. 
                            Você vê performance RELATIVA, não absoluta!
                          </p>
                        </div>

                        <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                          <p className="font-semibold text-sm">✅ Foco no que Importa</p>
                          <p className="text-sm">
                            Sistema destaca vídeos que são REALMENTE impressionantes para seu contexto. 
                            Menos ruído, mais signal. Você economiza tempo!
                          </p>
                        </div>
                      </div>

                      <Alert className="mt-4 bg-primary/10">
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>🎓 Use a Seu Favor:</strong> Filtre por "canais pequenos" + "score alto" para encontrar 
                          oceanos azuis (nichos com baixa competição mas formatos validados). 
                          Essa é a estratégia de crescimento mais inteligente!
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* SISTEMA DE SNAPSHOTS */}
                <AccordionItem value="snapshots">
                  <AccordionTrigger className="text-lg font-semibold">
                    📸 Sistema de Snapshots - Histórico de Métricas
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Alert className="bg-background">
                      <Calendar className="h-4 w-4" />
                      <AlertTitle>O que é?</AlertTitle>
                      <AlertDescription>
                        Sistema automático que registra métricas dos vídeos ao longo do tempo, permitindo análise histórica no Dashboard de Tendências.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded">
                        <p className="font-semibold text-sm">🔄 Funcionamento Automático</p>
                        <p className="text-sm mt-1">
                          Sempre que você atualiza um concorrente, o sistema cria snapshots das métricas atuais. 
                          Com o tempo, você constrói um histórico rico para análise!
                        </p>
                      </div>

                      <div className="p-3 bg-muted rounded">
                        <p className="font-semibold text-sm">📊 Dados Capturados</p>
                        <p className="text-sm mt-1">
                          Para cada vídeo: views, likes, comentários, VPH calculado, timestamp. 
                          Tudo armazenado para você visualizar no Dashboard de Tendências!
                        </p>
                      </div>

                      <Alert className="mt-3">
                        <AlertDescription className="text-sm">
                          <strong>💡 Dica:</strong> Quanto mais você atualiza seus concorrentes, mais rico fica seu histórico. 
                          Depois de 30 dias de atualizações diárias, você tem dados poderosos para tomar decisões!
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>

          {/* FILTROS */}
          <TabsContent value="filters" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Filter className="h-6 w-6" />
                Filtros para Refinar Resultados
              </h3>
              <div className="space-y-4 text-sm">
                <p>
                  Use filtros para destacar vídeos que realmente importam e evitar ruído.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>VPH Mínimo:</strong> Ex: 50 para focar em vídeos com crescimento acelerado</li>
                  <li><strong>Status:</strong> Explosivo, Viral, Em Alta, Normal</li>
                  <li><strong>Idade do Vídeo:</strong> Últimos 7, 30, 90 dias</li>
                  <li><strong>Views Mínimas:</strong> Para garantir relevância</li>
                  <li><strong>Nichos:</strong> Filtrar por nichos criados para organizar concorrentes</li>
                </ul>
                <div className="bg-primary/10 p-4 rounded border border-primary/20">
                  <strong>🎯 Estratégia:</strong> Combine filtros para criar presets de análise rápida, como "Meu Radar Diário" com vídeos explosivos dos últimos 7 dias.
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ESTRATÉGIAS */}
          <TabsContent value="strategies" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                Estratégias para Monitoramento Eficiente
              </h3>
              <div className="space-y-6 text-sm">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-lg border border-green-500/20">
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    🏆 Estratégia #1: Caçador de Tendências
                  </h4>
                  <p>
                    Atualize dados diariamente, filtre vídeos explosivos dos últimos 7 dias e analise padrões para agir rápido.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-lg border border-blue-500/20">
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    🌊 Estratégia #2: Análise Semanal Profunda
                  </h4>
                  <p>
                    Faça análises semanais filtrando vídeos virais dos últimos 30 dias, exporte dados e planeje conteúdo baseado em insights.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-lg border border-orange-500/20">
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    🚀 Estratégia #3: Benchmark Mensal
                  </h4>
                  <p>
                    Analise tendências de longo prazo, identifique evergreen e ajuste sua estratégia para crescimento sustentável.
                  </p>
                </div>

                <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                  <h4 className="text-xl font-bold mb-3">🎓 Dicas Finais</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Atualize dados regularmente para manter insights frescos</li>
                    <li>Combine monitoramento com análise de canais similares para melhor estratégia</li>
                    <li>Adapte formatos virais para seu público, não copie</li>
                    <li>Use nichos para organizar e priorizar concorrentes</li>
                    <li>Foque em qualidade, não quantidade de concorrentes monitorados</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="h-6 w-6" />
                ❓ Perguntas Frequentes
              </h3>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-lg font-semibold">
                    Com que frequência devo atualizar os dados?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>Depende do seu objetivo e disponibilidade:</strong></p>

                    <div className="space-y-2 mt-3">
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <p className="font-semibold">🔥 Caçador de Tendências (Diariamente)</p>
                        <p className="text-sm mt-1">
                          Quer pegar ondas virais antes de saturarem? Atualize TODOS OS DIAS. 
                          Dedique 10-15 minutos pela manhã para checar vídeos explosivos.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                        <p className="font-semibold">📊 Criador Regular (2-3x por semana)</p>
                        <p className="text-sm mt-1">
                          Equilíbrio entre estar informado e não sobrecarregar. 
                          Atualize Segunda, Quarta e Sexta para manter dados razoavelmente frescos.
                        </p>
                      </div>

                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold">🎯 Planejamento Estratégico (Semanal)</p>
                        <p className="text-sm mt-1">
                          Foca mais em evergreen que trending? Atualização semanal é suficiente. 
                          Faça uma análise profunda toda segunda-feira.
                        </p>
                      </div>
                    </div>

                    <Alert className="mt-3 bg-orange-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>⚠️ Lembre-se:</strong> Cada atualização consome quota da API do YouTube. 
                        Use com consciência!
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-lg font-semibold">
                    Devo monitorar canais maiores ou menores que o meu?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>A resposta ideal: AMBOS! Mas com objetivos diferentes:</strong></p>

                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-blue-600">📈 Canais Maiores (2-10x seu tamanho)</p>
                        <p className="text-sm mt-1"><strong>Por quê monitorar:</strong></p>
                        <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                          <li>Ver para onde o nicho está indo</li>
                          <li>Referências de qualidade e produção</li>
                          <li>Formatos validados que funcionam</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Cuidado:</strong> Não tente replicar tudo - eles têm recursos que você pode não ter ainda.</p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-green-600">🎯 Canais do Seu Tamanho (±50% inscritos)</p>
                        <p className="text-sm mt-1"><strong>Por quê monitorar:</strong></p>
                        <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                          <li>Concorrência direta real</li>
                          <li>Estratégias aplicáveis ao seu contexto</li>
                          <li>Ver quem está crescendo mais rápido</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Ideal:</strong> Foque MAIS nestes! São seus verdadeiros competidores.</p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-purple-600">💎 Canais Menores (1/2 a 1/5 do seu tamanho)</p>
                        <p className="text-sm mt-1"><strong>Por quê monitorar:</strong></p>
                        <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                          <li>Identificar quem está subindo rápido</li>
                          <li>Formatos novos e experimentais</li>
                          <li>Potenciais colaborações</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Bônus:</strong> Se um canal pequeno viraliza, você pega a onda CEDO!</p>
                      </div>
                    </div>

                    <Alert className="mt-3 bg-primary/10">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>💡 Estratégia Ideal</AlertTitle>
                      <AlertDescription>
                        <strong>Distribua assim:</strong>
                        <ul className="list-disc list-inside mt-2">
                          <li>30% canais maiores (inspiração)</li>
                          <li>50% canais do seu tamanho (competição direta)</li>
                          <li>20% canais menores (tendências emergentes)</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-lg font-semibold">
                    Como usar os nichos de forma eficaz?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>Nichos são categorias personalizadas para organizar seus concorrentes. Use assim:</strong></p>

                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold">📁 Organização por Tipo de Conteúdo</p>
                        <p className="text-sm text-muted-foreground mt-1">Exemplo para canal de culinária:</p>
                        <ul className="text-sm list-disc list-inside ml-2">
                          <li>Nicho "Receitas Rápidas"</li>
                          <li>Nicho "Sobremesas"</li>
                          <li>Nicho "Fit & Saudável"</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Benefício:</strong> Ver qual tipo de conteúdo está performando melhor.</p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold">🎯 Organização por Nível de Competição</p>
                        <ul className="text-sm list-disc list-inside ml-2">
                          <li>Nicho "Top Tier" (canais muito maiores)</li>
                          <li>Nicho "Concorrentes Diretos"</li>
                          <li>Nicho "Emergentes"</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Benefício:</strong> Filtrar por prioridade de análise.</p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold">🌍 Organização por Geografia/Idioma</p>
                        <ul className="text-sm list-disc list-inside ml-2">
                          <li>Nicho "BR"</li>
                          <li>Nicho "EUA"</li>
                          <li>Nicho "ES" (espanhol)</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Benefício:</strong> Comparar tendências entre mercados.</p>
                      </div>
                    </div>

                    <Alert className="mt-3 bg-green-500/10">
                      <AlertDescription>
                        <strong>💡 Dica Pro:</strong> Use cores diferentes para cada nicho. 
                        Facilita identificação visual rápida na lista!
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-lg font-semibold">
                    Vídeos "Explosivos" sempre se tornam mega virais?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>NÃO necessariamente, mas são os candidatos mais prováveis!</strong></p>

                    <div className="p-3 bg-background rounded border mt-3">
                      <p className="font-semibold mb-2">O que significa "Explosivo":</p>
                      <p className="text-sm">
                        Vídeo com crescimento MUITO ACELERADO nas primeiras horas/dias. 
                        VPH extremamente alto em relação à média do canal.
                      </p>
                    </div>

                    <div className="space-y-2 mt-3">
                      <p className="font-semibold">Cenários possíveis:</p>

                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold text-sm">✅ Cenário 1: Viraliza de verdade (60%)</p>
                        <p className="text-sm">
                          VPH continua alto, views explodem, vídeo vai para milhões. 
                          É o que você quer detectar!
                        </p>
                      </div>

                      <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                        <p className="font-semibold text-sm">⚠️ Cenário 2: Pico temporário (30%)</p>
                        <p className="text-sm">
                          VPH alto inicial depois estabiliza. Vídeo performou bem mas não explodiu. 
                          Ainda é útil - formato funcionou!
                        </p>
                      </div>

                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <p className="font-semibold text-sm">❌ Cenário 3: Falso positivo (10%)</p>
                        <p className="text-sm">
                          Canal usou estratégias externas (tráfego pago, cross-promotion). 
                          VPH caiu rapidamente. Ignore esses.
                        </p>
                      </div>
                    </div>

                    <Alert className="mt-3">
                      <AlertDescription>
                        <strong>💡 Como diferenciar:</strong> Verifique se o canal tem outros vídeos com VPH similar. 
                        Se só 1 vídeo é explosivo e os demais normais = pode ser falso positivo ou tráfego pago.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-lg font-semibold">
                    Devo copiar exatamente o que os concorrentes fazem?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-red-600">❌ NÃO! Nunca copie. Sempre ADAPTE.</AlertTitle>
                    </Alert>

                    <p className="mt-3"><strong>A diferença entre copiar e adaptar:</strong></p>

                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <p className="font-semibold text-red-600">❌ COPIAR (Errado):</p>
                        <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                          <li>Título quase idêntico</li>
                          <li>Thumbnail similar demais</li>
                          <li>Roteiro igual</li>
                          <li>Sem diferencial nenhum</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Resultado:</strong> Você parece cópia barata. Audiência percebe. Não cresce.</p>
                      </div>

                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold text-green-600">✅ ADAPTAR (Correto):</p>
                        <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                          <li>Identifica o CONCEITO central que funcionou</li>
                          <li>Adapta para SEU público específico</li>
                          <li>Adiciona SEU toque/personalidade única</li>
                          <li>Melhora algo que faltou no original</li>
                          <li>Cria valor adicional</li>
                        </ul>
                        <p className="text-sm mt-2"><strong>Resultado:</strong> Você se inspira mas cria algo original. Audiência valoriza.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-background rounded border mt-3">
                      <p className="font-semibold mb-2">📚 Exemplo Prático:</p>
                      <p className="text-sm"><strong>Vídeo viral do concorrente:</strong></p>
                      <p className="text-sm italic">"5 Investimentos Que Me Fizeram Ganhar R$ 10 Mil Por Mês"</p>

                      <p className="text-sm mt-3 text-red-600"><strong>❌ Copiar:</strong></p>
                      <p className="text-sm italic">"5 Investimentos Que Me Fizeram Ganhar R$ 10 Mil Por Mês"</p>

                      <p className="text-sm mt-3 text-green-600"><strong>✅ Adaptar:</strong></p>
                      <p className="text-sm italic">"Como Ganho R$ 10K/Mês com Apenas 3 Investimentos (Começando com R$ 100)"</p>
                      <p className="text-sm mt-1">
                        Mantém conceito (investimentos + valor específico) mas adiciona diferenciais 
                        (menos investimentos = mais simples, valor inicial baixo = acessível).
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* ATALHOS */}
            <Card className="p-6 bg-primary/5">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                ⚡ Atalhos e Dicas Rápidas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert className="bg-background">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>💡 Filtro Mágico</AlertTitle>
                  <AlertDescription>
                    Últimos 7 dias + VPH Mín 100 + Status "Explosivo" = Ver APENAS bombas! 
                    Use diariamente.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <Target className="h-4 w-4" />
                  <AlertTitle>🎯 Oceano Azul</AlertTitle>
                  <AlertDescription>
                    Filtre por Tamanho "Micro" + VPH 50+ = Canais pequenos viralizando = baixa competição!
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <Calendar className="h-4 w-4" />
                  <AlertTitle>📅 Planejamento</AlertTitle>
                  <AlertDescription>
                    Exporte vídeos virais toda semana. Monte calendário de conteúdo baseado nos padrões!
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <Eye className="h-4 w-4" />
                  <AlertTitle>👀 Monitoramento Eficiente</AlertTitle>
                  <AlertDescription>
                    Crie preset "Meu Radar Diário" com seus filtros favoritos. Economize tempo!
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
