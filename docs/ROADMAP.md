# Roadmap — Hubstry Compliance App

Atualizado em 2026-10-18. Mudanças de prioridade seguem o circuito do
[ADR-0001](adr/0001-registrar-decisoes-em-adrs.md): Claude propõe, Luna
revisa, Guilherme decide. Cada item vira um PR pequeno e independente.

Os números `#12`–`#17` são pull requests reais já integradas. Rótulos como
`PR-4` e `PR-5` são **identificadores internos de planejamento**; o número
efetivo no GitHub só existe quando a pull request é aberta.

## Entregue

| Data | Entrega | Referência |
|---|---|---|
| 2026-10-18 | Incidente `FUNCTION_INVOCATION_FAILED` corrigido (imports ESM, `api/_server`) | PR #12, ADR-0003 |
| 2026-10-18 | Erro React #310 no Dashboard corrigido | PR #12 |
| 2026-10-18 | Login GitHub, dashboard e scan validados em produção | — |
| 2026-10-18 | Suíte de regressão de falsos positivos do scanner | PR #13 |
| 2026-10-18 | `CLAUDE.md` com circuito, regras e decisões | PR #14 |
| 2026-10-18 | Marca Hubstry, favicon e selo NVIDIA Inception | PR #15, ADR-0010 |
| 2026-10-18 | Mitigações por configuração: `CRON_SECRET` criado; bypass neutralizado | ADR-0009 |
| 2026-10-18 | PR-4 concluído: proteção SSRF no scanner (faixas IANA, DNS validado, redirects revalidados, portas 80/443, limites de prazo e tamanho). Validada por testes com DNS e sockets simulados; comportamento em runtime real depende de validação em preview | PR #17, ADR-0008 |

## Agora — segurança

| Item | Escopo | Referência |
|---|---|---|
| PR-5 | Cron fail-closed + agendamento versionado: **implementado no código e coberto por testes com banco simulado; em validação** (branch `fix/cron-fail-closed`). Só passa a "implementado" depois de validado em preview e confirmado em produção. A retenção automática de 90 dias prometida no README **só é operacional depois** que o deploy com o cron ativo rodar e a execução for confirmada nos logs da Vercel. Escopo atual: apenas auditorias `completed` com mais de 90 dias. **Decisão pendente:** apagar também `failed`/`pending` | ADR-0009, ADR-0011 |

## A seguir — confiabilidade do motor e higiene

| Item | Escopo | Referência |
|---|---|---|
| Motor: base | Helpers de texto visível, `ruleId`/`evidenceLevel`, registro de fontes, score, script de baseline | ADR-0004, 0005, 0006 |
| Motor: três regras | Idade (barreira etária com contexto), consentimento (controles validados), GTM isolado como inconclusivo | ADR-0005 |
| Motor: demais regras | Lootbox, privacidade, misdirection, scroll infinito, autoplay, score em erro | ADR-0004 |
| PR-1 | Regenerar `pnpm-lock.yaml` | — |
| Testes e config | Aliases, cópias aninhadas no repo, teste de logout | — |
| Limpeza do template | Remover analytics `analytics.manus.im` e outras sobras; arquivos `.ps1`/`.patch` soltos | decisão pendente |
| Autenticação | Remover modo demo/bypass; proteger o `state` do OAuth | ADR-0009 |
| Banco | Definir schema canônico; corrigir `insertId`; scan assíncrono confiável (`waitUntil`/persistência); isolamento do banco de preview | decisão pendente |

## Depois — validação e expansão

| Item | Escopo | Referência |
|---|---|---|
| Base real rotulada | 30–50 sites com data, hash e rótulo humano; baseline separado das fixtures sintéticas | ADR-0007 |
| Experimento de IA | Nemotron no Bedrock via `scripts/ai-eval.ts`; Vertex depois | ADR-0007 |
| Validação funcional | Worker com navegador headless (ex.: Cloud Run) para consentimento renderizado por JS | ADR-0002, ADR-0004 |
| Radar Regulatório | Fase zero interna (resumo semanal em issue); decidir se mora no Hubstry ou no Lexiograph | decisão pendente |
| Plano Vercel | Migrar para plano que permita uso comercial **antes do lançamento ou de qualquer uso comercial** | ADR-0002 |

## Fora de escopo por ora
Integrações SERPRO (PDC, Datavalid, Consulta CPF), fine-tuning, RAG e
infraestrutura própria de inferência.
