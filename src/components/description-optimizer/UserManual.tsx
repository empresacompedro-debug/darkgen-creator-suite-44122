import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Otimizador de Descrição</CardTitle>
        <CardDescription>
          Guia completo para criação de descrições de vídeo otimizadas com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="setup">Configuração</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é o Otimizador de Descrição?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Uma ferramenta especializada em criar descrições completas e otimizadas para vídeos do YouTube, com foco em SEO, alcance orgânico e conversão, baseando-se apenas no título do vídeo.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Principais Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Geração de descrição completa a partir do título</li>
                      <li>Otimização para múltiplos idiomas</li>
                      <li>Scores de SEO, alcance e engajamento</li>
                      <li>Tags relevantes automatizadas</li>
                      <li>Frases para thumbnail sugeridas</li>
                      <li>CTA (Call-to-Action) personalizado opcional</li>
                      <li>Histórico completo de otimizações</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features">
                <AccordionTrigger>Recursos Principais</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Entrada Simples</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Apenas o título do vídeo é necessário</li>
                      <li>IA interpreta o contexto automaticamente</li>
                      <li>Gera conteúdo completo e relevante</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Análise Completa</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Score SEO:</strong> Otimização para buscas (0-100)</li>
                      <li><strong>Potencial de Alcance:</strong> Capacidade de descoberta (0-100)</li>
                      <li><strong>Potencial de Engajamento:</strong> Estímulo à ação (0-100)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Conteúdo Gerado</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Descrição otimizada e estruturada</li>
                      <li>10-15 tags estratégicas</li>
                      <li>3-5 frases impactantes para thumbnail</li>
                      <li>CTA personalizado (opcional)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="use-cases">
                <AccordionTrigger>Casos de Uso</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Criar descrições para vídeos novos rapidamente</li>
                    <li>Otimizar descrições existentes</li>
                    <li>Gerar variações em diferentes idiomas</li>
                    <li>Obter sugestões de tags relevantes</li>
                    <li>Criar textos para thumbnails</li>
                    <li>Testar diferentes abordagens de descrição</li>
                    <li>Aprender melhores práticas de SEO para YouTube</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="title-input">
                <AccordionTrigger>Título do Vídeo</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Como Usar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Cole ou digite o título do seu vídeo</li>
                      <li>Seja específico e descritivo</li>
                      <li>Inclua palavras-chave importantes</li>
                      <li>O título guiará toda a otimização</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Exemplos de Bons Títulos:</p>
                    <p className="text-sm">✅ "5 Receitas Fáceis de Sobremesas em 10 Minutos"</p>
                    <p className="text-sm">✅ "Como Ganhar Dinheiro Online em 2024 (Guia Completo)"</p>
                    <p className="text-sm">✅ "Review iPhone 15: Vale a Pena? Teste Completo"</p>
                    <p className="text-sm text-muted-foreground mt-2">Títulos claros geram descrições melhores!</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="language">
                <AccordionTrigger>Idioma</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Idiomas Disponíveis:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Português:</strong> pt-BR, padrão brasileiro</li>
                      <li><strong>Inglês:</strong> en-US, alcance internacional</li>
                      <li><strong>Espanhol:</strong> es-ES, mercado hispânico</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Dicas de Seleção:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Escolha o idioma do seu público-alvo</li>
                      <li>Para alcance global, use inglês</li>
                      <li>Você pode gerar em múltiplos idiomas</li>
                      <li>A descrição será completamente adaptada ao idioma</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-model">
                <AccordionTrigger>Modelo de IA</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 2.0 Flash (Padrão - Recomendado):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Rápido e eficiente</li>
                      <li>Excelente qualidade de conteúdo</li>
                      <li>Melhor custo-benefício</li>
                      <li>Ideal para uso diário</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 1.5 Pro:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Análise mais profunda</li>
                      <li>Descrições mais elaboradas</li>
                      <li>Melhor para conteúdo complexo</li>
                      <li>Recomendado para nichos técnicos</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Gemini 1.5 Flash:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Mais rápido</li>
                      <li>Bom para testes</li>
                      <li>Conteúdo direto e objetivo</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cta">
                <AccordionTrigger>Call-to-Action (CTA)</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">O que é CTA?</p>
                    <p className="text-sm">
                      Uma chamada para ação que incentiva o espectador a se inscrever, curtir, comentar ou realizar outra ação específica.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Quando Incluir CTA:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>✅ Para aumentar engajamento</li>
                      <li>✅ Em vídeos de crescimento de canal</li>
                      <li>✅ Quando quiser mais comentários</li>
                      <li>✅ Para direcionar para outros vídeos</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Quando Não Incluir:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>❌ Se preferir descrição mais limpa</li>
                      <li>❌ Em vídeos muito técnicos/informativos</li>
                      <li>❌ Se já tem CTA no vídeo</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold text-sm mb-1">Exemplo de CTA Gerado:</p>
                    <p className="text-sm italic">
                      "👍 Se este vídeo foi útil, não esqueça de deixar seu like!<br/>
                      🔔 Inscreva-se no canal para não perder nenhum conteúdo novo!<br/>
                      💬 Deixe nos comentários qual receita você quer ver no próximo vídeo!"
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="scores">
                <AccordionTrigger>Entendendo os Scores</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Score SEO (0-100):</p>
                    <p className="text-sm">
                      Mede a otimização da descrição para mecanismos de busca do YouTube e Google.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li><strong>80-100:</strong> Excelente - Muito bem otimizado</li>
                      <li><strong>60-79:</strong> Bom - Bem estruturado</li>
                      <li><strong>40-59:</strong> Regular - Pode melhorar</li>
                      <li><strong>0-39:</strong> Baixo - Necessita otimização</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Potencial de Alcance (0-100):</p>
                    <p className="text-sm">
                      Avalia a capacidade da descrição de ser descoberta por novos espectadores.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Densidade de palavras-chave relevantes</li>
                      <li>Cobertura de termos de busca populares</li>
                      <li>Potencial de aparecer em sugestões</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Potencial de Engajamento (0-100):</p>
                    <p className="text-sm">
                      Mede o quanto a descrição incentiva interação e ação do espectador.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Presença de CTAs eficazes</li>
                      <li>Clareza e estrutura do conteúdo</li>
                      <li>Incentivos para comentários/compartilhamento</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="description">
                <AccordionTrigger>Descrição Otimizada</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Estrutura Típica:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li><strong>Introdução (150 caracteres):</strong> Resumo com palavras-chave</li>
                      <li><strong>Corpo Principal:</strong> Detalhamento do conteúdo</li>
                      <li><strong>Informações Complementares:</strong> Links, referências</li>
                      <li><strong>CTA:</strong> Chamada para ação (se habilitado)</li>
                      <li><strong>Hashtags:</strong> 3-5 hashtags relevantes</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Elementos SEO Incluídos:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Palavra-chave principal nos primeiros 150 caracteres</li>
                      <li>Variações e sinônimos estrategicamente distribuídos</li>
                      <li>Termos de busca de cauda longa</li>
                      <li>Linguagem natural e legível</li>
                      <li>Formatação clara com quebras de linha</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Como Usar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Copie a descrição completa</li>
                      <li>Cole no campo de descrição do YouTube</li>
                      <li>Revise e ajuste se necessário</li>
                      <li>Adicione links personalizados (redes sociais, etc.)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tags">
                <AccordionTrigger>Tags Sugeridas</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Tipos de Tags Geradas:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Principais:</strong> Palavras-chave exatas do título</li>
                      <li><strong>Relacionadas:</strong> Termos conectados ao tema</li>
                      <li><strong>Cauda Longa:</strong> Frases específicas de busca</li>
                      <li><strong>Nicho:</strong> Tags do seu segmento</li>
                      <li><strong>Trending:</strong> Termos populares (quando aplicável)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Quantidade:</p>
                    <p className="text-sm">Tipicamente 10-15 tags, balanceadas entre específicas e gerais.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Como Aplicar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Copie todas as tags sugeridas</li>
                      <li>Cole no campo de tags do YouTube</li>
                      <li>Adicione tags personalizadas se desejar</li>
                      <li>Mantenha relevância com o conteúdo</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="thumbnail-phrases">
                <AccordionTrigger>Frases para Thumbnail</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">O que São:</p>
                    <p className="text-sm">
                      Frases curtas e impactantes sugeridas para usar em texto na thumbnail do vídeo.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Características:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Curtas e legíveis (2-6 palavras)</li>
                      <li>Impactantes e chamativas</li>
                      <li>Complementam o título</li>
                      <li>Criam curiosidade ou urgência</li>
                      <li>Fáceis de ler em tamanho pequeno</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-sm mb-1">Exemplo:</p>
                    <p className="text-sm">Para título: "5 Receitas Fáceis de Sobremesas"</p>
                    <p className="text-sm italic">
                      • "FÁCIL E RÁPIDO"<br/>
                      • "EM 10 MIN"<br/>
                      • "SEM FORNO"<br/>
                      • "TESTADO!"<br/>
                      • "DELICIOSO 😋"
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="history">
                <AccordionTrigger>Histórico de Otimizações</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Informações Salvas:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Título original do vídeo</li>
                      <li>Idioma e modelo de IA usados</li>
                      <li>Data da otimização</li>
                      <li>Todos os scores</li>
                      <li>Descrição, tags e frases geradas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Como Usar o Histórico:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Clique em "Ver" para revisar otimização completa</li>
                      <li>Compare diferentes versões do mesmo vídeo</li>
                      <li>Reutilize estruturas que funcionaram</li>
                      <li>Delete otimizações não utilizadas</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="workflow">
                <AccordionTrigger>Fluxo de Trabalho Recomendado</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Processo Completo:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Defina o título do seu vídeo</li>
                      <li>Cole no Otimizador de Descrição</li>
                      <li>Escolha idioma e modelo de IA</li>
                      <li>Decida se quer incluir CTA</li>
                      <li>Clique em "Otimizar Conteúdo"</li>
                      <li>Analise os scores e resultado</li>
                      <li>Copie a descrição para o YouTube</li>
                      <li>Aplique as tags sugeridas</li>
                      <li>Use as frases na thumbnail</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="multilanguage">
                <AccordionTrigger>Estratégia Multilíngue</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Expandindo Alcance:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Otimize no seu idioma principal</li>
                      <li>Gere versão em inglês para alcance global</li>
                      <li>Opcionalmente, crie em espanhol</li>
                      <li>Use cada versão em vídeos traduzidos</li>
                      <li>Ou combine elementos das diferentes versões</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Benefícios:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Alcance audiências internacionais</li>
                      <li>Aprenda termos de busca em outros idiomas</li>
                      <li>Descubra ângulos diferentes para o mesmo conteúdo</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="testing">
                <AccordionTrigger>Teste A/B de Descrições</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Como Testar:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Gere múltiplas versões da descrição</li>
                      <li>Varie: incluir/não incluir CTA</li>
                      <li>Teste diferentes modelos de IA</li>
                      <li>Compare os scores</li>
                      <li>Escolha a versão com melhor desempenho</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">O que Analisar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Qual versão tem scores mais altos?</li>
                      <li>Qual estrutura parece mais eficaz?</li>
                      <li>Quais tags são mais relevantes?</li>
                      <li>Qual CTA é mais atraente?</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="niche-strategies">
                <AccordionTrigger>Estratégias por Nicho</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Tutoriais/Educação:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Sempre inclua CTA</li>
                      <li>Foque em termos "como fazer"</li>
                      <li>Use frases diretas para thumbnail</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Entretenimento/Vlogs:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>CTA mais casual e pessoal</li>
                      <li>Tags de tendências e trends</li>
                      <li>Frases emocionais para thumbnail</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Reviews/Tech:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Tags com nomes de produtos</li>
                      <li>CTA direcionando para links</li>
                      <li>Frases com especificações</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="thumbnail-integration">
                <AccordionTrigger>Integração com Thumbnail</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Usando as Frases Sugeridas:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Revise as 3-5 frases geradas</li>
                      <li>Escolha 1-2 que mais chamam atenção</li>
                      <li>Use em fonte grande e legível</li>
                      <li>Contraste com o fundo</li>
                      <li>Teste diferentes posicionamentos</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Dicas de Design:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Fonte bold e clara</li>
                      <li>Cores contrastantes</li>
                      <li>Tamanho grande (legível em mobile)</li>
                      <li>Posicionamento estratégico</li>
                      <li>Combine com elementos visuais</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="optimization-cycle">
                <AccordionTrigger>Ciclo de Otimização Contínua</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Criação Inicial:</p>
                    <p className="text-sm">Use a ferramenta para criar descrição base do vídeo.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Análise de Desempenho:</p>
                    <p className="text-sm">Após publicação, monitore métricas do YouTube (CTR, impressões, etc.).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Re-otimização:</p>
                    <p className="text-sm">Se necessário, gere nova versão testando diferentes abordagens.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">4. Aprendizado:</p>
                    <p className="text-sm">Use o histórico para identificar padrões de sucesso.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="common-mistakes">
                <AccordionTrigger>Erros Comuns a Evitar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>❌ Usar título vago ou genérico</li>
                    <li>❌ Não revisar a descrição gerada antes de publicar</li>
                    <li>❌ Ignorar as tags sugeridas</li>
                    <li>❌ Não personalizar com seus links e informações</li>
                    <li>❌ Usar sempre o mesmo modelo de IA sem testar outros</li>
                    <li>❌ Não aproveitar as frases de thumbnail</li>
                    <li>❌ Deletar histórico sem analisar padrões</li>
                    <li>❌ Copiar descrição sem adaptar ao conteúdo real</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>Rotina de Uso</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Para Cada Vídeo Novo:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Defina o título primeiro</li>
                      <li>Gere a descrição otimizada</li>
                      <li>Aplique as tags</li>
                      <li>Use frases na thumbnail</li>
                      <li>Salve no histórico</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Revisão Semanal:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Analise vídeos publicados na semana</li>
                      <li>Compare descrições com desempenho</li>
                      <li>Identifique padrões de sucesso</li>
                      <li>Ajuste estratégia se necessário</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Manutenção Mensal:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Revise histórico completo</li>
                      <li>Delete otimizações antigas não usadas</li>
                      <li>Atualize descrições de vídeos antigos se necessário</li>
                      <li>Teste novos modelos de IA</li>
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
