import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UserManual() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Completo - Gerador de Imagens</CardTitle>
        <CardDescription>
          Guia completo para criação de imagens profissionais com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="styles">Estilos</TabsTrigger>
            <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is">
                <AccordionTrigger>O que é o Gerador de Imagens?</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>
                    Uma ferramenta profissional de geração de imagens com IA que permite criar conteúdo visual de alta qualidade para seus vídeos, thumbnails, posts e outros materiais.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Principais Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Geração de imagens a partir de descrições textuais</li>
                      <li>Múltiplos estilos artísticos disponíveis</li>
                      <li>Formatos de imagem variados (quadrado, vertical, horizontal)</li>
                      <li>Modelos de IA especializados</li>
                      <li>Download individual ou em lote</li>
                      <li>Histórico completo de gerações</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features">
                <AccordionTrigger>Recursos Principais</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Geração Flexível</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gere de 1 a 10 imagens por vez</li>
                      <li>Prompts em português traduzidos automaticamente</li>
                      <li>Ajustes de estilo e proporção</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Formatos Disponíveis</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Quadrado (1:1):</strong> Ideal para posts, avatares</li>
                      <li><strong>Vertical (9:16):</strong> Perfeito para Stories, Shorts</li>
                      <li><strong>Horizontal (16:9):</strong> Ideal para thumbnails, banners</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Modelos de IA</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Flux Schnell:</strong> Rápido, boa qualidade geral</li>
                      <li><strong>Flux Dev:</strong> Melhor qualidade, mais detalhes</li>
                      <li><strong>Flux Pro:</strong> Máxima qualidade profissional</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="use-cases">
                <AccordionTrigger>Casos de Uso</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Criar imagens para cenas de vídeos</li>
                    <li>Gerar elementos visuais para thumbnails</li>
                    <li>Produzir ilustrações para posts</li>
                    <li>Criar backgrounds e cenários</li>
                    <li>Gerar personagens e avatares</li>
                    <li>Produzir conteúdo visual para Stories</li>
                    <li>Criar assets para motion graphics</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="prompt-basics">
                <AccordionTrigger>Como Escrever Prompts Eficazes</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Estrutura Básica:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li><strong>Assunto Principal:</strong> O que você quer na imagem</li>
                      <li><strong>Detalhes:</strong> Características específicas</li>
                      <li><strong>Estilo:</strong> Visual desejado</li>
                      <li><strong>Iluminação:</strong> Atmosfera e mood</li>
                      <li><strong>Qualidade:</strong> Termos técnicos</li>
                    </ol>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Exemplo Ruim:</p>
                    <p className="text-sm italic">"cachorro"</p>
                    <p className="font-semibold mt-3">Exemplo Bom:</p>
                    <p className="text-sm italic">
                      "Um golden retriever correndo em um campo de flores ao pôr do sol, fotografia profissional, luz dourada, foco nítido, alta resolução, cores vibrantes"
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prompt-elements">
                <AccordionTrigger>Elementos de Prompt</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Termos de Qualidade:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>ultra realistic, photorealistic</li>
                      <li>8k, high resolution, ultra detailed</li>
                      <li>professional photography</li>
                      <li>studio lighting, cinematic lighting</li>
                      <li>sharp focus, depth of field</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Estilos Artísticos:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>digital art, concept art</li>
                      <li>oil painting, watercolor</li>
                      <li>3D render, CGI</li>
                      <li>anime style, cartoon style</li>
                      <li>vintage, retro, modern</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Iluminação:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>golden hour, blue hour</li>
                      <li>dramatic lighting, soft lighting</li>
                      <li>backlit, rim lighting</li>
                      <li>neon lights, natural light</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">4. Composição:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>close-up, wide shot, aerial view</li>
                      <li>centered composition, rule of thirds</li>
                      <li>low angle, high angle</li>
                      <li>bokeh background, blurred background</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prompt-templates">
                <AccordionTrigger>Templates de Prompts</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm mb-1">Fotografia Profissional:</p>
                      <p className="text-sm italic">
                        "[assunto], professional photography, studio lighting, high resolution, sharp focus, bokeh background, 8k quality"
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm mb-1">Arte Digital:</p>
                      <p className="text-sm italic">
                        "[assunto], digital art, vibrant colors, detailed illustration, concept art, trending on artstation"
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm mb-1">Cenário Cinematográfico:</p>
                      <p className="text-sm italic">
                        "[cena], cinematic lighting, dramatic atmosphere, wide shot, epic scale, movie poster style, ultra detailed"
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm mb-1">Personagem:</p>
                      <p className="text-sm italic">
                        "[pessoa/personagem], portrait, detailed face, expressive eyes, [estilo], professional lighting, high quality"
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prompt-tips">
                <AccordionTrigger>Dicas de Prompt</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <div className="space-y-2">
                    <p className="font-semibold">✅ Faça:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Seja específico e descritivo</li>
                      <li>Use vírgulas para separar conceitos</li>
                      <li>Inclua detalhes de iluminação e qualidade</li>
                      <li>Mencione o estilo visual desejado</li>
                      <li>Experimente variações do mesmo prompt</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">❌ Evite:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Prompts muito vagos ou genéricos</li>
                      <li>Instruções conflitantes</li>
                      <li>Excesso de detalhes desnecessários</li>
                      <li>Termos negativos (use o campo negativo)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="styles" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="realistic">
                <AccordionTrigger>Estilos Realistas</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Fotografia:</p>
                    <p className="text-sm">Palavras-chave: photorealistic, professional photography, DSLR, natural lighting, sharp focus</p>
                    <p className="text-sm">Melhor para: produtos, retratos, paisagens, documentário</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Cinematográfico:</p>
                    <p className="text-sm">Palavras-chave: cinematic, movie still, dramatic lighting, widescreen, epic</p>
                    <p className="text-sm">Melhor para: cenas épicas, ação, drama</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Hiper-realista:</p>
                    <p className="text-sm">Palavras-chave: hyperrealistic, ultra detailed, 8k, octane render, raytracing</p>
                    <p className="text-sm">Melhor para: CGI, conceitos futuristas, fantasia realista</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="artistic">
                <AccordionTrigger>Estilos Artísticos</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Digital Art:</p>
                    <p className="text-sm">Palavras-chave: digital art, vibrant colors, illustration, artstation trending</p>
                    <p className="text-sm">Melhor para: personagens, conceitos, posts</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Anime/Cartoon:</p>
                    <p className="text-sm">Palavras-chave: anime style, cel shading, manga, cartoon, vibrant</p>
                    <p className="text-sm">Melhor para: personagens estilizados, conteúdo jovem</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Pintura:</p>
                    <p className="text-sm">Palavras-chave: oil painting, watercolor, impressionism, artistic brushstrokes</p>
                    <p className="text-sm">Melhor para: arte clássica, atmosfera artística</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Minimalista:</p>
                    <p className="text-sm">Palavras-chave: minimalist, clean, simple, geometric, flat design</p>
                    <p className="text-sm">Melhor para: logos, ícones, design moderno</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="thematic">
                <AccordionTrigger>Estilos Temáticos</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Cyberpunk/Futurista:</p>
                    <p className="text-sm">Palavras-chave: cyberpunk, neon lights, futuristic, sci-fi, dystopian</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Fantasia:</p>
                    <p className="text-sm">Palavras-chave: fantasy, magical, ethereal, mystical, enchanted</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Vintage/Retro:</p>
                    <p className="text-sm">Palavras-chave: vintage, retro, 80s style, nostalgic, film grain</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Horror/Dark:</p>
                    <p className="text-sm">Palavras-chave: dark atmosphere, horror, eerie, ominous, gothic</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="format-specific">
                <AccordionTrigger>Estilos por Formato</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Para Thumbnails (16:9):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Alto contraste e cores vibrantes</li>
                      <li>Elementos centralizados e grandes</li>
                      <li>Ação ou expressões impactantes</li>
                      <li>Fundo desfocado ou simples</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para Stories/Shorts (9:16):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Composição vertical</li>
                      <li>Elementos distribuídos verticalmente</li>
                      <li>Espaço para texto superior/inferior</li>
                      <li>Visual mobile-friendly</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para Posts (1:1):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Composição centralizada</li>
                      <li>Equilíbrio visual</li>
                      <li>Boa legibilidade</li>
                      <li>Cores harmoniosas</li>
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
                    <p className="font-semibold">1. Planejamento:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Defina o objetivo da imagem</li>
                      <li>Escolha o formato adequado</li>
                      <li>Determine o estilo visual</li>
                      <li>Liste elementos necessários</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Criação do Prompt:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Comece com o assunto principal</li>
                      <li>Adicione detalhes específicos</li>
                      <li>Inclua estilo e atmosfera</li>
                      <li>Termine com termos de qualidade</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Geração:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gere 3-5 variações primeiro</li>
                      <li>Escolha o modelo adequado</li>
                      <li>Ajuste quantidade conforme necessário</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">4. Refinamento:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Analise os resultados</li>
                      <li>Ajuste o prompt se necessário</li>
                      <li>Gere novas versões melhoradas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">5. Organização:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Baixe as melhores versões</li>
                      <li>Organize por projeto</li>
                      <li>Salve prompts eficazes</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="batch-generation">
                <AccordionTrigger>Geração em Lote</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Quando Usar:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Criando banco de imagens para projeto</li>
                      <li>Testando variações de um conceito</li>
                      <li>Produzindo série de posts</li>
                      <li>Gerando opções para cliente</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Estratégia:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gere 5-10 imagens por vez</li>
                      <li>Use o mesmo prompt para consistência</li>
                      <li>Ou varie ligeiramente para diversidade</li>
                      <li>Baixe todas de uma vez</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="model-selection">
                <AccordionTrigger>Escolha do Modelo</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Flux Schnell (Rápido):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use para: testes rápidos, rascunhos</li>
                      <li>Ideal para: grande volume de imagens</li>
                      <li>Qualidade: boa para maioria dos casos</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Flux Dev (Balanceado):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use para: produção padrão</li>
                      <li>Ideal para: conteúdo final de qualidade</li>
                      <li>Qualidade: muito boa, detalhada</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Flux Pro (Premium):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use para: trabalhos profissionais</li>
                      <li>Ideal para: clientes, impressão</li>
                      <li>Qualidade: máxima, ultra-detalhada</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="use-strategies">
                <AccordionTrigger>Estratégias por Tipo de Conteúdo</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Para Thumbnails:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use formato 16:9</li>
                      <li>Gere 5+ opções para testar</li>
                      <li>Priorize contraste e impacto visual</li>
                      <li>Elementos grandes e centralizados</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para Vídeos (B-Roll):</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gere várias imagens relacionadas</li>
                      <li>Mantenha consistência visual</li>
                      <li>Varie ângulos e composições</li>
                      <li>Use formato 16:9</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para Stories/Reels:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use formato 9:16</li>
                      <li>Deixe espaço para texto</li>
                      <li>Visual simples e direto</li>
                      <li>Cores vibrantes</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Para Posts/Feed:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use formato 1:1</li>
                      <li>Composição equilibrada</li>
                      <li>Cores harmoniosas com feed</li>
                      <li>Legibilidade alta</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="common-mistakes">
                <AccordionTrigger>Erros Comuns a Evitar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>❌ Prompts muito vagos ou genéricos</li>
                    <li>❌ Não especificar estilo ou qualidade</li>
                    <li>❌ Usar formato errado para o objetivo</li>
                    <li>❌ Gerar apenas uma imagem sem variações</li>
                    <li>❌ Não salvar prompts que funcionaram bem</li>
                    <li>❌ Usar modelo mais caro sem necessidade</li>
                    <li>❌ Não revisar o histórico de gerações</li>
                    <li>❌ Prompts muito longos e confusos</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced-tips">
                <AccordionTrigger>Dicas Avançadas</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">1. Consistência Visual:</p>
                    <p className="text-sm">
                      Para séries de imagens, mantenha os mesmos termos de estilo no prompt (ex: "digital art, vibrant colors") e varie apenas o assunto.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">2. Teste A/B:</p>
                    <p className="text-sm">
                      Gere variações com pequenas mudanças no prompt para descobrir o que funciona melhor.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">3. Biblioteca de Prompts:</p>
                    <p className="text-sm">
                      Crie uma biblioteca pessoal com prompts que geram bons resultados para reutilizar.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">4. Iteração Progressiva:</p>
                    <p className="text-sm">
                      Comece simples e vá adicionando detalhes gradualmente até alcançar o resultado desejado.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine">
                <AccordionTrigger>Rotina de Produção</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-semibold">Diária:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gere imagens para conteúdo do dia</li>
                      <li>Teste novos estilos e prompts</li>
                      <li>Organize downloads por projeto</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Semanal:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Crie banco de imagens para a semana</li>
                      <li>Experimente novos estilos</li>
                      <li>Revise e salve melhores prompts</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Mensal:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Analise histórico de gerações</li>
                      <li>Identifique padrões de sucesso</li>
                      <li>Atualize biblioteca de prompts</li>
                      <li>Faça backup de imagens importantes</li>
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
