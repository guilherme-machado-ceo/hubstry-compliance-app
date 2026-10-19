# ADR-0005: Níveis de evidência e linguagem dos achados

- **Status:** Aceito (persistência e severidades complementares do PR #24: Proposto)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
Um produto de compliance que afirma "violação da LGPD" com base em
heurística assume risco reputacional e jurídico.

## Decisão
- Cada achado tem `ruleId`, `evidenceLevel` (`confirmada`, `indicio`,
  `inconclusiva`) e fundamentação classificada (ADR-0006).
- Achados heurísticos nunca afirmam violação legal nem recomendam
  Datavalid ou biometria.
- Indícios e inconclusivos aparecem no relatório, mas **não reduzem o
  score**.
- Severidades acordadas para as regras revisadas: idade e assinatura `info`,
  consentimento `warning`; nenhum indício é `critical`.

## Ponto em aberto (Proposto)
Representação provisória do nível de evidência no relatório por meio de
prefixos no título ("Indício:", "Inconclusivo:"). `ruleId` e
`evidenceLevel` **não são persistidos** como campos próprios; a persistência
estruturada permanece proposta até uma migração coordenada dos schemas.

## Severidades por regra no scanner atual (PR #24)

Aplicação das severidades acima às regras de `api/_server/scanner.ts`. As
linhas marcadas como **Proposto** não constam da decisão acordada; foram
propostas no PR #24 e **dependem de aprovação do Guilherme** (com parecer da
Luna). Até lá, não devem ser apresentadas como decididas.

| Regra (`type`) | Severidade | Status |
|---|---|---|
| Aferição de idade (`age_verification`) | `info` | Acordado (decisão acima) |
| Consentimento (`other`, título "Consentimento") | `warning` | Acordado (decisão acima) |
| Roach motel (`dark_pattern`) | `info` | Acordado, por interpretação: é a única regra sobre fluxos de assinatura/cancelamento, por isso recebe a severidade de "assinatura". Confirmar o mapeamento. |
| Loot box (`lootbox`) | `warning` | **Proposto, pendente** |
| Referência à política de privacidade (`missing_privacy_policy`) | `warning` | **Proposto, pendente** |
| Misdirection (`dark_pattern`) | `warning` | **Proposto, pendente** |
| Autoplay, rolagem infinita, rastreadores | `warning` | Severidade anterior mantida; não decidida por este ADR |
| Acessibilidade (alt, `lang`) | `info` | Severidade anterior mantida; não decidida por este ADR |

Justificativa das propostas: as três regras eram `critical`, mas se baseiam
em coocorrência de termos ou em atributos do HTML inicial, ou seja, são
indícios, e a decisão proíbe `critical` para indícios. `warning` mantém o
achado em destaque sem afirmá-lo como constatado; `info` seria a
alternativa se o achado tiver valor apenas informativo.

Todo achado das regras de detecção traz a mesma ressalva (análise do HTML
inicial, sem JavaScript nem outras páginas, possibilidade de falso positivo,
não comprova violação legal), aplicada num único ponto do código.

**Não implementado:** a regra "indícios e inconclusivos não reduzem o score".
O PR #24 preserva o score atual por restrição de escopo; a mudança fica para
PR próprio, com análise do impacto.

## Consequências
Relatórios mais honestos; o score muda para sites que só tinham indícios.

## Revisão
Quando houver migração de banco para colunas próprias.
