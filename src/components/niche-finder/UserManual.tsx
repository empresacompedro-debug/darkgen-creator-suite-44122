import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Filter, TrendingUp, Search, Lightbulb, AlertCircle, Zap, HelpCircle, CheckCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UserManual() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Manual Completo do Niche Finder</h2>
          <p className="text-muted-foreground">Guia detalhado para dominar a descoberta de nichos virais</p>
        </div>
      </div>

      {/* META DA FERRAMENTA */}
      <Alert className="mb-6 bg-primary/5 border-primary/20">
        <Target className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">🎯 Objetivo Principal</AlertTitle>
        <AlertDescription className="text-base">
          Descobrir nichos virais pouco explorados no YouTube usando IA para analisar milhares de vídeos 
          e identificar oportunidades de ouro com baixa competição e alto potencial de crescimento.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quick-start" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="quick-start">Início Rápido</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="basic-filters">Filtros Básicos</TabsTrigger>
          <TabsTrigger value="advanced-filters">Filtros Avançados</TabsTrigger>
          <TabsTrigger value="niche-lists">Lista de Nichos</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

          {/* INÍCIO RÁPIDO */}
        <TabsContent value="quick-start" className="space-y-6">
          {/* MODO DE BUSCA - DESTAQUE */}
          <Alert className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <Search className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-lg font-bold">🎯 Modo de Busca: Seu Ponto de Partida</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="font-semibold">🔍 Como funciona?</p>
              <p className="text-sm">
                O Niche Finder busca vídeos baseado em <strong>palavras-chave</strong> que você define, 
                aplicando filtros inteligentes para encontrar oportunidades de ouro:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>🔎 <strong>Busca por palavra-chave:</strong> Digite um tema (ex: "true crime", "horror stories")</li>
                <li>⚙️ <strong>Filtros personalizáveis:</strong> Configure idade do canal, inscritos, VPH e mais</li>
                <li>🤖 <strong>Análise com IA:</strong> Agrupa vídeos similares e identifica nichos específicos</li>
                <li>📊 <strong>Score de oportunidade:</strong> Calcula potencial de cada nicho automaticamente</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>💡 Dica:</strong> Comece com palavras-chave amplas (ex: "true crime", "horror") e use filtros para refinar. 
                Teste em português E inglês para maximizar descobertas!
              </p>
              <Badge className="mt-3" variant="outline">⚡ Consumo de quota varia: 300-1500 unidades dependendo dos filtros</Badge>
            </AlertDescription>
          </Alert>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Guia de 5 Minutos para Iniciantes
            </h3>
            
            <Alert className="mb-4 bg-background">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Nunca usou ferramentas de análise do YouTube?</AlertTitle>
              <AlertDescription>
                Não se preocupe! Este guia vai te ensinar o básico em poucos minutos.
                <br /><br />
                <strong>O que você precisa saber:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Views (Visualizações):</strong> Quantas vezes um vídeo foi assistido</li>
                  <li><strong>Inscritos:</strong> Número de seguidores de um canal</li>
                  <li><strong>VPH (Views Por Hora):</strong> Métrica que mostra velocidade de crescimento do vídeo</li>
                  <li><strong>Nicho:</strong> Categoria específica de conteúdo (ex: "true crime", "horror stories")</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">✅ Checklist Passo a Passo:</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">1</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Digite uma Palavra-Chave no Modo de Busca
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Exemplo: "true crime" (amplo), "serial killer documentaries" (específico) ou "horror stories" (em inglês)
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>💡 Dica:</strong> Teste a mesma palavra em português e inglês para descobrir nichos diferentes!
                    </p>
                    <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">2</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Use o Modo Caçador (Recomendado)
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Modo Caçador" - ele configura tudo automaticamente para você encontrar oportunidades de ouro.
                    </p>
                    <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">3</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Clique em "Buscar Nichos"
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aguarde enquanto a IA analisa milhares de vídeos (pode levar 2-5 minutos).
                    </p>
                    <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">4</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-yellow-600" />
                      Analise o Dashboard de Oportunidades
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Veja os nichos organizados por "Score de Oportunidade". Quanto maior o score (0-100), melhor!
                    </p>
                    <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">5</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-yellow-600" />
                      Expanda os Nichos de Interesse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em um nicho para ver todos os vídeos dentro dele. Analise títulos, thumbnails e métricas.
                    </p>
                    <Badge className="mt-2" variant="secondary">🟡 Intermediário</Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <Badge className="mt-1" variant="outline">6</Badge>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Exporte os Dados
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Exportar Excel" para ter todos os dados offline e planejar seu conteúdo.
                    </p>
                    <Badge className="mt-2" variant="secondary">🟢 Básico</Badge>
                  </div>
                </div>
              </div>

              <Alert className="bg-green-500/10 border-green-500/20">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>💡 Dica para Iniciantes</AlertTitle>
                <AlertDescription>
                  Procure nichos com:
                  <ul className="list-disc list-inside mt-2">
                    <li>Score de Oportunidade acima de 70</li>
                    <li>Saturação "Baixa" ou "Muito Baixa"</li>
                    <li>Tendência "Crescente"</li>
                  </ul>
                  Esses são os nichos mais fáceis de crescer!
                </AlertDescription>
              </Alert>
            </div>
          </Card>

          {/* GLOSSÁRIO VISUAL */}
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              📖 Glossário Visual: Entenda as Métricas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">🔥 VPH (Views Por Hora)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Quantas visualizações um vídeo recebe por hora desde a publicação.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge variant="outline">10 VPH</Badge> = Bom</p>
                  <p><Badge variant="outline">50 VPH</Badge> = Muito Bom</p>
                  <p><Badge variant="outline">100+ VPH</Badge> = Viral! 🚀</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Por que importa:</strong> VPH mostra se um vídeo está crescendo rápido, independente de quando foi publicado.
                  </AlertDescription>
                </Alert>
              </Card>

              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">⭐ Score de Oportunidade</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Nota de 0-100 que indica o potencial do nicho.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge variant="destructive">0-40</Badge> = Evite (saturado)</p>
                  <p><Badge variant="outline">40-70</Badge> = Moderado</p>
                  <p><Badge variant="default">70-100</Badge> = Excelente! 💎</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Como é calculado:</strong> Combina VPH médio, saturação, inscritos médios e tendência.
                  </AlertDescription>
                </Alert>
              </Card>

              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">📊 Saturação</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Nível de competição no nicho.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge className="bg-green-600">Muito Baixa</Badge> = Oceano Azul 🌊</p>
                  <p><Badge className="bg-yellow-600">Baixa</Badge> = Boa oportunidade</p>
                  <p><Badge className="bg-orange-600">Média</Badge> = Competitivo</p>
                  <p><Badge className="bg-red-600">Alta</Badge> = Evite</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Baseado em:</strong> Número de canais grandes vs pequenos no nicho.
                  </AlertDescription>
                </Alert>
              </Card>

              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">📈 Tendência</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Direção do nicho nos últimos 90 dias.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge className="bg-green-600">↗️ Crescente</Badge> = Está esquentando!</p>
                  <p><Badge className="bg-blue-600">→ Estável</Badge> = Evergreen</p>
                  <p><Badge className="bg-red-600">↘️ Declínio</Badge> = Esfriando</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Use para:</strong> Pegar nichos em ascensão antes da saturação.
                  </AlertDescription>
                </Alert>
              </Card>

              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">👥 Inscritos Médios</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Tamanho médio dos canais no nicho.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge variant="outline">500-5K</Badge> = Micro-canais</p>
                  <p><Badge variant="outline">5K-30K</Badge> = Ideal! 💎</p>
                  <p><Badge variant="outline">100K+</Badge> = Muito grande</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Oportunidade:</strong> Nichos com canais pequenos = baixa competição.
                  </AlertDescription>
                </Alert>
              </Card>

              <Card className="p-4 bg-background border-2">
                <h4 className="font-bold text-lg mb-2">📹 Score Viral</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Relação entre views e inscritos.
                </p>
                <div className="space-y-1 text-sm">
                  <p><Badge variant="outline">1.0</Badge> = Normal</p>
                  <p><Badge variant="outline">3.0+</Badge> = Muito bom</p>
                  <p><Badge variant="outline">10.0+</Badge> = Extremo! 🔥</p>
                </div>
                <Alert className="mt-3 bg-blue-500/10">
                  <AlertDescription className="text-xs">
                    <strong>Significa:</strong> Vídeo recebe views de fora da base de inscritos (algoritmo).
                  </AlertDescription>
                </Alert>
              </Card>
            </div>
          </Card>

          {/* ERROS COMUNS */}
          <Card className="p-6 bg-red-500/5 border-red-500/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              ❌ Erros Comuns de Iniciantes
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="error-1">
                <AccordionTrigger className="text-red-600 font-semibold">
                  ❌ Buscar nichos muito amplos
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p><strong>Erro:</strong> Usar palavras como "vídeo", "canal", "YouTube"</p>
                  <p><strong>Por que é ruim:</strong> Retorna milhões de resultados sem foco</p>
                  <p className="text-green-600"><strong>✅ Solução:</strong> Use termos específicos como "unsolved mysteries", "creepy horror stories", "dark history"</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="error-2">
                <AccordionTrigger className="text-red-600 font-semibold">
                  ❌ Ignorar o Score de Oportunidade
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p><strong>Erro:</strong> Focar só em VPH ou views</p>
                  <p><strong>Por que é ruim:</strong> Pode escolher nichos saturados ou em declínio</p>
                  <p className="text-green-600"><strong>✅ Solução:</strong> Sempre priorize nichos com Score 70+ combinado com saturação baixa</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="error-3">
                <AccordionTrigger className="text-red-600 font-semibold">
                  ❌ Não configurar filtros de inscritos
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p><strong>Erro:</strong> Deixar inscritos ilimitados</p>
                  <p><strong>Por que é ruim:</strong> Retorna canais gigantes (alta competição impossível de bater)</p>
                  <p className="text-green-600"><strong>✅ Solução:</strong> Configure Máx: 30.000 inscritos para encontrar oportunidades reais</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="error-4">
                <AccordionTrigger className="text-red-600 font-semibold">
                  ❌ Buscar poucos vídeos (menos de 1000)
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p><strong>Erro:</strong> Configurar apenas 200-500 vídeos</p>
                  <p><strong>Por que é ruim:</strong> Amostra pequena = nichos mal formados, dados imprecisos</p>
                  <p className="text-green-600"><strong>✅ Solução:</strong> Use no mínimo 1.000 vídeos. Ideal: 2.000-3.000 para análise completa</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="error-5">
                <AccordionTrigger className="text-red-600 font-semibold">
                  ❌ Não testar diferentes palavras-chave
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p><strong>Erro:</strong> Fazer apenas 1 busca e desistir</p>
                  <p><strong>Por que é ruim:</strong> Perde oportunidades em variações da palavra</p>
                  <p className="text-green-600"><strong>✅ Solução:</strong> Teste em português E inglês, singulares e plurais. Ex: "meditação", "meditation", "guided meditation"</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        {/* VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6 bg-primary/5">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-6 w-6" />
              O que é o Niche Finder?
            </h3>
            <div className="space-y-4 text-sm">
              <p>
                O Niche Finder é uma ferramenta avançada que utiliza <strong>Inteligência Artificial</strong> para descobrir 
                nichos virais pouco explorados no YouTube. Ele analisa milhares de vídeos e agrupa-os automaticamente em 
                nichos específicos, calculando métricas de oportunidade, saturação e tendências.
              </p>
              
              <div className="bg-background p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">🎯 Principais Funcionalidades:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Busca Inteligente:</strong> Encontra vídeos baseado em palavras-chave com filtros personalizados</li>
                  <li><strong>Análise com IA:</strong> Agrupa vídeos similares em nichos usando Gemini AI</li>
                  <li><strong>Score de Oportunidade:</strong> Calcula automaticamente o potencial de cada nicho (0-100)</li>
                  <li><strong>Análise de Saturação:</strong> Identifica nichos com pouca competição (Oceano Azul)</li>
                  <li><strong>Detecção de Tendências:</strong> Mostra se o nicho está crescendo ou em declínio</li>
                  <li><strong>Modo Caçador:</strong> Configuração otimizada para encontrar oportunidades de ouro</li>
                  <li><strong>Exportação Avançada:</strong> Exporta dados em Excel com múltiplas planilhas</li>
                </ul>
              </div>

              <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Fluxo de Uso Recomendado:
                </h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Defina uma palavra-chave relacionada ao tema que deseja explorar</li>
                  <li>Configure os filtros básicos (idade dos canais, inscritos, views)</li>
                  <li>Ajuste os filtros avançados (VPH, score viral, relação views/inscritos)</li>
                  <li>Execute a busca ou use o <strong>Modo Caçador</strong> para configuração automática</li>
                  <li>Analise o Dashboard de Oportunidades gerado pela IA</li>
                  <li>Aplique filtros de oportunidade para refinar os resultados</li>
                  <li>Expanda os nichos de interesse para ver vídeos detalhados</li>
                  <li>Exporte os dados para análise offline</li>
                </ol>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* FILTROS BÁSICOS */}
        <TabsContent value="basic-filters" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Filter className="h-6 w-6" />
              Filtros Básicos: Controle Total da Busca
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="keyword">
                <AccordionTrigger className="text-lg font-semibold">
                  🔍 Palavra-chave do Modo de Busca
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Define o tema principal que será pesquisado no YouTube. A palavra-chave é a base de toda a busca e análise de nichos.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📝 Como Usar Estrategicamente:</h5>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Palavras amplas:</strong> Descobrir nichos diversos (ex: "meditação", "receitas", "ASMR")</li>
                      <li><strong>Palavras específicas:</strong> Focar em sub-nichos (ex: "meditação guiada para ansiedade", "receitas veganas rápidas")</li>
                      <li><strong>Teste bilíngue:</strong> Busque em português E inglês - nichos podem variar bastante!</li>
                      <li><strong>Variações:</strong> Teste singular/plural, sinônimos (ex: "oração" vs "orações" vs "prayer")</li>
                      <li><strong>Evite genéricos:</strong> Não use "vídeo", "canal", "YouTube" - são muito amplos</li>
                    </ul>
                  </div>

                  <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20">
                    <strong>🚀 Estratégia de Múltiplas Buscas:</strong> Faça 3-5 buscas diferentes com variações da mesma palavra-chave 
                    e compare os resultados. Use a <strong>Lista de Nichos</strong> para organizar e agrupar as descobertas!
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💡 Dica Pro:</strong> Comece com palavras amplas + filtros rigorosos (VPH alto, poucos inscritos). 
                    Por exemplo: "oração" + VPH 100+ + Máx 10K inscritos = nichos virais inexplorados.
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>Exemplos Práticos de Buscas:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>"ASMR" → Sub-nichos de ASMR pouco explorados (ex: ASMR roleplay, ASMR cooking)</li>
                      <li>"affirmations" → Nichos de afirmações virais em inglês</li>
                      <li>"receitas fit" → Culinária saudável (depois teste "healthy recipes" em inglês)</li>
                      <li>"meditation music" → Música para meditação (compare com "música para meditação")</li>
                      <li>"histórias para dormir" → Nicho de narrativas (teste "sleep stories" também)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="channel-age">
                <AccordionTrigger className="text-lg font-semibold">
                  📅 Idade Máxima do Canal (dias)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Filtra canais criados há no máximo X dias. Útil para encontrar criadores iniciantes que viralizaram rapidamente.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">⚙️ Valores Recomendados:</h5>
                    <ul className="space-y-2">
                      <li>
                        <Badge>30-90 dias</Badge> → Canais <strong>muito novos</strong> que explodiram rapidamente. 
                        Alta chance de nichos inexplorados, mas poucos resultados.
                      </li>
                      <li>
                        <Badge>180-365 dias</Badge> → Canais <strong>recentes</strong> (até 1 ano). 
                        Equilíbrio entre novidade e volume de dados. <strong>RECOMENDADO</strong>
                      </li>
                      <li>
                        <Badge>730+ dias</Badge> → Inclui canais mais estabelecidos. 
                        Maior volume de resultados, mas pode incluir nichos saturados.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <strong>⚠️ Importante:</strong> Canais muito novos (menos de 30 dias) podem ter dados incompletos. 
                    Recomendamos <strong>180 dias</strong> para resultados confiáveis.
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>🎯 Estratégia:</strong> Combine "180 dias" + "VPH alto" + "Poucos inscritos" = 
                    Encontrar canais novos que viralizaram sem audiência prévia (nichos com alta oportunidade).
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="subscribers">
                <AccordionTrigger className="text-lg font-semibold">
                  👥 Faixa de Inscritos (Mín/Máx)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Define o tamanho dos canais a serem incluídos. Essencial para avaliar o nível de competição.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎚️ Faixas Estratégicas:</h5>
                    <ul className="space-y-3">
                      <li>
                        <Badge variant="outline">500 - 5.000</Badge>
                        <p className="mt-1"><strong>Micro-canais iniciantes:</strong> Baixíssima competição, mas dados podem ser inconsistentes. 
                        Use para validar nichos completamente inexplorados.</p>
                      </li>
                      <li>
                        <Badge variant="outline">5.000 - 30.000</Badge>
                        <p className="mt-1"><strong>Canais pequenos com tração:</strong> Ponto ideal para oportunidades. 
                        Canais que já provaram o nicho mas ainda não saturaram. <strong>MELHOR FAIXA</strong></p>
                      </li>
                      <li>
                        <Badge variant="outline">30.000 - 100.000</Badge>
                        <p className="mt-1"><strong>Canais médios:</strong> Nichos validados e rentáveis, mas com competição crescente. 
                        Ainda há espaço para entrar.</p>
                      </li>
                      <li>
                        <Badge variant="outline">100.000+</Badge>
                        <p className="mt-1"><strong>Canais grandes:</strong> Nichos estabelecidos e saturados. 
                        Evite, exceto para análise de mercado.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💎 Segredo de Ouro:</strong> Configure <strong>Mín: 500</strong> e <strong>Máx: 30.000</strong>. 
                    Esta faixa captura criadores que estão crescendo organicamente em nichos pouco explorados.
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>Combinação Poderosa:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li>Inscritos: 500-10.000 + VPH Mínimo: 100 = Nichos virais sem audiência</li>
                      <li>Inscritos: 10.000-50.000 + Score Viral: 4.0+ = Nichos validados e rentáveis</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="video-age">
                <AccordionTrigger className="text-lg font-semibold">
                  🕐 Idade Máxima do Vídeo (dias)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Filtra apenas vídeos publicados nos últimos X dias. Crucial para detectar tendências recentes.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📊 Cenários de Uso:</h5>
                    <ul className="space-y-3">
                      <li>
                        <Badge>7-14 dias</Badge>
                        <p className="mt-1"><strong>Tendências quentes:</strong> Vídeos muito recentes que estão viralizando AGORA. 
                        Perfeito para pegar ondas antes da saturação. Risco: poucos dados para análise.</p>
                      </li>
                      <li>
                        <Badge>30 dias</Badge>
                        <p className="mt-1"><strong>Tendências do mês:</strong> Equilíbrio perfeito entre novidade e confiabilidade. 
                        Vídeos tiveram tempo de viralizar. <strong>RECOMENDADO</strong></p>
                      </li>
                      <li>
                        <Badge>60-90 dias</Badge>
                        <p className="mt-1"><strong>Tendências consolidadas:</strong> Nichos que provaram ser duradouros. 
                        Menos risco, mas competição pode estar aumentando.</p>
                      </li>
                      <li>
                        <Badge>180+ dias</Badge>
                        <p className="mt-1"><strong>Nichos evergreen:</strong> Conteúdos atemporais que continuam gerando views. 
                        Ótimo para nichos de longo prazo.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <strong>⚡ Atenção:</strong> Vídeos com menos de 7 dias podem não ter dados suficientes para calcular VPH confiável. 
                    Prefira <strong>30 dias</strong> para análises precisas.
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>🚀 Estratégia Rápida:</strong> Use 14 dias + VPH Altíssimo (200+) = Detectar explosões virais acontecendo AGORA. 
                    Publique conteúdo similar antes que o nicho sature.
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="views">
                <AccordionTrigger className="text-lg font-semibold">
                  👁️ Views Mínimas
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Define o número mínimo de visualizações que um vídeo deve ter para ser incluído. Garante que o nicho tem demanda real.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎯 Thresholds Recomendados:</h5>
                    <ul className="space-y-3">
                      <li>
                        <Badge>10.000 - 50.000</Badge>
                        <p className="mt-1"><strong>Validação mínima:</strong> Vídeos que provaram ter alguma tração. 
                        Pode incluir nichos muito específicos (micro-nichos).</p>
                      </li>
                      <li>
                        <Badge>50.000 - 100.000</Badge>
                        <p className="mt-1"><strong>Nichos com demanda:</strong> Vídeos que alcançaram audiência significativa. 
                        Ponto ideal para equilibrar oportunidade e validação. <strong>RECOMENDADO</strong></p>
                      </li>
                      <li>
                        <Badge>200.000+</Badge>
                        <p className="mt-1"><strong>Nichos virais comprovados:</strong> Apenas vídeos que explodiram. 
                        Garante alto potencial, mas pode filtrar oportunidades emergentes.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💡 Combinação Inteligente:</strong> Views Mín: 100.000 + Inscritos Máx: 20.000 = 
                    Encontrar vídeos que viralizaram em canais pequenos (alta oportunidade de replicar).
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>Contexto Importante:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li>Views absolutas variam por nicho. 100K pode ser viral em nichos de meditação, mas comum em gaming.</li>
                      <li>Sempre combine com <strong>Relação Views/Inscritos</strong> para avaliar performance real.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="max-videos">
                <AccordionTrigger className="text-lg font-semibold">
                  📹 Máximo de Vídeos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Limita quantos vídeos serão retornados pela busca. Afeta tempo de processamento e cota da API do YouTube.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">⚖️ Balanceamento:</h5>
                    <ul className="space-y-3">
                      <li>
                        <Badge>500 vídeos</Badge>
                        <p className="mt-1"><strong>Busca rápida:</strong> Análise superficial, poucos nichos detectados. 
                        Use para testes ou buscas muito específicas.</p>
                      </li>
                      <li>
                        <Badge>1.000 vídeos</Badge>
                        <p className="mt-1"><strong>Busca padrão:</strong> Equilíbrio entre velocidade e profundidade. 
                        Gera 5-8 nichos em média. <strong>RECOMENDADO</strong></p>
                      </li>
                      <li>
                        <Badge>2.000+ vídeos</Badge>
                        <p className="mt-1"><strong>Busca profunda:</strong> Análise completa, detecta até 15+ nichos. 
                        Demora mais (2-3 minutos) e consome mais cota.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <strong>⚠️ Cota da API:</strong> Cada vídeo retornado consome cota do YouTube. 
                    Se você tem API própria, pode usar 2.000+. Se usa a API padrão, limite em 1.000-1.500.
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>🎯 Dica:</strong> Para análises exploratórias, use 1.500 vídeos. 
                    Para nichos muito específicos, 500 já é suficiente.
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        {/* LISTA DE NICHOS */}
        <TabsContent value="niche-lists" className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-purple-600" />
              📋 Lista de Nichos: Organize Suas Descobertas
            </h3>
            
            <Alert className="mb-4 bg-background">
              <Target className="h-4 w-4" />
              <AlertTitle>O que são Listas de Nichos?</AlertTitle>
              <AlertDescription>
                As Listas de Nichos permitem que você <strong>organize e salve nichos descobertos</strong> em categorias personalizadas. 
                É como ter várias pastas para guardar suas oportunidades de ouro e compará-las estrategicamente.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎯 Como Funcionam as Listas de Nichos?
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>As Listas de Nichos são coleções personalizadas onde você pode:</p>
                    
                    <div className="bg-background p-4 rounded-lg border">
                      <h5 className="font-semibold mb-2">✨ Funcionalidades:</h5>
                      <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong>Criar listas ilimitadas:</strong> Organize por tema, estratégia, nível de dificuldade, etc.</li>
                        <li><strong>Salvar nichos descobertos:</strong> Clique em "Salvar em Lista" em qualquer nicho do dashboard</li>
                        <li><strong>Adicionar descrição:</strong> Anote insights, estratégias e próximos passos para cada lista</li>
                        <li><strong>Visualizar histórico:</strong> Acesse nichos salvos a qualquer momento</li>
                        <li><strong>Comparar nichos:</strong> Veja diferentes listas lado a lado para tomar decisões</li>
                      </ul>
                    </div>

                    <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                      <strong>💡 Exemplo Prático:</strong> Você faz 5 buscas diferentes ("ASMR", "meditation", "sleep music", "oração", "affirmations"). 
                      Salva os top 3 nichos de cada busca em listas separadas. Depois compara qual lista tem mais oportunidades reais.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="how-to-use">
                  <AccordionTrigger className="text-lg font-semibold">
                    🚀 Como Usar Listas de Nichos na Prática
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="space-y-4">
                      <div className="bg-background p-4 rounded-lg border">
                        <h5 className="font-semibold mb-2">📋 Passo a Passo:</h5>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li><strong>Crie uma lista:</strong> Clique em "Gerenciar Listas de Nichos" → "Nova Lista"</li>
                          <li><strong>Nomeie estrategicamente:</strong> Ex: "ASMR - Alta Oportunidade", "Nichos para Testar", "Top 10 Junho"</li>
                          <li><strong>Adicione descrição:</strong> Ex: "Nichos com score 80+, saturação baixa, para canal novo"</li>
                          <li><strong>Salve nichos:</strong> Durante a busca, clique em "Salvar em Lista" nos nichos interessantes</li>
                          <li><strong>Revise e compare:</strong> Abra suas listas para revisar e decidir qual nicho explorar primeiro</li>
                        </ol>
                      </div>

                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>💡 Dica de Organização</AlertTitle>
                        <AlertDescription>
                          Crie listas por critérios específicos:
                          <ul className="list-disc list-inside mt-2">
                            <li><strong>Por score:</strong> "Score 90-100", "Score 70-89", "Score 60-69"</li>
                            <li><strong>Por idioma:</strong> "Nichos PT-BR", "Nichos Inglês"</li>
                            <li><strong>Por status:</strong> "Testar Primeiro", "Monitorar", "Descartados"</li>
                            <li><strong>Por tema:</strong> "Meditação", "ASMR", "Receitas"</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="strategies">
                  <AccordionTrigger className="text-lg font-semibold">
                    🎓 Estratégias Avançadas com Listas de Nichos
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="space-y-4">
                      <Card className="p-4 bg-purple-500/5 border-purple-500/20">
                        <h5 className="font-bold mb-2">🔥 Estratégia 1: Pipeline de Validação</h5>
                        <p className="text-sm mb-2">Use 3 listas para validar nichos progressivamente:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li><strong>"Descobertos":</strong> Salve todos os nichos interessantes aqui primeiro</li>
                          <li><strong>"Validando":</strong> Mova os 5 melhores para análise profunda (competitor research)</li>
                          <li><strong>"Produzir":</strong> Os nichos validados que você vai criar conteúdo</li>
                        </ol>
                      </Card>

                      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                        <h5 className="font-bold mb-2">📊 Estratégia 2: Comparação A/B</h5>
                        <p className="text-sm mb-2">Compare resultados de buscas diferentes:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                          <li>Busque "meditação" → Salve top 5 na lista "Meditação PT"</li>
                          <li>Busque "meditation" → Salve top 5 na lista "Meditation EN"</li>
                          <li>Compare qual idioma tem melhores oportunidades (score, saturação)</li>
                          <li>Decida se vai produzir em PT, EN ou ambos</li>
                        </ul>
                      </Card>

                      <Card className="p-4 bg-green-500/5 border-green-500/20">
                        <h5 className="font-bold mb-2">🎯 Estratégia 3: Funil de Nichos</h5>
                        <p className="text-sm mb-2">Organize por dificuldade de entrada:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                          <li><strong>"Fácil - Começar Agora":</strong> Score 80+, saturação muito baixa, 0-5K inscritos médios</li>
                          <li><strong>"Médio - Próximo Mês":</strong> Score 70-79, saturação baixa, 5-15K inscritos</li>
                          <li><strong>"Avançado - Longo Prazo":</strong> Score 60-69, saturação média, 15-30K inscritos</li>
                        </ul>
                      </Card>

                      <Card className="p-4 bg-orange-500/5 border-orange-500/20">
                        <h5 className="font-bold mb-2">🔄 Estratégia 4: Rotação Sazonal</h5>
                        <p className="text-sm mb-2">Crie listas por época do ano:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                          <li><strong>"Janeiro - Ano Novo":</strong> Nichos de motivação, planejamento, metas</li>
                          <li><strong>"Junho - Inverno":</strong> Nichos de conforto, sopas, meditação noturna</li>
                          <li><strong>"Dezembro - Festas":</strong> Nichos de receitas natalinas, decoração</li>
                          <li>Prepare conteúdo com antecedência baseado nas tendências sazonais</li>
                        </ul>
                      </Card>

                      <Card className="p-4 bg-red-500/5 border-red-500/20">
                        <h5 className="font-bold mb-2">⚡ Estratégia 5: Teste Rápido (MVP)</h5>
                        <p className="text-sm mb-2">Use listas para validar nichos antes de investir pesado:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li>Crie lista "Testar Esta Semana" com 3-5 nichos diferentes</li>
                          <li>Produza 1 vídeo simples para cada nicho (low effort)</li>
                          <li>Monitore performance nos primeiros 7 dias</li>
                          <li>Mova os que performaram para lista "Investir Mais"</li>
                          <li>Descarte ou ajuste os que não funcionaram</li>
                        </ol>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="integration">
                  <AccordionTrigger className="text-lg font-semibold">
                    🔗 Integrando Listas com Outras Ferramentas
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Maximize o valor das suas listas combinando com outras ferramentas da plataforma:</p>
                    
                    <div className="space-y-3">
                      <div className="bg-background p-4 rounded-lg border">
                        <h5 className="font-semibold mb-2">🎯 Workflow Completo:</h5>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li><strong>Niche Finder:</strong> Descubra nichos e salve os melhores em listas</li>
                          <li><strong>Monitoramento de Concorrentes:</strong> Adicione canais dos nichos salvos para monitorar</li>
                          <li><strong>Análise de Canais:</strong> Analise padrões dos canais dos nichos promissores</li>
                          <li><strong>Criador de Conteúdo:</strong> Crie roteiros baseados nos nichos validados</li>
                          <li><strong>Gerador de Títulos:</strong> Gere títulos virais para o nicho escolhido</li>
                        </ol>
                      </div>

                      <Alert className="bg-purple-500/10 border-purple-500/20">
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>🚀 Fluxo Recomendado</AlertTitle>
                        <AlertDescription className="text-sm">
                          <strong>Semana 1:</strong> Faça 10 buscas diferentes, salve top 30 nichos em 3 listas
                          <br />
                          <strong>Semana 2:</strong> Analise os 30 nichos em profundidade, descarte 20, mantenha 10
                          <br />
                          <strong>Semana 3:</strong> Teste 3-5 nichos com vídeos simples
                          <br />
                          <strong>Semana 4:</strong> Escolha o melhor nicho baseado em performance e invista pesado
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="best-practices">
                  <AccordionTrigger className="text-lg font-semibold">
                    ✅ Boas Práticas e Erros Comuns
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="space-y-4">
                      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                        <h5 className="font-semibold mb-2 text-green-700">✅ FAÇA ISSO:</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Revise suas listas semanalmente para manter nichos relevantes</li>
                          <li>Adicione notas/descrições detalhadas em cada lista</li>
                          <li>Delete listas antigas que não são mais úteis</li>
                          <li>Use nomes descritivos e sistemáticos para as listas</li>
                          <li>Exporte listas importantes para backup em Excel</li>
                          <li>Combine nichos de listas diferentes para criar sub-nichos únicos</li>
                        </ul>
                      </div>

                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <h5 className="font-semibold mb-2 text-red-700">❌ EVITE ISSO:</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Criar dezenas de listas desorganizadas sem critério claro</li>
                          <li>Salvar nichos sem revisar depois (paralisia por análise)</li>
                          <li>Ignorar a descrição da lista (você vai esquecer o critério usado)</li>
                          <li>Nunca deletar listas antigas (acumula lixo)</li>
                          <li>Salvar TODOS os nichos encontrados (seja seletivo)</li>
                          <li>Não exportar dados importantes (risco de perder informações)</li>
                        </ul>
                      </div>

                      <Alert className="bg-orange-500/10 border-orange-500/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>⚠️ Atenção: Limites e Quota</AlertTitle>
                        <AlertDescription className="text-sm">
                          Salvar nichos em listas <strong>NÃO consome quota</strong>. Use à vontade para organizar suas descobertas! 
                          Apenas a busca inicial consome quota.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Card>
        </TabsContent>

        {/* FILTROS AVANÇADOS */}
        <TabsContent value="advanced-filters" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Filtros Avançados: Encontre Oportunidades de Ouro
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="vph">
                <AccordionTrigger className="text-lg font-semibold">
                  ⚡ VPH Mínimo (Views Por Hora)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p><strong>🔥 O FILTRO MAIS IMPORTANTE DA FERRAMENTA!</strong></p>
                    <p className="mt-2">
                      <strong>VPH (Views Por Hora)</strong> mede a velocidade com que um vídeo está recebendo visualizações. 
                      É a métrica definitiva para detectar conteúdo viral.
                    </p>
                  </div>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📐 Fórmula:</h5>
                    <code className="bg-muted p-2 rounded block">
                      VPH = Views Totais / (Idade do Vídeo em Horas)
                    </code>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Exemplo: Vídeo com 240.000 views publicado há 10 dias (240 horas) = 1.000 VPH
                    </p>
                  </div>

                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎚️ Escala de Viralidade:</h5>
                    <ul className="space-y-2">
                      <li>
                        <Badge variant="outline">0-50 VPH</Badge> → Vídeo comum, crescimento orgânico lento
                      </li>
                      <li>
                        <Badge variant="outline">50-100 VPH</Badge> → Boa performance, acima da média
                      </li>
                      <li>
                        <Badge className="bg-green-600">100-200 VPH</Badge> → <strong>VIRAL</strong> - Alta chance de replicar
                      </li>
                      <li>
                        <Badge className="bg-orange-600">200-500 VPH</Badge> → <strong>SUPER VIRAL</strong> - Oportunidade confirmada
                      </li>
                      <li>
                        <Badge className="bg-red-600">500+ VPH</Badge> → <strong>EXPLOSIVO</strong> - Agir rápido antes da saturação
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                    <h5 className="font-semibold mb-2">💎 Estratégias Avançadas:</h5>
                    <ul className="space-y-2">
                      <li>
                        <strong>Descobrir nichos emergentes:</strong>
                        <br />VPH Mín: 150 + Inscritos Máx: 10.000 + Idade Vídeo: 14 dias
                        <br /><span className="text-xs text-muted-foreground">Resultado: Vídeos viralizando em canais pequenos recentemente</span>
                      </li>
                      <li>
                        <strong>Validar nichos evergreen:</strong>
                        <br />VPH Mín: 80 + Idade Vídeo: 180 dias
                        <br /><span className="text-xs text-muted-foreground">Resultado: Vídeos que continuam performando meses depois</span>
                      </li>
                      <li>
                        <strong>Pegar ondas virais:</strong>
                        <br />VPH Mín: 300 + Idade Vídeo: 7 dias
                        <br /><span className="text-xs text-muted-foreground">Resultado: Explosões acontecendo AGORA</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <strong>⚠️ Cuidado:</strong> VPH muito alto (&gt;500) pode indicar:
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>Tendências passageiras (trends de momento)</li>
                      <li>Tráfego pago (não orgânico)</li>
                      <li>Nichos que podem saturar rapidamente</li>
                    </ul>
                    <p className="mt-2"><strong>Recomendação:</strong> VPH entre 100-250 é o sweet spot para nichos sustentáveis.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="viral-score">
                <AccordionTrigger className="text-lg font-semibold">
                  🌟 Score Viral Mínimo
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Função:</strong> Score proprietário que combina VPH, engagement (likes, comentários) e crescimento. Simplifica a identificação de vídeos virais.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🧮 Como é Calculado:</h5>
                    <code className="bg-muted p-2 rounded block text-xs">
                      Score = (VPH / 100) × 0.5 + (Engagement Rate × 10) × 0.3 + (Growth Factor) × 0.2
                    </code>
                    <p className="mt-2">
                      <strong>Resumindo:</strong> Quanto maior o VPH, likes, comentários e views recentes, maior o score.
                    </p>
                  </div>

                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📊 Interpretação:</h5>
                    <ul className="space-y-2">
                      <li>
                        <Badge variant="outline">0.0 - 2.0</Badge> → Performance fraca, evite
                      </li>
                      <li>
                        <Badge variant="outline">2.0 - 3.5</Badge> → Performance média
                      </li>
                      <li>
                        <Badge className="bg-green-600">3.5 - 4.5</Badge> → <strong>BOA OPORTUNIDADE</strong>
                      </li>
                      <li>
                        <Badge className="bg-orange-600">4.5 - 5.5</Badge> → <strong>EXCELENTE</strong> - Alta chance de sucesso
                      </li>
                      <li>
                        <Badge className="bg-red-600">5.5+</Badge> → <strong>EXCEPCIONAL</strong> - Viral confirmado
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💡 Quando Usar:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li>Use <strong>4.0+</strong> para análises rápidas (filtra automaticamente oportunidades)</li>
                      <li>Combine com outros filtros para refinar (ex: Score 4.5+ + Inscritos &lt;20K)</li>
                      <li>Ignore scores abaixo de 3.0, exceto para nichos muito específicos</li>
                    </ul>
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>Diferença entre VPH e Score Viral:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li><strong>VPH:</strong> Mede apenas velocidade de views</li>
                      <li><strong>Score Viral:</strong> Considera também engagement e momentum</li>
                    </ul>
                    <p className="mt-2 text-xs">Use VPH para análises técnicas. Use Score para filtros rápidos.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="view-sub-ratio">
                <AccordionTrigger className="text-lg font-semibold">
                  📈 Relação Views/Inscritos Mínima
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p><strong>🎯 INDICADOR DE VIRALIDADE ORGÂNICA!</strong></p>
                    <p className="mt-2">
                      Mede quantas views um vídeo gerou em relação ao número de inscritos do canal. 
                      Valores altos indicam que o vídeo alcançou audiência ALÉM da base de inscritos.
                    </p>
                  </div>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📐 Fórmula:</h5>
                    <code className="bg-muted p-2 rounded block">
                      Relação = Views do Vídeo / Inscritos do Canal
                    </code>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Exemplo: Vídeo com 200.000 views em canal de 5.000 inscritos = Relação de 40
                    </p>
                  </div>

                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎚️ Benchmarks:</h5>
                    <ul className="space-y-2">
                      <li>
                        <Badge variant="outline">1-5</Badge> → Audiência majoritariamente inscrita (baixa viralidade)
                      </li>
                      <li>
                        <Badge variant="outline">5-10</Badge> → Alguma descoberta orgânica
                      </li>
                      <li>
                        <Badge className="bg-green-600">10-20</Badge> → <strong>BOA VIRALIDADE</strong> - Algoritmo favoreceu
                      </li>
                      <li>
                        <Badge className="bg-orange-600">20-50</Badge> → <strong>ALTA VIRALIDADE</strong> - Nicho com potencial
                      </li>
                      <li>
                        <Badge className="bg-red-600">50+</Badge> → <strong>VIRAL EXTREMO</strong> - Oportunidade de ouro
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                    <h5 className="font-semibold mb-2">💎 Por que isso é importante:</h5>
                    <p>
                      Um canal com 100.000 inscritos fazendo 150.000 views é <strong>menos valioso</strong> que 
                      um canal de 2.000 inscritos fazendo 100.000 views.
                    </p>
                    <p className="mt-2">
                      O segundo provou que o <strong>nicho tem demanda orgânica</strong>, não dependendo de audiência pré-existente.
                    </p>
                    <ul className="list-disc list-inside ml-2 mt-3">
                      <li>Relação alta = Nicho fácil de viralizar organicamente</li>
                      <li>Relação baixa = Dependência de audiência estabelecida</li>
                    </ul>
                  </div>

                  <div className="bg-orange-500/10 p-4 rounded border border-orange-500/20">
                    <h5 className="font-semibold mb-2">🚀 Estratégia Definitiva:</h5>
                    <p className="font-semibold text-primary">
                      Relação &gt;15 + Inscritos &lt;10.000 + VPH &gt;100 = 
                      <span className="block mt-1">NICHO VIRAL SEM COMPETIÇÃO ESTABELECIDA</span>
                    </p>
                    <p className="mt-3 text-xs">
                      Essa combinação identifica nichos onde até iniciantes conseguem viralizar facilmente.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hunter-mode">
                <AccordionTrigger className="text-lg font-semibold">
                  🎯 Modo Caçador de Oportunidades
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-500/30">
                    <p className="font-bold text-lg">🏆 CONFIGURAÇÃO AUTOMÁTICA PARA OPORTUNIDADES DE OURO</p>
                    <p className="mt-2">
                      O Modo Caçador aplica automaticamente os filtros ideais para encontrar nichos virais + baixa competição.
                    </p>
                  </div>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">⚙️ Configurações Aplicadas:</h5>
                    <ul className="space-y-1 text-xs">
                      <li>✅ Idade Máxima Canal: <strong>180 dias</strong> (canais recentes)</li>
                      <li>✅ Inscritos Mín: <strong>500</strong> / Máx: <strong>30.000</strong> (baixa competição)</li>
                      <li>✅ Idade Máxima Vídeo: <strong>30 dias</strong> (tendências recentes)</li>
                      <li>✅ Views Mínimas: <strong>100.000</strong> (demanda validada)</li>
                      <li>✅ Relação Views/Inscritos: <strong>15+</strong> (alta viralidade orgânica)</li>
                      <li>✅ VPH Mínimo: Não definido (permite amplitude)</li>
                      <li>✅ Score Viral: <strong>4.5+</strong> (apenas oportunidades excelentes)</li>
                      <li>✅ Máximo Vídeos: <strong>1.500</strong> (análise profunda)</li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                    <h5 className="font-semibold mb-2">🎯 Quando Usar:</h5>
                    <ul className="space-y-2">
                      <li>
                        <strong>✅ Use quando:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Você quer resultados rápidos sem configurar manualmente</li>
                          <li>Está explorando um tema novo sem conhecimento prévio</li>
                          <li>Quer garantir apenas oportunidades de alta qualidade</li>
                          <li>Não sabe quais filtros combinar</li>
                        </ul>
                      </li>
                      <li className="mt-3">
                        <strong>❌ NÃO use quando:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Você busca nichos muito específicos (micro-nichos)</li>
                          <li>Quer incluir canais maiores (50K+ inscritos)</li>
                          <li>Precisa de mais controle granular sobre os filtros</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>💡 Fluxo Recomendado:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-2 space-y-1">
                      <li>Digite uma palavra-chave ampla (ex: "sleep music")</li>
                      <li>Clique em "🎯 Modo Caçador de Oportunidades"</li>
                      <li>Aguarde a análise (2-3 minutos)</li>
                      <li>Analise o Dashboard gerado</li>
                      <li>Refine com filtros de oportunidade se necessário</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        {/* ESTRATÉGIAS */}
        <TabsContent value="strategies" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Estratégias de Descoberta Inteligente
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="mixing-tools">
                <AccordionTrigger className="text-lg font-semibold">
                  🔥 Como Combinar Modo de Busca + Lista de Nichos (ESTRATÉGIA MESTRA)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="font-semibold text-base mb-3">Esta é a estratégia mais poderosa para descobrir e validar nichos de ouro:</p>
                  
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
                    <h5 className="font-bold mb-3">📋 Workflow Completo (Passo a Passo):</h5>
                    
                    <div className="space-y-4">
                      <div className="bg-background p-3 rounded-lg border">
                        <p className="font-semibold mb-2">🔍 Fase 1: Busca Exploratória (Semana 1)</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li>Escolha um tema amplo (ex: "meditação", "ASMR", "receitas")</li>
                          <li>Use <strong>Modo Caçador</strong> para configuração automática</li>
                          <li>Faça 3-5 buscas com variações:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>"meditação" (PT)</li>
                              <li>"meditation" (EN)</li>
                              <li>"guided meditation" (EN específico)</li>
                              <li>"meditação guiada" (PT específico)</li>
                            </ul>
                          </li>
                          <li>Crie uma Lista de Nichos chamada "Meditação - Descobertas Iniciais"</li>
                          <li>Salve os top 10 nichos de CADA busca nesta lista (40-50 nichos total)</li>
                        </ol>
                      </div>

                      <div className="bg-background p-3 rounded-lg border">
                        <p className="font-semibold mb-2">🎯 Fase 2: Filtragem e Validação (Semana 2)</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li>Abra a lista "Meditação - Descobertas Iniciais"</li>
                          <li>Analise cada nicho criteriosamente:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Score acima de 70? ✅</li>
                              <li>Saturação "Baixa" ou "Muito Baixa"? ✅</li>
                              <li>Tendência "Crescente"? ✅</li>
                              <li>Inscritos médios abaixo de 20K? ✅</li>
                            </ul>
                          </li>
                          <li>Selecione os 15-20 melhores nichos</li>
                          <li>Crie uma NOVA lista: "Meditação - Validar Esta Semana"</li>
                          <li>Mova apenas os nichos selecionados para esta nova lista</li>
                        </ol>
                      </div>

                      <div className="bg-background p-3 rounded-lg border">
                        <p className="font-semibold mb-2">🔬 Fase 3: Análise Profunda (Semana 3)</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li>Para cada nicho da lista "Validar Esta Semana":
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Expanda o nicho e analise os vídeos individuais</li>
                              <li>Verifique thumbnails, títulos, engagement</li>
                              <li>Pesquise no YouTube se já existe muita competição</li>
                              <li>Use <strong>Monitoramento de Concorrentes</strong> para rastrear os canais</li>
                            </ul>
                          </li>
                          <li>Descarte 10 nichos que não passaram na análise profunda</li>
                          <li>Crie lista final: "Meditação - PRODUZIR"</li>
                          <li>Mova os 5-10 nichos vencedores para esta lista</li>
                        </ol>
                      </div>

                      <div className="bg-background p-3 rounded-lg border">
                        <p className="font-semibold mb-2">🚀 Fase 4: Teste e Execução (Semana 4)</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                          <li>Escolha 3 nichos da lista "PRODUZIR"</li>
                          <li>Crie 1 vídeo teste simples para cada um (baixo esforço)</li>
                          <li>Publique e monitore performance nos primeiros 7 dias</li>
                          <li>O nicho que performar melhor vira seu FOCO PRINCIPAL</li>
                          <li>Crie lista "Meditação - FOCO CANAL" e mova o nicho vencedor</li>
                          <li>Produza 10-15 vídeos neste nicho nos próximos 2 meses</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-green-500/10 border-green-500/20 mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>💎 Segredo do Sucesso</AlertTitle>
                    <AlertDescription className="text-sm">
                      A mágica está na ORGANIZAÇÃO. Use listas como um funil:
                      <br />
                      <strong>50 nichos descobertos → 20 validados → 10 testados → 1 escolhido</strong>
                      <br /><br />
                      Sem listas, você vai se perder nos dados. Com listas, você cria um SISTEMA replicável.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="multiple-niches">
                <AccordionTrigger className="text-lg font-semibold">
                  🌐 Estratégia: Buscar Múltiplos Nichos em Paralelo
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <p className="mb-3">Em vez de focar em apenas 1 tema, busque 3-5 temas diferentes simultaneamente e compare oportunidades:</p>
                    
                    <div className="space-y-3">
                      <div className="bg-purple-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">📋 Exemplo Prático:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li><strong>Segunda-feira:</strong> Busque "meditação" → Salve top 10 na lista "Meditação - Descobertas"</li>
                          <li><strong>Terça-feira:</strong> Busque "ASMR" → Salve top 10 na lista "ASMR - Descobertas"</li>
                          <li><strong>Quarta-feira:</strong> Busque "sleep music" → Salve top 10 na lista "Sleep Music - Descobertas"</li>
                          <li><strong>Quinta-feira:</strong> Busque "affirmations" → Salve top 10 na lista "Affirmations - Descobertas"</li>
                          <li><strong>Sexta-feira:</strong> Busque "oração" → Salve top 10 na lista "Oração - Descobertas"</li>
                        </ol>
                      </div>

                      <div className="bg-blue-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">📊 Fim de Semana: Análise Comparativa</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Abra as 5 listas lado a lado (use múltiplas abas)</li>
                          <li>Compare qual tema tem:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Maior número de nichos com score 80+</li>
                              <li>Menor saturação média</li>
                              <li>Tendência mais crescente</li>
                            </ul>
                          </li>
                          <li>O tema vencedor vira seu FOCO PRINCIPAL</li>
                          <li>Os outros ficam como backup para diversificar no futuro</li>
                        </ul>
                      </div>
                    </div>

                    <Alert className="bg-orange-500/10 border-orange-500/20 mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>⚡ Vantagem Competitiva</AlertTitle>
                      <AlertDescription className="text-sm">
                        Enquanto outros criadores testam 1 nicho por vez e desistem se não funcionar, 
                        você testa 5 simultaneamente e escolhe o melhor. Isso multiplica suas chances de sucesso por 5x!
                      </AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="seasonal-strategy">
                <AccordionTrigger className="text-lg font-semibold">
                  📅 Estratégia: Planejamento Sazonal com Listas
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <p className="mb-3">Use Listas de Nichos para planejar conteúdo ao longo do ano e pegar tendências sazonais:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-blue-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">❄️ Janeiro-Março</p>
                        <p className="text-xs mb-2">Temas: Ano Novo, Metas, Motivação</p>
                        <ul className="list-disc list-inside text-xs ml-2">
                          <li>Liste: "Q1 - Ano Novo"</li>
                          <li>Busque: "New Year goals", "resoluções"</li>
                          <li>Produza em Dezembro (antecipação)</li>
                        </ul>
                      </div>

                      <div className="bg-green-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">🌸 Abril-Junho</p>
                        <p className="text-xs mb-2">Temas: Primavera, Limpeza, Renovação</p>
                        <ul className="list-disc list-inside text-xs ml-2">
                          <li>Liste: "Q2 - Primavera"</li>
                          <li>Busque: "spring cleaning", "organização"</li>
                          <li>Produza em Março</li>
                        </ul>
                      </div>

                      <div className="bg-yellow-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">☀️ Julho-Setembro</p>
                        <p className="text-xs mb-2">Temas: Verão, Fitness, Viagem</p>
                        <ul className="list-disc list-inside text-xs ml-2">
                          <li>Liste: "Q3 - Verão"</li>
                          <li>Busque: "summer fitness", "receitas leves"</li>
                          <li>Produza em Junho</li>
                        </ul>
                      </div>

                      <div className="bg-orange-500/5 p-3 rounded border">
                        <p className="font-semibold mb-2">🍂 Outubro-Dezembro</p>
                        <p className="text-xs mb-2">Temas: Festas, Natal, Balanço Anual</p>
                        <ul className="list-disc list-inside text-xs ml-2">
                          <li>Liste: "Q4 - Festas"</li>
                          <li>Busque: "Christmas recipes", "decoração natal"</li>
                          <li>Produza em Setembro</li>
                        </ul>
                      </div>
                    </div>

                    <Alert className="bg-purple-500/10 border-purple-500/20 mt-4">
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>🎯 Pro Tip: Planejamento Trimestral</AlertTitle>
                      <AlertDescription className="text-sm">
                        No início de cada trimestre, faça buscas focadas em tendências sazonais dos próximos 3 meses. 
                        Salve em listas específicas e produza conteúdo COM ANTECEDÊNCIA. 
                        Quando o tema ficar quente, seus vídeos já estarão rankeando!
                      </AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="when-use-strategies">
                <AccordionTrigger className="text-lg font-semibold">
                  🤔 Quando Usar Estratégias?
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                    <h5 className="font-semibold mb-2">✅ Use estratégias quando:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Você <strong>NÃO sabe o que buscar</strong></li>
                      <li>Quer descobrir <strong>tendências que você nunca imaginaria</strong></li>
                      <li>Precisa validar se existe demanda em segmentos específicos</li>
                      <li>Está começando do zero e não tem uma palavra-chave</li>
                      <li>Quer economizar tempo configurando filtros manualmente</li>
                    </ul>
                  </div>

                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mt-4">
                    <h5 className="font-semibold mb-2">❌ NÃO use estratégias quando:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Você já tem uma <strong>palavra-chave específica</strong> em mente</li>
                      <li>Precisa de controle total sobre cada filtro</li>
                      <li>Está analisando um nicho muito específico que você já conhece</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-broad">
                <AccordionTrigger className="text-lg font-semibold">
                  🌍 Estratégia 1: Nichos Amplos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        Iniciante
                      </Badge>
                      <span className="text-xs text-muted-foreground">Tempo estimado: ~25-30s</span>
                    </div>
                    
                    <h5 className="font-semibold mb-2">🎯 Objetivo:</h5>
                    <p>Identificar grandes categorias com alto volume, mas ainda com espaço para novos criadores.</p>
                    
                    <h5 className="font-semibold mt-4 mb-2">⚙️ Configurações Principais:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Vídeos Máximos: <strong>800</strong></li>
                      <li>Visualizações Mínimas: <strong>50.000</strong> (alto alcance)</li>
                      <li>Inscritos: <strong>10.000 - 500.000</strong> (canais estabelecidos, não mega-canais)</li>
                      <li>Idade do Vídeo: <strong>até 60 dias</strong> (conteúdo recente)</li>
                      <li>Viral Score: <strong>3.0+</strong> (performance moderada)</li>
                      <li>Opportunity Score: <strong>40+</strong></li>
                      <li>Saturação Máxima: <strong>70%</strong></li>
                    </ul>
                    
                    <h5 className="font-semibold mt-4 mb-2">📊 Exemplos de Resultados:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>"Finanças Pessoais"</li>
                      <li>"Receitas Saudáveis"</li>
                      <li>"Tecnologia para Iniciantes"</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-sub">
                <AccordionTrigger className="text-lg font-semibold">
                  📦 Estratégia 2: Sub-Nichos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                        Intermediário
                      </Badge>
                      <span className="text-xs text-muted-foreground">Tempo estimado: ~30-35s</span>
                    </div>
                    
                    <h5 className="font-semibold mb-2">🎯 Objetivo:</h5>
                    <p>Encontrar segmentos específicos dentro de categorias maiores, com boa demanda e competição moderada.</p>
                    
                    <h5 className="font-semibold mt-4 mb-2">⚙️ Configurações Principais:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Vídeos Máximos: <strong>1.000</strong> (maior profundidade)</li>
                      <li>Visualizações Mínimas: <strong>30.000</strong> (demanda confirmada)</li>
                      <li>Inscritos: <strong>2.000 - 100.000</strong> (menos competição)</li>
                      <li>Idade do Vídeo: <strong>até 45 dias</strong></li>
                      <li>Viral Score: <strong>4.0+</strong> (alta performance)</li>
                      <li>Ratio Views/Subs: <strong>10+</strong> (conteúdo que viraliza)</li>
                      <li>Opportunity Score: <strong>55+</strong></li>
                      <li>Saturação Máxima: <strong>50%</strong></li>
                      <li>Tendência Mínima: <strong>+10%</strong> (crescimento claro)</li>
                    </ul>
                    
                    <h5 className="font-semibold mt-4 mb-2">📊 Exemplos de Resultados:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>"True Crime Cases from the 80s"</li>
                      <li>"Dark History of Ancient Civilizations"</li>
                      <li>"Unsolved Mysteries of Latin America"</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strategy-micro">
                <AccordionTrigger className="text-lg font-semibold">
                  🎯 Estratégia 3: Micro-Nichos (Oceano Azul)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                        Avançado
                      </Badge>
                      <span className="text-xs text-muted-foreground">Tempo estimado: ~35-45s</span>
                    </div>
                    
                    <h5 className="font-semibold mb-2">🎯 Objetivo:</h5>
                    <p>Descobrir oportunidades <strong>ultra-específicas</strong> com baixíssima competição e alto potencial de monetização rápida.</p>
                    
                    <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20 my-3">
                      <p className="font-semibold">💎 Esta é a estratégia para "Oceano Azul"</p>
                      <p className="text-xs mt-1">
                        Encontra nichos tão específicos que praticamente não têm competição, mas com demanda validada.
                      </p>
                    </div>
                    
                    <h5 className="font-semibold mt-4 mb-2">⚙️ Configurações Principais:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Vídeos Máximos: <strong>1.200</strong> (máxima profundidade)</li>
                      <li>Visualizações Mínimas: <strong>15.000</strong> (nicho validado mas pequeno)</li>
                      <li>Inscritos: <strong>500 - 30.000</strong> (canais muito pequenos)</li>
                      <li>Idade do Vídeo: <strong>até 30 dias</strong> (conteúdo muito fresco)</li>
                      <li>Idade do Canal: <strong>até 1 ano</strong> (canais novos)</li>
                      <li>Viral Score: <strong>5.0+</strong> (extrema viralidade)</li>
                      <li>Ratio Views/Subs: <strong>20+</strong> (explosivo!)</li>
                      <li>Engagement: <strong>1.5%+</strong> (audiência engajada)</li>
                      <li>Opportunity Score: <strong>70+</strong> (apenas ouro)</li>
                      <li>Saturação Máxima: <strong>30%</strong> (oceano azul!)</li>
                      <li>Tendência Mínima: <strong>+20%</strong> (crescimento forte)</li>
                    </ul>
                    
                    <h5 className="font-semibold mt-4 mb-2">📊 Exemplos de Resultados:</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>"Serial Killers of Brazil - Dark Cases"</li>
                      <li>"Horror Stories Animated - True Events"</li>
                      <li>"Haunted Places in Latin America History"</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="comparison-table">
                <AccordionTrigger className="text-lg font-semibold">
                  📊 Tabela Comparativa das Estratégias
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">Critério</th>
                          <th className="border p-2">🌍 Nichos Amplos</th>
                          <th className="border p-2">📦 Sub-Nichos</th>
                          <th className="border p-2">🎯 Micro-Nichos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-semibold">Dificuldade</td>
                          <td className="border p-2 text-center">Iniciante</td>
                          <td className="border p-2 text-center">Intermediário</td>
                          <td className="border p-2 text-center">Avançado</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Vídeos Analisados</td>
                          <td className="border p-2 text-center">800</td>
                          <td className="border p-2 text-center">1.000</td>
                          <td className="border p-2 text-center">1.200</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Inscritos</td>
                          <td className="border p-2 text-center">10K - 500K</td>
                          <td className="border p-2 text-center">2K - 100K</td>
                          <td className="border p-2 text-center">500 - 30K</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Opportunity Score</td>
                          <td className="border p-2 text-center">40+</td>
                          <td className="border p-2 text-center">55+</td>
                          <td className="border p-2 text-center">70+</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Saturação Máx</td>
                          <td className="border p-2 text-center">70%</td>
                          <td className="border p-2 text-center">50%</td>
                          <td className="border p-2 text-center">30%</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Tendência Mín</td>
                          <td className="border p-2 text-center">0%</td>
                          <td className="border p-2 text-center">+10%</td>
                          <td className="border p-2 text-center">+20%</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Tempo Estimado</td>
                          <td className="border p-2 text-center">25-30s</td>
                          <td className="border p-2 text-center">30-35s</td>
                          <td className="border p-2 text-center">35-45s</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">Melhor Para</td>
                          <td className="border p-2 text-center text-xs">Iniciantes explorando categorias</td>
                          <td className="border p-2 text-center text-xs">Criadores buscando nichos validados</td>
                          <td className="border p-2 text-center text-xs">Caçadores de oceanos azuis</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-to-use-strategies">
                <AccordionTrigger className="text-lg font-semibold">
                  🚀 Como Usar as Estratégias?
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-3">Passo a Passo:</h5>
                    <ol className="list-decimal list-inside ml-4 space-y-3">
                      <li>
                        <strong>Escolha a estratégia</strong> que corresponde ao seu objetivo:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Iniciante → Nichos Amplos</li>
                          <li>Quer nichos específicos → Sub-Nichos</li>
                          <li>Caçando oceano azul → Micro-Nichos</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Clique em "Ativar Estratégia"</strong> no card correspondente
                      </li>
                      <li>
                        A estratégia irá automaticamente:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Limpar o campo de palavra-chave (Modo Descoberta)</li>
                          <li>Aplicar todas as configurações de filtros</li>
                          <li>Iniciar a busca após 1.5 segundos</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Aguarde a análise</strong> (25-45s dependendo da estratégia)
                      </li>
                      <li>
                        <strong>Analise os resultados</strong> no Dashboard de Oportunidades
                      </li>
                      <li>
                        <strong>(Opcional) Refine</strong> com filtros de oportunidade se necessário
                      </li>
                    </ol>
                  </div>

                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>⚠️ Importante</AlertTitle>
                    <AlertDescription>
                      Ao ativar uma estratégia, <strong>o campo de palavra-chave será limpo automaticamente</strong> 
                      para ativar o Modo de Descoberta. Se você quiser usar uma palavra-chave específica, 
                      desative a estratégia primeiro.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        {/* ANÁLISE DE NICHOS */}
        <TabsContent value="analysis" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Search className="h-6 w-6" />
              Análise de Nichos com IA: Interpretando os Resultados
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dashboard">
                <AccordionTrigger className="text-lg font-semibold">
                  📊 Dashboard de Oportunidades
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>
                    Após executar a busca, o sistema usa <strong>Gemini AI</strong> para agrupar vídeos similares em nichos 
                    e gera um dashboard com visão estratégica.
                  </p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎯 Cards do Dashboard:</h5>
                    <ul className="space-y-3">
                      <li>
                        <Badge variant="outline">Nichos Descobertos</Badge>
                        <p className="mt-1">Total de nichos identificados pela IA. Normalmente entre 3-15 dependendo da diversidade dos vídeos.</p>
                      </li>
                      <li>
                        <Badge className="bg-green-600">💎 Oportunidades de Ouro</Badge>
                        <p className="mt-1">Nichos com <strong>Score de Oportunidade &gt;70</strong>. Combinação perfeita de viralidade + baixa competição.</p>
                      </li>
                      <li>
                        <Badge className="bg-orange-600">🔥 Em Alta</Badge>
                        <p className="mt-1">Nichos com <strong>Tendência &gt;+20%</strong>. Indicam crescimento recente, ótimo timing para entrar.</p>
                      </li>
                      <li>
                        <Badge className="bg-red-600">⚠️ Saturados</Badge>
                        <p className="mt-1">Nichos com <strong>Saturação &gt;60%</strong>. Muitos canais grandes, alta competição. Evite.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🏆 Top 3 Oportunidades:</h5>
                    <p>
                      Mostra os 3 nichos com maior Score de Oportunidade. Foco aqui para resultados rápidos.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Cada nicho mostra: Nome, descrição, número de vídeos, canais únicos e score de oportunidade.
                    </p>
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💡 Interpretação Rápida:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li>Se há 5+ Oportunidades de Ouro → <strong>Tema muito promissor</strong></li>
                      <li>Se há muitos Saturados (5+) → <strong>Busque sub-nichos mais específicos</strong></li>
                      <li>Se há nichos Em Alta → <strong>Aja rápido antes da saturação</strong></li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="niche-card">
                <AccordionTrigger className="text-lg font-semibold">
                  🎴 Cards de Nicho: Métricas Detalhadas
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Cada nicho é apresentado em um card com métricas calculadas automaticamente pela IA.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📊 Métricas Principais:</h5>
                    <ul className="space-y-3">
                      <li>
                        <strong>Nome e Descrição:</strong>
                        <p className="mt-1 text-xs">Gerado pela IA baseado nos títulos dos vídeos. Ex: "Orações Poderosas para Proteção"</p>
                      </li>
                      <li>
                        <strong>Vídeos, Views Totais, Canais:</strong>
                        <p className="mt-1 text-xs">Agregação dos dados de todos os vídeos do nicho. Quanto mais vídeos com menos canais = nicho focado.</p>
                      </li>
                      <li>
                        <strong>Score de Oportunidade (0-100):</strong>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Fórmula: (Viralidade × 30%) + (Competição × 25%) + (Saturação × 25%) + (Tendência × 15%) + (Acessibilidade × 5%)
                        </p>
                        <div className="mt-2 space-y-1">
                          <div><Badge variant="outline">0-40</Badge> → Oportunidade Baixa</div>
                          <div><Badge className="bg-yellow-600">40-70</Badge> → Oportunidade Média</div>
                          <div><Badge className="bg-green-600">70+</Badge> → <strong>Oportunidade Alta</strong> 🎯</div>
                        </div>
                      </li>
                      <li>
                        <strong>Saturação (0-100%):</strong>
                        <p className="mt-1 text-xs">Percentual de canais grandes (100K+ inscritos) no nicho.</p>
                        <div className="mt-2 space-y-1">
                          <div><Badge className="bg-green-600">0-30%</Badge> → 🟢 Oceano Azul (baixa competição)</div>
                          <div><Badge className="bg-yellow-600">30-60%</Badge> → 🟡 Competição Moderada</div>
                          <div><Badge className="bg-red-600">60-100%</Badge> → 🔴 Oceano Vermelho (alta competição)</div>
                        </div>
                      </li>
                      <li>
                        <strong>Tendência (-100% a +100%):</strong>
                        <p className="mt-1 text-xs">Compara performance de vídeos recentes (últimos 30 dias) vs mais antigos (30-60 dias).</p>
                        <div className="mt-2 space-y-1">
                          <div><Badge variant="outline">Negativo</Badge> → 📉 Em declínio (evite)</div>
                          <div><Badge variant="outline">0-20%</Badge> → Estável</div>
                          <div><Badge className="bg-green-600">20%+</Badge> → 📈 <strong>Crescendo!</strong></div>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                    <h5 className="font-semibold mb-2">🎯 Como Escolher o Melhor Nicho:</h5>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Priorize <strong>Score &gt;70</strong> (Oportunidades de Ouro)</li>
                      <li>Evite Saturação &gt;60% (muita competição)</li>
                      <li>Prefira Tendência positiva (crescimento)</li>
                      <li>Analise os vídeos individuais do nicho (clique para expandir)</li>
                      <li>Valide se você consegue criar conteúdo naquele nicho</li>
                    </ol>
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <strong>💡 Exemplo Prático:</strong>
                    <div className="mt-2 space-y-1 text-xs">
                      <p><strong>Nicho:</strong> "True Crime Brasileiro - Casos dos Anos 90"</p>
                      <p>Score: 82/100 | Saturação: 25% | Tendência: +35%</p>
                      <p className="mt-2 text-green-600 font-semibold">
                        ✅ ÓTIMA OPORTUNIDADE: Alta demanda, baixa competição, crescendo rapidamente.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="opportunity-filters">
                <AccordionTrigger className="text-lg font-semibold">
                  🎯 Filtros de Oportunidade
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Após os nichos serem detectados, você pode refiná-los com filtros específicos de oportunidade.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">🎚️ Filtros Disponíveis:</h5>
                    <ul className="space-y-3">
                      <li>
                        <strong>Score de Oportunidade Mínimo (0-100):</strong>
                        <p className="mt-1 text-xs">Filtra apenas nichos acima do score definido. Use 70+ para ver apenas ouro.</p>
                      </li>
                      <li>
                        <strong>Saturação Máxima (0-100%):</strong>
                        <p className="mt-1 text-xs">Define o máximo de competição aceitável. Use 30% para Oceano Azul puro.</p>
                      </li>
                      <li>
                        <strong>Tendência Mínima (-50% a +100%):</strong>
                        <p className="mt-1 text-xs">Filtra nichos em crescimento. Use +20% para pegar ondas.</p>
                      </li>
                      <li>
                        <strong>Competidores Máximos:</strong>
                        <p className="mt-1 text-xs">Número máximo de canais únicos no nicho. Quanto menos, mais focado/inexplorado.</p>
                      </li>
                      <li>
                        <strong>Tipo de Nicho:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                          <li><Badge>Micro-Nicho</Badge> → Extremamente específico (ex: "Haunted hospitals in São Paulo")</li>
                          <li><Badge>Sub-Nicho</Badge> → Derivação de nicho maior (ex: "Serial killers from the 70s")</li>
                          <li><Badge>Nicho Amplo</Badge> → Categoria geral (ex: "True Crime documentaries")</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                    <h5 className="font-semibold mb-2">🚀 Presets Recomendados:</h5>
                    <div className="space-y-3">
                      <div className="bg-background p-3 rounded border">
                        <p className="font-semibold">🏆 Oportunidades de Ouro:</p>
                        <p className="text-xs mt-1">Score: 70+ | Saturação: &lt;30% | Tendência: +10%</p>
                      </div>
                      <div className="bg-background p-3 rounded border">
                        <p className="font-semibold">📈 Nichos em Explosão:</p>
                        <p className="text-xs mt-1">Score: 60+ | Tendência: +50% | Tipo: Micro-Nicho</p>
                      </div>
                      <div className="bg-background p-3 rounded border">
                        <p className="font-semibold">🌊 Oceano Azul Puro:</p>
                        <p className="text-xs mt-1">Saturação: &lt;20% | Competidores: &lt;10 | Score: 50+</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="export">
                <AccordionTrigger className="text-lg font-semibold">
                  📥 Exportação Multi-Sheet
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Exporte todos os dados da análise em um arquivo Excel com múltiplas planilhas organizadas.</p>
                  
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">📋 Planilhas Geradas:</h5>
                    <ul className="space-y-2">
                      <li>
                        <Badge>Sheet 1: Resumo Nichos</Badge>
                        <p className="mt-1 text-xs">
                          Visão consolidada: Nome, descrição, métricas agregadas, score de oportunidade, saturação, tendência, palavras-chave.
                        </p>
                      </li>
                      <li>
                        <Badge>Sheet 2: Vídeos Detalhados</Badge>
                        <p className="mt-1 text-xs">
                          Todos os vídeos encontrados com: Título, canal, views, VPH, score viral, inscritos, relação views/inscritos, URL.
                        </p>
                      </li>
                      <li>
                        <Badge>Sheet 3: Top Canais</Badge>
                        <p className="mt-1 text-xs">
                          Canais mais relevantes por nicho, ordenados por performance. Útil para análise de competidores.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                    <strong>💡 Use o Excel para:</strong>
                    <ul className="list-disc list-inside ml-2 mt-2">
                      <li>Criar análises comparativas entre buscas</li>
                      <li>Compartilhar insights com equipe</li>
                      <li>Aplicar fórmulas personalizadas</li>
                      <li>Gerar gráficos de tendências</li>
                      <li>Manter histórico de nichos descobertos</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        {/* ESTRATÉGIAS */}
        <TabsContent value="strategies" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="h-6 w-6" />
              Estratégias Avançadas: Combinações Vencedoras
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-lg border border-green-500/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  🏆 Estratégia #1: Encontrar Nichos Virais Inexplorados
                </h4>
                <p className="mb-4 text-sm">
                  <strong>Objetivo:</strong> Descobrir nichos que estão viralizando mas ainda têm poucos criadores (janela de oportunidade limitada).
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="font-semibold mb-2">⚙️ Configuração:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Palavra-chave: Ampla (ex: "true crime", "horror stories", "dark history")</li>
                    <li>✅ Idade Canal: <strong>180 dias</strong></li>
                    <li>✅ Inscritos: <strong>500 - 15.000</strong></li>
                    <li>✅ Idade Vídeo: <strong>30 dias</strong></li>
                    <li>✅ Views Mín: <strong>100.000</strong></li>
                    <li>✅ VPH Mín: <strong>150</strong></li>
                    <li>✅ Relação Views/Inscritos: <strong>20+</strong></li>
                    <li>✅ Score Viral: <strong>4.5+</strong></li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-green-600">
                    Resultado: Vídeos viralizando em canais pequenos recentemente criados.
                  </p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 mt-3">
                  <p className="font-semibold text-sm">🎯 Após a Busca:</p>
                  <ul className="list-disc list-inside text-xs ml-2 mt-2">
                    <li>Aplique filtro: Score Oportunidade &gt;70 + Saturação &lt;30%</li>
                    <li>Foque nos nichos classificados como "Micro-Nicho"</li>
                    <li>Analise os 5 vídeos mais performáticos de cada nicho</li>
                    <li>Replique o formato RAPIDAMENTE (janela de 2-4 semanas)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-lg border border-blue-500/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  🌊 Estratégia #2: Oceano Azul (Zero Competição)
                </h4>
                <p className="mb-4 text-sm">
                  <strong>Objetivo:</strong> Encontrar nichos com demanda comprovada mas sem canais grandes estabelecidos.
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="font-semibold mb-2">⚙️ Configuração:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Palavra-chave: Específica (ex: "unsolved mysteries Brazil", "dark history Latin America", "creepy horror animated")</li>
                    <li>✅ Idade Canal: <strong>365 dias</strong> (permite mais dados)</li>
                    <li>✅ Inscritos: <strong>1.000 - 20.000</strong></li>
                    <li>✅ Idade Vídeo: <strong>90 dias</strong></li>
                    <li>✅ Views Mín: <strong>50.000</strong></li>
                    <li>✅ VPH Mín: <strong>50</strong> (não precisa ser explosivo)</li>
                    <li>✅ Relação Views/Inscritos: <strong>15+</strong></li>
                    <li>✅ Máx Vídeos: <strong>2.000</strong> (análise profunda)</li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-blue-600">
                    Resultado: Nichos com crescimento sustentável e baixíssima competição.
                  </p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 mt-3">
                  <p className="font-semibold text-sm">🎯 Após a Busca:</p>
                  <ul className="list-disc list-inside text-xs ml-2 mt-2">
                    <li>Filtrar: Saturação &lt;20% + Competidores &lt;15</li>
                    <li>Ignorar tendência (nichos evergreen podem estar estáveis)</li>
                    <li>Verificar se há pelo menos 20 vídeos no nicho (validação)</li>
                    <li>Criar conteúdo de LONGO PRAZO (nicho sustentável)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-lg border border-orange-500/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  🚀 Estratégia #3: Pegar Ondas Virais (Timing Perfeito)
                </h4>
                <p className="mb-4 text-sm">
                  <strong>Objetivo:</strong> Identificar explosões virais acontecendo AGORA e surfar a onda antes da saturação.
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="font-semibold mb-2">⚙️ Configuração:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Use <strong>MODO CAÇADOR</strong> (configuração automática)</li>
                    <li>✅ Ajuste manual: Idade Vídeo para <strong>14 dias</strong></li>
                    <li>✅ Ajuste manual: VPH Mín para <strong>200</strong></li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-orange-600">
                    Resultado: Vídeos explodindo nas últimas 2 semanas.
                  </p>
                </div>
                <div className="bg-red-500/10 p-3 rounded border border-red-500/20 mt-3">
                  <p className="font-semibold text-sm">⚠️ ATENÇÃO - Ação Rápida Necessária:</p>
                  <ul className="list-disc list-inside text-xs ml-2 mt-2">
                    <li>Filtrar: Tendência &gt;+50% (explosão confirmada)</li>
                    <li>Escolher 1-2 nichos no máximo</li>
                    <li>Produzir e publicar em <strong>48-72 horas</strong></li>
                    <li>Risco: Janela de oportunidade de 1-2 semanas apenas</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-lg border border-purple-500/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  🔍 Estratégia #4: Análise de Competidores
                </h4>
                <p className="mb-4 text-sm">
                  <strong>Objetivo:</strong> Estudar o que está funcionando para canais do seu tamanho e replicar com melhorias.
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="font-semibold mb-2">⚙️ Configuração:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Palavra-chave: Nicho do seu canal</li>
                    <li>✅ Inscritos: <strong>Próximo ao seu número</strong> (±50%)</li>
                    <li>✅ Idade Vídeo: <strong>60 dias</strong></li>
                    <li>✅ Views Mín: <strong>Dobro da sua média</strong></li>
                    <li>✅ VPH Mín: Não definir (permitir variação)</li>
                    <li>✅ Relação Views/Inscritos: <strong>10+</strong></li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-purple-600">
                    Resultado: Vídeos que performaram melhor que o esperado em canais similares ao seu.
                  </p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 mt-3">
                  <p className="font-semibold text-sm">🎯 Análise Pós-Busca:</p>
                  <ul className="list-disc list-inside text-xs ml-2 mt-2">
                    <li>Identificar padrões nos títulos (palavras-chave, ganchos)</li>
                    <li>Analisar thumbnails (cores, textos, elementos)</li>
                    <li>Verificar duração dos vídeos</li>
                    <li>Estudar descrições e tags (usar ferramentas externas)</li>
                    <li>Replicar estrutura, NÃO copiar conteúdo</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-6 rounded-lg border border-yellow-500/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  📊 Estratégia #5: Validação de Ideias (Antes de Criar)
                </h4>
                <p className="mb-4 text-sm">
                  <strong>Objetivo:</strong> Testar se uma ideia de vídeo tem potencial ANTES de produzir.
                </p>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="font-semibold mb-2">⚙️ Configuração:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Palavra-chave: <strong>Título exato</strong> que você quer testar</li>
                    <li>✅ Idade Vídeo: <strong>180 dias</strong> (histórico completo)</li>
                    <li>✅ Inscritos: Qualquer</li>
                    <li>✅ Views Mín: <strong>10.000</strong> (threshold baixo para capturar tudo)</li>
                    <li>✅ Máx Vídeos: <strong>500</strong> (busca focada)</li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-yellow-600">
                    Resultado: Todos os vídeos similares à sua ideia publicados nos últimos 6 meses.
                  </p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 mt-3">
                  <p className="font-semibold text-sm">🎯 Critérios de Validação:</p>
                  <ul className="list-disc list-inside text-xs ml-2 mt-2">
                    <li><strong>✅ Produzir se:</strong> VPH médio &gt;80 + Pelo menos 3 vídeos com 100K+ views</li>
                    <li><strong>⚠️ Revisar se:</strong> Apenas canais grandes (&gt;100K) tiveram sucesso</li>
                    <li><strong>❌ Evitar se:</strong> VPH médio &lt;30 ou nenhum vídeo passou de 50K views</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 mt-6">
                <h4 className="text-xl font-bold mb-3">🎓 Dicas Finais de Especialista</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">1.</span>
                    <span><strong>Não confie em um único nicho:</strong> Sempre valide com 2-3 buscas usando palavras-chave diferentes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">2.</span>
                    <span><strong>Contextualize os números:</strong> 50K views pode ser viral em nichos de meditação, mas comum em gaming.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">3.</span>
                    <span><strong>Análise qualitativa é essencial:</strong> Sempre assista aos top 3 vídeos de cada nicho antes de decidir.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">4.</span>
                    <span><strong>Timing é tudo:</strong> Nichos com Tendência &gt;+30% podem saturar em 1-2 meses. Aja rápido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">5.</span>
                    <span><strong>Mantenha histórico:</strong> Exporte e salve todas as análises. Compare evolução de nichos mensalmente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[24px]">6.</span>
                    <span><strong>Combine ferramentas:</strong> Use Niche Finder para descobrir + Sub Niche Hunter para aprofundar + Monitoramento para acompanhar.</span>
                  </li>
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
                  Por que minha busca não retornou resultados?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Possíveis causas:</strong></p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Palavra-chave muito específica:</strong> Tente termos mais amplos</li>
                    <li><strong>Filtros muito restritivos:</strong> Reduza VPH mínimo, aumente máx de inscritos</li>
                    <li><strong>Poucos vídeos configurados:</strong> Aumente para 2.000+</li>
                    <li><strong>Idade do canal muito baixa:</strong> Tente 365+ dias</li>
                  </ul>
                  <Alert className="mt-3 bg-blue-500/10">
                    <AlertDescription>
                      <strong>Teste rápido:</strong> Use apenas a palavra-chave + Modo Caçador. Se ainda não funcionar, a palavra pode não ter volume no YouTube.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger className="text-lg font-semibold">
                  Como sei se um nicho é realmente bom?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Checklist do Nicho Perfeito:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ Score de Oportunidade: 70+</li>
                    <li>✅ Saturação: Baixa ou Muito Baixa</li>
                    <li>✅ Tendência: Crescente ou Estável</li>
                    <li>✅ VPH Médio: 50+</li>
                    <li>✅ Inscritos Médios: 500-30.000</li>
                    <li>✅ Mínimo 5-10 vídeos no nicho</li>
                  </ul>
                  <p className="mt-3"><strong>Bônus:</strong> Se o nicho tem vídeos em múltiplos idiomas, é sinal de demanda global!</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger className="text-lg font-semibold">
                  Quanto tempo leva para fazer uma análise?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Tempos médios:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>500 vídeos:</strong> 1-2 minutos</li>
                    <li><strong>1.000 vídeos:</strong> 2-3 minutos</li>
                    <li><strong>2.000 vídeos:</strong> 4-6 minutos</li>
                    <li><strong>5.000 vídeos:</strong> 10-15 minutos</li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    <strong>Nota:</strong> O tempo varia com a velocidade da API do YouTube e processamento da IA Gemini.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger className="text-lg font-semibold">
                  Qual a diferença entre VPH e Views normais?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Views Normais:</strong></p>
                  <ul className="list-disc list-inside">
                    <li>Total de visualizações desde a publicação</li>
                    <li>Vídeos antigos sempre têm mais views</li>
                    <li>Difícil comparar vídeos de idades diferentes</li>
                  </ul>
                  
                  <p className="mt-3"><strong>VPH (Views Por Hora):</strong></p>
                  <ul className="list-disc list-inside">
                    <li>Views divididas pelas horas desde publicação</li>
                    <li>Normaliza pelo tempo - permite comparação justa</li>
                    <li>Mostra velocidade de crescimento real</li>
                  </ul>

                  <Alert className="mt-3 bg-green-500/10">
                    <AlertDescription>
                      <strong>Exemplo:</strong> Vídeo A (1 mês): 100K views = 138 VPH. Vídeo B (1 semana): 20K views = 119 VPH. 
                      Apesar de A ter mais views, B está crescendo quase tão rápido e é mais recente!
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger className="text-lg font-semibold">
                  Posso salvar minhas buscas?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Sim! Use a função de exportação:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Clique em "Exportar Excel" após a análise</li>
                    <li>Arquivo contém: nichos, vídeos, métricas completas</li>
                    <li>Organize em planilhas por data/palavra-chave</li>
                    <li>Compare evoluções ao longo do tempo</li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    <strong>Dica:</strong> Crie uma pasta "Análises de Nichos" e salve com nomes descritivos: "meditacao_2024-01.xlsx"
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Devo focar em nichos "Estáveis" ou "Crescentes"?
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p><strong>Depende da sua estratégia:</strong></p>
                  
                  <div className="space-y-3 mt-3">
                    <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                      <p className="font-semibold text-green-700">✅ Crescentes (Recomendado para iniciantes)</p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        <li>Aproveita momento de crescimento</li>
                        <li>Mais fácil ganhar tração inicial</li>
                        <li>Algoritmo está promovendo o tema</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                      <p className="font-semibold text-blue-700">✅ Estáveis (Melhor para longo prazo)</p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        <li>Demanda consistente ao longo do tempo</li>
                        <li>Conteúdo evergreen (sempre relevante)</li>
                        <li>Menor risco de saturação rápida</li>
                      </ul>
                    </div>
                  </div>

                  <Alert className="mt-3">
                    <AlertDescription>
                      <strong>Estratégia ideal:</strong> Combine ambos! 70% estáveis (base sólida) + 30% crescentes (aproveitar ondas).
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* ATALHOS RÁPIDOS */}
          <Card className="p-6 bg-primary/5">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              ⚡ Atalhos e Dicas Rápidas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert className="bg-background">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>💡 Dica do Dia</AlertTitle>
                <AlertDescription>
                  Use o filtro "Oceano Azul" no Dashboard para ver apenas nichos com saturação muito baixa. 
                  São as melhores oportunidades!
                </AlertDescription>
              </Alert>

              <Alert className="bg-background">
                <Zap className="h-4 w-4" />
                <AlertTitle>⚡ Atalho Rápido</AlertTitle>
                <AlertDescription>
                  Clique 2x em um nicho para expandir E copiar o nome automaticamente. 
                  Cole direto na busca do YouTube!
                </AlertDescription>
              </Alert>

              <Alert className="bg-background">
                <Target className="h-4 w-4" />
                <AlertTitle>🎯 Estratégia Ninja</AlertTitle>
                <AlertDescription>
                  Compare nichos em PT-BR vs EN. Muitas vezes o nicho está saturado em inglês mas vazio em português!
                </AlertDescription>
              </Alert>

              <Alert className="bg-background">
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>📈 Hack de Crescimento</AlertTitle>
                <AlertDescription>
                  Filtre por "Canais Novos" (menos de 180 dias) + VPH Alto (100+) = Formatos que estão funcionando AGORA.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
