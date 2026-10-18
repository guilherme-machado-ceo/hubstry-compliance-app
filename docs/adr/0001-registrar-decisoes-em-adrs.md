# ADR-0001: Registrar decisões de arquitetura em ADRs

- **Status:** Aceito
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O projeto é mantido por um fundador solo com revisão independente (Luna) e
implementação assistida (Claude, Claude Code). Em 18/10/2026, várias decisões
importantes existiam só em conversas, o que obrigava cada sessão nova a
redescobri-las.

## Decisão
- Decisões de arquitetura, segurança, dados e produto ficam em `docs/adr/`,
  numeradas, no formato de `0000-template.md`.
- Um ADR **Aceito** não é reescrito: mudanças geram um novo ADR que o
  substitui, e o antigo recebe o status "Substituído por ADR-NNNN".
- Fluxo: Claude propõe → Luna revisa → Guilherme decide e faz o merge.
- `CLAUDE.md` resume as regras operacionais e aponta para os ADRs.

## Consequências
Histórico rastreável do porquê de cada escolha; custo pequeno de manutenção
a cada decisão relevante.

## Revisão
Se o volume de ADRs ficar difícil de navegar, adotar índice por tema.
