# Lívia Lopes · Beauty Artist

Site editorial em português para a maquiadora Lívia Lopes, em Passos/MG. Construído com HTML, CSS e JavaScript, fotos reais dos materiais fornecidos e fontes locais. Sem dependências de produção, framework ou serviço pago necessário para navegar no site.

## Rodar localmente

É necessário Node.js 20 ou superior. Não é preciso executar `npm install`.

```sh
npm run dev
```

Abra `http://localhost:4173`. Para usar outra porta, configure `PORT` no ambiente. A prévia local recarrega com o botão Atualizar do navegador depois de editar os arquivos.

```sh
npm run check
npm test
npm run build
```

O build apenas copia os arquivos públicos para `dist/`. A pasta contém tudo que a hospedagem precisa. Não copie `integrations/` para a pasta pública: o projeto Apps Script é instalado separadamente na conta Google da Lívia.

## A experiência

- Noivas, debutantes e maquiagem social com conteúdo próprio em abas acessíveis por teclado.
- Apresentação da Lívia e seção do curso presencial de automaquiagem.
- Portfólio com filtros, ampliação e navegação por setas.
- Menu responsivo, perguntas frequentes, endereço, mapa, Instagram e WhatsApp.
- Formulário que prepara uma mensagem para o WhatsApp enquanto a integração Google estiver desativada.
- Animações de entrada, fotografias e interação, com respeito à preferência por movimento reduzido.
- Contato, aviso de privacidade, metadados sociais e dados estruturados locais.

Solicitar um horário nunca é apresentado como confirmação de reserva. A mensagem só é enviada pelo WhatsApp quando a visitante confirma no aplicativo. Nenhuma mensagem é disparada automaticamente.

## Editar conteúdo

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Estrutura, textos, contatos, perguntas e metadados |
| `app.js` | Textos das três experiências, filtros, diálogos e formulário |
| `styles.css` | Identidade visual, responsividade e movimentos |
| `config.js` | Número público de WhatsApp e URL opcional de pré-agendamento |
| `assets/` | Fotografias, logos, imagem de compartilhamento e fontes locais |

As fotos da própria Lívia usadas na biografia e no curso foram identificadas pelo proprietário. Trabalhos de debutantes vêm do portfólio de debutantes. [A procedência dos arquivos está documentada](docs/ASSETS.md). Imagens de referência e mockups do manual de branding não foram apresentados como clientes reais.

Os preços dos PDFs não foram publicados: o de debutantes é edição 2026 e o de noivas é edição 2027. O site pede uma proposta para a data da cliente. O curso não anuncia duração, programa, quantidade de vagas ou preço que ainda não foram confirmados.

## Pré-agendamento e painel da Lívia

O complemento em `integrations/apps-script/` implementa:

1. Solicitação pública → registro `PENDING` em Planilhas privadas.
2. Painel privado da Lívia → ajuste de data, horário e duração.
3. Aprovação autenticada → verifica conflitos e cria um evento no Google Agenda.

Há validação no servidor, proteção contra fórmulas em células, controle de concorrência, idempotência e recuperação de evento em caso de falha ao atualizar a planilha.

**A integração não está ativada nem implantada na conta Google.** O site entregue funciona pelo WhatsApp. [Siga o guia de instalação e testes reais](docs/AGENDA.md) antes de preencher `bookingEndpoint` em `config.js`. O curso continua usando WhatsApp, pois as datas são combinadas pessoalmente. Credenciais, IDs privados e a URL administrativa nunca devem ir para o código público.

## Hospedagem e GitHub Actions

Não há workflows em `.github/workflows`, nem Actions necessárias para desenvolver, testar ou gerar a pasta pública. As alterações iniciais podem ser publicadas em um único commit consolidado.

Qualquer hospedagem de arquivos estáticos serve o conteúdo de `dist/`. Para testar a pasta de produção localmente, use `node scripts/serve.mjs --dist` com a outra prévia parada ou em outra porta. Em hospedagens com configuração de build, o comando é `npm run build` e o diretório de publicação é `dist`.

Para publicar sem executar um pipeline a cada alteração, faça o upload de `dist/` no provedor escolhido. Se preferir deploy conectado ao GitHub, configure apenas o fluxo de produção que deseja usar. A prévia de revisão usa hospedagem privada do Sites, vinculada em `.openai/hosting.json`; não usa o GitHub Actions. Nenhum domínio personalizado ou plano pago de hospedagem foi contratado.

Os metadados absolutos usam o endereço da prévia privada. Quando o domínio definitivo for definido, ajuste `og:image`, `og:url` e a URL canônica em `index.html`, e configure `SITE_ORIGIN` no Apps Script. Todos os caminhos de assets são relativos, então o site também funciona em uma subpasta.

[Veja o registro da verificação local e os limites dos testes](docs/VALIDACAO.md).

## Dados e manutenção

O site não instala analytics, cookies de publicidade, pixels ou armazenamento local com dados de clientes. Os formulários são enviados somente ao WhatsApp ou à URL pública do Apps Script que você configurar. Os links externos usam `noopener noreferrer`.

O painel não envia confirmações automáticas e não traz de volta para a planilha alterações feitas diretamente no Google Agenda. A documentação da agenda descreve os limites e os ensaios necessários antes de uso real.

As fontes Cormorant Garamond e Manrope são distribuídas localmente sob SIL Open Font License. Os textos de licença estão em `assets/fonts/`. Fotos e marcas continuam pertencendo aos respectivos titulares; a autorização para usar o material neste projeto veio do usuário.
