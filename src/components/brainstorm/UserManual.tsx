import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Settings, TrendingUp, Target, Zap } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Brainstorm de Ideias</CardTitle>
        <p className="text-muted-foreground">
          Gere ideias ilimitadas de vídeos virais baseadas em nichos e tendências
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="setup">Como Usar</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  O Que é o Brainstorm de Ideias?
                </h3>
                <p className="text-muted-foreground">
                  Gerador automático de ideias de vídeos baseado em nichos e sub-nichos. Elimina o bloqueio 
                  criativo gerando 10+ ideias acionáveis por execução. Perfect para planejar calendário editorial.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Principais Funcionalidades
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">💡 Geração Baseada em Nicho</h4>
                    <p className="text-sm text-muted-foreground">
                      10+ ideias específicas para o nicho escolhido
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🎯 Refinamento por Sub-nicho</h4>
                    <p className="text-sm text-muted-foreground">
                      Foque em categorias ultra-específicas para ideias únicas
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🌍 Suporte Multilíngue</h4>
                    <p className="text-sm text-muted-foreground">
                      Gere ideias em 10+ idiomas diferentes
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">♻️ Geração Ilimitada</h4>
                    <p className="text-sm text-muted-foreground">
                      Crie bancos de centenas de ideias sem limites
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Para Quem É?
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Criadores</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que sofrem com bloqueio criativo
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Produtores</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que precisam planejar conteúdo com antecedência
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Agências</Badge>
                    <span className="text-sm text-muted-foreground">
                      Gerenciando múltiplos canais simultaneamente
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">💡 Casos de Uso</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Planejamento de calendário editorial mensal</li>
                  <li>Descoberta de ângulos únicos em nichos saturados</li>
                  <li>Exploração de sub-nichos inexplorados</li>
                  <li>Validação de demanda antes de criar conteúdo</li>
                  <li>Inspiração para séries de vídeos</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="niche-selection">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Seleção de Nicho</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Campo: Nicho</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Escolha a categoria principal do conteúdo. O sistema oferece 11 nichos pré-definidos.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm space-y-2">
                      <p className="font-medium">📋 Nichos Disponíveis:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Educação e Tutoriais</div>
                        <div>• Entretenimento</div>
                        <div>• Tecnologia e Inovação</div>
                        <div>• Saúde e Bem-Estar</div>
                        <div>• Negócios e Finanças</div>
                        <div>• Estilo de Vida</div>
                        <div>• Gaming e eSports</div>
                        <div>• Culinária e Gastronomia</div>
                        <div>• Viagens e Turismo</div>
                        <div>• Arte e Criatividade</div>
                        <div>• Esportes e Fitness</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">💡 Como Escolher o Nicho Certo?</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>1. Análise de Público:</strong> Qual nicho seu público consome?</p>
                      <p><strong>2. Expertise:</strong> Em qual você tem conhecimento/paixão?</p>
                      <p><strong>3. Monetização:</strong> Qual tem melhores oportunidades de receita?</p>
                      <p><strong>4. Concorrência:</strong> Onde há espaço para você crescer?</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="subniche">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Sub-nicho (Opcional)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 O Que É Sub-nicho?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Uma especialização dentro do nicho principal. Gera ideias muito mais específicas e únicas.
                    </p>
                    
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-2">📋 Exemplos:</p>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p><strong>Nicho:</strong> Negócios e Finanças</p>
                          <p><strong>Sub-nicho:</strong> "Investimentos em criptomoedas para iniciantes"</p>
                        </div>
                        <div>
                          <p><strong>Nicho:</strong> Saúde e Bem-Estar</p>
                          <p><strong>Sub-nicho:</strong> "Yoga para alívio de ansiedade"</p>
                        </div>
                        <div>
                          <p><strong>Nicho:</strong> Tecnologia</p>
                          <p><strong>Sub-nicho:</strong> "IA para pequenas empresas"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">✅ Quando Usar Sub-nicho?</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="default" className="mt-0.5">Sim</Badge>
                        <p className="text-sm text-muted-foreground">
                          Quando você quer ideias ultra-específicas para um público definido
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="default" className="mt-0.5">Sim</Badge>
                        <p className="text-sm text-muted-foreground">
                          Quando está explorando micro-nichos descobertos no Sub-Niche Hunter
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">Não</Badge>
                        <p className="text-sm text-muted-foreground">
                          Quando quer variedade ampla de ideias no nicho geral
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="language">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Idioma de Geração</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🌍 Campo: Idioma</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Língua em que as ideias serão geradas. Impacta a relevância cultural das sugestões.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">📋 10 Idiomas Disponíveis:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div>• Português (BR)</div>
                        <div>• Inglês (US)</div>
                        <div>• Espanhol</div>
                        <div>• Francês</div>
                        <div>• Alemão</div>
                        <div>• Italiano</div>
                        <div>• Japonês</div>
                        <div>• Coreano</div>
                        <div>• Chinês (Mandarim)</div>
                        <div>• Russo</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">💡 Estratégia Multilíngue</h4>
                    <p className="text-sm text-muted-foreground">
                      Gere ideias em inglês para ver tendências globais, depois adapte para português com 
                      contexto local. Melhor dos dois mundos!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-model">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Modelo de IA</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🤖 Escolha do Modelo</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Define qual inteligência artificial processará suas ideias.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">✅ Gemini 2.5 Flash (Recomendado)</p>
                        <p className="text-xs text-muted-foreground">
                          Melhor custo-benefício. Rápido, criativo e preciso para brainstorming.
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">⚡ Gemini 2.5 Flash Lite</p>
                        <p className="text-xs text-muted-foreground">
                          Mais econômico. Use para gerar grandes volumes de ideias rapidamente.
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">🚀 Gemini 2.5 Pro</p>
                        <p className="text-xs text-muted-foreground">
                          Máxima criatividade. Ideias mais únicas e bem elaboradas.
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Entendendo os Resultados</h3>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">💡 Formato das Ideias</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cada ideia é gerada em formato de título de vídeo otimizado para CTR (taxa de cliques).
                  </p>
                  <div className="bg-background p-3 rounded text-sm">
                    <p className="font-medium mb-2">Exemplo de Resultado:</p>
                    <ul className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                      <li>"Como Investir Seus Primeiros R$500 (Guia Completo para Iniciantes)"</li>
                      <li>"5 Erros Fatais Que Destruíram Minha Carteira de Investimentos"</li>
                      <li>"R$0 a R$10.000: Minha Jornada Real em 12 Meses Investindo"</li>
                      <li>"Ações vs Fundos Imobiliários: Qual Rende Mais em 2024?"</li>
                      <li>"A Verdade Sobre Investir Menos de R$1.000 Por Mês"</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">🎯 Características das Ideias</h4>
                  <div className="space-y-2">
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">Específicas</p>
                      <p className="text-xs text-muted-foreground">
                        Não são vagas - cada ideia tem ângulo definido
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">Acionáveis</p>
                      <p className="text-xs text-muted-foreground">
                        Prontas para se tornarem vídeos imediatamente
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">Otimizadas para CTR</p>
                      <p className="text-xs text-muted-foreground">
                        Usam fórmulas comprovadas de títulos virais
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">Contextualizadas</p>
                      <p className="text-xs text-muted-foreground">
                        Adaptadas ao nicho e sub-nicho escolhidos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">💾 Como Organizar as Ideias</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Copie todas as ideias para um documento</li>
                    <li>Categorize por tipo (tutoriais, listas, cases, etc)</li>
                    <li>Priorize as 3-5 melhores para validar primeiro</li>
                    <li>Use Niche Finder para validar demanda</li>
                    <li>Crie calendário editorial com ideias validadas</li>
                    <li>Mantenha banco de ideias reserva</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">🔄 Gerando Mais Ideias</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Não ficou satisfeito? Simplesmente clique em "Gerar Ideias" novamente!
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Cada geração traz ideias diferentes</li>
                    <li>Sem limites de uso</li>
                    <li>Tente variar sub-nichos para maior diversidade</li>
                    <li>Combine ideias de múltiplas gerações</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="strategy-1">
                <AccordionTrigger>
                  <span className="font-medium">1. Banco de Ideias para 90 Dias</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Crie um repositório massivo de ideias validadas para nunca ficar sem conteúdo.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Processo:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Escolha seu nicho principal</li>
                      <li>Gere 10 ideias sem sub-nicho</li>
                      <li>Gere 10 ideias com 5 sub-nichos diferentes (50 ideias)</li>
                      <li>Separe as 20 melhores ideias</li>
                      <li>Valide todas com Niche Finder</li>
                      <li>Organize em planilha por prioridade</li>
                      <li>Produza 2-3 vídeos por semana do banco</li>
                    </ol>
                  </div>
                  <Badge variant="outline">⏱️ Tempo: 3-4 horas | 🎯 Resultado: 3 meses sem bloqueio criativo</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-2">
                <AccordionTrigger>
                  <span className="font-medium">2. Validação Antes da Produção</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nunca produza um vídeo sem validar a demanda da ideia primeiro.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">✅ Workflow de Validação:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li><strong>Brainstorm:</strong> Gere 10 ideias</li>
                      <li><strong>Seleção:</strong> Escolha as 5 que mais te empolgam</li>
                      <li><strong>Niche Finder:</strong> Busque cada ideia no Niche Finder</li>
                      <li><strong>Análise:</strong> Verifique VPH médio (+100 ideal)</li>
                      <li><strong>Competição:</strong> Cheque se há vídeos virais de canais pequenos</li>
                      <li><strong>Decisão:</strong> Produza apenas as que passaram no teste</li>
                    </ol>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">🎯 Critérios de Validação:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                      <li>✅ VPH médio acima de 100</li>
                      <li>✅ Pelo menos 3 vídeos com +50k views</li>
                      <li>✅ Canais pequenos (-100k subs) com sucesso no tema</li>
                      <li>❌ Apenas 1 vídeo viral (pode ser outlier)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-3">
                <AccordionTrigger>
                  <span className="font-medium">3. Exploração de Sub-nichos</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Encontre ângulos únicos que seus concorrentes não estão explorando.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">🔍 Técnica de Descoberta:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Use Sub-Niche Hunter para identificar 10 micro-nichos</li>
                      <li>Para cada micro-nicho, gere 10 ideias no Brainstorm</li>
                      <li>Você terá 100 ideias ultra-específicas</li>
                      <li>Faça busca no YouTube de cada ideia</li>
                      <li>Identifique quais têm menos de 3 vídeos sobre o tema</li>
                      <li>Essas são suas oportunidades de "oceano azul"</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-4">
                <AccordionTrigger>
                  <span className="font-medium">4. Séries de Conteúdo Interligado</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Transforme ideias individuais em séries que mantêm audiência engajada.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">🎬 Como Criar Séries:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Gere 10 ideias em um sub-nicho específico</li>
                      <li>Agrupe ideias por tema comum</li>
                      <li>Ordene de introdutório para avançado</li>
                      <li>Crie arco narrativo conectando os vídeos</li>
                      <li>Use CTAs para direcionar ao próximo episódio</li>
                      <li>Crie playlist da série completa</li>
                    </ol>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">💡 Exemplo de Série:</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Sub-nicho:</strong> "Python para Análise de Dados"<br/>
                      <strong>Série de 5 vídeos:</strong><br/>
                      1. Python: Por Que É a Melhor Linguagem para Dados<br/>
                      2. Instalando o Ambiente Perfeito para Análise<br/>
                      3. Pandas: Manipulando Seus Primeiros Dados<br/>
                      4. Visualizações Que Impressionam com Matplotlib<br/>
                      5. Projeto Real: Análise Completa de Dataset
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-5">
                <AccordionTrigger>
                  <span className="font-medium">5. Análise de Tendências</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Use o Brainstorm para detectar tendências antes delas virarem mainstream.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📊 Sistema de Detecção:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Gere ideias mensalmente no mesmo nicho</li>
                      <li>Compare as ideias do mês com as do mês anterior</li>
                      <li>Temas novos que aparecem = tendências emergentes</li>
                      <li>Valide essas tendências com Niche Finder</li>
                      <li>Produza conteúdo sobre elas ANTES da concorrência</li>
                      <li>Posicione-se como autoridade no tema nascente</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-6">
                <AccordionTrigger>
                  <span className="font-medium">6. Combinação com Outras Ferramentas</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🎯 Brainstorm + Niche Finder</p>
                      <p className="text-xs text-muted-foreground">
                        Gere ideias → Valide demanda → Produza apenas as vencedoras
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">📝 Brainstorm + Criador de Conteúdo</p>
                      <p className="text-xs text-muted-foreground">
                        Ideia validada → Roteiro completo → Produção imediata
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🔍 Brainstorm + Sub-Niche Hunter</p>
                      <p className="text-xs text-muted-foreground">
                        Micro-nichos descobertos → Ideias específicas → Exploração completa
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">✍️ Brainstorm + Títulos Virais</p>
                      <p className="text-xs text-muted-foreground">
                        Ideia base → Múltiplas variações de títulos → A/B testing
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>
                  <span className="font-medium">📅 Rotina Recomendada</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Semanal (Segunda-feira):</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                        <li>Gere 10 novas ideias</li>
                        <li>Valide as top 3 com Niche Finder</li>
                        <li>Adicione ao calendário editorial</li>
                      </ul>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Quinzenal:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                        <li>Revise banco de ideias</li>
                        <li>Remova ideias que perderam relevância</li>
                        <li>Adicione novas baseadas em tendências</li>
                      </ul>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Mensal (Início do mês):</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                        <li>Sessão de brainstorm de 2 horas</li>
                        <li>Gere 50-100 ideias variadas</li>
                        <li>Organize por categoria e prioridade</li>
                        <li>Planeje conteúdo do próximo trimestre</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="mistakes">
                <AccordionTrigger>
                  <span className="font-medium">⚠️ Erros Comuns</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <div className="border-l-4 border-destructive pl-3">
                    <p className="font-medium text-sm">❌ Produzir Sem Validar</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Criar vídeo de qualquer ideia sem verificar demanda
                    </p>
                    <p className="text-xs">✅ Sempre valide com Niche Finder primeiro</p>
                  </div>
                  <div className="border-l-4 border-destructive pl-3">
                    <p className="font-medium text-sm">❌ Não Usar Sub-nichos</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Gerar apenas ideias genéricas do nicho amplo
                    </p>
                    <p className="text-xs">✅ Explore sub-nichos para ideias únicas</p>
                  </div>
                  <div className="border-l-4 border-destructive pl-3">
                    <p className="font-medium text-sm">❌ Não Organizar Ideias</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Gerar ideias e esquecer delas
                    </p>
                    <p className="text-xs">✅ Mantenha banco organizado e priorizado</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-muted p-4 rounded mt-4">
              <h4 className="font-medium mb-2">💎 Dica Final</h4>
              <p className="text-sm text-muted-foreground">
                O Brainstorm é mais poderoso quando usado como PARTE de um workflow, não isoladamente. 
                Combine sempre com validação (Niche Finder) e execução (Criador de Conteúdo).
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
