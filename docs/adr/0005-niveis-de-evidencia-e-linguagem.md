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

## Severidades por regra no scanner atual (PR #24)

Aplicação das severidades acima às regras de `api/_server/scanner.ts`.
As quatro classificações complementares (roach motel, loot box, referência à
política de privacidade e misdirection) foram **aprovadas pelo Guilherme em
19/10/2026**, após parecer da Luna, na revisão do PR #24.

| Regra (`type`) | Severidade | Status |
|---|---|---|
| Aferição de idade (`age_verification`) | `info` | Acordado (decisão acima) |
| Consentimento (`other`, título "Consentimento") | `warning` | Acordado (decisão acima) |
| Roach motel (`dark_pattern`) | `info` | Aprovado (19/10/2026); corresponde à severidade de "assinatura" da decisão acima |
| Loot box (`lootbox`) | `warning` | Aprovado (19/10/2026) |
| Referência à política de privacidade (`missing_privacy_policy`) | `warning` | Aprovado (19/10/2026), com condição de redação (abaixo) |
| Misdirection (`dark_pattern`) | `warning` | Aprovado (19/10/2026) |
| Autoplay, rolagem infinita, rastreadores | `warning` | Severidade anterior mantida; não decidida por este ADR |
| Acessibilidade (alt, `lang`) | `info` | Severidade anterior mantida; não decidida por este ADR |

Critério usado: como nenhum achado do scanner é confirmado, a severidade
combina a força do sinal com a gravidade do problema, caso se confirme.
`warning` indica um sinal que merece conferência humana sobre um tema de peso;
`info` indica um sinal genérico, que dispara com frequência em páginas sem
problema.

Justificativas:
- **Loot box:** o sinal é fraco (coocorrência de termos como "caixa" e
  "comprar"), mas, se confirmado, envolve crianças, adolescentes e dinheiro.
- **Referência à política de privacidade:** a coerência com o consentimento
  (também `warning`, também baseado na ausência de termos) pesa, assim como o
  filtro permissivo: qualquer menção a "dados", "privacy", "policy" ou
  "privacidade" impede o achado. **Condição:** o texto deve dizer apenas que
  o scanner não encontrou referência na página analisada, sem afirmar que a
  política inexiste nem que houve violação legal. Páginas montadas por
  JavaScript, com HTML inicial quase vazio, são a principal fonte conhecida
  de falso positivo.
- **Misdirection:** o sinal é fraco (qualquer `opacity` inline num botão com
  termo de recusa), mas o tema afeta diretamente a qualidade do consentimento.
- **Roach motel:** formulários de busca ou contato também disparam a regra;
  o sinal é genérico demais para ir além de `info`.

Todo achado das regras de detecção traz a mesma ressalva (análise do HTML
inicial, sem JavaScript nem outras páginas, possibilidade de falso positivo,
não comprova violação legal), aplicada num único ponto do código.

Revisar essas severidades quando houver a base de sites reais rotulados
(roadmap, item 4), que permitirá medir a taxa de falso positivo de cada regra.

**Não implementado:** a regra "indícios e inconclusivos não reduzem o score".
O PR #24 preserva o score atual por restrição de escopo; a mudança fica para
PR próprio, com análise do impacto.

## Consequências
Relatórios mais honestos; o score muda para sites que só tinham indícios.

## Revisão
Quando houver migração de banco para colunas próprias.
