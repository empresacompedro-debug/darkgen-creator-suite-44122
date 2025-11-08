import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Languages, Globe, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Tradutor de Roteiros</CardTitle>
        <p className="text-muted-foreground">
          Expanda seu canal globalmente com traduções profissionais que mantêm tom e contexto
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="setup">Como Usar</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Languages className="h-5 w-5" />
                O Que É Esta Ferramenta?
              </h3>
              <p className="text-muted-foreground mb-4">
                O <strong>Tradutor de Roteiros</strong> permite traduzir seus roteiros de vídeo para até 10 idiomas simultaneamente, preservando:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Tom narrativo original (formal, casual, técnico, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Contexto cultural e expressões idiomáticas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Termos técnicos específicos do nicho
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Formatação e estrutura do roteiro
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Para Quem É?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Criadores que querem expandir para mercados internacionais
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Canais multilíngues com públicos diversos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Empresas produzindo conteúdo para diferentes países
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Idiomas Suportados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Badge variant="outline" className="justify-center">🇧🇷 Português BR</Badge>
                <Badge variant="outline" className="justify-center">🇺🇸 English US</Badge>
                <Badge variant="outline" className="justify-center">🇪🇸 Español</Badge>
                <Badge variant="outline" className="justify-center">🇫🇷 Français</Badge>
                <Badge variant="outline" className="justify-center">🇩🇪 Deutsch</Badge>
                <Badge variant="outline" className="justify-center">🇮🇹 Italiano</Badge>
                <Badge variant="outline" className="justify-center">🇯🇵 日本語</Badge>
                <Badge variant="outline" className="justify-center">🇰🇷 한국어</Badge>
                <Badge variant="outline" className="justify-center">🇷🇴 Română</Badge>
                <Badge variant="outline" className="justify-center">🇵🇱 Polski</Badge>
              </div>
            </div>
          </TabsContent>

          {/* COMO USAR */}
          <TabsContent value="setup" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">📝 Passo a Passo</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>Passo 1: Preparar o Roteiro</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>O que colar:</strong></p>
                    <p className="text-muted-foreground">Seu roteiro completo de vídeo, incluindo:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Introdução e gancho</li>
                      <li>Corpo principal com todas as seções</li>
                      <li>CTAs (Calls to Action)</li>
                      <li>Conclusão</li>
                    </ul>
                    
                    <p className="mt-3"><strong>Formato recomendado:</strong></p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`[Introdução]
Olá, hoje vamos falar sobre...

[Desenvolvimento]
Ponto 1: ...
Ponto 2: ...

[CTA]
Se gostou, inscreva-se!

[Conclusão]
Até a próxima!`}
                    </pre>

                    <p className="mt-3 text-warning flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Mantenha marcadores como [Introdução] para facilitar edição pós-tradução</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step2">
                  <AccordionTrigger>Passo 2: Selecionar Idiomas</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Marque os idiomas desejados (pode selecionar múltiplos):</p>
                    
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      <p className="font-semibold">Dica: Escolha baseado em:</p>
                      <ul className="list-disc ml-6 text-xs text-muted-foreground">
                        <li><strong>Analytics:</strong> Veja de quais países vêm mais views</li>
                        <li><strong>Nicho:</strong> Finanças? EN + ES. Gaming? EN + KO + JA</li>
                        <li><strong>Monetização:</strong> Países com maior CPM (EN-US, DE, FR)</li>
                      </ul>
                    </div>

                    <p className="mt-3"><strong>Ordem Recomendada de Expansão:</strong></p>
                    <ol className="list-decimal ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>1º: Inglês (mercado global)</li>
                      <li>2º: Espanhol (América Latina + Espanha)</li>
                      <li>3º: Francês ou Alemão (Europa)</li>
                      <li>4º: Japonês ou Coreano (Ásia)</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step3">
                  <AccordionTrigger>Passo 3: Configurar Modelo de IA</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Modelos Disponíveis:</strong></p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-semibold">Gemini 2.5 Flash (Recomendado)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Excelente para traduções técnicas e narrativas complexas. Melhor custo-benefício.
                        </p>
                      </div>
                      <div className="border-l-4 border-accent pl-3">
                        <p className="font-semibold">Claude Sonnet 4.5</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ótimo para conteúdo criativo, storytelling e adaptação cultural refinada.
                        </p>
                      </div>
                      <div className="border-l-4 border-secondary pl-3">
                        <p className="font-semibold">GPT-4o</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Equilibrado. Bom para nichos gerais.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step4">
                  <AccordionTrigger>Passo 4: Traduzir e Exportar</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Clique em "Traduzir Roteiro" e aguarde 20-60 segundos.</p>
                    
                    <p className="mt-3"><strong>Após a tradução:</strong></p>
                    <ul className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Revise cada idioma individualmente (campo de texto editável)</li>
                      <li>Clique em "Exportar" para baixar .txt de cada idioma</li>
                      <li>Use os arquivos .txt para criar dublagens ou legendas</li>
                    </ul>

                    <p className="mt-3 text-primary flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Traduções são salvas automaticamente no histórico!</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* AVANÇADO */}
          <TabsContent value="advanced" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">⚙️ Funcionalidades Avançadas</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="preservation">
                  <AccordionTrigger>Preservação de Termos Técnicos</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>A IA automaticamente detecta e preserva:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Nomes próprios (pessoas, marcas, produtos)</li>
                      <li>Siglas técnicas (API, SEO, CPU, etc.)</li>
                      <li>Termos do nicho que não têm tradução direta</li>
                    </ul>

                    <p className="mt-3"><strong>Exemplo:</strong></p>
                    <pre className="bg-muted p-3 rounded-md text-xs">
Original (PT): "O ROI do Google Ads aumentou 300%"
Tradução (EN): "The ROI of Google Ads increased by 300%"
✅ "ROI" e "Google Ads" preservados
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cultural">
                  <AccordionTrigger>Adaptação Cultural</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>A IA adapta expressões idiomáticas:</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="bg-muted p-2 rounded-md">
                        <p><strong>PT-BR:</strong> "Chover no molhado"</p>
                        <p><strong>EN-US:</strong> "Beating a dead horse"</p>
                        <p className="text-muted-foreground italic">✅ Sentido preservado, não literal</p>
                      </div>
                      
                      <div className="bg-muted p-2 rounded-md">
                        <p><strong>PT-BR:</strong> "Pagar mico"</p>
                        <p><strong>ES:</strong> "Hacer el ridículo"</p>
                        <p className="text-muted-foreground italic">✅ Adaptação cultural correta</p>
                      </div>
                    </div>

                    <p className="mt-3 text-warning flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Sempre revise expressões culturais específicas do seu público!</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history">
                  <AccordionTrigger>Histórico e Reutilização</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Todas as traduções são salvas automaticamente.</p>
                    
                    <p className="mt-2"><strong>No histórico você pode:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Visualizar traduções antigas (ícone 👁️)</li>
                      <li>Baixar novamente qualquer idioma</li>
                      <li>Comparar diferentes versões</li>
                      <li>Excluir traduções antigas (ícone 🗑️)</li>
                    </ul>

                    <p className="mt-3"><strong>Caso de uso:</strong></p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Você traduziu um roteiro em Janeiro para 5 idiomas. Em Março, quer reutilizar a tradução em inglês para um vídeo atualizado. 
                      Basta abrir o histórico, visualizar, copiar e editar! ⚡
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="batch">
                  <AccordionTrigger>Tradução em Lote</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Para traduzir múltiplos roteiros:</strong></p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Separe cada roteiro em um arquivo .txt</li>
                      <li>Traduza um por vez (selecione todos os idiomas de uma vez)</li>
                      <li>Use o histórico para gerenciar todas as traduções</li>
                      <li>Exporte tudo ao final do processo</li>
                    </ol>

                    <p className="mt-3 text-primary flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Dica: Crie um sistema de nomenclatura (ex: "Roteiro_Video01_EN", "Roteiro_Video01_ES")</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* RESULTADOS */}
          <TabsContent value="results" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">📊 O Que Você Recebe</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="format">
                  <AccordionTrigger>Formato das Traduções</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Cada idioma será exibido em um card separado com:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Nome do idioma no topo</li>
                      <li>Tradução completa (editável)</li>
                      <li>Botão "Exportar" para download .txt</li>
                    </ul>

                    <p className="mt-3"><strong>Exemplo visual:</strong></p>
                    <div className="bg-muted p-3 rounded-md text-xs space-y-2">
                      <div className="border-l-4 border-primary pl-2">
                        <p className="font-semibold">English US</p>
                        <p className="text-muted-foreground italic">Today, we're going to talk about...</p>
                      </div>
                      <div className="border-l-4 border-accent pl-2">
                        <p className="font-semibold">Español</p>
                        <p className="text-muted-foreground italic">Hoy, vamos a hablar sobre...</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="quality">
                  <AccordionTrigger>Qualidade Esperada</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Você pode esperar:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>✅ 95-98% de precisão gramatical</li>
                      <li>✅ Tom narrativo preservado</li>
                      <li>✅ Contexto mantido entre sentenças</li>
                      <li>✅ Termos técnicos corretos</li>
                    </ul>

                    <p className="mt-3"><strong>Revisão recomendada:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>Gírias específicas do país-alvo</li>
                      <li>Referências culturais muito locais</li>
                      <li>Números, datas e unidades (ex: milhas vs km)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="usage">
                  <AccordionTrigger>Como Usar as Traduções</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>3 Formas Principais:</strong></p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-semibold">1. Dublagem</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Envie o roteiro traduzido para locutores nativos ou use IA de voz (ElevenLabs, etc.)
                        </p>
                      </div>

                      <div className="border-l-4 border-accent pl-3">
                        <p className="font-semibold">2. Legendas</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use ferramentas como "Conversor SRT" para criar legendas no idioma traduzido
                        </p>
                      </div>

                      <div className="border-l-4 border-secondary pl-3">
                        <p className="font-semibold">3. Descrição de Vídeo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cole a tradução na descrição do YouTube para alcançar públicos multilíngues
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* ESTRATÉGIAS */}
          <TabsContent value="strategies" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">🚀 Estratégias de Expansão Global</h3>
              
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="s1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">1</Badge>
                      <span>Criação de Canal Multilíngue</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Estratégia:</p>
                    <p className="text-muted-foreground">Criar um canal principal (PT-BR) e canais secundários em outros idiomas.</p>
                    
                    <p className="font-semibold mt-3">Workflow:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Produza vídeo em português</li>
                      <li>Traduza roteiro para EN, ES e FR</li>
                      <li>Grave dublagens (ou use IA de voz)</li>
                      <li>Publique nos canais secundários:</li>
                      <ul className="list-disc ml-6 text-xs mt-1">
                        <li>@SeuCanal_EN (inglês)</li>
                        <li>@SeuCanal_ES (espanhol)</li>
                        <li>@SeuCanal_FR (francês)</li>
                      </ul>
                      <li>Cross-promote entre canais</li>
                    </ol>

                    <p className="font-semibold mt-3">Resultado Esperado:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Canal de Finanças em PT-BR: 50k inscritos<br/>
                      Após 6 meses com canais EN/ES/FR: Total de 180k inscritos<br/>
                      📈 Crescimento de 260%!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">2</Badge>
                      <span>Otimização SEO Multilíngue</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Ranquear no YouTube Search de múltiplos países.</p>
                    
                    <p className="font-semibold mt-3">Técnica:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Identifique palavras-chave de alto volume em cada idioma (use ferramentas como TubeBuddy)</li>
                      <li>Traduza roteiro incluindo essas keywords naturalmente</li>
                      <li>Use a ferramenta "Otimizador de Descrição" para cada idioma</li>
                      <li>Adicione legendas em múltiplos idiomas (YouTube indexa legendas!)</li>
                      <li>Crie playlists por idioma</li>
                    </ol>

                    <p className="font-semibold mt-3">Pro Tip:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Um vídeo com legendas em 5 idiomas pode ranquear em 5 países diferentes simultaneamente! 🌍
                      </span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">3</Badge>
                      <span>Monetização por Região Geográfica</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Fato:</p>
                    <p className="text-muted-foreground">CPM varia até 10x entre países!</p>
                    
                    <div className="bg-muted p-3 rounded-md text-xs space-y-1 mt-2">
                      <p><strong>CPM Médio por País:</strong></p>
                      <p>🇺🇸 EUA: $8-15</p>
                      <p>🇩🇪 Alemanha: $7-12</p>
                      <p>🇫🇷 França: $5-9</p>
                      <p>🇧🇷 Brasil: $1-3</p>
                      <p>🇮🇳 Índia: $0.50-1.50</p>
                    </div>

                    <p className="font-semibold mt-3">Estratégia de Monetização:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Priorize traduções para países com alto CPM (EN-US, DE, FR)</li>
                      <li>Crie conteúdo adaptado para esses mercados</li>
                      <li>Use geotargeting de anúncios para produtos premium</li>
                      <li>Desenvolva produtos digitais em múltiplos idiomas</li>
                    </ol>

                    <p className="mt-3 text-xs text-muted-foreground bg-primary/10 p-3 rounded-md">
                      <strong>Caso Real:</strong> Canal de Finanças traduzido para EN:<br/>
                      - Antes: 100k views/mês × $2 CPM = $200<br/>
                      - Depois: 80k PT + 20k EN × ($2 + $10) = $360<br/>
                      💰 Aumento de 80% na receita com 20% das views!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">4</Badge>
                      <span>Reaproveitamento de Conteúdo Evergreen</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Ideia:</p>
                    <p className="text-muted-foreground">Vídeos antigos com bom desempenho podem ser "ressuscitados" com traduções.</p>
                    
                    <p className="font-semibold mt-3">Como Fazer:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Identifique seus 10 vídeos com maior retenção (YouTube Analytics)</li>
                      <li>Traduza os roteiros para 2-3 idiomas</li>
                      <li>Adicione dublagens ou legendas</li>
                      <li>Re-publique com títulos otimizados para cada mercado</li>
                      <li>Promova para públicos internacionais</li>
                    </ol>

                    <p className="mt-3 text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      <strong>Exemplo:</strong> Vídeo "Como Investir em Ações" de 2022:<br/>
                      - Views originais (PT): 50k<br/>
                      - Após tradução para EN/ES: +80k views adicionais<br/>
                      - Esforço: 2h de trabalho = 160% mais visualizações! 🚀
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s5">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">5</Badge>
                      <span>Parcerias Internacionais</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Estratégia:</p>
                    <p className="text-muted-foreground">Use traduções para colaborar com criadores de outros países.</p>
                    
                    <p className="font-semibold mt-3">Workflow de Parceria:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Identifique criadores do mesmo nicho em outros países</li>
                      <li>Proponha troca de conteúdo:</li>
                      <ul className="list-disc ml-6 text-xs mt-1">
                        <li>Você publica vídeo dele dublado em PT</li>
                        <li>Ele publica vídeo seu dublado em EN/ES/FR</li>
                      </ul>
                      <li>Use o Tradutor para adaptar os roteiros</li>
                      <li>Cross-promote nos canais de ambos</li>
                      <li>Divida receita de AdSense</li>
                    </ol>

                    <p className="font-semibold mt-3">Benefícios:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>Acesso a audiências já estabelecidas</li>
                      <li>Credibilidade por associação</li>
                      <li>Produção de conteúdo mais rápida</li>
                      <li>Networking internacional</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s6">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">6</Badge>
                      <span>Testes de Mercado com Traduções</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Descobrir qual mercado internacional tem mais afinidade com seu conteúdo.</p>
                    
                    <p className="font-semibold mt-3">Teste MVP (Minimum Viable Product):</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Escolha 1 vídeo de alto desempenho</li>
                      <li>Traduza para 5 idiomas diferentes</li>
                      <li>Publique todos na mesma semana</li>
                      <li>Promova igualmente (mesmo budget de anúncios)</li>
                      <li>Após 30 dias, analise métricas:</li>
                      <ul className="list-disc ml-6 text-xs mt-1">
                        <li>CTR (Click-Through Rate)</li>
                        <li>Retenção média</li>
                        <li>Comentários e engajamento</li>
                        <li>Taxa de inscrição</li>
                      </ul>
                      <li>Foque nos 2 idiomas vencedores</li>
                    </ol>

                    <p className="mt-3 text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      <strong>Descoberta comum:</strong> Muitos canais descobrem que têm audiências inesperadas!<br/>
                      Ex: Canal BR de Tech descobre que Romênia é o 2º maior mercado. 🇷🇴
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Melhores Práticas
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Sempre tenha um falante nativo revisando traduções críticas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Adapte CTAs para cada cultura (ex: "Inscreva-se" vs "Subscribe")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Use analytics regionais para priorizar idiomas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Teste formatos de datas e unidades (DD/MM vs MM/DD, km vs miles)</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
