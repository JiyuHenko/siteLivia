# Pré-agendamentos com Google Planilhas e Google Agenda

O site é estático. Este complemento opcional recebe preferências, grava uma solicitação `PENDING` em uma planilha privada e oferece um painel da Lívia. Apenas uma aprovação autenticada cria o compromisso no Google Agenda. Receber uma solicitação **não reserva um horário**.

**Situação da entrega:** código pronto para configurar e testar na conta Google da Lívia. Nenhuma planilha, agenda, implantação ou autorização Google foi criada nesta entrega. Até configurar a URL pública no site, o contato continua pelo WhatsApp. Não há credenciais ou identificadores de conta neste repositório.

## Arquivos

- `integrations/apps-script/Core.gs`: validação, estados, autorização, idempotência e aprovação.
- `integrations/apps-script/Code.gs`: endpoints e adaptadores Sheets/Calendar.
- `integrations/apps-script/Admin.html`: painel privado servido pelo Apps Script.
- `integrations/apps-script/appsscript.json`: fuso e escopos de autorização.
- `integrations/apps-script/tests/booking.test.cjs`: testes locais sem dependências.
- `integrations/apps-script/tests/frontend.test.cjs`: transporte real do site com navegador simulado, sem enviar dados ao Google.

## Configuração na conta da Lívia

1. Crie uma planilha Google **privada**, sem compartilhamento por link, para as solicitações. Copie o ID da URL.
2. Crie uma agenda separada para os atendimentos, também privada. Em **Configurações → Integrar agenda**, copie o ID. Defina o fuso da agenda como **America/Sao_Paulo**. Se usar a agenda principal, todas as ocupações dela bloquearão aprovações nesse intervalo.
3. Na conta proprietária desses recursos, abra [Google Apps Script](https://script.google.com/) e crie um projeto independente. Adicione os arquivos `Core.gs`, `Code.gs` e um arquivo HTML chamado **Admin** com o conteúdo de `Admin.html`.
4. Nas configurações do projeto, habilite a exibição do manifesto e substitua `appsscript.json` pelo arquivo entregue. Confirme o fuso **America/Sao_Paulo**.
5. Em **Configurações do projeto → Propriedades do script**, adicione os valores abaixo. São configurações do servidor; não copie para o JavaScript público.

| Propriedade | Valor |
| --- | --- |
| `SPREADSHEET_ID` | ID da planilha privada |
| `CALENDAR_ID` | ID exato da agenda usada pela Lívia |
| `ADMIN_EMAIL` | E-mail completo da conta Google da Lívia, sem espaços |
| `SITE_ORIGIN` | Origem exata do site, por exemplo `https://www.seudominio.com.br`, sem barra final ou caminho |
| `DAILY_REQUEST_LIMIT` | Opcional; padrão `100`; inteiro entre `1` e `1000` |

Para o domínio principal do site, defina `SITE_ORIGIN` como **`https://livialopesmakeup.com.br`**, sem `www`, sem caminho e sem barra final. O retorno usa a origem exata via `postMessage`.

6. No editor, selecione e execute **`prepararPlanilha_`** uma vez com a conta autorizada. Conceda os acessos solicitados. A função cria a aba `Solicitacoes`, os cabeçalhos e o fuso da planilha. Ela não sobrescreve dados existentes; rejeita cabeçalhos incompatíveis.
7. Use duas implantações distintas de aplicativo da Web, do **mesmo projeto**, conforme abaixo. Sem usar GitHub Actions, sem backend próprio e sem serviço de envio de mensagens.

### Implantação pública: receber solicitações

Em **Implantar → Nova implantação → Aplicativo da Web**:

- Executar como: **eu / proprietária do projeto**.
- Quem pode acessar: **qualquer pessoa**, para atender visitantes sem conta Google.
- Copie a URL de produção terminada em `/exec`. Esta é a única URL de integração que vai na configuração pública do site. Nunca use a URL `/dev`.
- Use a configuração `bookingEndpoint` de `config.js` para informar essa URL. O campo vazio mantém o fluxo de consulta pelo WhatsApp.

### Implantação privada: painel da Lívia

Crie **outra nova implantação** do mesmo projeto. Não transforme a implantação pública em privada, nem reutilize a mesma URL para o painel.

- Executar como: **eu / proprietária do projeto**.
- Quem pode acessar: **somente eu**.
- Abra a URL privada adicionando `?view=admin`. Salve esse endereço nos favoritos da Lívia; não coloque no menu público.
- Abra com a conta configurada em `ADMIN_EMAIL`. Cada função administrativa exige que `Session.getActiveUser().getEmail()` corresponda exatamente a ela.
- Se o Google não informar a identidade ativa, o painel nega acesso. Não use `getEffectiveUser()` como alternativa: uma implantação pública executada como proprietária pode retornar a identidade da proprietária mesmo para operações de visitantes.

As duas implantações compartilham as mesmas propriedades, planilha e código do projeto. Ao publicar correções, atualize **as duas** para a versão revisada em **Gerenciar implantações**. Confira as configurações de acesso novamente. Organizações Google Workspace podem restringir apps públicos; nesse caso, mantenha o WhatsApp até a administradora do domínio permitir a implantação.

## Fluxo de atendimento

1. A cliente escolhe experiência, data e horário desejados, informa nome/WhatsApp, autoriza contato e envia.
2. O servidor valida os dados e registra `PENDING`. O site só mostra recebimento depois de uma resposta positiva do servidor com uma referência `LL-…`.
3. Lívia acessa o painel privado e conversa com a cliente. Pode ajustar a data, o horário e a duração antes de aprovar. A duração deve incluir preparação, atendimento e intervalo, em blocos de 15 minutos, entre 30 e 720 minutos.
4. A aprovação verifica sobreposição com **todos os eventos da agenda configurada**. Se houver conflito, a solicitação continua pendente e o painel informa o problema. Se estiver livre, cria o evento e grava `APPROVED` com o ID do compromisso.
5. **Encerrar solicitação** grava `DECLINED` e não cria evento. Nenhuma confirmação, recusa, e-mail, SMS ou mensagem de WhatsApp é enviada automaticamente. O link WhatsApp apenas abre uma conversa para a Lívia conduzir.

Solicitações pendentes não bloqueiam o calendário. Dois pedidos para a mesma hora podem coexistir; somente o primeiro aprovado ocupa o intervalo. Eventos aprovados são alterados/cancelados diretamente no Google Agenda e comunicados à cliente. O painel não sincroniza essas alterações de volta para a planilha nesta versão.

## Contrato do formulário público

Envie um formulário `POST`, `application/x-www-form-urlencoded`, com destino à URL pública `/exec`, apontando `target` para um iframe oculto com `name`. Não use `fetch(..., {mode: 'no-cors'})`: uma resposta opaca não comprova que o pedido foi gravado.

| Campo | Regra |
| --- | --- |
| `action` | Literal `request` |
| `requestId` | UUID gerado no navegador com `crypto.randomUUID()`, mantido numa repetição do mesmo envio |
| `name` | 2 a 100 caracteres, sem quebras de linha |
| `phone` | WhatsApp brasileiro com DDD; aceita formatação e prefixo `55` |
| `service` | `noivas`, `debutantes`, `social` ou `curso` |
| `date` | `YYYY-MM-DD`, data local de Brasília |
| `time` | `HH:mm`, horário local de Brasília |
| `notes` | Opcional; até 1.000 caracteres |
| `consent` | `true` ou `on`, somente após consentimento explícito |
| `website` | Honeypot; deve estar vazio e fora da navegação por teclado |

O servidor exige pelo menos uma hora de antecedência e no máximo dois anos de intervalo. Horário solicitado é preferência; não há grade de disponibilidade pública nem garantia de funcionamento do ateliê em determinado horário.

No site entregue, **curso presencial** sempre prepara uma conversa no WhatsApp; data e horário são opcionais nesse fluxo. Os demais serviços podem usar o endpoint online configurado. Embora o contrato do servidor já aceite `service=curso` com data e horário, o formulário atual não envia consultas de curso a ele.

A resposta é um `HtmlOutput` com `postMessage` para **`SITE_ORIGIN` exata**, contendo:

```js
{
  source: 'livia-booking',
  requestId: 'o-mesmo-uuid-enviado',
  ok: true,
  reference: 'LL-REFERENCIA',
  error: ''
}
```

Em falha, `ok` é `false`, `reference` é vazio e `error` contém uma mensagem segura para a cliente. Nenhum nome, telefone ou nota é retornado no endpoint público. Não há endpoint público de listagem ou consulta de clientes.

O HTML Service usa um iframe próprio dentro da navegação. Por isso, o retorno tenta `window.parent.postMessage` e, quando há essa camada, `window.top.postMessage`, sempre com a origem exata do site. No site, aceite a mensagem apenas se:

```js
const origin = new URL(event.origin);
const googleOrigin = origin.protocol === 'https:' && (
  origin.hostname === 'script.google.com' ||
  origin.hostname === 'script.googleusercontent.com' ||
  origin.hostname.endsWith('.googleusercontent.com')
);
const valid = googleOrigin && event.data?.source === 'livia-booking' &&
  event.data.requestId === pendingRequestId;
```

Confira `ok === true` e uma referência no formato `LL-` seguido de 12 caracteres hexadecimais maiúsculos antes de exibir sucesso. Um evento `load` do iframe não comprova gravação. O frontend usa timeout de 25 segundos com estado de **recebimento não confirmado**, oferece WhatsApp e permite repetir os mesmos dados com o mesmo `requestId` enquanto a página permanece aberta. Após sucesso ou mudança nos dados, gera outro UUID. Os campos ficam bloqueados durante o envio para preservar o conteúdo correlacionado à resposta. O sandbox do Google pode impedir que `event.source` seja igual ao iframe externo; a correlação usa origem Google e UUID imprevisível.

Para testar no servidor local, `SITE_ORIGIN` aceita `http://localhost:PORTA` exata. Troque para a origem HTTPS definitiva antes da publicação. Um domínio de preview e o domínio final são origens diferentes; este projeto aceita uma origem por configuração.

## Garantias e limites

- Validação ocorre novamente no servidor. Campos duplicados, payloads grandes, UUID inválido, datas inexistentes, consentimento ausente e honeypot preenchido são rejeitados.
- `LockService.getScriptLock()` serializa escritas e aprovações deste projeto. Reenvios com mesmo UUID e mesmos dados devolvem a mesma referência. Reusar o UUID com outros dados é rejeitado. Fórmulas em campos da planilha são neutralizadas.
- Antes de criar o evento, a aprovação grava um checkpoint do intervalo confirmado. O evento recebe um marcador com o UUID. Se a gravação final no Sheets falhar, uma nova aprovação procura esse marcador e recupera o evento existente. Uma tentativa de encerramento também verifica esse caso.
- O lock não bloqueia alterações feitas diretamente por outras pessoas no Google Agenda. A checagem de conflito e a criação do evento não são uma transação com o Google Calendar. Evite edições simultâneas no mesmo horário enquanto aprova.
- A recuperação procura o marcador no intervalo salvo. Não mova/apague o evento ou remova seu marcador antes de recuperar uma aprovação interrompida. Se isso acontecer, revise a agenda manualmente antes de tentar novamente.
- `SITE_ORIGIN` restringe o destino do retorno; não autentica um formulário anônimo nem impede alguém de chamar a URL pública diretamente. Honeypot e limite diário global são mitigação simples, não proteção completa contra spam. O Apps Script não fornece um mecanismo robusto de limitação por IP neste fluxo. Se houver abuso, desative o endpoint e use WhatsApp, ou adicione validação de desafio no servidor.
- Apps Script, Sheets e Calendar têm cotas e disponibilidade próprias. Este fluxo evita GitHub Actions, mas não promete capacidade ilimitada. O limite diário é de pedidos gravados; não evita que tentativas rejeitadas consumam execuções Google.
- A planilha e a agenda contêm dados pessoais de contato. Restrinja acesso à Lívia, evite registrar dados sensíveis em notas, defina uma rotina de exclusão de solicitações antigas e mantenha o aviso de privacidade do site condizente com o uso real. A retenção é manual nesta versão.

## Verificação antes de ativar

Execute localmente:

```sh
npm test
```

Os testes usam mocks de Sheets/Calendar e do DOM. Cobrem validação, identidade administrativa ausente/errada, idempotência, conflito de agenda, limites do intervalo, retomada após falha de gravação, encerramento, neutralização de fórmulas e serialização HTML. O transporte do frontend é exercitado com mensagens de origem/UUID errados, referência vazia, rejeição do servidor, timeout, configuração inválida e bloqueio de envio pelo navegador. Não substituem os testes reais na conta Google.

Depois da implantação, faça estes ensaios com **dados de teste**:

1. Em janela anônima, abra a URL privada: deve exigir login e negar visitante. A URL pública com `?view=admin` também deve negar visitante, sem listar dados.
2. Pelo site local ou domínio permitido, envie um pedido: confira resposta com referência e uma linha `PENDING` na planilha, sem evento na agenda.
3. Repita o mesmo envio/UUID: deve continuar existindo uma única linha. Envie dados inválidos e confira rejeição sem gravação.
4. No painel da conta autorizada, aprove com um horário livre: confira um único evento e estado `APPROVED`. Repetir aprovação não deve criar outro.
5. Tente aprovar outro pedido sobreposto ao primeiro: deve informar conflito e manter `PENDING`.
6. Encerre outro pedido: deve virar `DECLINED`, sem evento.
7. Teste em celular e na hospedagem definitiva, conferindo o retorno entre iframes do Google. Se a resposta não chegar, o site deve informar recebimento não confirmado, sem exibir falso sucesso.

## Referências oficiais

- [Apps Script: aplicativos da Web e identidade de execução](https://developers.google.com/apps-script/guides/web)
- [Session: disponibilidade de getActiveUser](https://developers.google.com/apps-script/reference/base/session)
- [HTML Service: sandbox de iframe](https://developers.google.com/apps-script/guides/html/restrictions)
- [Calendar: criação e consulta de eventos](https://developers.google.com/apps-script/reference/calendar/calendar)
- [LockService: exclusão mútua no projeto](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Cotas e limitações de Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
