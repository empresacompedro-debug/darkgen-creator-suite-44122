import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Otimizador de Vídeo</CardTitle>
        <CardDescription>
          Guia completo para otimização de títulos, descrições e tags com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="optimization">Otimização</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é o Otimizador de Vídeo?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Uma ferramenta de otimização completa que analisa vídeos do YouTube e usa IA para melhorar títulos, descrições e tags, aumentando alcance, CTR e engajamento.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Principais Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Análise automática de vídeos do YouTube</li>
                      <li>Otimização de título com foco em CTR</li>
                      <li>Descrição SEO-friendly completa</li>
                      <li>Tags estratégicas para alcance</li>
                      <li>Score antes/depois da otimização</li>
                      <li>Histórico completo de otimizações</li>
                      <li>Múltiplos modelos de IA disponíveis</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features">
                <AccordionTrigger>Recursos Principais</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Análise Completa</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Extrai dados do vídeo automaticamente</li>
                      <li>Analisa título, descrição e tags atuais</li>
                      <li>Calcula score de qualidade (0-100)</li>
                      <li>Identifica pontos de melhoria</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Otimização com IA</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Título otimizado para CTR</li>
                      <li>Descrição completa com SEO</li>
                      <li>Tags relevantes e estratégicas</li>
                      <li>Novo score previsto</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Comparação</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Versão original vs otimizada lado a lado</li>
                      <li>Diferença de score destacada</li>
                      <li>Mudanças específicas evidenciadas</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="use-cases">
                <AccordionTrigger>Quando Usar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Antes de publicar um vídeo novo</li>
                    <li>Para melhorar vídeos com baixo desempenho</li>
                    <li>Ao republicar ou atualizar conteúdo antigo</li>
                    <li>Para aprender boas práticas de SEO</li>
                    <li>Quando quiser aumentar alcance orgânico</li>
                    <li>Para testar diferentes abordagens</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="title">
                <AccordionTrigger>Otimização de Título</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">O que a IA Considera:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Comprimento:</strong> 60-70 caracteres ideal</li>
                      <li><strong>Palavras-chave:</strong> Termos de busca relevantes</li>
                      <li><strong>Gatilhos mentais:</strong> Curiosidade, urgência, benefício</li>
                      <li><strong>Números:</strong> Listas, estatísticas</li>
                      <li><strong>Clareza:</strong> Objetivo claro e direto</li>
                      <li><strong>Emoção:</strong> Palavras impactantes</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Exemplo de Otimização:</p>
                    <p className="text-sm"><strong>Original:</strong> "Meu novo vídeo sobre culinária"</p>
                    <p className="text-sm"><strong>Otimizado:</strong> "5 Receitas FÁCEIS que Fazem SUCESSO (Passo a Passo)"</p>
                    <p className="text-sm text-muted-foreground">✓ Número ✓ Benefício ✓ Palavra-chave ✓ Clareza</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="description">
                <AccordionTrigger>Otimização de Descrição</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Estrutura Recomendada:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li><strong>Introdução (150 caracteres):</strong> Resume o vídeo com palavras-chave</li>
                      <li><strong>Detalhamento:</strong> Explica o conteúdo em profundidade</li>
                      <li><strong>Timestamps:</strong> Facilita navegação (se aplicável)</li>
                      <li><strong>Links:</strong> Redes sociais, produtos, referências</li>
                      <li><strong>Hashtags:</strong> 3-5 hashtags relevantes</li>
                      <li><strong>CTA:</strong> Inscrição, like, comentário</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Elementos SEO:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Palavra-chave principal nos primeiros 150 caracteres</li>
                      <li>Variações e sinônimos da palavra-chave</li>
                      <li>Termos relacionados ao nicho</li>
                      <li>Responde perguntas comuns sobre o tema</li>
                      <li>Linguagem natural e legível</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tags">
                <AccordionTrigger>Otimização de Tags</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Estratégia de Tags:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Tag principal:</strong> Palavra-chave exata do vídeo</li>
                      <li><strong>Tags de cauda longa:</strong> Frases específicas</li>
                      <li><strong>Tags de nicho:</strong> Termos do seu nicho</li>
                      <li><strong>Tags de tópico:</strong> Temas gerais relacionados</li>
                      <li><strong>Tags de canal:</strong> Nome do canal, marca</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Exemplo para Vídeo de Receita:</p>
                    <p className="text-sm"><strong>Principal:</strong> receita fácil</p>
                    <p className="text-sm"><strong>Cauda longa:</strong> receita fácil e rápida para iniciantes</p>
                    <p className="text-sm"><strong>Nicho:</strong> culinária, gastronomia, cozinha</p>
                    <p className="text-sm"><strong>Tópico:</strong> comida, alimentação</p>
                    <p className="text-sm"><strong>Canal:</strong> [nome do canal]</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Boas Práticas:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use 10-15 tags por vídeo</li>
                      <li>Mix de tags específicas e gerais</li>
                      <li>Evite tag stuffing (repetição excessiva)</li>
                      <li>Use tags em português E inglês (se aplicável)</li>
                      <li>Mantenha relevância com o conteúdo</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-models">
                <AccordionTrigger>Modelos de IA Disponíveis</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 2.0 Flash (Padrão - Recomendado):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Rápido e eficiente</li>
                      <li>Ótimo custo-benefício</li>
                      <li>Ideal para uso diário</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 1.5 Pro:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Análise mais profunda</li>
                      <li>Melhor para conteúdo complexo</li>
                      <li>Descrições mais elaboradas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 1.5 Flash:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Mais rápido</li>
                      <li>Bom para testes</li>
                      <li>Otimizações mais simples</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="score">
                <AccordionTrigger>Sistema de Score</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Como o Score é Calculado:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Título (35%):</strong> Comprimento, palavras-chave, gatilhos</li>
                      <li><strong>Descrição (35%):</strong> Completude, SEO, estrutura</li>
                      <li><strong>Tags (30%):</strong> Quantidade, relevância, estratégia</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Faixas de Score:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>0-40:</strong> 🔴 Necessita otimização urgente</li>
                      <li><strong>41-60:</strong> 🟡 Pode melhorar significativamente</li>
                      <li><strong>61-80:</strong> 🟢 Boa otimização</li>
                      <li><strong>81-100:</strong> ✅ Excelente otimização</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="metrics">
                <AccordionTrigger>Métricas de Análise</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Para o Título:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Comprimento em caracteres</li>
                      <li>Presença de palavras-chave</li>
                      <li>Uso de números</li>
                      <li>Gatilhos mentais identificados</li>
                      <li>Clareza e especificidade</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para a Descrição:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Comprimento total</li>
                      <li>Densidade de palavras-chave</li>
                      <li>Presença de timestamps</li>
                      <li>Links e CTAs</li>
                      <li>Estrutura e formatação</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para as Tags:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Quantidade de tags</li>
                      <li>Relevância ao conteúdo</li>
                      <li>Mix de especificidade</li>
                      <li>Cobertura de termos relacionados</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="comparison">
                <AccordionTrigger>Interpretando a Comparação</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Mudança no Score:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>+30-40 pontos:</strong> Transformação significativa</li>
                      <li><strong>+20-30 pontos:</strong> Melhoria substancial</li>
                      <li><strong>+10-20 pontos:</strong> Otimização moderada</li>
                      <li><strong>+5-10 pontos:</strong> Ajustes finos</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">O que Observar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Mudanças específicas no título</li>
                      <li>Estrutura da nova descrição</li>
                      <li>Quantidade e tipo de tags adicionadas</li>
                      <li>Elementos SEO incorporados</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="history">
                <AccordionTrigger>Usando o Histórico</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Benefícios do Histórico:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Revisar otimizações anteriores</li>
                      <li>Comparar diferentes abordagens</li>
                      <li>Aprender com padrões de sucesso</li>
                      <li>Reaproveitar ideias eficazes</li>
                      <li>Acompanhar evolução ao longo do tempo</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Como Usar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Clique em "Ver" para revisar otimização</li>
                      <li>Analise o que funcionou melhor</li>
                      <li>Delete otimizações não utilizadas</li>
                      <li>Use como referência para novos vídeos</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="pre-publish">
                <AccordionTrigger>Estratégia: Pré-Publicação</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Fluxo Recomendado:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Finalize a edição do vídeo</li>
                      <li>Faça upload privado no YouTube</li>
                      <li>Copie a URL do vídeo</li>
                      <li>Use o Otimizador para análise</li>
                      <li>Revise as sugestões da IA</li>
                      <li>Aplique as otimizações no YouTube</li>
                      <li>Publique o vídeo otimizado</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Benefícios:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Vídeo já nasce otimizado</li>
                      <li>Melhor indexação desde o início</li>
                      <li>Maior chance de alcance inicial</li>
                      <li>Não precisa re-otimizar depois</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rescue">
                <AccordionTrigger>Estratégia: Resgate de Vídeos</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Como Resgatar Vídeos Antigos:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Identifique vídeos com bom conteúdo mas baixo desempenho</li>
                      <li>Otimize título, descrição e tags</li>
                      <li>Atualize thumbnail se possível</li>
                      <li>Republique ou divulgue novamente</li>
                      <li>Monitore resultados nas próximas semanas</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Sinais de Vídeos para Resgatar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Baixo CTR (menos de 3-4%)</li>
                      <li>Impressões altas mas views baixas</li>
                      <li>Título genérico ou vago</li>
                      <li>Descrição muito curta</li>
                      <li>Poucas ou nenhuma tag</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="testing">
                <AccordionTrigger>Estratégia: Teste A/B</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Como Testar:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Otimize o mesmo vídeo múltiplas vezes</li>
                      <li>Experimente diferentes abordagens de título</li>
                      <li>Teste variações de descrição</li>
                      <li>Compare scores e sugestões</li>
                      <li>Escolha a melhor versão</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">O que Testar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Diferentes gatilhos mentais no título</li>
                      <li>Variações de palavras-chave</li>
                      <li>Estruturas de descrição diferentes</li>
                      <li>Sets de tags com estratégias variadas</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="learning">
                <AccordionTrigger>Estratégia: Aprendizado Contínuo</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Use a Ferramenta para Aprender:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Compare suas otimizações com as da IA</li>
                      <li>Identifique padrões em títulos de sucesso</li>
                      <li>Aprenda estruturas de descrição eficazes</li>
                      <li>Descubra tags que você não conhecia</li>
                      <li>Entenda o que gera scores altos</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Evolua Suas Habilidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Com o tempo, seus títulos melhorarão naturalmente</li>
                      <li>Você aprenderá SEO na prática</li>
                      <li>Desenvolverá intuição para otimização</li>
                      <li>Precisará menos da ferramenta gradualmente</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="niche-specific">
                <AccordionTrigger>Estratégias por Nicho</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Entretenimento/Vlogs:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Títulos emocionais e curiosos</li>
                      <li>Descrição mais informal e pessoal</li>
                      <li>Tags de tendências e trending topics</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Educacional/Tutoriais:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Títulos claros com benefício direto</li>
                      <li>Descrição detalhada com timestamps</li>
                      <li>Tags focadas em "como fazer"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Review/Unboxing:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Título com nome exato do produto</li>
                      <li>Descrição com specs e links</li>
                      <li>Tags de produto e marca</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="common-mistakes">
                <AccordionTrigger>Erros Comuns a Evitar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>❌ Ignorar as sugestões de SEO da IA</li>
                    <li>❌ Usar título clickbait sem entregar o prometido</li>
                    <li>❌ Descrição muito curta ou genérica</li>
                    <li>❌ Tags irrelevantes ao conteúdo</li>
                    <li>❌ Não revisar antes de aplicar</li>
                    <li>❌ Copiar tags de outros vídeos sem adaptar</li>
                    <li>❌ Não testar diferentes abordagens</li>
                    <li>❌ Aplicar otimização sem entender o porquê</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>Rotina de Otimização</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Para Cada Vídeo Novo:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Sempre otimize antes de publicar</li>
                      <li>Revise e ajuste as sugestões da IA</li>
                      <li>Salve no histórico para referência</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Manutenção Mensal:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Revise vídeos com baixo desempenho</li>
                      <li>Re-otimize se necessário</li>
                      <li>Analise o histórico de otimizações</li>
                      <li>Identifique padrões de sucesso</li>
                    </ul>
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
