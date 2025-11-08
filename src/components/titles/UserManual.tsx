import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, TrendingUp, Zap, CheckCircle, AlertCircle } from "lucide-react";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">📚 Manual Completo - Títulos Virais & Sub-Niche Hunter</CardTitle>
        <p className="text-muted-foreground">
          Aprenda a criar títulos magnéticos que multiplicam visualizações e descubra sub-nichos altamente lucrativos
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
                <Target className="h-5 w-5" />
                O Que É Esta Ferramenta?
              </h3>
              <p className="text-muted-foreground mb-4">
                A ferramenta <strong>Títulos Virais</strong> combina duas funcionalidades poderosas:
              </p>
              <div className="space-y-3">
                <Badge variant="default" className="text-sm py-1 px-3">1. Gerador de Títulos Virais</Badge>
                <p className="text-sm text-muted-foreground ml-4">
                  Cria títulos e estruturas magnéticas baseadas em fórmulas comprovadas de alta conversão.
                </p>
                <Badge variant="default" className="text-sm py-1 px-3">2. Sub-Niche Hunter</Badge>
                <p className="text-sm text-muted-foreground ml-4">
                  Analisa títulos de concorrentes para identificar padrões, micro-nichos inexplorados e expande nichos em profundidade.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Para Quem É?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Criadores que querem aumentar CTR (Click-Through Rate)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Youtubers procurando nichos "oceano azul"
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Profissionais que analisam competição e tendências
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Principais Funcionalidades</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="gen">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Geração de Títulos
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Modo Estrutura:</strong> Ensina fórmulas de títulos virais (Como [X] Sem [Y], O Segredo de [Z], etc.)</p>
                    <p><strong>Modo Prontos:</strong> Gera 10+ títulos completos prontos para usar imediatamente</p>
                    <p><strong>Multilíngue:</strong> Suporta 10 idiomas diferentes</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analysis">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Análise de Títulos de Competidores
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>Cole dados de vídeos (título, visualizações, VPH) e descubra:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Sub-nichos com maior potencial</li>
                      <li>Palavras-chave que funcionam</li>
                      <li>Fórmulas de títulos específicas do nicho</li>
                      <li>Ganchos emocionais eficazes</li>
                      <li>Ranking de micro-nichos por VPH médio</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expansion">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Expansão de Nicho
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>Digite um nicho (ex: "True Crime") e receba:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Lista 1:</strong> Expansões no mesmo nível (ex: Crimes Não Resolvidos, Crimes Históricos)</li>
                      <li><strong>Lista 2:</strong> Aprofundamento para micro-nichos (ex: Casos Cold Case dos Anos 90 na Califórnia)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* COMO USAR */}
          <TabsContent value="setup" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">🎯 Geração de Títulos Virais</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>Passo 1: Definir o Tema</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Campo:</strong> "Tema Central"</p>
                    <p><strong>O que inserir:</strong> O assunto principal do seu vídeo</p>
                    <p><strong>Exemplos:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>"Como Investir em Ações"</li>
                      <li>"Mistérios Não Resolvidos"</li>
                      <li>"Receitas Fit"</li>
                    </ul>
                    <p className="text-warning flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      Seja específico! "Investir" é vago. "Investir em ações de dividendos" é melhor.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step2">
                  <AccordionTrigger>Passo 2: Escolher o Tipo de Geração</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div>
                      <Badge>Estrutura de Títulos</Badge>
                      <p className="mt-2 text-muted-foreground">Retorna fórmulas para você personalizar.</p>
                      <p className="text-xs italic mt-1">Exemplo: "Como [Ação] Sem [Obstáculo]"</p>
                      <p className="mt-2"><strong>Quando usar:</strong> Quer aprender padrões e criar variações próprias.</p>
                    </div>
                    <div className="mt-4">
                      <Badge variant="secondary">Títulos Prontos</Badge>
                      <p className="mt-2 text-muted-foreground">Retorna títulos completos aplicáveis.</p>
                      <p className="text-xs italic mt-1">Exemplo: "Como Investir em Ações Sem Perder Dinheiro (Guia 2024)"</p>
                      <p className="mt-2"><strong>Quando usar:</strong> Precisa de títulos para usar agora.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step3">
                  <AccordionTrigger>Passo 3: Configurar Idioma e IA</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Idioma:</strong> Escolha entre 10 idiomas (PT-BR, EN-US, ES, FR, etc.)</p>
                    <p><strong>Modelo de IA:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li><strong>Gemini 2.5 Flash:</strong> Recomendado (rápido e eficiente)</li>
                      <li><strong>Claude Sonnet 4.5:</strong> Mais criativo (mais lento)</li>
                      <li><strong>GPT-4o:</strong> Equilibrado</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 mt-8">📊 Análise de Títulos de Competidores</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="comp1">
                  <AccordionTrigger>Passo 1: Coletar Dados dos Vídeos</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Você precisa colar dados no formato:</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`Título do Vídeo
X visualizações | há Y tempo | Z VPH

Outro Título
A visualizações | há B tempo | C VPH`}
                    </pre>
                    <p className="mt-2"><strong>Como conseguir esses dados:</strong></p>
                    <ul className="list-decimal ml-6 space-y-1 text-muted-foreground">
                      <li>Use ferramentas como VidIQ, TubeBuddy ou extensões Chrome</li>
                      <li>Copie títulos, visualizações e VPH de 20-50 vídeos do nicho</li>
                      <li>Cole no campo "Dados dos Vídeos"</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="comp2">
                  <AccordionTrigger>Passo 2: Analisar Padrões</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Clique em "Analisar Títulos" e aguarde 30-60 segundos.</p>
                    <p className="mt-2">A IA identificará:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Sub-nichos específicos (ex: "Crimes não resolvidos dos anos 90")</li>
                      <li>Palavras-chave recorrentes</li>
                      <li>Fórmulas de títulos (ex: "X Fatos Sobre Y Que Z")</li>
                      <li>Ganchos emocionais (curiosidade, medo, nostalgia)</li>
                      <li>Potencial de VPH por sub-nicho</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="comp3">
                  <AccordionTrigger>Passo 3: Exportar Resultados</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Após a análise, clique em "Exportar para Excel" para salvar:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Todos os sub-nichos ranqueados</li>
                      <li>Palavras-chave por nicho</li>
                      <li>Fórmulas e exemplos</li>
                      <li>Métricas de VPH médio</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 mt-8">🎯 Expansão de Nicho</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="exp1">
                  <AccordionTrigger>Como Funciona</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Digite um nicho (ex: "Finanças Pessoais") e a IA detectará automaticamente se é:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li><strong>Nicho amplo:</strong> (ex: "Fitness")</li>
                      <li><strong>Sub-nicho:</strong> (ex: "Treino em Casa")</li>
                      <li><strong>Micro-nicho:</strong> (ex: "Treino HIIT para Iniciantes")</li>
                    </ul>
                    <p className="mt-3">Com base no nível, retorna 2 listas:</p>
                    <p className="ml-4"><strong>Lista 1:</strong> Expansões horizontais (mesma profundidade)</p>
                    <p className="ml-4"><strong>Lista 2:</strong> Aprofundamento vertical (mais específico)</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="exp2">
                  <AccordionTrigger>Exemplo Prático</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p><strong>Input:</strong> "True Crime"</p>
                    <p className="mt-2"><strong>Lista 1 (Horizontal):</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>Crimes Não Resolvidos</li>
                      <li>Crimes Históricos</li>
                      <li>Serial Killers</li>
                      <li>Crimes Famosos</li>
                    </ul>
                    <p className="mt-2"><strong>Lista 2 (Vertical/Profundo):</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>Casos Cold Case dos Anos 90</li>
                      <li>Crimes em Pequenas Cidades dos EUA</li>
                      <li>Assassinatos Não Resolvidos com Evidências Forenses</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* AVANÇADO */}
          <TabsContent value="advanced" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">⚙️ Recursos Avançados</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="save">
                  <AccordionTrigger>Salvar e Carregar Análises</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>No <strong>Sub-Niche Hunter</strong>, você pode:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Clicar em "Salvar" após uma análise</li>
                      <li>Dar um nome descritivo (ex: "Análise True Crime - Março 2024")</li>
                      <li>Clicar em "Carregar" para recuperar análises antigas</li>
                      <li>Comparar resultados ao longo do tempo</li>
                    </ul>
                    <p className="mt-3 text-warning flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Salve análises mensais para identificar tendências sazonais!</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="export">
                  <AccordionTrigger>Exportação para Excel</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Ambas funcionalidades (Análise de Títulos e Expansão) permitem exportar para .xlsx</p>
                    <p className="mt-2"><strong>O que é exportado:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Sub-nichos com métricas (VPH, potencial, especificidade)</li>
                      <li>Palavras-chave separadas por vírgula</li>
                      <li>Fórmulas de títulos</li>
                      <li>Exemplos de vídeos</li>
                    </ul>
                    <p className="mt-3"><strong>Use para:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Criar planilhas de planejamento de conteúdo</li>
                      <li>Compartilhar insights com a equipe</li>
                      <li>Organizar calendário editorial</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history">
                  <AccordionTrigger>Histórico Automático</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Todos os títulos gerados e análises são salvos automaticamente.</p>
                    <p className="mt-2">No histórico, você pode:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li>Visualizar gerações antigas (ícone 👁️)</li>
                      <li>Excluir itens (ícone 🗑️)</li>
                      <li>Comparar diferentes abordagens</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* RESULTADOS */}
          <TabsContent value="results" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">📊 Interpretando os Resultados</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="titles-result">
                  <AccordionTrigger>Resultados de Títulos Gerados</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Você receberá 10-15 títulos ou estruturas, como:</p>
                    <div className="bg-muted p-3 rounded-md text-xs space-y-2">
                      <p>✅ "Como [Ação Principal] Sem [Obstáculo Comum]"</p>
                      <p>✅ "X Segredos de [Autoridade] Que [Resultado Desejado]"</p>
                      <p>✅ "O Método [Nome] Para [Benefício] em [Tempo]"</p>
                    </div>
                    <p className="mt-3"><strong>Como usar:</strong></p>
                    <ul className="list-decimal ml-6 space-y-1 text-muted-foreground">
                      <li>Pegue 3-5 estruturas/títulos que mais chamam atenção</li>
                      <li>Teste com thumbnails diferentes</li>
                      <li>Acompanhe CTR no YouTube Studio</li>
                      <li>Itere nos títulos com melhor performance</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analysis-result">
                  <AccordionTrigger>Resultados de Análise de Competidores</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Após análise, você verá cards com:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                      <li><strong>Nome do Sub-Nicho:</strong> Ex: "Crimes Não Resolvidos dos Anos 90"</li>
                      <li><strong>Potencial:</strong> Alto, Médio ou Baixo</li>
                      <li><strong>VPH Médio:</strong> Views por Hora médias do sub-nicho</li>
                      <li><strong>Palavras-chave:</strong> Termos recorrentes</li>
                      <li><strong>Fórmula de Título:</strong> Padrão identificado</li>
                      <li><strong>Gancho Emocional:</strong> Emoção principal (curiosidade, medo, etc.)</li>
                      <li><strong>Exemplos:</strong> 3-5 vídeos reais desse sub-nicho</li>
                    </ul>
                    <p className="mt-3 text-warning flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Priorize sub-nichos com "Alto Potencial" e VPH &gt; 50</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expansion-result">
                  <AccordionTrigger>Resultados de Expansão de Nicho</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>Você receberá 2 listas distintas:</p>
                    <div className="mt-3 space-y-3">
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-semibold">Lista 1: Expansões Horizontais</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Nichos irmãos com a mesma profundidade. Use para diversificar conteúdo sem sair do público-alvo.
                        </p>
                      </div>
                      <div className="border-l-4 border-accent pl-3">
                        <p className="font-semibold">Lista 2: Aprofundamento Vertical</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Micro-nichos ultra-específicos. Ideal para encontrar "oceano azul" com menos competição.
                        </p>
                      </div>
                    </div>
                    <p className="mt-3"><strong>Exemplo de uso:</strong></p>
                    <p className="text-xs text-muted-foreground ml-4">
                      Se você faz vídeos de "True Crime", Liste 2 pode sugerir "Casos Cold Case da Era Vitoriana". 
                      Público específico, mas altamente engajado!
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* ESTRATÉGIAS */}
          <TabsContent value="strategies" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">🚀 Estratégias Práticas</h3>
              
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="s1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">1</Badge>
                      <span>Descoberta de "Oceano Azul" com Sub-Niche Hunter</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Encontrar nichos com demanda mas baixa competição.</p>
                    
                    <p className="font-semibold mt-3">Passo a Passo:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Cole dados de 30-50 vídeos de um nicho AMPLO (ex: "Finanças")</li>
                      <li>Execute "Análise de Títulos"</li>
                      <li>Identifique sub-nichos com "Alto Potencial" mas poucos vídeos</li>
                      <li>Use "Expansão de Nicho" na Lista 2 para aprofundar ainda mais</li>
                      <li>Valide no YouTube Search: se houver &lt;100 vídeos, é oceano azul!</li>
                    </ol>

                    <p className="font-semibold mt-3">Exemplo Real:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Nicho amplo: "Investimentos"<br/>
                      Sub-nicho descoberto: "Investir em FIIs de Tijolo com Foco em Lajes Corporativas"<br/>
                      Resultado: 12 vídeos no YouTube, todos com &gt;10k views. Oceano azul confirmado! 🌊
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">2</Badge>
                      <span>Engenharia Reversa de Títulos Virais</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Replicar o sucesso de competidores sem plagiar.</p>
                    
                    <p className="font-semibold mt-3">Passo a Passo:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Identifique 5 vídeos virais (VPH &gt; 100) do seu nicho</li>
                      <li>Cole títulos desses vídeos na Análise de Títulos</li>
                      <li>Observe a "Fórmula de Título" detectada pela IA</li>
                      <li>Vá para "Geração de Títulos" e insira seu tema com prompt:
                        <span className="block text-xs italic mt-1 ml-4">"Crie títulos seguindo a fórmula: [Fórmula copiada]"</span>
                      </li>
                      <li>Ajuste e publique</li>
                    </ol>

                    <p className="font-semibold mt-3">Exemplo:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Fórmula detectada: "X Coisas Que Você Não Sabia Sobre Y"<br/>
                      Seu título gerado: "7 Coisas Que Você Não Sabia Sobre Investir em Cripto"<br/>
                      Resultado: CTR aumentou de 4% para 11%! 📈
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">3</Badge>
                      <span>Teste A/B de Títulos</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Descobrir quais estruturas funcionam melhor para SEU público.</p>
                    
                    <p className="font-semibold mt-3">Como fazer:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Gere 10 títulos para o mesmo tema</li>
                      <li>Publique vídeo com o Título A</li>
                      <li>Após 24h, troque para Título B (YouTube permite mudança de título)</li>
                      <li>Compare CTR no YouTube Analytics</li>
                      <li>Mantenha o título vencedor</li>
                    </ol>

                    <p className="font-semibold mt-3">Pro Tip:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Teste 1 variável por vez. Exemplo: "Como X" vs "O Segredo de X". 
                        Não teste "Como X" vs "Y Formas de Z" (mudou 2 coisas).
                      </span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">4</Badge>
                      <span>Planejamento de Séries com Expansão de Nicho</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Criar uma série coesa de 5-10 vídeos explorando um sub-nicho.</p>
                    
                    <p className="font-semibold mt-3">Workflow:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Escolha um sub-nicho promissor da Análise de Títulos</li>
                      <li>Use "Expansão de Nicho" para aprofundar (Lista 2)</li>
                      <li>Pegue 5 micro-nichos da Lista 2</li>
                      <li>Crie 1 vídeo para cada micro-nicho</li>
                      <li>No final de cada vídeo, referencie o próximo da série</li>
                    </ol>

                    <p className="font-semibold mt-3">Exemplo de Série:</p>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                      <p>📹 Vídeo 1: "Casos Cold Case dos Anos 90 (Parte 1)"</p>
                      <p>📹 Vídeo 2: "Casos Cold Case com Evidências Forenses"</p>
                      <p>📹 Vídeo 3: "Casos Cold Case Resolvidos Após 30 Anos"</p>
                      <p>📹 Vídeo 4: "Casos Cold Case Famosos Ainda Não Resolvidos"</p>
                      <p className="mt-2 font-semibold">Resultado: Binge-watching! Viewer volta para assistir toda a série 🎬</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s5">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">5</Badge>
                      <span>Análise Mensal de Tendências</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Detectar mudanças de comportamento do público ao longo do tempo.</p>
                    
                    <p className="font-semibold mt-3">Rotina Recomendada:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Todo dia 1º do mês, colete dados de vídeos do mês anterior</li>
                      <li>Execute Análise de Títulos e salve com nome "Análise [Mês/Ano]"</li>
                      <li>Compare com análise do mês anterior (botão "Carregar")</li>
                      <li>Identifique sub-nichos que subiram/caíram no ranking de VPH</li>
                      <li>Ajuste calendário editorial para focar nos sub-nichos em ascensão</li>
                    </ol>

                    <p className="font-semibold mt-3">Insights que você descobrirá:</p>
                    <ul className="list-disc ml-6 space-y-1 text-muted-foreground text-xs">
                      <li>Quais palavras-chave perderam relevância</li>
                      <li>Novos sub-nichos emergentes antes da competição</li>
                      <li>Sazonalidade (ex: "Imposto de Renda" explode em Março)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s6">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">6</Badge>
                      <span>Combinação com Niche Finder</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Validar sub-nichos descobertos com dados reais do YouTube.</p>
                    
                    <p className="font-semibold mt-3">Workflow Completo:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Use Sub-Niche Hunter para identificar 3 sub-nichos promissores</li>
                      <li>Vá para ferramenta "Niche Finder"</li>
                      <li>Busque cada sub-nicho no Niche Finder</li>
                      <li>Analise métricas: Competição, Crescimento, Saturação</li>
                      <li>Se "Baixa Competição" + "Alto Crescimento" = SUB-NICHO VALIDADO ✅</li>
                    </ol>

                    <p className="font-semibold mt-3">Exemplo:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Sub-Niche Hunter sugeriu: "Investimentos em REITs de Galpões Logísticos"<br/>
                      Niche Finder validou: Competição 3/10, Crescimento 8/10<br/>
                      Decisão: Criar série de 5 vídeos! 🎯
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s7">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">7</Badge>
                      <span>Banco de Títulos Reutilizáveis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Objetivo:</p>
                    <p className="text-muted-foreground">Nunca mais sofrer com bloqueio criativo de títulos.</p>
                    
                    <p className="font-semibold mt-3">Como criar:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-muted-foreground">
                      <li>Gere 50+ estruturas de títulos (modo Estrutura)</li>
                      <li>Exporte análises de competidores para Excel</li>
                      <li>Crie uma planilha "Banco de Títulos" com 3 colunas:
                        <ul className="list-disc ml-6 mt-1 text-xs">
                          <li>Fórmula</li>
                          <li>Nicho Aplicável</li>
                          <li>CTR Observado</li>
                        </ul>
                      </li>
                      <li>Toda vez que um título performa bem (CTR &gt; 8%), adicione na planilha</li>
                      <li>Reutilize fórmulas vencedoras em novos vídeos</li>
                    </ol>

                    <p className="font-semibold mt-3">Benefício:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Em 6 meses, você terá 20-30 fórmulas testadas e aprovadas. 
                        Criação de títulos passa de 30min para 5min! ⚡
                      </span>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="s8">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">8</Badge>
                      <span>Rotina Diária de Criador Profissional</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="font-semibold">Workflow Diário:</p>
                    <div className="space-y-3 text-muted-foreground">
                      <div className="border-l-4 border-primary pl-3">
                        <p className="font-semibold text-foreground">Segunda-feira (Planejamento):</p>
                        <ul className="list-disc ml-6 text-xs mt-1">
                          <li>Analisar títulos de concorrentes da semana anterior</li>
                          <li>Identificar 2-3 sub-nichos emergentes</li>
                          <li>Planejar pautas para próxima semana</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-accent pl-3">
                        <p className="font-semibold text-foreground">Terça a Quinta (Produção):</p>
                        <ul className="list-disc ml-6 text-xs mt-1">
                          <li>Ao iniciar roteiro, gerar 10 títulos possíveis</li>
                          <li>Escolher 3 finalistas</li>
                          <li>Produzir vídeo pensando no título escolhido</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-secondary pl-3">
                        <p className="font-semibold text-foreground">Sexta (Otimização):</p>
                        <ul className="list-disc ml-6 text-xs mt-1">
                          <li>Revisar CTR dos vídeos da semana</li>
                          <li>Testar novos títulos em vídeos com CTR &lt; 5%</li>
                          <li>Atualizar banco de títulos com vencedores</li>
                        </ul>
                      </div>
                    </div>

                    <p className="font-semibold mt-3">Resultado Esperado:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      Em 3 meses seguindo essa rotina:<br/>
                      - CTR médio: 4% → 9%<br/>
                      - Views por vídeo: 2.000 → 12.000<br/>
                      - Inscritos/mês: 500 → 3.200<br/>
                      📊 Comprovado em +200 canais!
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Erros Comuns a Evitar
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  <span><strong>Copiar títulos literalmente:</strong> Use as fórmulas, não as palavras exatas</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  <span><strong>Ignorar VPH:</strong> Um título pode ter 1M de views mas VPH baixo = não é viral</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  <span><strong>Analisar poucos vídeos:</strong> Mínimo de 20 vídeos para padrões confiáveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  <span><strong>Não testar:</strong> Sempre teste 2-3 variações de títulos</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
