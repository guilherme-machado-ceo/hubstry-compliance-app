# Roadmap — Hubstry Compliance App

Atualizado em 2026-10-19. Mudanças de prioridade seguem o circuito do
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
| 2026-10-18 | PR-4 concluído: proteção SSRF no scanner (faixas IANA, DNS validado, redirects revalidados, portas 80/443, limites de prazo e tamanho). Validada por testes com DNS e sockets simulados e no preview da Vercel (site público concluído; três endereços reservados recusados antes de conectar) | PR #17, ADR-0008 |
| 2026-10-18 | Nova landing, página Sobre (posicionamento e manifesto) e planos alinhados ao backend | PR #19, ADR-0010 |
| 2026-10-19 | Linguagem jurídica dos achados: ressalva uniforme, acentuação e severidades aprovadas | PR #24, ADR-0005 |

## Agora — app gratuito ([ADR-0012](adr/0012-app-gratuito-na-vercel-hobby.md))

Gratuito por tempo indeterminado, na Vercel Hobby; cobrança congelada (Stripe
preservado, checkout desativado). Sem Vercel Pro, sem migração. Ordem:

| # | Item | Escopo | Referência |
|---|---|---|---|
| 1 | Confiabilidade do scan | Prazo máximo explícito para a operação inteira (busca, análise e gravação); estado final confiável; nenhuma auditoria presa em `pending`; nenhum achado parcial exibido como concluído; contagem de análises só com conclusão confirmada; caber no limite de duração da Vercel Hobby | ADR-0012 |
| 2 | Modo gratuito | Interface de app gratuito, sem convite; cota mensal finita por conta; checkout desativado na interface e no servidor | ADR-0012 |
| 3 | Privacidade e conta | Termos de uso e política de privacidade (pendências de informação e revisão jurídica) e exclusão de conta pela interface | ADR-0012, LGPD art. 18 |

## Agora — segurança

| Item | Escopo | Referência |
|---|---|---|
| PR-5 | Cron fail-closed e agendamento versionado integrados no PR #18; primeira execução em produção ainda aguarda confirmação nos logs da Vercel. Escopo atual da retenção: apenas auditorias `completed` com mais de 90 dias. **Decisão pendente:** apagar também `failed`/`pending` | PR #18, ADR-0009, ADR-0011 |

## A seguir — confiabilidade do motor e higiene

| Item | Escopo | Referência |
|---|---|---|
| Motor: base | Helpers de texto visível, `ruleId`/`evidenceLevel`, registro de fontes, score, script de baseline | ADR-0004, 0005, 0006 |
| Motor: três regras | Idade (barreira etária com contexto), consentimento (controles validados), GTM isolado como inconclusivo | ADR-0005 |
| Motor: demais regras | Lootbox, privacidade, misdirection, scroll infinito, autoplay, score em erro | ADR-0004 |
| PR-1 | Regenerar `pnpm-lock.yaml` | — |
| Testes e config | Aliases, cópias aninhadas no repo (teste de logout corrigido no PR de `fix/auth-logout-teste`) | — |
| Limpeza do template | Remover analytics `analytics.manus.im` e outras sobras; arquivos `.ps1`/`.patch` soltos | decisão pendente |
| Autenticação | Remover modo demo/bypass; proteger o `state` do OAuth | ADR-0009 |
| Banco | Definir schema canônico; corrigir `insertId`; scan assíncrono confiável (`waitUntil`/persistência); isolamento do banco de preview | decisão pendente |

## Produto e direitos do usuário (identificados em 2026-10-18)

| Item | Escopo | Referência |
|---|---|---|
| Cancelamento e troca de plano | Portal do cliente do Stripe para cancelamento e troca de plano; manter canal eletrônico adequado para solicitações de cancelamento (Decreto nº 7.962/2013, art. 4º, V); hoje só pelo e-mail. **Congelado** com a cobrança (ADR-0012) | ADR-0012 |
| Exclusão de dados pelo titular | Interface para `audits.delete` e `gdpr.deleteAccount` (art. 18 da LGPD); hoje só pelo e-mail | decisão pendente |
| Login além do GitHub | Google ou e-mail com link mágico, para DPOs, advogados e gestores | decisão pendente |

## Depois — validação e expansão

| Item | Escopo | Referência |
|---|---|---|
| Base real rotulada | 30–50 sites com data, hash e rótulo humano; baseline separado das fixtures sintéticas | ADR-0007 |
| Experimento de IA | Nemotron no Bedrock via `scripts/ai-eval.ts`; Vertex depois | ADR-0007 |
| Validação funcional | Worker com navegador headless (ex.: Cloud Run) para consentimento renderizado por JS | ADR-0002, ADR-0004 |
| Radar Regulatório | Fase zero interna (resumo semanal em issue); decidir se mora no Hubstry ou no Lexiograph | decisão pendente |
| Plano Vercel | **Decidido:** permanece no Hobby, sem Pro e sem migração. Risco conhecido e aceito: os termos da Vercel reservam o Hobby a uso não comercial | ADR-0002, ADR-0012 |

## Fora de escopo por ora
Integrações SERPRO (PDC, Datavalid, Consulta CPF), fine-tuning, RAG e
infraestrutura própria de inferência.
