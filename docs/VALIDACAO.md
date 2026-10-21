# Verificação da primeira versão

Verificação local em 21 de outubro de 2026. O site funciona como arquivos estáticos; nenhuma execução do GitHub Actions foi necessária.

## Código e agendamento

`npm run check` valida a sintaxe dos módulos, referências a arquivos, âncoras, fotografias das experiências e IDs HTML únicos.

`npm test` executa 14 testes locais com Node.js. Cobrem validação de telefone/data/serviço/consentimento, repetição de envio sem duplicar, autorização administrativa, conflitos no calendário, recuperação de evento após falha na planilha e neutralização de fórmulas. O transporte do navegador é testado contra respostas de origem ou UUID incorretos, confirmação inválida, rejeição, timeout e configuração inválida.

## Navegadores e layout

Ensaios com Playwright e Chrome headless, além de inspeção visual no navegador do Codex:

| Cenário | Resultado |
| --- | --- |
| Desktop 1440 px | Sem rolagem horizontal, fotografias e navegação corretas |
| Tablet 768 px | Layout responsivo, imagens e formulário corretos |
| Celular 390 px | Menu, seções, curso, galeria e contato corretos |
| Celular pequeno 320 px | Sem rolagem horizontal ou corte de conteúdo |
| Teclado | Abas com setas/Home/End; lightbox com setas/Escape; retorno de foco dos diálogos/menu |
| Movimento reduzido | Conteúdo visível e animações desativadas |
| Galeria | Filtros mostram a categoria correta; ampliação navega apenas nas fotos visíveis |
| Curso | Data/horário opcionais; mensagem direcionada ao WhatsApp |
| Telefone | Máscara aceita; letras e números curtos rejeitados |
| Solicitação WhatsApp | Mensagem codificada corretamente; UI informa que ainda precisa enviar no aplicativo |

Foram corrigidos durante a revisão um `pattern` HTML incompatível com o modo Unicode Sets do Chrome, o fechamento da opção de noivas no formulário e o retorno do foco no menu móvel. A rodada final não registrou erros de console/runtime, assets ausentes ou rolagem horizontal.

## Ensaio do modo Google

O ensaio adicional com Playwright interceptou a configuração e os dois POSTs, sem alterar `config.js` e sem acessar o Google de verdade. A primeira resposta simulada foi rejeitada: o formulário mostrou erro e alternativa pelo WhatsApp. O segundo envio manteve o mesmo UUID e recebeu uma confirmação válida. Os campos ficaram bloqueados durante o envio, foram limpos no sucesso e a mensagem esclareceu que a reserva dependia de confirmação. Uma mensagem forjada da origem local foi ignorada.

Todos os testes de WhatsApp interceptaram a abertura de janelas/rede. Nenhuma mensagem ou solicitação real foi enviada, nenhum evento real foi criado e nenhum dado de cliente foi usado nos ensaios.

## Limites da verificação

Os serviços Google foram exercitados com mocks. O OAuth, as permissões das duas implantações, a identidade da administradora, o retorno entre iframes e a gravação em uma planilha/agenda real precisam ser validados na conta da Lívia conforme [AGENDA.md](AGENDA.md). O campo `bookingEndpoint` permanece vazio até esse ensaio. O site usa WhatsApp normalmente.

Safari e Firefox não foram executados nesta entrega. Os recursos usados são APIs web nativas; a confirmação visual foi feita no Chrome e no navegador do Codex.


## Revisão e ampliação para GitHub Pages

Na revisão de 21 de outubro de 2026, o site passou a ter seis documentos completos: início, noivas, debutantes, maquiagem social, automaquiagem e galeria. A galeria reúne 24 fotografias reais e filtros por experiência e bastidores. A configuração da antiga prévia privada foi removida; metadados, links e sitemap usam o GitHub Pages.

As alterações de interface incluem a troca do selo sobre a foto por um link legível, novos botões e ícones SVG de contato, mapa Google integrado, movimento de parallax na foto do casamento e introdução de FAQ com posição sticky no desktop. Não há background-attachment: fixed; o parallax move uma camada de imagem dentro de uma área recortada e é desativado com movimento reduzido.

A matriz Chrome cobriu as seis páginas em 1440, 768, 390 e 320 pixels. Foram conferidos links entre páginas, âncoras, fotografias, filtros, lightbox, teclado, menu, formulários, ausência de rolagem horizontal e erros de execução. Duas falhas do primeiro ensaio vieram de pressupostos do teste (hit-test após autoscroll de um iframe e cálculo do padding no limite sticky); foram corrigidas no roteiro e as oito verificações específicas passaram, sem alteração de código do site. O mapa real retornou HTTP 200 e foi conferido visualmente.

A verificação adicional usou a biblioteca Playwright 1.58.0 já instalada, compatível com o WebKit 2248 disponível no computador. Foram 31 verificações aprovadas nas seis páginas, em 390 e 1440 pixels: nenhum erro de console/runtime, rolagem horizontal ou símbolo SVG ausente; galeria, lightbox e parallax funcionaram. Nenhum navegador ou pacote precisou ser baixado para esse ensaio.

WebKit no Windows aproxima o comportamento do Safari, mas não substitui a verificação em um iPhone físico. O envio de WhatsApp foi interceptado nos testes: nenhuma mensagem foi enviada. As 14 verificações locais do agendamento continuam passando e a integração Google permanece desativada até configuração na conta da Lívia.
