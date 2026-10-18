# ADR-0011: Tratamento do HTML analisado e retenção

- **Status:** Aceito (retenção: Proposto)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O README promete que o HTML é descartado após a análise. A coluna
`htmlContent` existe nos dois schemas, mas o código não grava nela.

## Decisão
- O HTML é analisado em memória e descartado.
- A coluna `htmlContent` não deve ser usada; remoção física só em migração
  coordenada futura.

## Ponto em aberto (Proposto)
Retenção de 90 dias: agendar o cron em `vercel.json` e decidir se
auditorias `failed`/`pending` também são apagadas (PR-5).

**Alerta operacional:** em 18/10/2026 não há agendamento do cron em
`vercel.json`. O README promete retenção automática, mas a exclusão após
90 dias só pode ser considerada operacional depois que o agendamento for
implementado e validado. Até lá, a promessa não deve ser tratada como
rotina comprovadamente ativa.

## Revisão
Na migração de schema e no PR-5.
