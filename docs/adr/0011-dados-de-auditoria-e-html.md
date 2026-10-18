# ADR-0011: Tratamento do HTML analisado e retenção

- **Status:** Aceito (retenção de `completed`: implementada no PR-5, em validação; `failed`/`pending`: Proposto)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O README promete que o HTML é descartado após a análise. A coluna
`htmlContent` existe nos dois schemas, mas o código não grava nela.

## Decisão
- O HTML é analisado em memória e descartado.
- A coluna `htmlContent` não deve ser usada; remoção física só em migração
  coordenada futura.

## Retenção: escopo atual
Implementado no PR-5 (`deleteOldAudits(90)`, chamado por
`/api/cron/cleanup`, agendado em `vercel.json` às 03:00 UTC):
- **Apaga somente** auditorias com `status = completed` e `createdAt` há
  mais de 90 dias, com suas `violations` e `reports`.
- **Não apaga** auditorias `failed` ou `pending`, nem usuários ou
  assinaturas. Elas permanecem indefinidamente.
- O reset mensal dos contadores de scan roda no dia 1 (UTC).

## Ponto em aberto (Proposto)
Decidir se auditorias `failed`/`pending` também são apagadas (e após quantos
dias). **Sem essa decisão, o escopo acima é o único em vigor** e não deve ser
ampliado por código. Requer decisão da Luna e do Guilherme.

**Alerta operacional:** o README promete retenção automática. O código e o
agendamento existem na branch do PR-5, mas a exclusão só pode ser
considerada operacional depois do merge, do deploy de produção com o cron
ativo e da confirmação da execução nos logs. Ao ser ativado, o cron pode
apagar auditorias concluídas com mais de 90 dias. Até essa confirmação, a
promessa não deve ser tratada como rotina comprovadamente ativa.

## Revisão
Na migração de schema e na decisão sobre `failed`/`pending`.
