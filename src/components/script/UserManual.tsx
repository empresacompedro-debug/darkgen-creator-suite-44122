import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FileText, Settings, BarChart3, TrendingUp, Zap, Target, CheckCircle2 } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Criador de Conteúdo</CardTitle>
        <p className="text-muted-foreground">
          Crie roteiros virais profissionais com IA avançada e análise automática de qualidade
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="advanced">Opções Avançadas</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  O Que é o Criador de Conteúdo?
                </h3>
                <p className="text-muted-foreground">
                  Sistema completo de criação de roteiros otimizados para máxima retenção e engajamento. 
                  Utiliza fórmulas comprovadas e análise inteligente para criar scripts que mantêm a audiência 
                  grudada do início ao fim.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Principais Funcionalidades
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">✍️ Geração de Roteiros com IA</h4>
                    <p className="text-sm text-muted-foreground">
                      Crie roteiros completos baseados em seu nicho, tema e estilo narrativo
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">📊 Análise Automática de Qualidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema de pontuação que identifica pontos fortes e fracos do roteiro
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🔄 Sistema de Continuação</h4>
                    <p className="text-sm text-muted-foreground">
                      Continue gerando o roteiro por streaming até atingir o tamanho desejado
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🚀 Melhoria com IA</h4>
                    <p className="text-sm text-muted-foreground">
                      Otimize roteiros existentes com sugestões inteligentes da IA
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-1">🎯 Fórmulas de Retenção</h4>
                    <p className="text-sm text-muted-foreground">
                      Aplique frameworks comprovados como Ethical Retention para manter audiência
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Para Quem é Esta Ferramenta?
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Criadores</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que querem roteiros profissionais sem contratar roteirista
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Produtores</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que precisam escalar produção de conteúdo com qualidade
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default">Agências</Badge>
                    <span className="text-sm text-muted-foreground">
                      Que gerenciam múltiplos canais e precisam de eficiência
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">💡 Casos de Uso</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Criação de roteiros para vídeos de 5-30 minutos</li>
                  <li>Produção em massa de conteúdo educativo</li>
                  <li>Roteiros para vídeos de vendas e afiliados</li>
                  <li>Scripts para videoaulas e tutoriais</li>
                  <li>Conteúdo storytelling e entretenimento</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="basic-fields">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Campos Básicos Essenciais</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Nicho do Conteúdo</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      A categoria principal do seu vídeo. Define o contexto geral do roteiro.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">💡 Exemplos:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>Finanças Pessoais</li>
                        <li>Desenvolvimento Pessoal</li>
                        <li>Culinária</li>
                        <li>Tecnologia e Gadgets</li>
                        <li>Empreendedorismo Digital</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📌 Tema Específico</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      O assunto exato que será abordado no vídeo. Seja específico!
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">✅ Bons temas (específicos):</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>"Como investir os primeiros R$500 em ações"</li>
                        <li>"5 hábitos matinais de pessoas bem-sucedidas"</li>
                        <li>"Receita de bolo de chocolate sem glúten"</li>
                      </ul>
                      <p className="font-medium mb-1 mt-2">❌ Temas vagos (evitar):</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li>"Investimentos" (amplo demais)</li>
                        <li>"Produtividade" (genérico)</li>
                        <li>"Receitas" (sem foco)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">👥 Público-Alvo</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Quem vai assistir? Define linguagem, exemplos e profundidade do conteúdo.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">💡 Seja específico:</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Quanto mais detalhes, melhor a IA adapta o roteiro.
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium">❌ Genérico: "Jovens"</p>
                          <p className="text-xs font-medium text-green-600">✅ Específico: "Universitários de 18-25 anos começando a investir"</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">❌ Genérico: "Empreendedores"</p>
                          <p className="text-xs font-medium text-green-600">✅ Específico: "Donos de pequenos negócios locais querendo expandir online"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="length">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Controle de Tamanho do Roteiro</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🔢 Número de Partes</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Quantas seções/blocos terá seu roteiro. Mais partes = estrutura mais organizada.
                    </p>
                    <Badge variant="outline" className="mb-2">Recomendado: 5-8 partes</Badge>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">📋 Estrutura por Partes:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>3-4 partes:</strong> Vídeos curtos (5-8 min) - Intro, Conteúdo, CTA</li>
                        <li><strong>5-7 partes:</strong> Vídeos médios (10-15 min) - Estrutura ideal</li>
                        <li><strong>8-10 partes:</strong> Vídeos longos (20-30 min) - Conteúdo profundo</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📝 Palavras por Parte</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Densidade de cada seção. Impacta diretamente o tempo final do vídeo.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">⏱️ Cálculo de Duração:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>150 palavras/min:</strong> Narração normal</li>
                        <li><strong>180 palavras/min:</strong> Narração rápida</li>
                        <li><strong>120 palavras/min:</strong> Narração pausada</li>
                      </ul>
                      <p className="font-medium mt-2 mb-1">💡 Recomendações:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                        <li><strong>150-200 palavras/parte:</strong> Vídeos dinâmicos</li>
                        <li><strong>250-350 palavras/parte:</strong> Conteúdo educativo (ideal)</li>
                        <li><strong>400+ palavras/parte:</strong> Análises profundas</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📊 Exemplo de Cálculo</h4>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="text-xs text-muted-foreground">
                        <strong>Configuração:</strong> 7 partes × 300 palavras = 2.100 palavras<br/>
                        <strong>Duração:</strong> 2.100 ÷ 150 palavras/min = <strong>14 minutos</strong><br/>
                        <strong>Perfeito para:</strong> Vídeos educativos de formato médio
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tone">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Tom Narrativo (11 Opções)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O tom define a personalidade do roteiro. Escolha baseado no seu público e estilo do canal.
                  </p>

                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">🎭 Profissional e Confiável</p>
                      <p className="text-xs text-muted-foreground">
                        Formal, autoritativo, baseado em dados. Ideal para finanças, medicina, direito.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">😊 Amigável e Acessível</p>
                      <p className="text-xs text-muted-foreground">
                        Conversa casual, como falar com um amigo. Ideal para lifestyle, tutoriais, vlogs.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">🔥 Motivacional e Inspirador</p>
                      <p className="text-xs text-muted-foreground">
                        Energético, empolgante, que inspira ação. Ideal para desenvolvimento pessoal, fitness.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">😂 Engraçado e Leve</p>
                      <p className="text-xs text-muted-foreground">
                        Humor, piadas, tom descontraído. Ideal para entretenimento, comentários, reações.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">🎓 Educativo e Didático</p>
                      <p className="text-xs text-muted-foreground">
                        Explicativo, passo a passo, foco em ensinar. Ideal para cursos, tutoriais técnicos.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">📚 Storytelling Narrativo</p>
                      <p className="text-xs text-muted-foreground">
                        Conta histórias, usa arcos narrativos. Ideal para casos reais, biografias, documentários.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">⚡ Direto ao Ponto</p>
                      <p className="text-xs text-muted-foreground">
                        Zero enrolação, máxima eficiência. Ideal para listas rápidas, resumos, news.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">🤔 Reflexivo e Profundo</p>
                      <p className="text-xs text-muted-foreground">
                        Análises complexas, provoca pensamento. Ideal para filosofia, sociedade, reviews críticos.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">💎 Luxo e Sofisticação</p>
                      <p className="text-xs text-muted-foreground">
                        Elegante, premium, exclusivo. Ideal para lifestyle de alto padrão, luxo, arte.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">⚔️ Provocativo e Controverso</p>
                      <p className="text-xs text-muted-foreground">
                        Opiniões fortes, debate. Ideal para comentários polêmicos, análises críticas.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm">😌 Calmo e Relaxante</p>
                      <p className="text-xs text-muted-foreground">
                        Tom suave, tranquilo. Ideal para meditação, ASMR, bem-estar, natureza.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="retention">
                <AccordionTrigger>
                  <span className="font-medium">🎯 Fórmulas de Retenção</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Frameworks comprovados para manter audiência assistindo até o final.
                  </p>

                  <div className="bg-muted p-4 rounded">
                    <h4 className="font-medium mb-2">✅ Ethical Retention (Recomendado)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Estratégia ética de retenção focada em entregar valor real.
                    </p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><strong>Funciona assim:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Promessa clara logo no início</li>
                        <li>Loops abertos que resolvem em seguida</li>
                        <li>Progressão lógica de informação</li>
                        <li>Sem clickbait ou falsas promessas</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">🔵 Sem Fórmula Específica</p>
                      <p className="text-xs text-muted-foreground">
                        Roteiro natural focado no conteúdo. Use quando tema é forte o suficiente.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">🔵 Hook-Promise-Deliver</p>
                      <p className="text-xs text-muted-foreground">
                        Gancho inicial → Promessa → Entrega. Clássico eficaz.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">🔵 Problem-Agitate-Solution</p>
                      <p className="text-xs text-muted-foreground">
                        Problema → Agravamento → Solução. Ideal para vendas e persuasão.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ctas">
                <AccordionTrigger>
                  <span className="font-medium">📢 CTAs Estratégicos</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Quando Incluir CTAs?</h4>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">📍 CTA no Início</p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Use para:</strong> Inscrições no canal, notificações<br/>
                          <strong>Momento:</strong> Após hook inicial, antes do conteúdo<br/>
                          <strong>Exemplo:</strong> "Se inscreva para não perder os próximos vídeos"
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">📍 CTA no Meio</p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Use para:</strong> Produtos, cursos, links importantes<br/>
                          <strong>Momento:</strong> Após entregar valor, antes do clímax<br/>
                          <strong>Exemplo:</strong> "Quer aprofundar? Link do curso na descrição"
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium text-sm mb-1">📍 CTA no Final (Mais Comum)</p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Use para:</strong> Próximo vídeo, comentários, engajamento<br/>
                          <strong>Momento:</strong> Após conclusão, antes dos créditos<br/>
                          <strong>Exemplo:</strong> "Comenta aí qual dessas dicas vai aplicar primeiro"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">💡 Dica de Ouro</h4>
                    <p className="text-sm text-muted-foreground">
                      Não use mais de 2 CTAs por vídeo. Muitos CTAs = confusão = nenhuma ação.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="narrative-mode">
                <AccordionTrigger>
                  <span className="font-medium">📖 Modo Narrativo</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ative quando quiser roteiros focados em contar histórias ao invés de listas ou tutoriais.
                  </p>

                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">✅ Use Modo Narrativo Para:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2 space-y-1">
                        <li>Casos de sucesso ou fracasso</li>
                        <li>Biografias e documentários</li>
                        <li>Reviews de produtos com storytelling</li>
                        <li>Viagens e experiências pessoais</li>
                        <li>Evolução de projetos no tempo</li>
                      </ul>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">❌ NÃO Use Modo Narrativo Para:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2 space-y-1">
                        <li>Listas e top 10</li>
                        <li>Tutoriais passo a passo</li>
                        <li>Análises técnicas diretas</li>
                        <li>Vídeos de notícias</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="affiliates">
                <AccordionTrigger>
                  <span className="font-medium">💰 Programa de Afiliados</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Integre produtos de afiliados naturalmente no roteiro sem parecer vendedor demais.
                  </p>

                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium text-sm mb-2">📝 O Que Informar:</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li><strong>Nome do Produto:</strong> Ex: "Curso Python Completo"</li>
                      <li><strong>Benefício Principal:</strong> O que ele resolve</li>
                      <li><strong>Quando Mencionar:</strong> Meio do vídeo é ideal</li>
                      <li><strong>Tom:</strong> Recomendação genuína, não venda forçada</li>
                    </ul>
                  </div>

                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium text-sm mb-2">✅ Boas Práticas:</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Mencione que é afiliado (transparência)</li>
                      <li>Só promova produtos que realmente usa/conhece</li>
                      <li>Integre no contexto do conteúdo</li>
                      <li>Ofereça valor antes de pedir ação</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Sistema de Análise de Qualidade</h3>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">🎯 Pontuação Geral (0-100)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Score automático que avalia múltiplos aspectos do roteiro.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">90-100</Badge>
                      <span className="text-xs">Excelente - Pronto para gravar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-500">75-89</Badge>
                      <span className="text-xs">Bom - Pequenos ajustes recomendados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-yellow-500">60-74</Badge>
                      <span className="text-xs">Razoável - Precisa melhorias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">0-59</Badge>
                      <span className="text-xs">Fraco - Reescrever recomendado</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">📋 Critérios Avaliados</h4>
                  <div className="space-y-2">
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium text-sm">✅ Pontos Fortes</p>
                      <p className="text-xs text-muted-foreground">
                        O que está funcionando bem no roteiro
                      </p>
                    </div>
                    <div className="border-l-4 border-destructive pl-3">
                      <p className="font-medium text-sm">❌ Pontos Fracos</p>
                      <p className="text-xs text-muted-foreground">
                        O que pode ser melhorado
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-3">
                      <p className="font-medium text-sm">💡 Sugestões de Melhoria</p>
                      <p className="text-xs text-muted-foreground">
                        Ações específicas para otimizar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">🚀 Botão "Melhorar com IA"</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use para otimizar roteiros automaticamente baseado na análise.
                  </p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                    <li>Gere um roteiro e analise</li>
                    <li>Revise pontos fracos identificados</li>
                    <li>Clique em "Melhorar com IA"</li>
                    <li>IA reescreve focando nos pontos fracos</li>
                    <li>Analise novamente e compare scores</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">⚠️ Importante</h4>
                  <p className="text-sm text-muted-foreground">
                    A análise é um guia, não uma verdade absoluta. Use seu julgamento criativo final. 
                    Roteiros com 70+ pontos geralmente funcionam bem se o tema for forte.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="strategy-1">
                <AccordionTrigger>
                  <span className="font-medium">1. Workflow Completo de Produção</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">🎬 Do Brainstorm ao Vídeo Final:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li><strong>Brainstorm:</strong> Gere 10 ideias de vídeo</li>
                      <li><strong>Validação:</strong> Valide top 3 com Niche Finder</li>
                      <li><strong>Roteiro:</strong> Crie script da ideia vencedora (7 partes, 300 palavras cada)</li>
                      <li><strong>Análise:</strong> Verifique score (mínimo 75 pontos)</li>
                      <li><strong>Melhoria:</strong> Se necessário, use botão de melhorar</li>
                      <li><strong>Prompts:</strong> Gere prompts de cena do roteiro</li>
                      <li><strong>Guia:</strong> Crie guia de edição</li>
                      <li><strong>Produção:</strong> Grave seguindo o roteiro</li>
                      <li><strong>Otimização:</strong> Use Otimizador de Descrição</li>
                    </ol>
                  </div>
                  <Badge variant="outline">⏱️ Tempo Total: 2-3 horas | 🎯 Resultado: Vídeo profissional completo</Badge>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-2">
                <AccordionTrigger>
                  <span className="font-medium">2. Produção em Massa Eficiente</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Crie banco de roteiros para 30 dias em uma sessão.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">📋 Sistema de Batch Creation:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Reserve 4 horas de trabalho focado</li>
                      <li>Gere 10 roteiros variando temas do mesmo nicho</li>
                      <li>Use modelo/template consistente para todos</li>
                      <li>Analise todos e melhore os que tiverem score -75</li>
                      <li>Organize em pasta por ordem de prioridade</li>
                      <li>Grave 2-3 por semana seguindo o banco</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Benefício:</strong> Consistência de publicação + economia de tempo + menos bloqueio criativo
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-3">
                <AccordionTrigger>
                  <span className="font-medium">3. Otimização de Retenção</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Maximize a porcentagem de audiência que assiste até o final.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">🎯 Técnicas Comprovadas:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li><strong>Hook nos primeiros 5 segundos:</strong> Promessa clara + curiosidade</li>
                      <li><strong>Loops abertos:</strong> "Mais sobre X daqui a pouco"</li>
                      <li><strong>Pattern Interrupt:</strong> Mude ritmo a cada 2 minutos</li>
                      <li><strong>CTAs estratégicos:</strong> No meio para engajar</li>
                      <li><strong>Payoff no final:</strong> Entregue a promessa do início</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">📊 Configure Assim:</p>
                    <p className="text-xs text-muted-foreground">
                      Tom: Direto ao Ponto<br/>
                      Fórmula: Ethical Retention<br/>
                      CTA: No meio<br/>
                      Partes: 5-7<br/>
                      Palavras: 200-250/parte
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-4">
                <AccordionTrigger>
                  <span className="font-medium">4. Série de Vídeos Interconectados</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Crie séries que mantêm audiência voltando.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Escolha um tema amplo (ex: "Python do Zero")</li>
                      <li>Divida em 5-10 episódios progressivos</li>
                      <li>Crie roteiro de cada episódio mencionando próximo</li>
                      <li>Use CTA no final: "No próximo episódio..."</li>
                      <li>Adicione cards e links para episódio seguinte</li>
                      <li>Crie playlist da série completa</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Resultado:</strong> +300% tempo de sessão + algoritmo favorece fortemente
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-5">
                <AccordionTrigger>
                  <span className="font-medium">5. Adaptação para Diferentes Formatos</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Um roteiro → múltiplos formatos de conteúdo.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">📹 Vídeo Longo (YouTube)</p>
                      <p className="text-xs text-muted-foreground">
                        7 partes, 300 palavras cada, tom educativo
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🎬 Short/Reels</p>
                      <p className="text-xs text-muted-foreground">
                        Use apenas o Hook (primeira parte) + conclusão
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">📝 Post de Blog</p>
                      <p className="text-xs text-muted-foreground">
                        Expanda cada parte em seção de artigo
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🐦 Thread Twitter/X</p>
                      <p className="text-xs text-muted-foreground">
                        Cada parte = 1-2 tweets na thread
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-6">
                <AccordionTrigger>
                  <span className="font-medium">6. Roteiros para Vendas e Conversão</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Otimize roteiros para produtos digitais, cursos e afiliados.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-2">💰 Estrutura de Vendas Ideal:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Partes 1-2:</strong> Problema (gere dor/conscientização)</li>
                      <li><strong>Partes 3-4:</strong> Agravamento (mostre consequências)</li>
                      <li><strong>Parte 5:</strong> Introdução da solução (seu produto)</li>
                      <li><strong>Partes 6-7:</strong> Benefícios + Prova Social</li>
                      <li><strong>CTA Final:</strong> Call to action claro e direto</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium text-sm mb-1">⚙️ Configuração Recomendada:</p>
                    <p className="text-xs text-muted-foreground">
                      Tom: Motivacional<br/>
                      Fórmula: Problem-Agitate-Solution<br/>
                      CTA: Meio + Final<br/>
                      Programa de Afiliados: Ativo
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>
                  <span className="font-medium">📅 Rotina de Criação Recomendada</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Segunda (Planejamento):</p>
                      <p className="text-xs text-muted-foreground">
                        Brainstorm de ideias + validação de nichos + criação de 3 roteiros
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Terça (Análise):</p>
                      <p className="text-xs text-muted-foreground">
                        Revisar roteiros, analisar scores, melhorar os fracos
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Quarta-Quinta (Produção):</p>
                      <p className="text-xs text-muted-foreground">
                        Gravação dos 2-3 vídeos da semana
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium text-sm mb-1">🗓️ Sexta (Revisão):</p>
                      <p className="text-xs text-muted-foreground">
                        Criar banco de roteiros para próximas 2 semanas
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-muted p-4 rounded mt-4">
              <h4 className="font-medium mb-2">💎 Dica de Especialista</h4>
              <p className="text-sm text-muted-foreground">
                Os melhores resultados vêm de usar múltiplas ferramentas juntas: Criador de Conteúdo → 
                Prompts para Cenas → Guia de Edição → Otimizador de Descrição. Não use isoladamente!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
