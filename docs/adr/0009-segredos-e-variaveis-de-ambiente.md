# ADR-0009: Gestão de segredos e variáveis de ambiente

- **Status:** Aceito
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

## Consequências
O código ainda é fail-open no cron e ainda contém o bypass: correções no
PR-5 e em PR próprio de remoção do modo demo.

## Revisão
Após o PR-5 e a remoção do bypass.
