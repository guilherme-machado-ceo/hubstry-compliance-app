# ADR-0009: Gestão de segredos e variáveis de ambiente

- **Status:** Aceito (cron fail-closed e agendamento: implementados no PR-5, em validação; remoção do bypass: pendente)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
Em 18/10/2026: `CRON_SECRET` ausente deixava `/api/cron/cleanup` aberto a
qualquer requisição; `BYPASS_AUTH` e `VERCEL_DEMO_MODE` existiam em produção
com valores desconhecidos; segredos do Stripe e do Blob estavam como
"legíveis".

## Decisão
- Valores de segredos nunca aparecem em código, logs, relatórios ou chats;
  consultas são feitas só pelo nome.
- Segredos novos são criados como *Sensitive*.
- Endpoints protegidos por segredo falham fechados quando o segredo falta.
- `CRON_SECRET` criado em Production e Preview; `BYPASS_AUTH` e
  `VERCEL_DEMO_MODE` neutralizados com `false`.
- Endpoints destrutivos não são testados em produção; validação por testes
  com banco simulado.

## Implementação no PR-5 (`api/cron/cleanup.ts`, `vercel.json`)
- **Fail-closed:** `CRON_SECRET` ausente, vazio ou só com espaços ⇒ resposta
  503 e nenhuma operação no banco.
- **Autenticação:** com segredo configurado, só executa com
  `Authorization: Bearer <CRON_SECRET>` válido; ausente ou incorreto ⇒ 401
  e nenhuma operação no banco. A comparação é em tempo constante.
- O valor do segredo não é registrado nem devolvido; respostas de erro são
  genéricas (`Cron not configured`, `Unauthorized`, `Internal error`).
- **Agendamento versionado:** `crons` em `vercel.json`, `/api/cron/cleanup`,
  `0 3 * * *` (diário, 03:00 UTC).
- Cobertura: testes do handler com as funções de banco simuladas.

### Limites da Vercel consultados (documentação, 2026-10-18)
- Plano Hobby: no máximo uma execução por dia; expressões mais frequentes
  falham no deploy. `0 3 * * *` atende.
- Precisão no Hobby: a execução pode ocorrer a qualquer momento dentro da
  hora indicada (03:00–03:59 UTC).
- Fuso sempre UTC. A Vercel faz um GET na URL do deployment de produção e
  envia `CRON_SECRET` como `Authorization: Bearer`.
- Sem retentativa em caso de falha; a entrega é *best effort* e pode haver
  execuções perdidas ou duplicadas. As operações do cron precisam tolerar
  isso (a exclusão por idade e o reset para zero são repetíveis).
- Redirecionamentos não são seguidos.

## Consequências
Com o PR-5, o cron deixa de ser fail-open **no código**. Isso só vale em
produção depois do merge, do deploy e da confirmação da execução nos logs.
O código ainda contém o bypass de autenticação (`BYPASS_AUTH` +
`VERCEL_DEMO_MODE`): remoção em PR próprio. Ao ser ativado em produção, o
cron passa a executar a política de retenção (ADR-0011).

## Revisão
Após a confirmação do cron em produção e a remoção do bypass.
