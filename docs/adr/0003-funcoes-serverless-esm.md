# ADR-0003: Convenções das funções serverless em ESM

- **Status:** Aceito
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
No incidente de 18/10/2026, as funções falhavam na inicialização com
`ERR_MODULE_NOT_FOUND`: o código compilado em produção importava módulos
relativos sem extensão (ex.: `.../_core/sdk`), que o loader ESM do Node não
resolve num pacote com `"type": "module"`. O erro foi reproduzido localmente
com `vercel build` e Node 22, e a adição das extensões `.js` o eliminou
(PR #12).

## Decisão
- Todo import relativo no backend usa extensão `.js`.
- Código auxiliar fica em pastas com prefixo `_` (`api/_server`,
  `api/_shared`); só os pontos de entrada em `api/` viram funções.

## Consequências
Evita endpoints públicos acidentais (helpers, seed, testes) e falhas de
inicialização. Exige atenção em revisão de PR.

## Revisão
Se o backend passar a usar bundler (ex.: esbuild), reavaliar a exigência de
extensão.
