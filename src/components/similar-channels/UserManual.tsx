import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, HelpCircle, Zap, Lightbulb, CheckCircle, AlertCircle, BookOpen, Users, TrendingUp } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Canais Similares</CardTitle>
        <p className="text-muted-foreground">
          Guia detalhado para encontrar canais similares e descobrir oportunidades virais
        </p>
      </CardHeader>
      <CardContent>
        {/* META DA FERRAMENTA */}
        <Alert className="mb-6 bg-primary/5 border-primary/20">
          <Target className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">🎯 Objetivo Principal</AlertTitle>
          <AlertDescription className="text-base">
            Descobrir canais similares a um canal de referência para identificar concorrentes diretos, 
            novos talentos no seu nicho, e oportunidades de baixa competição (Oceano Azul).
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="quick-start" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="quick-start">🚀 Início Rápido</TabsTrigger>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="basic">Filtros Básicos</TabsTrigger>
            <TabsTrigger value="advanced">Avançados</TabsTrigger>
            <TabsTrigger value="dark">🎭 Dark Channels</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
          </TabsList>

          {/* INÍCIO RÁPIDO */}
          <TabsContent value="quick-start" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Guia Rápido para Iniciantes
              </h3>

              {/* QUANDO USAR */}
              <Alert className="mb-4 bg-blue-500/10 border-blue-500/20">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>🤔 Quando Usar Esta Ferramenta?</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Use "Canais Similares" quando você quer:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ Encontrar concorrentes diretos do seu canal ou de referência</li>
                    <li>✅ Descobrir novos talentos crescendo no seu nicho</li>
                    <li>✅ Identificar canais pequenos com potencial (Oceano Azul)</li>
                    <li>✅ Analisar a "vizinhança" de um canal de sucesso</li>
                    <li>✅ Mapear todo o panorama de um nicho específico</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* CONCEITO CANAL DE REFERÊNCIA */}
              <Card className="p-4 mb-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  📖 O que é "Canal de Referência"?
                </h4>
                <p className="text-sm mb-3">
                  É o canal que você usa como <strong>ponto de partida</strong> para a busca. 
                  O sistema vai encontrar outros canais <strong>parecidos com ele</strong>.
                </p>
                
                <div className="space-y-2 text-sm">
                  <p><strong>💡 Analogia simples:</strong></p>
                  <p className="p-3 bg-muted rounded">
                    Se você gosta de um filme, pode pedir recomendações de "filmes similares". 
                    O canal de referência é esse filme inicial - você fornece ele, e nós encontramos os similares!
                  </p>
                  
                  <p className="mt-3"><strong>Exemplos práticos:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Você tem um canal → use SEU canal como referência</li>
                    <li>Quer competir com alguém → use o canal DELE como referência</li>
                    <li>Quer entrar num nicho → use um canal de SUCESSO no nicho como referência</li>
                  </ul>
                </div>
              </Card>

              {/* COMO FUNCIONA SIMILARIDADE */}
              <Card className="p-4 mb-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  🔍 Como a Similaridade é Calculada?
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  O algoritmo analisa múltiplos fatores para determinar se canais são parecidos:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <p className="font-semibold text-sm">📊 Métricas de Crescimento</p>
                      <p className="text-xs text-muted-foreground">Taxa de crescimento de inscritos, views mensais, VPH médio</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <p className="font-semibold text-sm">🎬 Padrões de Conteúdo</p>
                      <p className="text-xs text-muted-foreground">Frequência de upload, duração média dos vídeos, tipo de conteúdo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <p className="font-semibold text-sm">👥 Tamanho da Audiência</p>
                      <p className="text-xs text-muted-foreground">Faixa de inscritos, alcance orgânico, engajamento</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">4</Badge>
                    <div>
                      <p className="font-semibold text-sm">🎯 Nicho e Tema</p>
                      <p className="text-xs text-muted-foreground">Categorias, palavras-chave nos títulos, tópicos principais</p>
                    </div>
                  </div>
                </div>

                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Resultado:</strong> Score de 0-100% mostrando o quão similar cada canal é ao de referência. 
                    Quanto maior o %, mais parecido!
                  </AlertDescription>
                </Alert>
              </Card>

              {/* CHECKLIST PASSO A PASSO */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">✅ Checklist Passo a Passo:</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">1</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Cole a URL do Canal de Referência
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos aceitos: https://youtube.com/@canal, @canal, ou UC...
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">2</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Configure os Filtros Básicos
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Iniciantes:</strong> Máximo 50 canais, Idade: 3650 dias, Inscritos: 50K
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">3</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Clique em "Buscar Canais"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aguarde enquanto o sistema encontra canais similares (1-3 minutos).
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">4</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                        Analise os Resultados
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Veja % de similaridade, métricas de cada canal, badges especiais (Novo, Explosivo, Ativo).
                      </p>
                      <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">5</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                        Aplique Filtros Avançados (Opcional)
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Refine por VPH, Views/Inscritos, Frequência de Upload para encontrar exatamente o que busca.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Badge className="mt-1" variant="outline">6</Badge>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Exporte ou Salve a Busca
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Exporte para Excel ou salve como preset de filtros para usar novamente.
                      </p>
                      <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONFIGURAÇÃO RECOMENDADA INICIANTES */}
              <Alert className="mt-4 bg-green-500/10 border-green-500/20">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>⚡ Configuração Recomendada para Iniciantes</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p><strong>🎯 Objetivo:</strong> Encontrar canais pequenos com potencial</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>Máximo de Canais:</strong> 50</li>
                      <li><strong>Idade Máxima:</strong> 730 dias (2 anos)</li>
                      <li><strong>Máximo Inscritos:</strong> 50.000</li>
                      <li><strong>VPH Mínimo:</strong> 50</li>
                      <li><strong>Ordenar por:</strong> VPH Médio</li>
                      <li><strong>Badges:</strong> Ativar "Canal Novo" + "Canal Ativo"</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </Card>

            {/* CASOS DE USO REAIS */}
            <Card className="p-6 bg-background">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                🎯 Casos de Uso Reais
              </h3>
              
              <div className="space-y-4">
                <Card className="p-4 border-2 border-blue-500/20 bg-blue-500/5">
                  <h4 className="font-bold mb-2">📱 Caso 1: "Quero começar um canal mas não sei por onde"</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Situação:</strong> Você quer criar conteúdo sobre finanças pessoais mas não sabe o tamanho ideal do canal para competir.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>✅ Solução com Canais Similares:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Encontre um canal de finanças de SUCESSO médio (100-200K inscritos)</li>
                      <li>Use-o como referência</li>
                      <li>Configure Máx Inscritos: 30K (encontrar canais menores no mesmo nicho)</li>
                      <li>Filtre por VPH: 50+ (só canais com conteúdo que funciona)</li>
                      <li><strong>Resultado:</strong> Lista de canais pequenos validando o nicho com baixa competição!</li>
                    </ol>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-green-500/20 bg-green-500/5">
                  <h4 className="font-bold mb-2">🎯 Caso 2: "Quero encontrar concorrentes diretos"</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Situação:</strong> Você tem um canal de 15K inscritos sobre meditação e quer ver quem está no mesmo nível.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>✅ Solução com Canais Similares:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Use SEU canal como referência</li>
                      <li>Configure Máx Inscritos: 50K (pegar quem está próximo ou um pouco acima)</li>
                      <li>Configure Mín Inscritos: 5K (evitar canais muito pequenos)</li>
                      <li>Ordene por: Similaridade (mais parecidos primeiro)</li>
                      <li><strong>Resultado:</strong> Concorrentes diretos para monitorar e aprender!</li>
                    </ol>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-purple-500/20 bg-purple-500/5">
                  <h4 className="font-bold mb-2">💎 Caso 3: "Quero descobrir novos talentos no meu nicho"</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Situação:</strong> Você quer identificar criadores emergentes para colaborações ou patrocínios.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>✅ Solução com Canais Similares:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Use um canal de referência consolidado no nicho</li>
                      <li>Configure Idade Máxima: 365 dias (apenas canais de até 1 ano)</li>
                      <li>Configure Máx Inscritos: 20K</li>
                      <li>Ative badge "Canal Novo" + "Canal Explosivo"</li>
                      <li>Ordene por: VPH Médio</li>
                      <li><strong>Resultado:</strong> Talentos emergentes crescendo rápido!</li>
                    </ol>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-primary/5">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-6 w-6" />
                O que é "Canais Similares"?
              </h3>
              <p className="text-sm">
                "Canais Similares" é uma ferramenta que permite encontrar canais do YouTube que são parecidos com um canal de referência. 
                Isso ajuda a mapear concorrentes, descobrir novos criadores no seu nicho e identificar oportunidades de crescimento.
              </p>
              <p className="mt-4 text-sm">
                A similaridade é calculada com base em métricas de crescimento, padrões de conteúdo, tamanho da audiência e temas abordados.
              </p>
            </Card>
          </TabsContent>

          {/* FILTROS BÁSICOS */}
          <TabsContent value="basic" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Badge>Filtros Básicos</Badge>
              </h3>
              <p className="text-sm">
                Configure os filtros básicos para limitar a busca a canais que atendam aos seus critérios de interesse.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li><strong>Máximo de Canais:</strong> Limite o número de canais retornados para análise.</li>
                <li><strong>Idade Máxima do Canal:</strong> Filtra canais criados há no máximo X dias.</li>
                <li><strong>Faixa de Inscritos:</strong> Defina o tamanho dos canais para focar em concorrentes relevantes.</li>
                <li><strong>Ordenação:</strong> Escolha ordenar por VPH, Similaridade, ou Inscritos.</li>
              </ul>
            </Card>
          </TabsContent>

          {/* DARK CHANNELS */}
          <TabsContent value="dark" className="space-y-6">
            <Card className="p-6 bg-purple-500/5">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                🎭 Detector de Canais Dark (Faceless)
              </h3>
              
              <Alert className="mb-4 bg-purple-500/10 border-purple-500/20">
                <AlertDescription>
                  <strong>🤖 Análise com IA:</strong> Sistema automático detecta canais sem rosto usando Inteligência Artificial. 
                  Analisa descrição, títulos e padrões de conteúdo para identificar canais faceless.
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dark-1">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎯 O que é um Canal Dark/Faceless?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">
                      Canais dark (ou faceless) são aqueles que <strong>não mostram o rosto do criador</strong>. 
                      São muito populares por serem:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>✅ <strong>Mais fáceis de escalar</strong> - Qualquer pessoa pode gravar</li>
                      <li>✅ <strong>Menor exposição pessoal</strong> - Privacidade preservada</li>
                      <li>✅ <strong>Automatizáveis</strong> - Podem usar IA para narração</li>
                      <li>✅ <strong>Nichos lucrativos</strong> - Curiosidades, listas, tutoriais</li>
                    </ul>

                    <div className="mt-4 space-y-2">
                      <p className="font-semibold">📋 Tipos de Canais Dark:</p>
                      <div className="grid gap-2 mt-2">
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">🎙️ Narração + Imagens</p>
                          <p className="text-xs text-muted-foreground">Voz em off com slides, fotos, vídeos de arquivo</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">📹 Stock Videos</p>
                          <p className="text-xs text-muted-foreground">Apenas vídeos de banco sem aparecer pessoa</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">🎨 Animações</p>
                          <p className="text-xs text-muted-foreground">Motion graphics, texto animado, infográficos</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">🤖 IA / TTS</p>
                          <p className="text-xs text-muted-foreground">Voz gerada por IA com imagens/vídeos</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">📺 Compilações</p>
                          <p className="text-xs text-muted-foreground">Compilações de clipes sem apresentador</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="font-semibold text-sm">💻 Screen Recording</p>
                          <p className="text-xs text-muted-foreground">Tutoriais de tela sem webcam</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dark-2">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎯 Dark Score: Métrica Combinada (0-100)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">
                      O <strong>Dark Score</strong> é uma métrica única que combina múltiplos fatores para avaliar a 
                      <strong> qualidade e potencial de um canal dark</strong>:
                    </p>

                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                        <p className="font-semibold text-sm mb-2">📊 Fórmula do Dark Score:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                          <li><strong>40%</strong> - Confiança da IA (quão certo está que é dark)</li>
                          <li><strong>30%</strong> - VPH normalizado (viralidade do conteúdo)</li>
                          <li><strong>20%</strong> - Engajamento (views por inscrito)</li>
                          <li><strong>10%</strong> - Frequência de upload</li>
                        </ul>
                      </div>

                      <div className="grid gap-2">
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="font-semibold text-sm">✅ Score 80-100: EXCELENTE</p>
                          <p className="text-xs text-muted-foreground">Canal dark de alta qualidade, muito viral, ótima oportunidade</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="font-semibold text-sm">✅ Score 60-79: BOM</p>
                          <p className="text-xs text-muted-foreground">Canal dark sólido, bom desempenho, vale investigar</p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                          <p className="font-semibold text-sm">⚠️ Score 40-59: MÉDIO</p>
                          <p className="text-xs text-muted-foreground">Canal dark funcional mas não destacado</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                          <p className="font-semibold text-sm">❌ Score 0-39: BAIXO</p>
                          <p className="text-xs text-muted-foreground">Canal dark com performance fraca ou incerto</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dark-3">
                  <AccordionTrigger className="text-lg font-semibold">
                    ⚙️ Como Funciona a Detecção?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm">1️⃣ Coleta de Dados</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sistema busca descrição do canal, títulos dos últimos vídeos, keywords
                        </p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm">2️⃣ Análise com IA</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gemini Flash analisa os dados e identifica padrões de canais faceless
                        </p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm">3️⃣ Classificação</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Retorna se é dark (sim/não), confiança (0-100%), tipo e Dark Score
                        </p>
                      </div>
                    </div>

                    <Alert className="mt-3">
                      <AlertDescription className="text-xs">
                        <strong>⚡ Processamento:</strong> Análise automática dos top 10 canais encontrados. 
                        Pode levar 1-2 minutos.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dark-4">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎯 Preset "Apenas Dark Channels"
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">
                      Use o preset <strong>🎭 Apenas Dark Channels</strong> para filtrar SOMENTE canais sem rosto confirmados:
                    </p>
                    
                    <div className="p-4 bg-purple-500/10 rounded border border-purple-500/20">
                      <p className="font-semibold mb-2">Configuração do Preset:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>✅ Apenas canais detectados como dark</li>
                        <li>✅ VPH mínimo: 100 (conteúdo viral)</li>
                        <li>✅ Análise automática com IA</li>
                      </ul>
                    </div>

                    <Alert className="bg-green-500/10 border-green-500/20">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>💡 Dica Pro</AlertTitle>
                      <AlertDescription className="text-xs">
                        Combine com filtro de idade (60-365 dias) para encontrar canais dark NOVOS que estão crescendo.
                        Isso identifica formatos faceless validados com baixa competição!
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dark-5">
                  <AccordionTrigger className="text-lg font-semibold">
                    💰 Preset "Canais Novíssimos" + Monetização
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      Dois presets poderosos para encontrar oportunidades específicas:
                    </p>

                    <div className="space-y-3">
                      <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
                        <p className="font-semibold mb-2">⏰ Canais Novíssimos (0-60 dias)</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Identifica canais MUITO novos (até 2 meses) com potencial:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                          <li>Idade máxima: 60 dias</li>
                          <li>VPH mínimo: 50 (já mostra tração)</li>
                          <li>Views/Inscrito: 0.5+ (engajamento inicial)</li>
                          <li>Upload frequência: 1+ por mês</li>
                        </ul>
                        <Badge className="mt-2 bg-blue-500 text-white">Oportunidade Máxima</Badge>
                      </div>

                      <div className="p-4 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold mb-2">💰 Aptos para Monetização</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Canais que JÁ atingiram requisitos do YPP (YouTube Partner Program):
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                          <li>1.000+ inscritos</li>
                          <li>4.000+ horas de watch time (estimado)</li>
                          <li>Frequência: 4+ vídeos/mês (canal ativo)</li>
                        </ul>
                        <Badge className="mt-2 bg-green-500 text-white">Prontos para $$$</Badge>
                      </div>
                    </div>

                    <Alert className="bg-yellow-500/10 border-yellow-500/20 mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Estratégia Avançada:</strong> Use "Novíssimos" + filtro Dark para encontrar 
                        canais faceless nascendo agora. Se já têm VPH alto, é sinal de nicho validado!
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>


          {/* FILTROS AVANÇADOS */}
          <TabsContent value="advanced" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Badge>Filtros Avançados</Badge>
              </h3>
              <p className="text-sm">
                Use filtros avançados para refinar ainda mais a busca e encontrar canais com características específicas.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li><strong>VPH Mínimo:</strong> Filtra canais com vídeos que têm alta velocidade de crescimento.</li>
                <li><strong>Relação Views/Inscritos:</strong> Identifica canais com alcance orgânico além da base de inscritos.</li>
                <li><strong>Frequência de Upload:</strong> Filtra canais ativos com uploads regulares.</li>
                <li><strong>Badges:</strong> Ative para mostrar canais "Novos", "Explosivos" ou "Ativos".</li>
              </ul>
            </Card>
          </TabsContent>

          {/* ANÁLISE */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Análise dos Resultados
              </h3>
              <p className="text-sm">
                Após a busca, analise os canais encontrados observando:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li><strong>Score de Similaridade:</strong> Quanto mais próximo de 100%, mais parecido com o canal de referência.</li>
                <li><strong>VPH Médio:</strong> Indica canais com vídeos virais recentes.</li>
                <li><strong>Badges:</strong> Identifique canais novos, explosivos e ativos para oportunidades.</li>
                <li><strong>Faixa de Inscritos:</strong> Avalie o tamanho da audiência para competição e oportunidades.</li>
              </ul>
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
                    Qual a diferença entre "Canais Similares" e "Monitoramento de Concorrentes"?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2 text-left">Aspecto</th>
                            <th className="p-2 text-left bg-blue-500/10">Canais Similares</th>
                            <th className="p-2 text-left bg-green-500/10">Monitoramento</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-semibold">🎯 Objetivo</td>
                            <td className="p-2 bg-blue-500/5">DESCOBRIR novos canais</td>
                            <td className="p-2 bg-green-500/5">ACOMPANHAR canais conhecidos</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-semibold">⏱️ Frequência</td>
                            <td className="p-2 bg-blue-500/5">Busca pontual (1x)</td>
                            <td className="p-2 bg-green-500/5">Monitoramento contínuo</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-semibold">📊 Dados</td>
                            <td className="p-2 bg-blue-500/5">Métricas gerais do canal</td>
                            <td className="p-2 bg-green-500/5">Vídeos detalhados + atualizações</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-semibold">🔍 Uso</td>
                            <td className="p-2 bg-blue-500/5">Mapear o nicho</td>
                            <td className="p-2 bg-green-500/5">Detectar vídeos virais em tempo real</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <Alert className="mt-3 bg-blue-500/10">
                      <AlertDescription>
                        <strong>💡 Dica:</strong> Use "Canais Similares" para ENCONTRAR quem monitorar, 
                        depois adicione esses canais ao "Monitoramento de Concorrentes" para acompanhar continuamente.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-lg font-semibold">
                    Por que alguns canais aparecem com Score de Qualidade baixo?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>Motivos comuns:</strong></p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <strong>Canal esconde inscritos:</strong> Alguns criadores desativam a exibição pública do contador de inscritos
                      </li>
                      <li>
                        <strong>Poucos vídeos públicos:</strong> Canal novo ou com muitos vídeos privados/deletados
                      </li>
                      <li>
                        <strong>API do YouTube limitada:</strong> Alguns dados não estão disponíveis via API
                      </li>
                      <li>
                        <strong>Canal inativo:</strong> Não publica há muito tempo, dados desatualizados
                      </li>
                    </ul>
                    
                    <Alert className="mt-3">
                      <AlertDescription>
                        <strong>Recomendação:</strong> Priorize canais com Score de Qualidade 80%+ para análises confiáveis. 
                        Canais com score baixo podem ter métricas imprecisas.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-lg font-semibold">
                    Quantos canais devo buscar? 50, 100 ou 200?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>Depende do seu objetivo:</strong></p>
                    
                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold flex items-center gap-2">
                          <Badge>50 canais</Badge>
                          Busca Rápida e Focada
                        </p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Ótimo para iniciantes</li>
                          <li>Análise rápida (1-2 min)</li>
                          <li>Consome menos quota da API</li>
                          <li><strong>Use quando:</strong> Quer uma visão geral rápida</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                        <p className="font-semibold flex items-center gap-2">
                          <Badge>100 canais</Badge>
                          Análise Completa (Recomendado)
                        </p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Equilíbrio ideal</li>
                          <li>Análise profunda mas não lenta</li>
                          <li>Tempo: 2-4 min</li>
                          <li><strong>Use quando:</strong> Quer mapeamento completo do nicho</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                        <p className="font-semibold flex items-center gap-2">
                          <Badge>200 canais</Badge>
                          Busca Profunda
                        </p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Máximo de canais possível</li>
                          <li>Tempo: 5-8 min</li>
                          <li>Consome mais quota</li>
                          <li><strong>Use quando:</strong> Precisa mapear TODO o ecossistema do nicho</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-lg font-semibold">
                    O que significam os badges "Novo", "Explosivo" e "Ativo"?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold flex items-center gap-2">
                          🌱 Canal Novo
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Critério:</strong> Criado há menos de 1 ano (365 dias)
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Por que importa:</strong> Representa oportunidades emergentes. 
                          Se um canal novo já está similar ao seu nicho, significa que o formato está validado e a competição ainda é baixa.
                        </p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold flex items-center gap-2">
                          🚀 Canal Explosivo
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Critério:</strong> VPH médio alto + crescimento acelerado recente
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Por que importa:</strong> Canal que está viralizando AGORA. 
                          Analise o formato, títulos e thumbnails dele - há algo funcionando muito bem que você pode adaptar.
                        </p>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold flex items-center gap-2">
                          ⚡ Canal Ativo
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Critério:</strong> Upload nos últimos 7 dias + frequência alta
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Por que importa:</strong> Criador comprometido e consistente. 
                          Ótimo para colaborações, estudar estratégias atuais, ou como concorrente direto a monitorar.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-lg font-semibold">
                    Como usar Views/Inscritos para encontrar Oceanos Azuis?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>A relação Views/Inscritos revela se o canal cresce organicamente:</strong></p>
                    
                    <div className="space-y-3 mt-3">
                      <Alert className="bg-red-500/10">
                        <AlertDescription>
                          <strong>🔴 Views/Inscritos &lt; 1.0:</strong>
                          <p className="text-sm mt-1">Canal depende muito da base de inscritos. Pouco alcance orgânico. Crescimento lento.</p>
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-yellow-500/10">
                        <AlertDescription>
                          <strong>🟡 Views/Inscritos 1.0-3.0:</strong>
                          <p className="text-sm mt-1">Crescimento orgânico saudável. Canal está fazendo conteúdo que agrada o algoritmo.</p>
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-green-500/10">
                        <AlertDescription>
                          <strong>🟢 Views/Inscritos 3.0-10.0:</strong>
                          <p className="text-sm mt-1">Excelente alcance orgânico! Vídeos alcançam muito além da base de inscritos. <strong>OCEANO AZUL!</strong></p>
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-blue-500/10">
                        <AlertDescription>
                          <strong>💎 Views/Inscritos &gt; 10.0:</strong>
                          <p className="text-sm mt-1">Conteúdo EXTREMAMENTE viral. Algoritmo está promovendo massivamente. Nicho com demanda latente enorme!</p>
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Alert className="mt-4 bg-primary/10">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>💡 Estratégia de Ouro</AlertTitle>
                      <AlertDescription>
                        Configure o filtro:
                        <ul className="list-disc list-inside mt-2">
                          <li>Views/Inscritos Mínimo: 5.0</li>
                          <li>Máximo Inscritos: 20.000</li>
                          <li>VPH Mínimo: 50</li>
                        </ul>
                        <strong className="block mt-2">
                          = Canais pequenos com conteúdo extremamente viral = OPORTUNIDADE DE OURO!
                        </strong>
                      </AlertDescription>
                    </Alert>
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
                  <AlertTitle>💡 Dica Rápida</AlertTitle>
                  <AlertDescription>
                    Ordene por "Idade do Canal" para encontrar os talentos mais novos do nicho!
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <Target className="h-4 w-4" />
                  <AlertTitle>🎯 Hack de Pesquisa</AlertTitle>
                  <AlertDescription>
                    Use canais de 100-200K como referência + filtro máx 30K = Encontrar quem está subindo no nicho!
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>📈 Estratégia Avançada</AlertTitle>
                  <AlertDescription>
                    Combine badges "Novo" + "Explosivo" + VPH 100+ = Formatos viralizando AGORA em canais novos!
                  </AlertDescription>
                </Alert>

                <Alert className="bg-background">
                  <Users className="h-4 w-4" />
                  <AlertTitle>👥 Colaborações</AlertTitle>
                  <AlertDescription>
                    Filtre por tamanho similar ao seu (±50% inscritos) para encontrar parceiros ideais!
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
