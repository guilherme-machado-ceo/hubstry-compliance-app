# CLAUDE.md — Hubstry Compliance App

Scanner de conformidade (LGPD / ECA Digital) para sites. Frontend React + Vite,
backend em funções serverless na Vercel (`api/`), tRPC, Drizzle, Stripe,
login via GitHub OAuth. Fundador solo; responda em português.

## Circuito de trabalho

- **Luna (ChatGPT):** define critérios e fundamentação normativa; aprova ou
  reprova planos e diffs.
- **Claude Code (você):** investiga, propõe plano, implementa em branch
  própria com testes, entrega diff e evidências.
- **Guilherme:** revisa e faz o merge. Ele decide; a Luna aconselha.

Nada vai para a `main` sem diff revisado e testes executados.

## Regras invioláveis

- Nunca faça push na `main`, merge, nem altere DNS, domínio, variáveis de
  ambiente ou banco de produção. Uma branch por PR, PRs pequenos e
  independentes.
- Testes automatizados usam DNS, sockets, fetch e banco **simulados**. Nenhum
  teste abre conexão real a destino interno ou externo, nem toca dados reais.
- Nenhuma dependência nova sem necessidade comprovada e justificada no PR.
- Nenhuma migração de banco sem aprovação explícita (há dois schemas, ver
  "Armadilhas").
- Não exponha valores de secrets em código, logs ou relatórios.
- Diferencie sempre o que foi **verificado** (rodou comando, leu arquivo) do
  que é **hipótese**. Não declare sucesso sem evidência.
- A falha de `api/_server/auth.logout.test.ts` é preexistente e tratada à
  parte; não a misture com outras mudanças.

## Motor de scan (`api/_server/scanner.ts`) — princípios

- Arquitetura **determinística**: análise estática do HTML, sem navegador
  headless e sem IA no caminho crítico, no build ou em produção.
- Cada achado deve ter `ruleId`, `evidenceLevel`
  (`confirmada` | `indicio` | `inconclusiva`) e fundamentação classificada
  como obrigação legal, recomendação regulatória ou heurística técnica.
- Indícios e inconclusivos aparecem no relatório, mas **não reduzem o score**.
- Nenhum achado heurístico pode afirmar violação legal ("violando LGPD",
  "exigido pelo ECA Digital"), nem recomendar Datavalid ou biometria.
- Texto analisado = texto **visível** (sem `script`, `style`, `noscript`,
  `template`), com correspondência por **palavra inteira**, nunca substring.
- Menção a algo não é mecanismo: citar "data de nascimento" não é aferição de
  idade; script de CMP não prova banner funcional; GTM isolado não prova
  rastreamento.
- Toda regra tem fixtures positivas e negativas em
  `api/_server/__fixtures__/scanner/` (com `manifest.json`).
- 0 falsos positivos em fixtures sintéticas **não** prova precisão real.

## Fontes normativas (status verificado em 18/10/2026)

| Fonte | Status |
|---|---|
| Lei 15.211/2025 (ECA Digital) | vigente |
| Decreto 12.880/2026 | vigente |
| ANPD — Guia Orientativo Cookies e Proteção de Dados (2022) | orientativo, não vinculante |
| ANPD — Guia de escopo e obrigações gerais do ECA Digital | minuta (circuito deliberativo 13–16/10/2026) |
| ANPD — Guia de aferição de idade | minuta |

Nunca apresente minuta como norma definitiva. O legítimo interesse pode
fundamentar medição de audiência em certos contextos (Guia de Cookies): o
scanner não decide base legal. Atualize esta tabela quando o status mudar.

## Armadilhas conhecidas

- `package.json` tem `"type": "module"` e a Vercel compila cada `.ts`
  separadamente, sem bundler: **todo import relativo precisa de extensão
  `.js`** (`from "./sdk.js"`). Sem isso, a função quebra na inicialização
  com `ERR_MODULE_NOT_FOUND` (incidente de 18/10/2026).
- Arquivos em `api/` viram funções públicas. Código auxiliar fica em pastas
  com prefixo `_` (`api/_server`, `api/_shared`).
- Hooks React sempre antes de qualquer `return` condicional (erro #310 no
  Dashboard).
- Dois schemas Drizzle: `drizzle/schema.ts` (MySQL) e `schema.sqlite.ts`.
  Produção provavelmente usa Turso/libsql (`DATABASE_PROVIDER` e
  `DATABASE_AUTH_TOKEN` existem na Vercel); confirmar antes de mexer.
- Coluna `htmlContent` existe, mas o app não grava nela: o HTML é analisado
  em memória e descartado, como o README promete. Não use essa coluna.
- O bypass de autenticação (`BYPASS_AUTH` + `VERCEL_DEMO_MODE`) ainda existe
  no código; em produção as duas variáveis estão como `false`.
- `/api/cron/cleanup` é fail-open no código se `CRON_SECRET` faltar. O
  segredo foi criado em produção; a correção estrutural é o PR-5.
- Plano Vercel Hobby: logs de runtime ficam só 1 hora.
- `pnpm-lock.yaml` está desatualizado; a produção instala com
  `--no-frozen-lockfile` (variável `PNPM_FLAGS`).
- Ambiente do Guilherme é Windows/PowerShell: scripts com sintaxe POSIX
  (`VAR=x cmd`, `rm -f`) não funcionam lá.

## Roadmap aprovado (ordem)

1. **PR-4** — SSRF no scanner (`assertSafeUrl` e fetch): faixas IANA, IPs
   literais, todos os A/AAAA validados, conexão fixada em IP validado,
   redirects revalidados, timeout até o fim do corpo, limite de tamanho.
2. **PR-5** — cron fail-closed + agendamento versionado em `vercel.json`,
   testes com banco simulado.
3. Motor: base (helpers, `ruleId`/`evidenceLevel`, fontes, score) → três
   regras revisadas (idade, consentimento, GTM) → demais regras.
4. Base local de 30–50 sites reais rotulados (origem, data, hash do HTML,
   rótulo por regra), separada das fixtures sintéticas; `scanner:baseline`
   com métricas separadas.
5. Experimento de IA fora do produto: Nemotron no Amazon Bedrock via
   `scripts/ai-eval.ts`, comparado a rótulos humanos. Vertex AI só depois.

## Formato de entrega

Para cada PR: branch, diff, resultado da suíte completa, o que foi verificado
por teste versus o que depende do preview, e decisões que precisam da Luna.
Seja conciso.
