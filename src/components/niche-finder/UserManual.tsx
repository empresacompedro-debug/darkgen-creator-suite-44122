import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, TrendingUp, Search, Lightbulb, AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UserManual() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Manual do Niche Finder</h2>
          <p className="text-muted-foreground">Guia completo para busca em lote de nichos virais</p>
        </div>
      </div>

      <Alert className="mb-6 bg-primary/5 border-primary/20">
        <Target className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">🎯 Objetivo Principal</AlertTitle>
        <AlertDescription className="text-base">
          Encontrar vídeos virais no YouTube usando busca em lote, com filtro único de duração mínima de 8 minutos.
          Ideal para descobrir oportunidades em múltiplos nichos simultaneamente.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="how-to">Como Usar</TabsTrigger>
          <TabsTrigger value="tips">Dicas</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Modo Lote: Busca Simplificada e Poderosa
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Badge className="mt-1" variant="outline">✓</Badge>
                <div className="flex-1">
                  <p className="font-semibold">Filtro Único: Vídeos ≥ 8 Minutos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sistema focado em conteúdo de qualidade. Busca apenas vídeos com 8 minutos ou mais de duração.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Badge className="mt-1" variant="outline">✓</Badge>
                <div className="flex-1">
                  <p className="font-semibold">Até 500 Vídeos por Nicho</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cada nicho pode retornar até 500 vídeos, ordenados por score viral.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Badge className="mt-1" variant="outline">✓</Badge>
                <div className="flex-1">
                  <p className="font-semibold">Busca Única ou em Lote</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Busque 1 nicho ou até 100 nichos simultaneamente. Perfeito para análise em escala.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Badge className="mt-1" variant="outline">✓</Badge>
                <div className="flex-1">
                  <p className="font-semibold">Processamento em Lotes de 20</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O sistema processa 20 nichos por vez para otimizar velocidade e evitar rate limits.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Métricas Importantes</AlertTitle>
            <AlertDescription className="space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Score Viral:</strong> Métrica que combina VPH, engajamento e outros fatores</li>
                <li><strong>VPH (Views Por Hora):</strong> Velocidade de crescimento do vídeo</li>
                <li><strong>Ratio Views/Subs:</strong> Quantas vezes o vídeo teve mais views que o canal tem inscritos</li>
                <li><strong>Engajamento:</strong> Percentual de likes, comentários e interações</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* COMO USAR */}
        <TabsContent value="how-to" className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="single">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Busca Única (1 Nicho)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3 p-4 bg-accent/5 rounded-lg">
                  <h4 className="font-semibold">Passo a Passo:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <strong>Digite uma palavra-chave</strong> no campo "🔍 Buscar 1 Nicho"
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Exemplo: "meditação", "receitas veganas", "investimentos"
                      </p>
                    </li>
                    <li>
                      <strong>Clique em "Buscar"</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        O sistema buscará até 500 vídeos sobre o tema (≥ 8 minutos)
                      </p>
                    </li>
                    <li>
                      <strong>Analise os resultados</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Vídeos ordenados por score viral. Use os filtros de ordenação para explorar diferentes ângulos.
                      </p>
                    </li>
                    <li>
                      <strong>Exporte para Excel</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Clique em "Exportar Excel" para salvar a análise completa.
                      </p>
                    </li>
                  </ol>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>💡 Dica</AlertTitle>
                  <AlertDescription>
                    Use palavras-chave em português E inglês para maximizar descobertas!
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="batch">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Busca em Lote (Múltiplos Nichos)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3 p-4 bg-accent/5 rounded-lg">
                  <h4 className="font-semibold">Passo a Passo:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <strong>Cole sua lista de nichos</strong> no campo "📋 Buscar Vários Nichos"
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Um nicho por linha. Exemplo:<br/>
                        <code className="text-xs">
                          fitness para idosos<br/>
                          receitas veganas rápidas<br/>
                          meditação para ansiedade
                        </code>
                      </p>
                    </li>
                    <li>
                      <strong>Visualize a contagem</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        O sistema mostra quantos nichos foram detectados (ex: "📊 50 nichos detectados")
                      </p>
                    </li>
                    <li>
                      <strong>Clique em "Iniciar Busca em Lote"</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        O sistema processará 20 nichos por vez, mostrando progresso em tempo real
                      </p>
                    </li>
                    <li>
                      <strong>Aguarde a conclusão</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Barra de progresso mostra: % completo, nichos processados e vídeos encontrados
                      </p>
                    </li>
                    <li>
                      <strong>Analise e exporte</strong>
                      <p className="text-sm text-muted-foreground ml-6 mt-1">
                        Todos os vídeos aparecem na lista de resultados. Use ordenação e exportação.
                      </p>
                    </li>
                  </ol>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>⚡ Performance</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Busca única: 200-500 vídeos em ~5-10 segundos</li>
                      <li>Busca lote (50 nichos): 10.000-25.000 vídeos em ~2-3 minutos</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sorting">
              <AccordionTrigger className="text-lg font-semibold">
                Ordenação de Resultados
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Após a busca, você pode ordenar os resultados por diferentes critérios:
                </p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">Score Viral (Padrão)</p>
                    <p className="text-xs text-muted-foreground">Métrica composta que identifica os vídeos mais virais</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">VPH (Explosivo)</p>
                    <p className="text-xs text-muted-foreground">Vídeos com maior velocidade de crescimento</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">Visualizações</p>
                    <p className="text-xs text-muted-foreground">Maior número absoluto de views</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">Ratio Views/Subs</p>
                    <p className="text-xs text-muted-foreground">Vídeos que viralizaram além da base de inscritos</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">Idade do Vídeo</p>
                    <p className="text-xs text-muted-foreground">Vídeos mais recentes ou mais antigos</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-semibold text-sm">Canal Mais Novo</p>
                    <p className="text-xs text-muted-foreground">Canais criados mais recentemente</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="history">
              <AccordionTrigger className="text-lg font-semibold">
                Histórico e Exportação
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-accent/5 rounded-lg">
                    <h4 className="font-semibold mb-2">💾 Salvar Busca</h4>
                    <p className="text-sm text-muted-foreground">
                      Após qualquer busca, clique em "Salvar Busca" para guardar os resultados com um nome personalizado.
                      Útil para comparar análises diferentes ao longo do tempo.
                    </p>
                  </div>

                  <div className="p-4 bg-accent/5 rounded-lg">
                    <h4 className="font-semibold mb-2">📂 Histórico</h4>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Histórico" para ver suas últimas 10 buscas salvas. 
                      Você pode carregar qualquer busca anterior para continuar a análise.
                    </p>
                  </div>

                  <div className="p-4 bg-accent/5 rounded-lg">
                    <h4 className="font-semibold mb-2">📊 Exportar Excel</h4>
                    <p className="text-sm text-muted-foreground">
                      Exporte todos os resultados para Excel (.xlsx) com todas as métricas:
                      título, canal, views, VPH, score viral, engajamento, duração, links e mais.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* DICAS */}
        <TabsContent value="tips" className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              Estratégias para Maximizar Descobertas
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">🌍 Busque em Múltiplos Idiomas</h4>
                <p className="text-sm text-muted-foreground">
                  Faça buscas em português E inglês. Muitos nichos têm nichos virais em ambos os idiomas.
                  Exemplo: "meditação" e "meditation", "receitas" e "recipes".
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">🎯 Use Variações de Palavras-Chave</h4>
                <p className="text-sm text-muted-foreground">
                  Em vez de apenas "fitness", busque também: "treino", "workout", "exercícios", "musculação".
                  Cada variação pode revelar oportunidades diferentes.
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">📊 Analise o Ratio Views/Subs</h4>
                <p className="text-sm text-muted-foreground">
                  Vídeos com ratio alto (ex: 10x ou mais) indicam que o conteúdo viralizou além da base de inscritos.
                  Ótimo sinal de que o nicho tem potencial viral.
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">⏱️ Observe a Idade dos Vídeos</h4>
                <p className="text-sm text-muted-foreground">
                  Vídeos recentes com alto VPH indicam tendências atuais.
                  Vídeos antigos com alto score mostram nichos perenes (evergreen).
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">🔄 Use a Lista de Nichos Pré-Selecionadas</h4>
                <p className="text-sm text-muted-foreground">
                  Clique em "Lista de Nichos" para acessar listas curadas de nichos virais.
                  Você pode carregar listas inteiras direto para o modo lote!
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">💾 Salve e Compare</h4>
                <p className="text-sm text-muted-foreground">
                  Salve suas buscas semanalmente e compare os resultados.
                  Identifique tendências de crescimento e novos players emergentes.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq1">
              <AccordionTrigger>Por que apenas vídeos ≥ 8 minutos?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Vídeos com 8 minutos ou mais tendem a ter mais profundidade e qualidade, além de serem melhor ranqueados 
                  pelo algoritmo do YouTube. Esse filtro ajuda a focar em conteúdo mais substancial e com maior potencial de monetização.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq2">
              <AccordionTrigger>Quantos nichos posso buscar de uma vez?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Você pode buscar até 100 nichos simultaneamente no modo lote. O sistema processa 20 nichos por vez
                  para otimizar performance e evitar rate limits da API do YouTube.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq3">
              <AccordionTrigger>O que é o Score Viral?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  O Score Viral é uma métrica composta que combina VPH (velocidade de crescimento), engajamento,
                  ratio views/subs e outros fatores para identificar os vídeos com maior potencial viral.
                  Quanto maior o score, mais "explosivo" é o vídeo.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq4">
              <AccordionTrigger>Quanto tempo leva uma busca em lote?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Depende da quantidade de nichos:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>1 nicho: ~5-10 segundos</li>
                  <li>20 nichos: ~30-60 segundos</li>
                  <li>50 nichos: ~2-3 minutos</li>
                  <li>100 nichos: ~5-6 minutos</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq5">
              <AccordionTrigger>Posso salvar minhas buscas?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Sim! Após qualquer busca, clique em "Salvar Busca" para guardar os resultados com um nome personalizado.
                  Você pode acessar suas buscas salvas no botão "Histórico". As últimas 10 buscas ficam disponíveis.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq6">
              <AccordionTrigger>Como exportar os resultados?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Após uma busca, clique em "Exportar Excel" no topo dos resultados. O arquivo .xlsx incluirá:
                  título, canal, views, likes, comentários, VPH, score viral, engajamento, duração, idade do vídeo,
                  inscritos do canal, ratio views/subs, links do vídeo e canal, e mais.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq7">
              <AccordionTrigger>O que fazer se não encontrar resultados?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Se uma busca retornar poucos resultados:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Tente palavras-chave mais genéricas (ex: "fitness" em vez de "fitness para idosos com diabetes")</li>
                  <li>Busque em inglês além do português</li>
                  <li>Use variações de palavras-chave</li>
                  <li>Lembre que o filtro é APENAS duração ≥ 8 minutos, então nichos muito específicos podem ter poucos vídeos longos</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
