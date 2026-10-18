# ADR-0005: Níveis de evidência e linguagem dos achados

- **Status:** Aceito (persistência: Proposto)
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

## Consequências
Relatórios mais honestos; o score muda para sites que só tinham indícios.

## Revisão
Quando houver migração de banco para colunas próprias.
