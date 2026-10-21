# Lívia Lopes · Beauty Artist

Site editorial em português para a maquiadora Lívia Lopes, em Passos/MG. Construído com HTML, CSS e JavaScript, fotos reais dos materiais fornecidos e fontes locais. Sem dependências de produção ou framework. Publicado no [GitHub Pages](https://jiyuhenko.github.io/siteLivia/).

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

- Home com experiências acessíveis por teclado e links para páginas completas de noivas, debutantes e maquiagem social.
- Apresentação da Lívia e seção do curso presencial de automaquiagem.
- Página própria do curso presencial de automaquiagem e navegação entre experiências.
- [Galeria](https://jiyuhenko.github.io/siteLivia/galeria.html) com 24 fotos reais, filtros por categoria, ampliação e navegação por setas.
- Menu responsivo, perguntas frequentes, endereço e mapa Google integrado com link para traçar a rota.
- Ícones vetoriais para WhatsApp, Instagram, localização e contato; sem glifos decorativos ou emojis dependentes da plataforma.
- Formulário que prepara uma mensagem para o WhatsApp enquanto a integração Google estiver desativada.
- Animações de entrada, transições de fotografias e parallax da foto de casamento. A introdução das dúvidas acompanha o scroll no desktop; no celular mantém a leitura normal. Todos os movimentos respeitam a preferência por movimento reduzido.
- Contato, aviso de privacidade, metadados sociais e dados estruturados locais.

Solicitar um horário nunca é apresentado como confirmação de reserva. A mensagem só é enviada pelo WhatsApp quando a visitante confirma no aplicativo. Nenhuma mensagem é disparada automaticamente.

## Editar conteúdo

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Estrutura, textos, contatos, perguntas e metadados |
| `pages/*.html` | Fragmentos editáveis das quatro experiências e da galeria |
| `app.js` | Textos das três experiências, filtros, diálogos e formulário |
| `styles.css`, `refinements.css` | Identidade visual, refinamentos, mapa, contato e movimentos |
| `services.css`, `gallery-page.css` | Estilos das páginas de serviços e da galeria |
| `config.js` | URL pública, WhatsApp e URL opcional de pré-agendamento |
| `assets/` | Fotografias, logos, imagem de compartilhamento e fontes locais |

Edite as páginas internas em `pages/`, depois execute `npm run pages` para atualizar os HTMLs completos na raiz. O gerador reutiliza cabeçalho, rodapé, ícones e formulários de `index.html`. Os documentos gerados são versionados: o visitante e o GitHub Pages não precisam executar Node. O endereço público fica em `config.js`; o gerador também atualiza metadados e `sitemap.xml`.

As fotos da própria Lívia usadas na biografia e no curso foram identificadas pelo proprietário. Trabalhos de debutantes vêm do portfólio de debutantes. A procedência está documentada em [ASSETS.md](docs/ASSETS.md) e [GALERIA-ASSETS.md](docs/GALERIA-ASSETS.md); fotos adicionais de serviços também estão identificadas nos comentários dos fragmentos. Imagens de referência e mockups do manual de branding não foram apresentados como clientes reais.

Os preços dos PDFs não foram publicados: o de debutantes é edição 2026 e o de noivas é edição 2027. O site pede uma proposta para a data da cliente. O curso não anuncia duração, programa, quantidade de vagas ou preço que ainda não foram confirmados.

## Pré-agendamento e painel da Lívia

O complemento em `integrations/apps-script/` implementa:

1. Solicitação pública → registro `PENDING` em Planilhas privadas.
2. Painel privado da Lívia → ajuste de data, horário e duração.
3. Aprovação autenticada → verifica conflitos e cria um evento no Google Agenda.

Há validação no servidor, proteção contra fórmulas em células, controle de concorrência, idempotência e recuperação de evento em caso de falha ao atualizar a planilha.

**A integração não está ativada nem implantada na conta Google.** O site entregue funciona pelo WhatsApp. [Siga o guia de instalação e testes reais](docs/AGENDA.md) antes de preencher `bookingEndpoint` em `config.js`. O curso continua usando WhatsApp, pois as datas são combinadas pessoalmente. Credenciais, IDs privados e a URL administrativa nunca devem ir para o código público.

## Hospedagem e GitHub Actions

Não há workflows próprios em `.github/workflows`, nem Actions necessárias para desenvolver, testar ou gerar a pasta pública. O GitHub Pages já foi configurado pelo proprietário. Os arquivos completos na raiz permitem publicar pelo branch `main`, pasta `/ (root)`, com `.nojekyll`. O GitHub pode executar seu fluxo padrão de publicação do Pages a cada push; não foram adicionados pipelines extras.

Qualquer hospedagem de arquivos estáticos serve o conteúdo de `dist/`. Para testar a pasta de produção localmente, use `node scripts/serve.mjs --dist` com a outra prévia parada ou em outra porta. Em hospedagens com configuração de build, o comando é `npm run build` e o diretório de publicação é `dist`.

Concentre as alterações, execute a geração e as verificações localmente e faça um único push quando estiverem prontas. A configuração da antiga prévia privada foi removida a pedido do proprietário; este repositório usa GitHub Pages. Nenhum domínio ou serviço pago foi contratado.

Os metadados usam `https://jiyuhenko.github.io/siteLivia/`. Ao mudar de endereço, atualize `url` em `config.js`, execute `npm run pages` e ajuste a linha `Sitemap` de `robots.txt`. No Apps Script, `SITE_ORIGIN` é somente a origem: para esse endereço, use `https://jiyuhenko.github.io`, sem `/siteLivia`. Os caminhos de arquivos são relativos para preservar o funcionamento na subpasta do GitHub Pages.

[Veja o registro da verificação local e os limites dos testes](docs/VALIDACAO.md).

## Dados e manutenção

O site não instala analytics, pixels ou armazenamento local com dados de clientes. O mapa integrado carrega conteúdo do Google e está sujeito às políticas desse serviço. Os formulários são enviados somente ao WhatsApp ou à URL pública do Apps Script que você configurar. Os links externos usam `noopener noreferrer`.

O painel não envia confirmações automáticas e não traz de volta para a planilha alterações feitas diretamente no Google Agenda. A documentação da agenda descreve os limites e os ensaios necessários antes de uso real.

As fontes Cormorant Garamond e Manrope são distribuídas localmente sob SIL Open Font License. Os textos de licença estão em `assets/fonts/`. Fotos e marcas continuam pertencendo aos respectivos titulares; a autorização para usar o material neste projeto veio do usuário.
