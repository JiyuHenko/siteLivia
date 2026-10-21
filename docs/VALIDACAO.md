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
